import { cn } from '@/lib/utils';

export default function Credits({
  className,
  photos = false,
}: {
  className?: string;
  // Also credit the photos (advanced mode; basic mode shows none).
  photos?: boolean;
}) {
  return (
    <div className={cn('space-y-1 text-xs', className)}>
      <p>
        Developed by{' '}
        <a
          href='https://github.com/Darkace01/blank-page'
          target='_blank'
          rel='noopener noreferrer'
          className='underline-offset-4 hover:underline'
        >
          Kazeem Quadri
        </a>
      </p>
      {/* Every photo in the Blob store is Kazeem's. */}
      {photos && <p>All photos taken by Kazeem Quadri.</p>}
    </div>
  );
}
