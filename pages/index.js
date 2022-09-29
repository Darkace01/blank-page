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
  ChatBubbleOvalLeftIcon,
} from '@heroicons/react/24/outline';
import QuoteCard from '../components/QuoteCard';
import axios from 'axios';
import { RANDOM_QUOTES_URL } from '../lib/helpers';
import FooterCredit from '../components/FooterCredit';
import Head from 'next/head';
const randomColor = () => {
  let randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor}`;
};

const Home = ({ content, author }) => {
  const [color, setColor] = useState('#000000');
  const [fullScrren, setFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [crazyMode, setCrazyMode] = useState(false);
  const [crazyModeInterval, setCrazyModeInterval] = useState(500);
  const [showQuote, setShowQuote] = useState(false);
  const [randomQuote, setRandomQuote] = useState({ content, author });
  const [fetchRandomQuote, setFetchRandomQuote] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isErrorQuote, setIsErrorQuote] = useState(false);

  useEffect(() => {
    if (showQuote) {
      if (fetchRandomQuote) {
        setIsLoadingQuote(true);
        setIsErrorQuote(false);

        getRandomQuote();
      }
      setFetchRandomQuote(false);
    }
  }, [fetchRandomQuote]);
  const getRandomQuote = async () => {
    try {
      const res = await axios.get(RANDOM_QUOTES_URL);
      if (res.data) {
        const { content, author } = res.data;
        setRandomQuote({ content, author });
        setIsLoadingQuote(false);
      }
    } catch (error) {
      console.log('error', error);
      setIsErrorQuote(true);
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    if (isIOSDevice()) {
      console.log(
        'Full screen mode is not supported on iOS devices. Please use a desktop browser to use this feature.'
      );
      return;
    }
    if (fullScrren) {
      requestFullScreen();
    } else {
      exitFullscreen();
    }
  }, [fullScrren]);

  const isIOSDevice = () => {
    return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  };

  useEffect(() => {
    if (crazyMode) {
      const interval = setInterval(() => {
        setColor(randomColor());
        if (showQuote) {
          getRandomQuote();
        }
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

  const randomMode = () => {
    setColor(randomColor());
    if (showQuote) {
      setFetchRandomQuote(true);
    }
  };

  const toggleFullScreen = () => {
    if (isIOSDevice()) {
      alert(
        'Full screen mode is not supported on your device. Please use a supported browser to use this feature.'
      );
      return;
    }
    setFullScreen(!fullScrren);
  };
  return (
    <>
      <Head>
        <title>Blank Page</title>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1'
        ></meta>
        <meta
          name='description'
          content='This was created out of frustration of not wanting to turn off my second monitor when I just want to focus on one screen. It"s a simple app that would fill your second monitor with a black screen. It also has some fun feature to change the color randomly and also a fun mode to do that continuously.'
        />
        <meta
          name='google-site-verification'
          content='63h6sakCIa6MwD-3KSfTqhDAXozANjDTYpoe1N531nM'
        />
      </Head>
      <div
        className='h-full w-full min-h-screen p-1 relative'
        style={{ backgroundColor: color }} //{`background-color: ${color}`}
      >
        {showControls ? (
          <div className='flex flex-row items-end justify-end align-middle p-4 flex-wrap space-x-2 space-y-2 bg-black bg-opacity-10 rounded-md mx-1'>
            <h1 className=' text-white align-middle'>
              <span className='bg-black p-1 bg-opacity-10 rounded-md'>
                {color}
              </span>{' '}
            </h1>
            <LightBulbIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={randomMode}
              title='Random Color'
            />
            <ArrowPathIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={() => setColor('#000000')}
              title='Black'
            />
            <ChatBubbleOvalLeftIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={() => setShowQuote(!showQuote)}
              title='Show Quote'
            />
            {fullScrren ? (
              <ArrowsPointingInIcon
                className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
                onClick={toggleFullScreen}
                title='Exit Full Screen'
              />
            ) : (
              <ArrowsPointingOutIcon
                className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
                onClick={toggleFullScreen}
                title='Full Screen'
              />
            )}
            {crazyMode ? (
              <>
                <StopIcon
                  className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
                  onClick={() => setCrazyMode(!crazyMode)}
                  title='Stop Crazy Mode'
                />
                <input
                  type='range'
                  min='100'
                  max='10000'
                  value={crazyModeInterval}
                  className='text-white cursor-pointer hover:text-slate-500'
                  onChange={(e) => setCrazyModeInterval(e.target.value)}
                />
              </>
            ) : (
              <VariableIcon
                className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
                onClick={() => setCrazyMode(!crazyMode)}
                title='Crazy Mode'
              />
            )}
            <EyeSlashIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={() => setShowControls(!showControls)}
              title='Hide Controls'
            />
          </div>
        ) : (
          <div className='flex flex-row items-end justify-end p-4  bg-black bg-opacity-10 rounded-md mx-1'>
            <EyeIcon
              className='h-7 w-7 text-slate-700 cursor-pointer hover:text-slate-500'
              onClick={() => setShowControls(!showControls)}
              title='Show Controls'
            />
          </div>
        )}
        {showQuote && (
          <div className='align-middle items-center justify-center flex min-h-[80vh]'>
            <QuoteCard
              randomQuote={randomQuote}
              isLoading={isLoadingQuote}
              isError={isErrorQuote}
            />
          </div>
        )}
        <FooterCredit />
      </div>
    </>
  );
};

export async function getStaticProps() {
  const res = await axios.get(RANDOM_QUOTES_URL);
  const { content, author } = res.data;

  return {
    props: {
      content,
      author,
    }, // will be passed to the page component as props
  };
}
export default Home;
