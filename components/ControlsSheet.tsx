'use client';
import {
  Images,
  Palette,
  Shuffle,
  SlidersHorizontal,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SLIDESHOW_INTERVALS } from '@/lib/helpers';

export type BgMode = 'color' | 'picture';

type ControlsSheetProps = {
  bgMode: BgMode;
  onBgModeChange: (mode: BgMode) => void;
  color: string;
  onColorChange: (color: string) => void;
  onRandomColor: () => void;
  onBlack: () => void;
  crazyMode: boolean;
  onCrazyModeChange: (on: boolean) => void;
  crazyModeInterval: number;
  onCrazyModeIntervalChange: (ms: number) => void;
  pictureStatus: string;
  // Who took the photos on screen; null until a collage has loaded.
  photoCredit: string | null;
  onShufflePictures: () => void;
  autoChange: boolean;
  onAutoChangeChange: (on: boolean) => void;
  changeInterval: number;
  onChangeIntervalChange: (ms: number) => void;
  showClock: boolean;
  onShowClockChange: (on: boolean) => void;
  showQuote: boolean;
  onShowQuoteChange: (on: boolean) => void;
  fullScreen: boolean;
  onFullScreenChange: (on: boolean) => void;
};

const formatInterval = (ms: number) =>
  ms < 60000 ? `${ms / 1000} seconds` : `${ms / 60000} min`;

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

// All the app's controls, in a sheet that slides in from the right. The only
// thing on screen otherwise is the small trigger button in the top-right
// corner, which stays faded until hovered or focused.
export default function ControlsSheet(props: ControlsSheetProps) {
  const {
    bgMode,
    onBgModeChange,
    color,
    onColorChange,
    onRandomColor,
    onBlack,
    crazyMode,
    onCrazyModeChange,
    crazyModeInterval,
    onCrazyModeIntervalChange,
    pictureStatus,
    photoCredit,
    onShufflePictures,
    autoChange,
    onAutoChangeChange,
    changeInterval,
    onChangeIntervalChange,
    showClock,
    onShowClockChange,
    showQuote,
    onShowQuoteChange,
    fullScreen,
    onFullScreenChange,
  } = props;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant='secondary'
          size='icon'
          aria-label='Open controls'
          title='Controls'
          className='fixed right-3 top-3 z-20 rounded-full bg-black/40 text-white opacity-40 shadow-lg backdrop-blur transition-opacity hover:bg-black/60 hover:opacity-100 focus-visible:opacity-100'
        >
          <SlidersHorizontal />
        </Button>
      </SheetTrigger>
      <SheetContent className='w-[88vw] overflow-y-auto sm:max-w-sm'>
        <SheetHeader className='text-left'>
          <SheetTitle>Controls</SheetTitle>
          <SheetDescription>Background, slideshow and display.</SheetDescription>
        </SheetHeader>

        <div className='mt-6 space-y-6'>
          <Tabs
            value={bgMode}
            onValueChange={(value) => onBgModeChange(value as BgMode)}
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='color' className='gap-2'>
                <Palette className='h-4 w-4' /> Colour
              </TabsTrigger>
              <TabsTrigger value='picture' className='gap-2'>
                <Images className='h-4 w-4' /> Pictures
              </TabsTrigger>
            </TabsList>

            <TabsContent value='color' className='mt-4 space-y-5'>
              <div className='flex items-center gap-3'>
                <input
                  type='color'
                  aria-label='Background colour'
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
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
                <Button variant='secondary' onClick={onBlack}>
                  <Square className='fill-current' /> Black
                </Button>
              </div>
              <SwitchRow
                id='crazy-mode'
                label='Crazy mode'
                checked={crazyMode}
                onCheckedChange={onCrazyModeChange}
              />
              {crazyMode && (
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <Label>Speed</Label>
                    <span className='text-muted-foreground'>
                      every {(crazyModeInterval / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <Slider
                    min={100}
                    max={10000}
                    step={100}
                    value={[crazyModeInterval]}
                    onValueChange={([ms]) => onCrazyModeIntervalChange(ms)}
                    aria-label='Crazy mode speed'
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value='picture' className='mt-4 space-y-5'>
              <Button className='w-full' onClick={onShufflePictures}>
                <Shuffle /> Shuffle pictures
              </Button>
              <p className='text-sm text-muted-foreground'>{pictureStatus}</p>
              <SwitchRow
                id='auto-change'
                label='Change automatically'
                checked={autoChange}
                onCheckedChange={onAutoChangeChange}
              />
              <div className='flex items-center justify-between gap-4'>
                <Label htmlFor='change-interval'>Change every</Label>
                <Select
                  value={String(changeInterval)}
                  onValueChange={(value) => onChangeIntervalChange(Number(value))}
                  disabled={!autoChange}
                >
                  <SelectTrigger id='change-interval' className='w-36'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLIDESHOW_INTERVALS.map((ms) => (
                      <SelectItem key={ms} value={String(ms)}>
                        {formatInterval(ms)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className='space-y-4'>
            <h3 className='text-sm font-medium'>Display</h3>
            <SwitchRow
              id='show-clock'
              label='Show clock'
              checked={showClock}
              onCheckedChange={onShowClockChange}
            />
            <SwitchRow
              id='show-quote'
              label='Show quote'
              checked={showQuote}
              onCheckedChange={onShowQuoteChange}
            />
            <SwitchRow
              id='full-screen'
              label='Full screen'
              checked={fullScreen}
              onCheckedChange={onFullScreenChange}
            />
          </div>

          <Separator />

          <div className='space-y-1 text-xs text-muted-foreground'>
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
            {bgMode === 'picture' && photoCredit && <p>{photoCredit}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
