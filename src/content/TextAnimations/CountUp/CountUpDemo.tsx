import CountUp from './CountUp';

function CountUpDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-8 bg-gray-950 text-white">
      <CountUp to={24815} duration={2.2} separator="," className="text-4xl font-bold" />
      <CountUp to={99.9} decimals={1} suffix="%" duration={1.8} easing="expo" className="text-3xl font-semibold text-sky-300" />
      <CountUp to={1234567} format="compact" prefix="$" duration={2} mode="roll" className="text-3xl font-semibold text-violet-300" />
    </div>
  );
}

export default CountUpDemo;
