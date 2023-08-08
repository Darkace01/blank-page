import React, { useEffect, useState } from 'react';
export const dynamic = 'force-dynamic';
export default function Clock() {
  const [date, setDate] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDate(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <h1 className=' text-white align-middle'>
      <span className='bg-black p-1 bg-opacity-10 rounded-md'>{date}</span>
    </h1>
  );
}
