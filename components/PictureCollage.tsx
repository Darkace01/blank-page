'use client';
import { useEffect, useRef, useState } from 'react';
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
  transition: 'rise' | 'zoom' | 'slide';
  tiles: Tile[];
};

// How long the outgoing collage stays mounted while it fades out (matches
// .collage-leaving in globals.css).
const LEAVE_MS = 700;
const TILE_STAGGER_MS = 90;

function CollageLayer({
  collage,
  leaving,
}: {
  collage: Collage;
  leaving?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 ${
        leaving ? 'collage-leaving pointer-events-none' : ''
      }`}
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
            className='absolute bottom-1 left-1 rounded bg-black bg-opacity-50 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'
          >
            {tile.author}
          </a>
        </div>
      ))}
    </div>
  );
}

export default function PictureCollage({
  collage,
}: {
  collage: Collage | null;
}) {
  const [leaving, setLeaving] = useState<Collage | null>(null);
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

  return (
    // Clipped so tiles sliding in from outside their spot don't add scrollbars.
    <div
      className='absolute overflow-hidden'
      style={{ inset: `${COLLAGE_INSET_VMIN}vmin` }}
    >
      {leaving && <CollageLayer key={leaving.id} collage={leaving} leaving />}
      {collage && <CollageLayer key={collage.id} collage={collage} />}
    </div>
  );
}
