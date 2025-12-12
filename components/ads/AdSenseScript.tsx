import Script from 'next/script'

export function AdSenseScript() {
  // AdSense Publisher ID for site verification and ads
  const ADSENSE_PUBLISHER_ID = 'ca-pub-2305349540791838'
  
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}