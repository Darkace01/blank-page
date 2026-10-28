'use client';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { COLLAGE_INSET_VMIN } from '@/lib/helpers';

type Tile = {
  src: string;
  author: string;
  link: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Collage = {
  id: number;
  // Size of the box the tiles were laid out for (CSS px).
  boxWidth: number;
  boxHeight: number;
  transition: 'rise' | 'zoom' | 'slide';
  tiles: Tile[];
};

// How long the outgoing collage stays mounted while it fades out (matches
// .collage-leaving in globals.css).
const LEAVE_MS = 700;
const TILE_STAGGER_MS = 90;
// Gap between tiles/skeleton blocks; the same as the outer inset.
const GAP = `${COLLAGE_INSET_VMIN}vmin`;

// Shown on touch screens (no hover); elsewhere revealed by hovering the tile.
const HOVER_REVEAL =
  'transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100';

// Placeholder blocks shaped like a collage, shown until the first one loads.
const SKELETON_ROWS = [
  {
    id: 'top',
    blocks: [
      { id: 'top-1', grow: 3 },
      { id: 'top-2', grow: 2 },
      { id: 'top-3', grow: 2 },
    ],
  },
  {
    id: 'bottom',
    blocks: [
      { id: 'bottom-1', grow: 2 },
      { id: 'bottom-2', grow: 3 },
      { id: 'bottom-3', grow: 2 },
    ],
  },
];

function CollageSkeleton() {
  return (
    <div className='absolute inset-0 flex flex-col' style={{ gap: GAP }}>
      <span className='sr-only'>Loading pictures</span>
      {SKELETON_ROWS.map((row) => (
        <div
          key={row.id}
          className='flex flex-1'
          style={{ gap: GAP }}
          aria-hidden
        >
          {row.blocks.map((block) => (
            <Skeleton
              key={block.id}
              className='h-full rounded-md bg-white/10'
              style={{ flexGrow: block.grow, flexBasis: 0 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CollageLayer({
  collage,
  leaving,
  onOpen,
}: {
  collage: Collage;
  leaving?: boolean;
  onOpen?: (index: number) => void;
}) {
  const ratio = collage.boxWidth / collage.boxHeight;
  return (
    // Keeps the shape the collage was laid out for and is fitted, centred,
    // into the container, so if the window is resized the collage scales
    // evenly instead of being squashed.
    <div
      className={`absolute inset-0 m-auto ${
        leaving ? 'collage-leaving pointer-events-none' : ''
      }`}
      style={{
        aspectRatio: `${collage.boxWidth} / ${collage.boxHeight}`,
        width: `min(100cqw, calc(100cqh * ${ratio}))`,
        height: 'auto',
      }}
    >
      {collage.tiles.map((tile, i) => (
        <div
          key={tile.src}
          className={`group absolute overflow-hidden rounded-md shadow-lg ${
            leaving ? '' : 'collage-tile'
          }`}
          style={
            {
              left: `${tile.left}%`,
              top: `${tile.top}%`,
              width: `${tile.width}%`,
              height: `${tile.height}%`,
              animationName: leaving
                ? undefined
                : `collage-${collage.transition}`,
              '--tile-delay': `${i * TILE_STAGGER_MS}ms`,
            } as React.CSSProperties
          }
        >
          {/* biome-ignore lint/performance/noImgElement: tiles are preloaded by exact URL; next/image would fetch them again through the optimizer */}
          <img
            src={tile.src}
            alt={`By ${tile.author}`}
            className='h-full w-full object-cover'
          />
          <a
            href={tile.link}
            target='_blank'
            rel='noopener noreferrer'
            className={`absolute bottom-1.5 left-1.5 max-w-[60%] truncate rounded bg-black/50 px-1.5 py-0.5 text-xs text-white ${HOVER_REVEAL}`}
          >
            {tile.author}
          </a>
          {onOpen && (
            <button
              type='button'
              onClick={() => onOpen(i)}
              aria-label={`View photo by ${tile.author} larger`}
              title='View larger'
              className={`absolute bottom-1.5 right-1.5 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 ${HOVER_REVEAL}`}
            >
              <Maximize2 className='h-4 w-4' />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function Lightbox({
  tiles,
  index,
  onIndexChange,
}: {
  tiles: Tile[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const tile = index === null ? null : tiles[index];
  const step = (delta: number) => {
    if (index === null) return;
    onIndexChange((index + delta + tiles.length) % tiles.length);
  };

  return (
    <Dialog
      open={tile !== null}
      onOpenChange={(open) => !open && onIndexChange(null)}
    >
      <DialogContent
        aria-describedby={undefined}
        className='w-auto max-w-[95vw] gap-3 border-0 bg-transparent p-0 shadow-none sm:rounded-none'
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') step(-1);
          if (e.key === 'ArrowRight') step(1);
        }}
      >
        {tile && (
          <>
            <DialogTitle className='sr-only'>Photo by {tile.author}</DialogTitle>
            {/* biome-ignore lint/performance/noImgElement: the full-size Blob photo, already cached from its tile */}
            <img
              src={tile.src}
              alt={`By ${tile.author}`}
              className='mx-auto max-h-[85vh] max-w-[92vw] rounded-md object-contain shadow-2xl'
            />
            <div className='flex items-center justify-between gap-4 text-sm text-white'>
              <a
                href={tile.link}
                target='_blank'
                rel='noopener noreferrer'
                className='truncate underline-offset-4 hover:underline'
              >
                {tile.author}
              </a>
              {tiles.length > 1 && (
                <div className='flex shrink-0 items-center gap-2'>
                  <Button
                    variant='secondary'
                    size='icon'
                    aria-label='Previous photo'
                    onClick={() => step(-1)}
                  >
                    <ChevronLeft />
                  </Button>
                  <span className='tabular-nums text-white/70'>
                    {(index ?? 0) + 1} / {tiles.length}
                  </span>
                  <Button
                    variant='secondary'
                    size='icon'
                    aria-label='Next photo'
                    onClick={() => step(1)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PictureCollage({
  collage,
  isError,
  onLightboxOpenChange,
}: {
  collage: Collage | null;
  isError: boolean;
  // Lets the page pause the slideshow while a photo is open.
  onLightboxOpenChange: (open: boolean) => void;
}) {
  const [leaving, setLeaving] = useState<Collage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const shown = useRef<Collage | null>(null);

  // Keep the previous collage on screen, fading out, while the new one enters.
  useEffect(() => {
    if (shown.current && shown.current.id !== collage?.id) {
      setLeaving(shown.current);
    }
    shown.current = collage;
  }, [collage]);

  useEffect(() => {
    if (!leaving) return;
    const timeout = setTimeout(() => setLeaving(null), LEAVE_MS);
    return () => clearTimeout(timeout);
  }, [leaving]);

  const openLightbox = (index: number | null) => {
    setLightboxIndex(index);
    onLightboxOpenChange(index !== null);
  };

  return (
    // Clipped so tiles sliding in from outside their spot don't add scrollbars.
    <div
      className='absolute overflow-hidden'
      style={{ inset: GAP, containerType: 'size' }}
    >
      {!collage &&
        (isError ? (
          <p className='absolute inset-0 flex items-center justify-center text-white/70'>
            Couldn&apos;t load pictures.
          </p>
        ) : (
          <CollageSkeleton />
        ))}
      {leaving && <CollageLayer key={leaving.id} collage={leaving} leaving />}
      {collage && (
        <CollageLayer
          key={collage.id}
          collage={collage}
          onOpen={openLightbox}
        />
      )}
      {collage && (
        <Lightbox
          tiles={collage.tiles}
          index={lightboxIndex}
          onIndexChange={openLightbox}
        />
      )}
    </div>
  );
}
