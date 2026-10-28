'use client';
import { SlidersHorizontal } from 'lucide-react';
import AdvancedControls from '@/components/controls/AdvancedControls';
import BasicControls from '@/components/controls/BasicControls';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSettings } from '@/lib/settings';

// All the app's controls, in a sheet that slides in from the right, opened by
// a button in the top-right corner. Basic mode shows a short dark panel;
// advanced mode a longer one in hover.dev's neo-brutalist style. Open state is
// the page's, so the developer toolkit can close it before opening.
export default function ControlsSheet({
  open,
  onOpenChange,
  pictureStatus,
  onRandomColor,
  onShufflePictures,
  onOpenDevTools,
  fullScreen,
  onFullScreenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pictureStatus: string;
  onRandomColor: () => void;
  onShufflePictures: () => void;
  onOpenDevTools: () => void;
  fullScreen: boolean;
  onFullScreenChange: (on: boolean) => void;
}) {
  const { advanced } = useSettings();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {advanced ? (
          <button
            type='button'
            aria-label='Open controls'
            title='Controls'
            className='fixed right-3 top-3 z-20 flex h-10 w-10 items-center justify-center border-2 border-brutal-line bg-indigo-600 text-white opacity-60 shadow-[3px_3px_0_0_rgb(var(--brutal-shadow))] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:opacity-100 hover:shadow-none focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
          >
            <SlidersHorizontal className='h-5 w-5' />
          </button>
        ) : (
          <Button
            variant='secondary'
            size='icon'
            aria-label='Open controls'
            title='Controls'
            className='fixed right-3 top-3 z-20 rounded-full bg-black/40 text-white opacity-40 shadow-lg backdrop-blur transition-opacity hover:bg-black/60 hover:opacity-100 focus-visible:opacity-100'
          >
            <SlidersHorizontal />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        className={
          advanced
            ? 'grid-paper w-[92vw] overflow-y-auto border-l-2 border-brutal-line text-brutal-text sm:max-w-md'
            : 'w-[88vw] overflow-y-auto sm:max-w-sm'
        }
      >
        {advanced ? (
          <AdvancedControls
            pictureStatus={pictureStatus}
            onRandomColor={onRandomColor}
            onShufflePictures={onShufflePictures}
            onOpenDevTools={onOpenDevTools}
            fullScreen={fullScreen}
            onFullScreenChange={onFullScreenChange}
          />
        ) : (
          <BasicControls
            onRandomColor={onRandomColor}
            fullScreen={fullScreen}
            onFullScreenChange={onFullScreenChange}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
