import React, { useEffect, useState } from 'react';

function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentTime]);
  return (
    <h1 className=' text-white align-middle'>
      <span className='bg-black p-1 bg-opacity-10 rounded-md'>
        {/* {currentTime.toLocaleTimeString()} */}
      </span>
    </h1>
  );
}

export default Clock;
