import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type ModelViewerEnvironment =
  | 'apartment'
  | 'city'
  | 'dawn'
  | 'forest'
  | 'lobby'
  | 'night'
  | 'park'
  | 'studio'
  | 'sunset'
  | 'warehouse'
  | 'none';

export type ModelViewerIntro = 'rise' | 'spin' | 'fade' | 'none';

export interface ModelViewerHandle {
  capture: (type?: string) => string | null;
}

export interface ModelViewerProps {
  url: string;
  width?: number | string;
  height?: number | string;
  environment?: ModelViewerEnvironment;
  environmentIntensity?: number;
  exposure?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateDelay?: number;
  dragRotate?: boolean;
  turntable?: boolean;
  zoom?: boolean;
  minZoom?: number;
  maxZoom?: number;
  hoverTilt?: number;
  float?: number;
  shadow?: boolean;
  shadowOpacity?: number;
  intro?: ModelViewerIntro;
  startAngle?: number;
  tilt?: number;
  offsetX?: number;
  offsetY?: number;
  fit?: number;
  resetOnDoubleClick?: boolean;
  className?: string;
  class?: string;
  style?: JSX.CSSProperties;
  onModelLoaded?: () => void;
  /** Upstream forwarded a ref exposing { capture }; pass a callback or a { current } box here. */
  ref?: ((handle: ModelViewerHandle) => void) | { current: ModelViewerHandle | null };
}

type Settings = {
  autoRotate: boolean;
  autoRotateSpeed: number;
  autoRotateDelay: number;
  dragRotate: boolean;
  turntable: boolean;
  zoom: boolean;
  minZoom: number;
  maxZoom: number;
  hoverTilt: number;
  float: number;
  shadow: boolean;
  shadowOpacity: number;
  intro: ModelViewerIntro;
  startAngle: number;
  tilt: number;
  offsetX: number;
  offsetY: number;
  fit: number;
  resetOnDoubleClick: boolean;
  reducedMotion: boolean;
};

type Bounds = { scale: number; center: THREE.Vector3; radius: number; floor: number };

type Motion = {
  yaw: number;
  pitch: number;
  yawVelocity: number;
  pitchVelocity: number;
  zoom: number;
  zoomGoal: number;
  tiltX: number;
  tiltY: number;
  tiltGoalX: number;
  tiltGoalY: number;
  spinSpeed: number;
  idle: number;
  dragging: boolean;
  intro: number;
  clock: number;
  reset: { yaw: number; pitch: number } | null;
};

const FOV = 30;
const INTRO_SECONDS = 1.3;
const DRAG_SPEED = 0.0065;
const PITCH_LIMIT = (65 * Math.PI) / 180;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const measured = new WeakMap<THREE.Object3D, Bounds>();

const measure = (object: THREE.Object3D): Bounds => {
  const cached = measured.get(object);
  if (cached) return cached;
  const box = new THREE.Box3().setFromObject(object);
  const extent = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 2 / Math.max(extent.x, extent.y, extent.z, 0.0001);
  const bounds = { scale, center, radius: (extent.length() / 2) * scale, floor: (extent.y / 2) * scale };
  measured.set(object, bounds);
  return bounds;
};

const disposeObject = (object: THREE.Object3D) => {
  object.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach(mat => mat.dispose());
    else if (material) (material as THREE.Material).dispose();
  });
};

// PORT-NOTE: drei's ContactShadows is approximated with a radial-gradient
// plane at the model floor (soft round blob shadow).
const makeShadowTexture = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const ModelViewer = (props: ModelViewerProps) => {
  let containerEl!: HTMLDivElement;
  const [ready, setReady] = createSignal(false);

  const glRef: { current: THREE.WebGLRenderer | null } = { current: null };
  const settingsRef: { current: Settings } = { current: undefined as unknown as Settings };

  const buildSettings = (): Settings => ({
    autoRotate: props.autoRotate ?? true,
    autoRotateSpeed: props.autoRotateSpeed ?? 0.4,
    autoRotateDelay: Math.max(0, props.autoRotateDelay ?? 2),
    dragRotate: props.dragRotate ?? true,
    turntable: props.turntable ?? false,
    zoom: props.zoom ?? true,
    minZoom: Math.min(props.minZoom ?? 0.7, props.maxZoom ?? 2),
    maxZoom: Math.max(props.minZoom ?? 0.7, props.maxZoom ?? 2),
    hoverTilt: Math.max(0, props.hoverTilt ?? 0.15),
    float: Math.max(0, props.float ?? 0.3),
    shadow: props.shadow ?? true,
    shadowOpacity: props.shadowOpacity ?? 0.45,
    intro: props.intro ?? 'rise',
    startAngle: props.startAngle ?? -30,
    tilt: props.tilt ?? 10,
    offsetX: props.offsetX ?? 0,
    offsetY: props.offsetY ?? 0,
    fit: props.fit ?? 0.8,
    resetOnDoubleClick: props.resetOnDoubleClick ?? true,
    reducedMotion: typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  });
  settingsRef.current = buildSettings();

  // Upstream re-rendered on any prop change; track them here to refresh settings.
  createEffect(() => {
    settingsRef.current = buildSettings();
  });

  createEffect(() => {
    const handle = props.ref;
    const value: ModelViewerHandle = {
      capture: (type = 'image/png') => glRef.current?.domElement.toDataURL(type) ?? null
    };
    if (typeof handle === 'function') handle(value);
    else if (handle && 'current' in handle) handle.current = value;
  });

  createEffect(() => {
    props.url; // readiness resets on every url change (upstream effect on [url])
    setReady(false);
  });

  onMount(() => {
    const container = containerEl;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = props.exposure ?? 1;
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.style.cursor = (props.dragRotate ?? true) ? 'grab' : 'default';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.opacity = ready() || (props.intro ?? 'rise') === 'none' ? '1' : '0';
    renderer.domElement.style.transition = (props.intro ?? 'rise') === 'none' ? 'none' : 'opacity 0.6s ease';
    container.appendChild(renderer.domElement);
    glRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);
    camera.position.set(0, 0, 6);

    const light = new THREE.DirectionalLight(0xffffff, 0.6);
    light.position.set(3, 5, 4);
    scene.add(light);

    // PORT-NOTE: drei's <Environment preset> HDRIs are approximated with
    // three's RoomEnvironment via PMREM; 'none' disables the env map.
    const pmrem = new THREE.PMREMGenerator(renderer);
    let envTarget: THREE.WebGLRenderTarget | null = null;
    const applyEnvironment = () => {
      if (envTarget) {
        envTarget.dispose();
        envTarget = null;
      }
      scene.environment = null;
      if ((props.environment ?? 'studio') !== 'none') {
        const room = new RoomEnvironment();
        envTarget = pmrem.fromScene(room, 0.04);
        scene.environment = envTarget.texture;
        scene.environmentIntensity = props.environmentIntensity ?? 1;
      }
    };
    applyEnvironment();

    const place = new THREE.Group();
    const floatGroup = new THREE.Group();
    const tiltGroup = new THREE.Group();
    const spinGroup = new THREE.Group();
    const fitGroup = new THREE.Group();
    place.add(floatGroup);
    floatGroup.add(tiltGroup);
    tiltGroup.add(spinGroup);
    spinGroup.add(fitGroup);
    scene.add(place);

    const shadowTexture = makeShadowTexture();
    const shadowGeometry = new THREE.PlaneGeometry(1, 1);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: props.shadowOpacity ?? 0.45
    });
    const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.visible = false;
    place.add(shadowMesh);

    let currentObject: THREE.Object3D | null = null;
    let bounds: Bounds = { scale: 1, center: new THREE.Vector3(), radius: 1, floor: 1 };
    const announced = new WeakSet<THREE.Object3D>();
    let loadToken = 0;

    const s0 = settingsRef.current;
    const motion: Motion = {
      yaw: toRadians(s0.startAngle),
      pitch: toRadians(s0.tilt),
      yawVelocity: 0,
      pitchVelocity: 0,
      zoom: 1,
      zoomGoal: 1,
      tiltX: 0,
      tiltY: 0,
      tiltGoalX: 0,
      tiltGoalY: 0,
      spinSpeed: 0,
      idle: 0,
      dragging: false,
      intro: s0.intro === 'none' ? 1 : 0,
      clock: 0,
      reset: null
    };

    let width = 1;
    let height = 1;
    let raf = 0;
    let last = 0;
    let disposed = false;
    const visibleRef = { current: true };

    const invalidate = () => {
      if (raf || disposed || !visibleRef.current) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const update = (dt: number) => {
      const s = settingsRef.current;
      const m = motion;
      m.clock += dt;
      m.idle += dt;
      const reduce = s.reducedMotion;

      if (m.intro < 1) m.intro = reduce ? 1 : Math.min(1, m.intro + dt / INTRO_SECONDS);
      const eased = 1 - Math.pow(1 - m.intro, 3);

      if (m.reset) {
        m.yaw += (m.reset.yaw - m.yaw) * (1 - Math.exp(-dt * 7));
        m.pitch += (m.reset.pitch - m.pitch) * (1 - Math.exp(-dt * 7));
        if (Math.abs(m.reset.yaw - m.yaw) < 0.001 && Math.abs(m.reset.pitch - m.pitch) < 0.001) m.reset = null;
      } else if (!m.dragging) {
        const decay = Math.exp(-dt * 4.5);
        m.yaw += m.yawVelocity * dt;
        m.pitch = THREE.MathUtils.clamp(m.pitch + m.pitchVelocity * dt, -PITCH_LIMIT, PITCH_LIMIT);
        m.yawVelocity *= decay;
        m.pitchVelocity *= decay;
        if (s.turntable) m.pitch += (toRadians(s.tilt) - m.pitch) * (1 - Math.exp(-dt * 4));
      }

      const spinning = s.autoRotate && !reduce && !m.dragging && m.idle > s.autoRotateDelay;
      m.spinSpeed += ((spinning ? s.autoRotateSpeed : 0) - m.spinSpeed) * (1 - Math.exp(-dt * 2));
      m.yaw += m.spinSpeed * dt;

      m.zoom += (m.zoomGoal - m.zoom) * (1 - Math.exp(-dt * 8));
      m.tiltX += (m.tiltGoalX - m.tiltX) * (1 - Math.exp(-dt * 6));
      m.tiltY += (m.tiltGoalY - m.tiltY) * (1 - Math.exp(-dt * 6));

      const aspect = width / Math.max(height, 1);
      const halfView = Math.tan(toRadians(FOV) / 2);
      const fitDistance = bounds.radius / (Math.max(s.fit, 0.05) * halfView * Math.min(1, aspect));
      const distance = fitDistance / m.zoom;
      camera.aspect = aspect;
      camera.position.set(0, 0, distance);
      camera.near = distance / 50;
      camera.far = distance * 50;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      const halfHeight = fitDistance * halfView;
      place.position.set(s.offsetX * halfHeight * aspect, s.offsetY * halfHeight, 0);

      const intro = s.intro;
      const rise = intro === 'rise' ? (1 - eased) * -0.45 : 0;
      const grow = intro === 'rise' ? 0.9 + 0.1 * eased : 1;
      const twist = intro === 'spin' ? (1 - eased) * -Math.PI * 1.2 : intro === 'rise' ? (1 - eased) * -0.5 : 0;
      const bob = reduce ? 0 : Math.sin(m.clock * 1.3) * s.float * 0.06;
      floatGroup.position.y = rise + bob;
      floatGroup.scale.setScalar(grow);
      tiltGroup.rotation.set(m.tiltX, m.tiltY, 0);
      spinGroup.rotation.set(m.pitch, m.yaw + twist, 0, 'YXZ');

      return (
        m.intro < 1 ||
        m.dragging ||
        !!m.reset ||
        Math.abs(m.yawVelocity) + Math.abs(m.pitchVelocity) > 0.0005 ||
        Math.abs(m.zoomGoal - m.zoom) > 0.0005 ||
        Math.abs(m.tiltGoalX - m.tiltX) + Math.abs(m.tiltGoalY - m.tiltY) > 0.0005 ||
        m.spinSpeed > 0.0005 ||
        (s.autoRotate && !reduce) ||
        (s.float > 0 && !reduce)
      );
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min(last ? (now - last) / 1000 : 1 / 60, 0.05);
      last = now;
      const settling = update(dt);
      renderer.render(scene, camera);
      if (settling && visibleRef.current) invalidate();
    };

    const element = renderer.domElement;
    const pointers = new Map<number, { x: number; y: number; t: number }>();
    let pinchStart = 0;
    let zoomStart = 1;

    const onDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, t: event.timeStamp });
      if (pointers.size === 2 && s.zoom) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        zoomStart = motion.zoomGoal;
        motion.dragging = false;
      } else if (pointers.size === 1 && s.dragRotate && (event.pointerType !== 'mouse' || event.button === 0)) {
        motion.dragging = true;
        motion.yawVelocity = 0;
        motion.pitchVelocity = 0;
        element.setPointerCapture?.(event.pointerId);
        element.style.cursor = 'grabbing';
      }
      motion.idle = 0;
      invalidate();
    };

    const onMove = (event: PointerEvent) => {
      const s = settingsRef.current;
      const rect = element.getBoundingClientRect();
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        motion.tiltGoalX = ny * s.hoverTilt * 0.6;
        motion.tiltGoalY = nx * s.hoverTilt;
      }
      const lastPointer = pointers.get(event.pointerId);
      if (lastPointer) {
        const dx = event.clientX - lastPointer.x;
        const dy = event.clientY - lastPointer.y;
        const elapsed = Math.max((event.timeStamp - lastPointer.t) / 1000, 1 / 240);
        lastPointer.x = event.clientX;
        lastPointer.y = event.clientY;
        lastPointer.t = event.timeStamp;
        if (pointers.size === 2 && s.zoom && pinchStart > 0) {
          const [a, b] = [...pointers.values()];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          motion.zoomGoal = THREE.MathUtils.clamp((zoomStart * distance) / pinchStart, s.minZoom, s.maxZoom);
        } else if (motion.dragging) {
          const m = motion;
          m.yaw += dx * DRAG_SPEED;
          m.yawVelocity = m.yawVelocity * 0.4 + ((dx * DRAG_SPEED) / elapsed) * 0.6;
          if (!s.turntable) {
            m.pitch = THREE.MathUtils.clamp(m.pitch + dy * DRAG_SPEED, -PITCH_LIMIT, PITCH_LIMIT);
            m.pitchVelocity = m.pitchVelocity * 0.4 + ((dy * DRAG_SPEED) / elapsed) * 0.6;
          }
          m.idle = 0;
        }
      }
      invalidate();
    };

    const onUp = (event: PointerEvent) => {
      const lastPointer = pointers.get(event.pointerId);
      if (lastPointer && event.timeStamp - lastPointer.t > 80) {
        motion.yawVelocity = 0;
        motion.pitchVelocity = 0;
      }
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchStart = 0;
      if (pointers.size === 0) {
        motion.dragging = false;
        element.style.cursor = settingsRef.current.dragRotate ? 'grab' : 'default';
      }
      invalidate();
    };

    const onLeave = () => {
      motion.tiltGoalX = 0;
      motion.tiltGoalY = 0;
      invalidate();
    };

    const onWheel = (event: WheelEvent) => {
      const s = settingsRef.current;
      if (!s.zoom || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const m = motion;
      m.zoomGoal = THREE.MathUtils.clamp(m.zoomGoal * Math.exp(-event.deltaY * 0.01), s.minZoom, s.maxZoom);
      m.idle = 0;
      invalidate();
    };

    const onDoubleClick = () => {
      const s = settingsRef.current;
      if (!s.resetOnDoubleClick) return;
      const m = motion;
      const turns = Math.round((m.yaw - toRadians(s.startAngle)) / (Math.PI * 2));
      m.reset = { yaw: toRadians(s.startAngle) + turns * Math.PI * 2, pitch: toRadians(s.tilt) };
      m.zoomGoal = 1;
      m.yawVelocity = 0;
      m.pitchVelocity = 0;
      m.idle = 0;
      invalidate();
    };

    element.addEventListener('pointerdown', onDown);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointercancel', onUp);
    element.addEventListener('pointerleave', onLeave);
    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('dblclick', onDoubleClick);

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      invalidate();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const visibility = new IntersectionObserver(entries => {
      visibleRef.current = entries.some(entry => entry.isIntersecting);
      if (visibleRef.current) invalidate();
    });
    visibility.observe(container);

    const loadModel = (url: string, token: number) => {
      const extension = (url.split('?')[0].split('.').pop() ?? '').toLowerCase();
      const onError = (error: unknown) => {
        if (token === loadToken) console.error('ModelViewer: failed to load model', error);
      };
      const onLoad = (object: THREE.Object3D) => {
        if (disposed || token !== loadToken) {
          disposeObject(object);
          return;
        }
        if (currentObject) {
          fitGroup.remove(currentObject);
          disposeObject(currentObject);
        }
        currentObject = object;
        fitGroup.add(object);
        bounds = measure(object);
        fitGroup.scale.setScalar(bounds.scale);
        fitGroup.position.set(
          -bounds.center.x * bounds.scale,
          -bounds.center.y * bounds.scale,
          -bounds.center.z * bounds.scale
        );
        shadowMesh.visible = settingsRef.current.shadow;
        shadowMesh.position.set(0, -bounds.floor - 0.08, 0);
        const shadowScale = bounds.radius * 4;
        shadowMesh.scale.set(shadowScale, shadowScale, 1);
        shadowMaterial.opacity = settingsRef.current.shadowOpacity;
        if (!announced.has(object)) {
          announced.add(object);
          setReady(true);
          const cb = props.onModelLoaded;
          if (cb) cb();
        }
        invalidate();
      };
      if (extension === 'fbx') new FBXLoader().load(url, onLoad, undefined, onError);
      else if (extension === 'obj') new OBJLoader().load(url, onLoad, undefined, onError);
      else new GLTFLoader().load(url, gltf => onLoad(gltf.scene), undefined, onError);
    };

    let loadedUrl: string | null = null;
    createEffect(() => {
      const url = props.url;
      if (!url || url === loadedUrl) return;
      loadedUrl = url;
      loadToken += 1;
      loadModel(url, loadToken);
    });

    // React to option changes that affect the static scene (upstream read
    // these on every render).
    createEffect(() => {
      renderer.toneMappingExposure = props.exposure ?? 1;
      invalidate();
    });
    createEffect(() => {
      applyEnvironment();
      invalidate();
    });
    createEffect(() => {
      const dragRotate = props.dragRotate ?? true;
      const shadow = props.shadow ?? true;
      const shadowOpacity = props.shadowOpacity ?? 0.45;
      settingsRef.current = buildSettings();
      element.style.cursor = motion.dragging ? 'grabbing' : dragRotate ? 'grab' : 'default';
      shadowMesh.visible = shadow && Boolean(currentObject);
      shadowMaterial.opacity = shadowOpacity;
      invalidate();
    });
    createEffect(() => {
      const shown = ready() || (props.intro ?? 'rise') === 'none';
      element.style.opacity = shown ? '1' : '0';
    });

    resize();
    invalidate();

    onCleanup(() => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibility.disconnect();
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      element.removeEventListener('pointerleave', onLeave);
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('dblclick', onDoubleClick);
      if (currentObject) {
        fitGroup.remove(currentObject);
        disposeObject(currentObject);
        currentObject = null;
      }
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      if (envTarget) envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      glRef.current = null;
    });
  });

  return (
    <div
      ref={containerEl}
      class={`relative ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={
        {
          width: props.width ?? 400,
          height: props.height ?? 400,
          ...(props.style as Record<string, string | number>)
        } as JSX.CSSProperties
      }
    />
  );
};

export default ModelViewer;
