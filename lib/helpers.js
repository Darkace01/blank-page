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

// Lorem Picsum: free, no API key. ~990 photos spread over 10 pages of 100.
export const PICTURES_LIST_URL = 'https://picsum.photos/v2/list';
export const PICTURES_PAGE_COUNT = 10;
// Crazy mode never swaps pictures faster than this, to avoid hammering Picsum.
export const PICTURE_MIN_INTERVAL = 3000;

export const pictureUrl = (id) => {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.min(3840, Math.round(window.innerWidth * ratio));
  const height = Math.min(2160, Math.round(window.innerHeight * ratio));
  return `https://picsum.photos/id/${id}/${width}/${height}`;
};

export const randomColor = () => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor}`;
};
