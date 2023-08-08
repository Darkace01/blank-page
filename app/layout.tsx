import Script from 'next/script';
import './globals.css';
import { AppValuesProvider } from '../context/AppContext';

export const metadata = {
  title: 'Blank Page',
  description:
    'This was created out of frustration of not wanting to turn off my second monitor when I just want to focus on one screen. It"s a simple app that would fill your second monitor with a black screen. It also has some fun feature to change the color randomly and also a fun mode to do that continuously.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1'
        ></meta>
        <meta
          name='google-site-verification'
          content='63h6sakCIa6MwD-3KSfTqhDAXozANjDTYpoe1N531nM'
        />
      </head>
      <body
        className='h-full w-full min-h-screen relative'
        // style={{ backgroundColor: '#000000' }}
      >
        <Script
          strategy='afterInteractive'
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script id='ga-analytics'>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
