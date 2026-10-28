export const requestFullScreen = () => {
  var elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE11 */
    elem.msRequestFullscreen();
  }
};

export const exitFullscreen = () => {
  if (!document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    /* IE11 */
    document.msExitFullscreen();
  }
};

export const RANDOM_QUOTES_URL = 'https://dummyjson.com/quotes/random';

// Lists the photos in Vercel Blob (see app/api/backgrounds/route.ts).
export const PICTURES_URL = '/api/backgrounds';
// Picture slideshow intervals offered in the controls (ms). The shortest is
// 5s: each change downloads several photos and the entry transition needs time.
export const SLIDESHOW_INTERVALS = [5000, 10000, 30000, 60000, 300000];
export const DEFAULT_SLIDESHOW_INTERVAL = 10000;

// Margin around the collage, in vmin. Matches the gap between tiles
// (GAP_RATIO in collage.js), so the border looks even all round. The controls
// overlay the collage, so it uses the full height.
export const COLLAGE_INSET_VMIN = 1.5;

// The collage's box in CSS pixels; the JS twin of the inset PictureCollage
// applies with CSS.
export const collageBox = () => {
  const inset =
    (Math.min(window.innerWidth, window.innerHeight) * COLLAGE_INSET_VMIN) /
    100;
  return {
    width: window.innerWidth - inset * 2,
    height: window.innerHeight - inset * 2,
  };
};

export const randomColor = () => {
  // Padded to 6 digits: a short value like "#a3f0c" isn't a valid colour.
  const randomColor = Math.floor(Math.random() * 16777216)
    .toString(16)
    .padStart(6, '0');
  return `#${randomColor}`;
};
