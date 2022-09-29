import React from 'react';

function FooterCredit() {
  return (
    <div className='absolute bottom-0 right-0 text-white opacity-10 hover:opacity-100 transition-opacity cursor-pointer text-xs text-center pb-2 pr-2'>
      <p>
        Developed By {''}
        <a href='https://github.com/Darkace01/blank-page'>Kazeem Quadri</a>
      </p>
    </div>
  );
}

export default FooterCredit;
