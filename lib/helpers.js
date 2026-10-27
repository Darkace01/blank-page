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

// Lists the photos in public/backgrounds (see app/api/backgrounds/route.ts).
export const LOCAL_PICTURES_URL = '/api/backgrounds';

// Lorem Picsum: free, no API key. ~990 photos spread over 10 pages of 100.
export const PICTURES_LIST_URL = 'https://picsum.photos/v2/list';
export const PICTURES_PAGE_COUNT = 10;
// Crazy mode never swaps collages faster than this: each change downloads
// several photos, and the entry transition needs time to play.
export const PICTURE_MIN_INTERVAL = 5000;

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

// A Picsum URL for a tile of the given CSS size, sharp on high-DPI screens.
export const pictureUrl = (id, width, height) => {
  const ratio = window.devicePixelRatio || 1;
  const px = (size) => Math.max(1, Math.min(2400, Math.round(size * ratio)));
  return `https://picsum.photos/id/${id}/${px(width)}/${px(height)}`;
};

export const randomColor = () => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor}`;
};
