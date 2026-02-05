import React, { useEffect, useRef } from 'react';

const TrustBox = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadScript = () => {
            const scriptId = 'trustpilot-bootstrap-script';
            if (document.getElementById(scriptId)) {
                if ((window as any).Trustpilot && ref.current) {
                    (window as any).Trustpilot.loadFromElement(ref.current, true);
                }
                return;
            }

            const script = document.createElement('script');
            script.id = scriptId;
            script.type = 'text/javascript';
            script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
            script.async = true;
            script.onload = () => {
                if ((window as any).Trustpilot && ref.current) {
                    (window as any).Trustpilot.loadFromElement(ref.current, true);
                }
            };
            document.head.appendChild(script);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadScript();
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // Load 200px before it comes into view
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className="trustpilot-widget"
            data-locale="en-US"
            data-template-id="5419b637fa0340045cd0c936"
            data-businessunit-id="6825e3b743a58c4ab5232cae"
            data-style-height="20px"
            data-style-width="100%"
            data-theme="dark"
            data-href="https://www.trustpilot.com/review/servertechcentral.com"
            data-token="ba4f6bff-2e90-4115-8e89-c0843b6eb97d"
        >
            <a href="https://www.trustpilot.com/review/servertechcentral.com" target="_blank" rel="noopener">Trustpilot</a>
        </div>
    );
};

export default TrustBox;
