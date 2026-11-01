import DecryptedText from './DecryptedText';

function DecryptedTextDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-gray-950 p-8 font-mono text-white">
      <DecryptedText
        text="Decrypt on view"
        animateOn="view"
        speed={55}
        revealDirection="center"
        parentClassName="text-3xl font-semibold"
        className="text-sky-300"
        encryptedClassName="text-sky-800"
      />
      <DecryptedText
        text="Fade + scramble effect"
        animateOn="view"
        effect="fade"
        scrambleColor="#38bdf8"
        parentClassName="text-xl"
      />
    </div>
  );
}

export default DecryptedTextDemo;
