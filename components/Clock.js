import React, { useEffect, useState } from 'react';

function Clock() {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
  return (
    <h1 className=' text-white align-middle'>
      <span className='bg-black p-1 bg-opacity-10 rounded-md'>
        {currentTime}
      </span>{' '}
    </h1>
  );
}

export default Clock;
