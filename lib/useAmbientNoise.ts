'use client';
import { useEffect, useRef } from 'react';
import type { AmbientSound } from '@/lib/settings';

const BUFFER_SECONDS = 10;

// A looping buffer of noise. Each colour is roughly level-matched.
const noiseBuffer = (ctx: AudioContext, sound: Exclude<AmbientSound, 'off'>) => {
  const length = ctx.sampleRate * BUFFER_SECONDS;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Pink noise filter state (Paul Kellet's refined method).
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  // Brown noise: a leaky random walk.
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (sound === 'white') {
      data[i] = white * 0.3;
    } else if (sound === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
};

// Plays white, pink or brown noise, generated in the browser. Changes fade in
// and out rather than cutting. Browsers only let audio start after a user
// gesture, so if a sound is restored on page load it starts on the first click
// or key press.
export function useAmbientNoise(sound: AmbientSound, volume: number) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
    const ctx = ctxRef.current;
    if (ctx && gainRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    }
  }, [volume]);

  useEffect(() => {
    if (sound === 'off') return;
    ctxRef.current ??= new AudioContext();
    const ctx = ctxRef.current;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, sound);
    source.loop = true;
    source.connect(gain);
    source.start();
    gain.gain.setTargetAtTime(volumeRef.current, ctx.currentTime, 0.4);
    gainRef.current = gain;

    const resume = () => {
      ctx.resume();
    };
    if (ctx.state === 'suspended') {
      window.addEventListener('pointerdown', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
    }

    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
      gainRef.current = null;
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      source.stop(ctx.currentTime + 0.5);
      source.onended = () => gain.disconnect();
    };
  }, [sound]);

  useEffect(
    () => () => {
      ctxRef.current?.close();
      ctxRef.current = null;
    },
    [],
  );
}

// A soft two-note chime (for the focus timer). Called from timer ticks after
// the user started the timer with a click, so audio is allowed.
export function playChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [880, 1318.5].forEach((frequency, i) => {
      const start = now + i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.3);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // No audio available: the timer still switches phase silently.
  }
}
