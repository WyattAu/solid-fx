import TearTicket from './TearTicket';

function TearTicketDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-zinc-950 p-6 text-zinc-100">
      <TearTicket
        image="https://picsum.photos/seed/tearticket/640/360"
        imageAlt="Concert artwork"
        stub={
          <div class="flex h-full w-full flex-col items-end justify-between p-3 text-right text-[11px] tracking-widest uppercase opacity-70">
            <span>Admit One</span>
            <span>Row F · Seat 12</span>
          </div>
        }
      >
        <div class="flex h-full flex-col justify-between p-5">
          <span class="text-xs tracking-[0.2em] uppercase opacity-60">Solid Bits Cinema</span>
          <div>
            <div class="text-lg font-semibold">Midnight Runtime</div>
            <div class="text-xs opacity-60">Fri 21:30 · Door 7 · Tear the stub to redeem</div>
          </div>
        </div>
      </TearTicket>
    </div>
  );
}

export default TearTicketDemo;
