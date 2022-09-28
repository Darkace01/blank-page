import { useState, useEffect } from 'react';

const randomColor = () => {
  let randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor}`;
};
const Home = () => {
  const [color, setColor] = useState('#000000');
  const [fullScrren, setFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (fullScrren) {
      requestFullScreen();
    } else {
      exitFullscreen();
    }
  }, [fullScrren]);

  const requestFullScreen = () => {
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

  const exitFullscreen = () => {
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
  return (
    <div
      className='h-full w-full min-h-screen'
      style={{ backgroundColor: color }} //{`background-color: ${color}`}
    >
      {showControls ? (
        <div className='flex flex-row items-end justify-end p-4 flex-wrap space-x-2 space-y-2'>
          <h1 className=' text-white'>Change Color</h1>
          <button
            className='bg-white text-black p-1 rounded-md '
            onClick={() => setColor(randomColor())}
          >
            {color}
          </button>
          <button
            className='bg-white text-black p-1 rounded-md '
            onClick={() => setColor('#000000')}
          >
            Reset Color
          </button>
          <button
            className='bg-white text-black p-1 rounded-md '
            onClick={() => setFullScreen(!fullScrren)}
          >
            {fullScrren ? 'Exit Full Screen' : 'Full Screen'}
          </button>
          <button
            className='bg-white text-black p-1 rounded-md '
            onClick={() => setShowControls(!showControls)}
          >
            Hide Controls
          </button>
        </div>
      ) : (
        <div className='flex flex-row items-end justify-end p-4'>
          <button
            className='bg-slate-800 text-black p-1 rounded-md '
            onClick={() => setShowControls(!showControls)}
          >
            Show Controls
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
