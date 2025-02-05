import Script from "next/script";
import React from "react";

type AdSenseTypes = {
    adSense: string;
};
const AdSense = ({ adSense }: AdSenseTypes) => {
    return (
        <Script async 
            strategy="lazyOnload"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSense}`}
            crossOrigin="anonymous"
        />
    );
}
export default AdSense;