import Script from 'next/script'

export function AdSenseScript() {
  // Replace with your actual AdSense publisher ID
  const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX'
  
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}