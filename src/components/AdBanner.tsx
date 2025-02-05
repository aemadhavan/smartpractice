'use client';

import React, { useEffect } from "react";

type AdBannerTypes = {
    adSense: string;
    dataadslot: string;
    dataadformat: string;
    datafullwidthresponsive: boolean;
};

const AdBanner = ({ adSense,dataadslot,dataadformat,datafullwidthresponsive }: AdBannerTypes) => {

    useEffect(() => {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
            {}
          );
        } catch (error: any) {
          console.log(error.message);
        }
      }, []);
    
    return (
        <div>
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={adSense}
                data-ad-slot={dataadslot}
                data-ad-format={dataadformat}
                data-full-width-responsive={datafullwidthresponsive.toString()}>
            </ins>
        </div>
    );
}
export default AdBanner;