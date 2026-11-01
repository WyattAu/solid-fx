import type { JSX } from 'solid-js'
import { onCleanup, onMount, createEffect } from 'solid-js'
import * as THREE from 'three'

type ColorBendsProps = {
  class?: string
  className?: string
  style?: JSX.CSSProperties
  rotation?: number
  speed?: number
  colors?: string[]
  transparent?: boolean
  autoRotate?: number
  scale?: number
  frequency?: number
  warpStrength?: number
  mouseInfluence?: number
  parallax?: number
  noise?: number
  iterations?: number
  intensity?: number
  bandWidth?: number
}

const MAX_COLORS = 8 as const

const frag = `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer; // in NDC [-1,1]
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

    for (int j = 0; j < 5; j++) {
      if (j >= uIterations - 1) break;
      vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
      q += (rr - q) * 0.15;
    }

    vec3 col = vec3(0.0);
    float a = 1.0;

    if (uColorCount > 0) {
      vec2 s = q;
      vec3 sumCol = vec3(0.0);
      float cover = 0.0;
      for (int i = 0; i < MAX_COLORS; ++i) {
            if (i >= uColorCount) break;
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3); // strong response across 0..1
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0); // allow >1 to amplify displacement
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float m = mix(m0, m1, kMix);
            float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
            sumCol += uColors[i] * w;
            cover = max(cover, w);
      }
      col = clamp(sumCol, 0.0, 1.0);
      a = uTransparent > 0 ? cover : 1.0;
    } else {
        vec2 s = q;
        for (int k = 0; k < 3; ++k) {
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3);
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float m = mix(m0, m1, kMix);
            col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
        }
        a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
    }

    col *= uIntensity;

    if (uNoise > 0.0001) {
      float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
      col += (n - 0.5) * uNoise;
      col = clamp(col, 0.0, 1.0);
    }

    vec3 rgb = (uTransparent > 0) ? col * a : col;
    gl_FragColor = vec4(rgb, a);
}
`

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

export default function ColorBends(props: ColorBendsProps) {
  let containerRef!: HTMLDivElement

  let renderer: THREE.WebGLRenderer | null = null
  let raf = 0
  let material: THREE.ShaderMaterial | null = null
  let resizeObserver: ResizeObserver | null = null
  let rotationDeg = props.rotation ?? 90
  let autoRotate = props.autoRotate ?? 0
  const pointerTarget = new THREE.Vector2(0, 0)
  const pointerCurrent = new THREE.Vector2(0, 0)
  const pointerSmooth = 8

  onMount(() => {
    const container = containerRef
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const geometry = new THREE.PlaneGeometry(2, 2)
    const uColorsArray = Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(0, 0, 0))
    material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: props.speed ?? 0.2 },
        uRot: { value: new THREE.Vector2(1, 0) },
        uColorCount: { value: 0 },
        uColors: { value: uColorsArray },
        uTransparent: { value: (props.transparent ?? true) ? 1 : 0 },
        uScale: { value: props.scale ?? 1 },
        uFrequency: { value: props.frequency ?? 1 },
        uWarpStrength: { value: props.warpStrength ?? 1 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uMouseInfluence: { value: props.mouseInfluence ?? 1 },
        uParallax: { value: props.parallax ?? 0.5 },
        uNoise: { value: props.noise ?? 0.15 },
        uIterations: { value: props.iterations ?? 1 },
        uIntensity: { value: props.intensity ?? 1.5 },
        uBandWidth: { value: props.bandWidth ?? 6 },
      },
      premultipliedAlpha: true,
      transparent: true,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true,
    })
    // upstream sets these dynamically; three's types lag here
    ;(renderer as unknown as { outputColorSpace: string }).outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, (props.transparent ?? true) ? 0 : 1)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)

    const clock = new THREE.Clock()

    const handleResize = () => {
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      renderer!.setSize(w, h, false)
      ;(material!.uniforms.uCanvas.value as THREE.Vector2).set(w, h)
    }

    handleResize()

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(container)
    } else {
      ;(window as Window).addEventListener('resize', handleResize)
    }

    const loop = () => {
      const dt = clock.getDelta()
      const elapsed = clock.elapsedTime
      material!.uniforms.uTime.value = elapsed

      const deg = (rotationDeg % 360) + autoRotate * elapsed
      const rad = (deg * Math.PI) / 180
      const c = Math.cos(rad)
      const s = Math.sin(rad)
      ;(material!.uniforms.uRot.value as THREE.Vector2).set(c, s)

      const amt = Math.min(1, dt * pointerSmooth)
      pointerCurrent.lerp(pointerTarget, amt)
      ;(material!.uniforms.uPointer.value as THREE.Vector2).copy(pointerCurrent)
      renderer!.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1
      const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1)
      pointerTarget.set(x, y)
    }
    container.addEventListener('pointermove', handlePointerMove)

    onCleanup(() => {
      if (raf) cancelAnimationFrame(raf)
      if (resizeObserver) resizeObserver.disconnect()
      else window.removeEventListener('resize', handleResize)
      container.removeEventListener('pointermove', handlePointerMove)
      geometry.dispose()
      material!.dispose()
      renderer!.dispose()
      renderer!.forceContextLoss()
      if (renderer!.domElement && renderer!.domElement.parentElement === container) {
        container.removeChild(renderer!.domElement)
      }
    })
  })

  // Live uniform sync — mirrors upstream's prop-sync effect dep array.
  createEffect(() => {
    const mat = material
    if (!mat) return

    rotationDeg = props.rotation ?? 90
    autoRotate = props.autoRotate ?? 0
    mat.uniforms.uSpeed.value = props.speed ?? 0.2
    mat.uniforms.uScale.value = props.scale ?? 1
    mat.uniforms.uFrequency.value = props.frequency ?? 1
    mat.uniforms.uWarpStrength.value = props.warpStrength ?? 1
    mat.uniforms.uMouseInfluence.value = props.mouseInfluence ?? 1
    mat.uniforms.uParallax.value = props.parallax ?? 0.5
    mat.uniforms.uNoise.value = props.noise ?? 0.15
    mat.uniforms.uIterations.value = props.iterations ?? 1
    mat.uniforms.uIntensity.value = props.intensity ?? 1.5
    mat.uniforms.uBandWidth.value = props.bandWidth ?? 6

    const toVec3 = (hex: string) => {
      const h = hex.replace('#', '').trim()
      const v =
        h.length === 3
          ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
          : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
      return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255)
    }

    const arr = (props.colors || []).filter(Boolean).slice(0, MAX_COLORS).map(toVec3)
    for (let i = 0; i < MAX_COLORS; i++) {
      const vec = (mat.uniforms.uColors.value as THREE.Vector3[])[i]
      if (i < arr.length) vec.copy(arr[i])
      else vec.set(0, 0, 0)
    }
    mat.uniforms.uColorCount.value = arr.length

    const transparent = props.transparent ?? true
    mat.uniforms.uTransparent.value = transparent ? 1 : 0
    renderer?.setClearColor(0x000000, transparent ? 0 : 1)
  })

  return (
    <div
      ref={containerRef}
      class={`relative h-full w-full overflow-hidden ${props.class ?? ''} ${props.className ?? ''}`}
      style={props.style}
    />
  )
}
