// solid-fx scenes layer — composition, not a port.
import type { JSX } from 'solid-js'
import { createSignal, createUniqueId, Show } from 'solid-js'
import Aurora from '@/content/Backgrounds/Aurora/Aurora'
import GlassSurface from '@/content/Components/GlassSurface/GlassSurface'
import SquishSwitch from '@/content/Micro/SquishSwitch/SquishSwitch'
import SpringCheck from '@/content/Micro/SpringCheck/SpringCheck'

export interface LoginCredentials {
  username: string
  password: string
  remember: boolean
}

export interface LoginSceneProps {
  /** Card headline. @default 'Sign in' */
  title?: string
  /** Supporting line under the headline. */
  subtitle?: string
  /** Submit-button text. @default 'Sign in' */
  submitLabel?: string
  /** Called with the form values when the form is submitted. */
  onSubmit?: (credentials: LoginCredentials) => void
  /** Section height — number (px) or any CSS length. @default '100vh' */
  height?: number | string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const px = (h: number | string): string => (typeof h === 'number' ? `${h}px` : h)

export default function LoginScene(props: LoginSceneProps) {
  const [username, setUsername] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [remember, setRemember] = createSignal(false)
  const [submitted, setSubmitted] = createSignal(false)
  const userField = createUniqueId()
  const passField = createUniqueId()

  const height = () => px(props.height ?? '100vh')
  const mergedClass = () =>
    [
      'fx-scene-login relative flex w-full items-center justify-center overflow-hidden',
      props.class,
      props.className,
    ]
      .filter(Boolean)
      .join(' ')

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (submitted()) return
    setSubmitted(true)
    props.onSubmit?.({ username: username(), password: password(), remember: remember() })
  }

  return (
    <section class={mergedClass()} style={{ height: height(), ...props.style }}>
      {/* Background layer: Aurora fills the section absolutely. */}
      <div class="fx-scene-login-bg absolute inset-0" aria-hidden="true">
        <Aurora
          colorStops={['#3A29FF', '#FF94B4', '#FF3232']}
          amplitude={1.0}
          speed={0.3}
          scale={0.9}
          mouseInteraction={false}
        />
      </div>

      {/* Foreground layer: the GlassSurface login card. */}
      <div class="fx-scene-login-card relative z-10 w-full max-w-sm px-4">
        <GlassSurface width="100%" borderRadius={18}>
          <form class="flex flex-col gap-5 p-8 text-left" onSubmit={handleSubmit}>
            <div class="flex flex-col gap-1 text-center">
              <h2 class="text-2xl font-semibold text-white">{props.title ?? 'Sign in'}</h2>
              <Show when={props.subtitle}>
                <p class="text-sm text-white/70">{props.subtitle}</p>
              </Show>
            </div>

            <Show
              when={submitted()}
              fallback={
                <>
                  <div class="flex flex-col gap-1.5">
                    <label
                      for={userField}
                      class="text-xs font-medium tracking-wider text-white/70 uppercase"
                    >
                      Username
                    </label>
                    <input
                      id={userField}
                      type="text"
                      autocomplete="username"
                      placeholder="you@example.com"
                      value={username()}
                      onInput={e => setUsername((e.currentTarget as HTMLInputElement).value)}
                      class="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/45"
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label
                      for={passField}
                      class="text-xs font-medium tracking-wider text-white/70 uppercase"
                    >
                      Password
                    </label>
                    <input
                      id={passField}
                      type="password"
                      autocomplete="current-password"
                      placeholder="••••••••"
                      value={password()}
                      onInput={e => setPassword((e.currentTarget as HTMLInputElement).value)}
                      class="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/45"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <SquishSwitch
                      checked={remember()}
                      onChange={setRemember}
                      label="Remember me"
                      ariaLabel="Remember me"
                    />
                  </div>
                  <button
                    type="submit"
                    class="w-full rounded-lg bg-white/90 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white"
                  >
                    {props.submitLabel ?? 'Sign in'}
                  </button>
                </>
              }
            >
              <div class="flex flex-col items-center gap-3 py-2">
                <SpringCheck checked label="Signed in" />
                <p class="text-sm text-white/70">
                  Welcome back{username() ? `, ${username()}` : ''}.
                </p>
              </div>
            </Show>
          </form>
        </GlassSurface>
      </div>
    </section>
  )
}
