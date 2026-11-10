// solid-fx scenes layer — composition, not a port.
import LoginScene from './LoginScene'

function LoginSceneDemo() {
  return (
    <div class="w-full">
      <LoginScene
        height={560}
        title="Sign in"
        subtitle="Use any credentials — the demo just plays the success state."
        onSubmit={credentials => {
          console.log('login submit', credentials)
        }}
      />
    </div>
  )
}

export default LoginSceneDemo
