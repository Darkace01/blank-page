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

// Margin around the collage, in vmin, so the background colour frames it.
export const COLLAGE_INSET_VMIN = 4;
// Space between the bottom of the control bar and the top of the collage.
export const COLLAGE_BAR_GAP_VMIN = 1;

// CSS for the collage's top edge: below the control bar (`controlsBottom`,
// in px from the top of the viewport; 0 when hidden) or the usual margin.
export const collageTop = (controlsBottom) =>
  `max(${COLLAGE_INSET_VMIN}vmin, calc(${controlsBottom}px + ${COLLAGE_BAR_GAP_VMIN}vmin))`;

// The collage's box in CSS pixels; the JS twin of the insets PictureCollage
// applies with CSS.
export const collageBox = (controlsBottom = 0) => {
  const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
  const inset = vmin * COLLAGE_INSET_VMIN;
  const top = Math.max(inset, controlsBottom + vmin * COLLAGE_BAR_GAP_VMIN);
  return {
    width: window.innerWidth - inset * 2,
    height: window.innerHeight - top - inset,
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
