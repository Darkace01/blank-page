'use client';
import { useQuote } from '../lib/apiHelpers';
import type { Quote } from '../types';

// The quote follows background changes (see app/page.tsx). While the next one
// loads, the current one stays up; the skeleton only shows before the first.
function QuoteCard() {
  const { data, isError } = useQuote();

  const { content, author } = (data ?? {}) as Quote;
  if (isError && !content)
    return (
      <div className='text-white bg-black bg-opacity-20 rounded-lg p-10 space-x-3 min-h-[15rem] max-w-4xl items-center justify-center align-middle flex'>
        <div>
          <h1 className='text-2xl font-bold'>Error</h1>
          <p className='text-xl font-light'>Something went wrong</p>
        </div>
      </div>
    );

  if (!content || !author)
    return (
      <div className='text-white bg-black bg-opacity-20 rounded-lg p-10 space-x-3 min-h-[15rem] max-w-4xl items-center justify-center align-middle flex'>
        <div className='animate-pulse flex space-x-4'>
          <div className='rounded-full bg-slate-400 h-12 w-12'></div>
          <div className='flex-1 space-y-4 py-1'>
            <div className='h-4 bg-slate-400 rounded w-3/4'></div>
            <div className='space-y-2'>
              <div className='h-4 bg-slate-400 rounded'></div>
              <div className='h-4 bg-slate-400 rounded w-5/6'></div>
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className='text-white bg-black bg-opacity-20 rounded-lg p-10 space-x-3 min-h-[15rem] max-w-4xl items-center justify-center align-middle flex'>
      {/* Keyed by the quote, so each new one fades in. */}
      <div key={content} className='animate-in fade-in duration-700'>
        <div className='text-center italic text-3xl font-light'>{content}</div>
        <div className='text-md font-bold text-center'> - {author}</div>
      </div>
    </div>
  );
}

export default QuoteCard;
