import Script from 'next/script';
import '../styles/globals.css';
import { AppValuesProvider } from '../context/AppContext';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <Script
          strategy='lazyOnload'
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
      </Head>
      <AppValuesProvider>
        <Component {...pageProps} />
      </AppValuesProvider>
    </>
  );
}

export default MyApp;
