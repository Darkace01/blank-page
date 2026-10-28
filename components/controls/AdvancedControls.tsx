'use client';
import {
  Code2,
  Images,
  Keyboard,
  type LucideIcon,
  Monitor,
  MonitorSmartphone,
  Moon,
  Palette,
  Shuffle,
  Square,
  Sun,
  Timer,
  Waves,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  BrutalButton,
  BrutalCard,
  BrutalLabel,
  BrutalRow,
  BrutalSlider,
  BrutalSwitch,
  brutalSelectContent,
  brutalSelectItem,
  brutalSelectTrigger,
} from '@/components/brutal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { SLIDESHOW_INTERVALS, TIMER_MINUTES } from '@/lib/helpers';
import {
  type AmbientSound,
  type BgMode,
  type Theme,
  useSettings,
} from '@/lib/settings';
import Credits from './Credits';

const formatInterval = (ms: number) =>
  ms < 60000 ? `${ms / 1000} seconds` : `${ms / 60000} min`;

const THEMES: { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'Auto', Icon: MonitorSmartphone },
];

const SOUND_LABELS: Record<AmbientSound, string> = {
  off: 'Off',
  white: 'White noise',
  pink: 'Pink noise',
  brown: 'Brown noise',
};

export const SHORTCUTS = [
  ['Space', 'Random colour / shuffle photos'],
  ['F', 'Full screen'],
  ['B', 'Black screen'],
  ['H', 'Hide clock and widgets'],
  ['D', 'Developer toolkit'],
] as const;

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <BrutalCard>
      <div className='space-y-4 p-4'>
        <BrutalLabel icon={icon}>{title}</BrutalLabel>
        {children}
      </div>
    </BrutalCard>
  );
}

function BrutalSelect({
  id,
  value,
  onValueChange,
  options,
  disabled,
  className = 'w-36',
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={`${brutalSelectTrigger} ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={brutalSelectContent}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={brutalSelectItem}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Advanced mode: every feature, in hover.dev's neo-brutalist style.
export default function AdvancedControls({
  pictureStatus,
  onRandomColor,
  onShufflePictures,
  onOpenDevTools,
  fullScreen,
  onFullScreenChange,
}: {
  pictureStatus: string;
  onRandomColor: () => void;
  onShufflePictures: () => void;
  onOpenDevTools: () => void;
  fullScreen: boolean;
  onFullScreenChange: (on: boolean) => void;
}) {
  const s = useSettings();

  const modeButton = (mode: BgMode, icon: ReactNode, label: string) => (
    <BrutalButton
      variant={s.bgMode === mode ? 'active' : 'light'}
      aria-pressed={s.bgMode === mode}
      className='flex-1'
      onClick={() => s.setBgMode(mode)}
    >
      {icon} {label}
    </BrutalButton>
  );

  return (
    <div className='space-y-5 font-brutal'>
      <BrutalCard faceClassName='grid-paper-indigo'>
        <div className='p-4'>
          <div className='border-2 border-brutal-line bg-brutal-paper p-4 shadow-[3px_3px_0_0_rgb(var(--brutal-shadow))]'>
            <SheetTitle className='font-brutal text-2xl font-extrabold leading-tight text-brutal-text'>
              Blank <span className='text-brutal-accent'>Page</span>
            </SheetTitle>
            <SheetDescription className='text-sm text-brutal-muted'>
              Advanced mode. Everything is saved in this browser.
            </SheetDescription>
            <div className='mt-4'>
              <BrutalRow htmlFor='advanced-mode' label='Advanced mode'>
                <BrutalSwitch
                  id='advanced-mode'
                  checked={s.advanced}
                  onCheckedChange={s.setAdvanced}
                />
              </BrutalRow>
            </div>
            <fieldset className='mt-4'>
              <legend className='mb-2 text-sm font-medium'>Theme</legend>
              <div className='flex gap-2'>
                {THEMES.map(({ value, label, Icon }) => (
                  <BrutalButton
                    key={value}
                    variant={s.theme === value ? 'active' : 'light'}
                    aria-pressed={s.theme === value}
                    className='flex-1 text-xs'
                    onClick={() => s.setTheme(value)}
                  >
                    <Icon /> {label}
                  </BrutalButton>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </BrutalCard>

      <Section icon={<Palette />} title='Background'>
        <div className='flex gap-3'>
          {modeButton('color', <Palette />, 'Colour')}
          {modeButton('picture', <Images />, 'Pictures')}
        </div>

        {s.bgMode === 'color' ? (
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <input
                type='color'
                aria-label='Background colour'
                value={s.color}
                onChange={(e) => s.setColor(e.target.value)}
                className='h-10 w-14 shrink-0 cursor-pointer border-2 border-brutal-line bg-brutal-paper p-0.5 shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))]'
              />
              <span className='font-mono text-sm'>{s.color}</span>
            </div>
            <div className='flex gap-3'>
              <BrutalButton
                variant='primary'
                className='flex-1'
                onClick={onRandomColor}
              >
                <Shuffle /> Random
              </BrutalButton>
              <BrutalButton
                variant='dark'
                className='flex-1'
                onClick={() => s.setColor('#000000')}
              >
                <Square className='fill-current' /> Black
              </BrutalButton>
            </div>
            <BrutalRow
              htmlFor='crazy-mode'
              label='Crazy mode'
              hint='Cycles random colours'
            >
              <BrutalSwitch
                id='crazy-mode'
                checked={s.crazyMode}
                onCheckedChange={s.setCrazyMode}
              />
            </BrutalRow>
            {s.crazyMode && (
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Speed</span>
                  <span className='tabular-nums text-brutal-muted'>
                    every {(s.crazyModeInterval / 1000).toFixed(1)}s
                  </span>
                </div>
                <BrutalSlider
                  min={100}
                  max={10000}
                  step={100}
                  value={[s.crazyModeInterval]}
                  onValueChange={([ms]) => s.setCrazyModeInterval(ms)}
                  aria-label='Crazy mode speed'
                />
              </div>
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            <BrutalButton
              variant='primary'
              className='w-full'
              onClick={onShufflePictures}
            >
              <Shuffle /> Shuffle pictures
            </BrutalButton>
            <p className='text-sm text-brutal-muted'>{pictureStatus}</p>
            <BrutalRow htmlFor='auto-change' label='Change automatically'>
              <BrutalSwitch
                id='auto-change'
                checked={s.autoChange}
                onCheckedChange={s.setAutoChange}
              />
            </BrutalRow>
            <BrutalRow htmlFor='change-interval' label='Change every'>
              <BrutalSelect
                id='change-interval'
                value={String(s.changeInterval)}
                onValueChange={(value) => s.setChangeInterval(Number(value))}
                disabled={!s.autoChange}
                options={SLIDESHOW_INTERVALS.map((ms) => ({
                  value: String(ms),
                  label: formatInterval(ms),
                }))}
              />
            </BrutalRow>
          </div>
        )}
      </Section>

      <Section icon={<Timer />} title='Focus'>
        <BrutalRow
          htmlFor='show-timer'
          label='Focus timer'
          hint='Work, then a 5 minute break'
        >
          <BrutalSwitch
            id='show-timer'
            checked={s.showTimer}
            onCheckedChange={s.setShowTimer}
          />
        </BrutalRow>
        <BrutalRow htmlFor='timer-minutes' label='Work for'>
          <BrutalSelect
            id='timer-minutes'
            value={String(s.timerMinutes)}
            onValueChange={(value) => s.setTimerMinutes(Number(value))}
            disabled={!s.showTimer}
            options={TIMER_MINUTES.map((minutes) => ({
              value: String(minutes),
              label: `${minutes} min`,
            }))}
          />
        </BrutalRow>
        <BrutalRow
          htmlFor='show-breathing'
          label='Breathing guide'
          hint='Box breathing, 4-4-4-4'
        >
          <BrutalSwitch
            id='show-breathing'
            checked={s.showBreathing}
            onCheckedChange={s.setShowBreathing}
          />
        </BrutalRow>
        <BrutalRow htmlFor='show-quote' label='Quote'>
          <BrutalSwitch
            id='show-quote'
            checked={s.showQuote}
            onCheckedChange={s.setShowQuote}
          />
        </BrutalRow>
      </Section>

      <Section icon={<Waves />} title='Ambient sound'>
        <BrutalRow htmlFor='ambient-sound' label='Sound'>
          <BrutalSelect
            id='ambient-sound'
            value={s.ambientSound}
            onValueChange={(value) => s.setAmbientSound(value as AmbientSound)}
            options={(Object.keys(SOUND_LABELS) as AmbientSound[]).map(
              (sound) => ({ value: sound, label: SOUND_LABELS[sound] }),
            )}
          />
        </BrutalRow>
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Volume</span>
            <span className='tabular-nums text-brutal-muted'>
              {Math.round(s.ambientVolume * 100)}%
            </span>
          </div>
          <BrutalSlider
            min={0}
            max={1}
            step={0.05}
            value={[s.ambientVolume]}
            onValueChange={([volume]) => s.setAmbientVolume(volume)}
            disabled={s.ambientSound === 'off'}
            aria-label='Ambient sound volume'
          />
        </div>
      </Section>

      <Section icon={<Monitor />} title='Screen'>
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Dim</span>
            <span className='tabular-nums text-brutal-muted'>
              {Math.round(s.dim * 100)}%
            </span>
          </div>
          <BrutalSlider
            min={0}
            max={0.8}
            step={0.05}
            value={[s.dim]}
            onValueChange={([dim]) => s.setDim(dim)}
            aria-label='Dim the screen'
          />
        </div>
        <BrutalRow
          htmlFor='warm-light'
          label='Warm light'
          hint='Softer, warmer tones'
        >
          <BrutalSwitch
            id='warm-light'
            checked={s.warmLight}
            onCheckedChange={s.setWarmLight}
          />
        </BrutalRow>
        <BrutalRow htmlFor='show-clock' label='Clock'>
          <BrutalSwitch
            id='show-clock'
            checked={s.showClock}
            onCheckedChange={s.setShowClock}
          />
        </BrutalRow>
        <BrutalRow htmlFor='full-screen' label='Full screen'>
          <BrutalSwitch
            id='full-screen'
            checked={fullScreen}
            onCheckedChange={onFullScreenChange}
          />
        </BrutalRow>
      </Section>

      <Section icon={<Code2 />} title='Developer toolkit'>
        <p className='text-sm text-brutal-muted'>
          Passwords, tokens, UUIDs, hashes, Base64, JWTs, JSON and timestamps.
          Runs entirely in your browser.
        </p>
        <BrutalButton variant='dark' className='w-full' onClick={onOpenDevTools}>
          <Code2 /> Open toolkit
        </BrutalButton>
      </Section>

      <Section icon={<Keyboard />} title='Shortcuts'>
        <ul className='space-y-2 text-sm'>
          {SHORTCUTS.map(([key, action]) => (
            <li key={key} className='flex items-center justify-between gap-4'>
              <span>{action}</span>
              <kbd className='min-w-[2.5rem] border-2 border-brutal-line bg-brutal-paper px-2 py-0.5 text-center font-mono text-xs font-semibold shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))]'>
                {key}
              </kbd>
            </li>
          ))}
        </ul>
      </Section>

      <Credits photos className='px-1 text-brutal-muted' />
    </div>
  );
}
