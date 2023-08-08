'use client';
import React, { useEffect, useState } from 'react';

function Clock() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <h1 className=' text-white align-middle'>
      <span className='bg-black p-1 bg-opacity-10 rounded-md'>
        {date.toLocaleTimeString()}
      </span>
    </h1>
  );
}

export default Clock;
