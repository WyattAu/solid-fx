import { createSignal } from 'solid-js';
import CurvedInput from './CurvedInput';

const CurvedInputDemo = () => {
  const [value, setValue] = createSignal('');
  const [submitted, setSubmitted] = createSignal('');

  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-[#141019] px-6">
      <CurvedInput
        value={value()}
        onChange={setValue}
        onSubmit={v => setSubmitted(v)}
        placeholder="Enter your email"
        buttonText="Get Started"
        width={450}
        bend={28}
      />
      <p class="text-xs text-zinc-400">
        {submitted() ? `Submitted: ${submitted()}` : 'Type and submit — the text follows the curve.'}
      </p>
    </div>
  );
};

export default CurvedInputDemo;
