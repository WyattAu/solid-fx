import Stepper, { Step } from './Stepper'

function StepperDemo() {
  return (
    <div class="flex h-96 w-full items-start justify-center overflow-auto rounded-xl bg-neutral-950 p-6">
      <Stepper initialStep={1}>
        <Step title="Account" description="Create your login">
          <p class="text-sm text-neutral-300">
            Enter your email and password to create an account.
          </p>
        </Step>
        <Step title="Profile" description="Tell us about you">
          <p class="text-sm text-neutral-300">Add a display name and avatar for your profile.</p>
        </Step>
        <Step title="Finish" description="You're all set">
          <p class="text-sm text-neutral-300">Review everything and complete the setup.</p>
        </Step>
      </Stepper>
    </div>
  )
}

export default StepperDemo
