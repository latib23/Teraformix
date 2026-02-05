
import React, { useEffect } from 'react';

const GoogleAnalytics = () => {
  const globalId = (typeof window !== 'undefined') ? ((window as any).__GA_ID__ as string | undefined) : undefined;
  const storedId = (typeof window !== 'undefined') ? (() => { try { if (typeof localStorage !== 'undefined') return localStorage.getItem('ga_id') || ''; return ''; } catch (_e) { void _e; return ''; } })() : '';
  const GA_MEASUREMENT_ID = globalId || storedId || '';

  useEffect(() => {
    const isProd = typeof window !== 'undefined' && location.hostname !== 'localhost';
    const isValid = GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
    const hasGtm = typeof window !== 'undefined' && (!!(window as any).__GTM_ID__ || !!(window as any).dataLayer);
    if (!isProd || !isValid || hasGtm) return;

    const loadGA = () => {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.async = true;
      document.head.appendChild(script);

      const inlineScript = document.createElement('script');
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);} 
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
      `;
      document.head.appendChild(inlineScript);
    };

    const schedule = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(loadGA);
      } else {
        setTimeout(loadGA, 1500);
      }
    };

    const onFirstInteraction = () => {
      schedule();
      window.removeEventListener('scroll', onFirstInteraction);
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };

    window.addEventListener('scroll', onFirstInteraction, { once: true });
    window.addEventListener('click', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
  }, [GA_MEASUREMENT_ID]);

  return null;
};

export default GoogleAnalytics;
