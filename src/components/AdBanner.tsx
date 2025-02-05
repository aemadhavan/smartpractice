import React from "react";

type AdBannerTypes = {
    adSense: string;
};

const AdBanner = ({ adSense }: AdBannerTypes) => {
    return (
        <div>
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={adSense}
                data-ad-slot="7806394673"
                data-ad-format="auto"
                data-full-width-responsive="true">
            </ins>
        </div>
    );
}
export default AdBanner;