'use client';
import { Shuffle, Sparkles, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/lib/settings';
import Credits from './Credits';

function SwitchRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (on: boolean) => void;
}) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// Basic mode: the original app, a colour screen with a few essentials.
export default function BasicControls({
  onRandomColor,
  fullScreen,
  onFullScreenChange,
}: {
  onRandomColor: () => void;
  fullScreen: boolean;
  onFullScreenChange: (on: boolean) => void;
}) {
  const { color, setColor, showClock, setShowClock, setAdvanced } =
    useSettings();

  return (
    <>
      <SheetHeader className='text-left'>
        <SheetTitle>Blank Page</SheetTitle>
        <SheetDescription>A calm, blank screen.</SheetDescription>
      </SheetHeader>

      <div className='mt-6 space-y-6'>
        <button
          type='button'
          onClick={() => setAdvanced(true)}
          className='flex w-full items-start gap-3 rounded-lg border border-indigo-400/40 bg-indigo-500/10 p-4 text-left transition-colors hover:bg-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
        >
          <Sparkles className='mt-0.5 h-5 w-5 shrink-0 text-indigo-300' />
          <span className='space-y-1'>
            <span className='block font-medium'>Switch to advanced mode</span>
            <span className='block text-sm text-muted-foreground'>
              Photo slideshow, focus timer, breathing guide, ambient sound,
              screen dimmer and more.
            </span>
          </span>
        </button>

        <div className='space-y-3'>
          <h3 className='text-sm font-medium'>Colour</h3>
          <div className='flex items-center gap-3'>
            <input
              type='color'
              aria-label='Background colour'
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className='h-10 w-14 shrink-0 cursor-pointer rounded-md border bg-transparent p-1'
            />
            <span className='font-mono text-sm text-muted-foreground'>
              {color}
            </span>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <Button variant='secondary' onClick={onRandomColor}>
              <Shuffle /> Random
            </Button>
            <Button variant='secondary' onClick={() => setColor('#000000')}>
              <Square className='fill-current' /> Black
            </Button>
          </div>
        </div>

        <Separator />

        <div className='space-y-4'>
          <SwitchRow
            id='show-clock'
            label='Show clock'
            checked={showClock}
            onCheckedChange={setShowClock}
          />
          <SwitchRow
            id='full-screen'
            label='Full screen'
            checked={fullScreen}
            onCheckedChange={onFullScreenChange}
          />
        </div>

        <p className='text-xs text-muted-foreground'>
          Tip: press <kbd className='font-mono text-foreground'>Space</kbd> for
          a random colour, <kbd className='font-mono text-foreground'>F</kbd>{' '}
          for full screen.
        </p>

        <Separator />

        <Credits className='text-muted-foreground' />
      </div>
    </>
  );
}
