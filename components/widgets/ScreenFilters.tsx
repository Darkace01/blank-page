// Screen dimmer and warm light, laid over the background, collage and quote
// but under the clock, widgets and controls button (z-20), so those stay
// readable. Purely visual: clicks pass straight through.
export default function ScreenFilters({
  dim,
  warm,
}: {
  dim: number;
  warm: boolean;
}) {
  if (!dim && !warm) return null;
  return (
    <div aria-hidden className='pointer-events-none fixed inset-0 z-[15]'>
      {warm && (
        <div className='absolute inset-0 bg-[#ff9a4d] opacity-30 mix-blend-multiply' />
      )}
      {dim > 0 && (
        <div className='absolute inset-0 bg-black' style={{ opacity: dim }} />
      )}
    </div>
  );
}
