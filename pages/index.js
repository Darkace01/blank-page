import { useState, useEffect } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon,
  LightBulbIcon,
  VariableIcon,
  StopIcon,
} from '@heroicons/react/24/outline';

const randomColor = () => {
  let randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor}`;
};
const Home = () => {
  const [color, setColor] = useState('#000000');
  const [fullScrren, setFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [crazyMode, setCrazyMode] = useState(false);
  const [crazyModeInterval, setCrazyModeInterval] = useState(100);

  useEffect(() => {
    if (fullScrren) {
      requestFullScreen();
    } else {
      exitFullscreen();
    }
  }, [fullScrren]);

  useEffect(() => {
    if (crazyMode) {
      const interval = setInterval(() => {
        setColor(randomColor());
      }, crazyModeInterval);
      return () => clearInterval(interval);
    }
  }, [crazyMode, crazyModeInterval]);

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
      className='h-full w-full min-h-screen p-1'
      style={{ backgroundColor: color }} //{`background-color: ${color}`}
    >
      {showControls ? (
        <div className='flex flex-row items-end justify-end align-middle p-4 flex-wrap space-x-2 space-y-2 bg-black bg-opacity-10 rounded-md mx-1'>
          <h1 className='text-white flex lg:flex md:flex sm:hidden align-middle '>
            Change Color:
          </h1>
          <span className='bg-black p-1 bg-opacity-10 rounded-md text-white'>
            {color}
          </span>
          <LightBulbIcon
            className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
            onClick={() => setColor(randomColor())}
          />
          <ArrowPathIcon
            className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
            onClick={() => setColor('#000000')}
          />
          {fullScrren ? (
            <ArrowsPointingInIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={() => setFullScreen(!fullScrren)}
            />
          ) : (
            <ArrowsPointingOutIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={() => setFullScreen(!fullScrren)}
            />
          )}
          {crazyMode ? (
            <>
              <StopIcon
                className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
                onClick={() => setCrazyMode(!crazyMode)}
              />
              <input
                type='range'
                min='100'
                max='1000'
                value={crazyModeInterval}
                className='text-white cursor-pointer hover:text-slate-500'
                onChange={(e) => setCrazyModeInterval(e.target.value)}
              />
            </>
          ) : (
            <VariableIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={() => setCrazyMode(!crazyMode)}
            />
          )}
          <EyeSlashIcon
            className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
            onClick={() => setShowControls(!showControls)}
          />
        </div>
      ) : (
        <div className='flex flex-row items-end justify-end p-4  bg-black bg-opacity-10 rounded-md mx-1'>
          <EyeIcon
            className='h-7 w-7 text-slate-700 cursor-pointer hover:text-slate-500'
            onClick={() => setShowControls(!showControls)}
          />
        </div>
      )}
    </div>
  );
};

export default Home;
