
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GoogleAnalytics from '../components/Analytics/GoogleAnalytics';
import { Outlet } from 'react-router-dom';
import ExitIntentModal from '../components/ExitIntentModal';
import SnowOverlay from '../components/SnowOverlay';
import FireworksOverlay from '../components/FireworksOverlay';
import { useGlobalContent } from '../contexts/GlobalContent';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const { content } = useGlobalContent();

  /*
  useEffect(() => {
    const path = location.pathname || '';
    const isAdmin = path.startsWith('/admin') || path.startsWith('/salesteam');
    const existing = document.getElementById('zsiqscript');

    if (isAdmin) {
      // Hide the widget using Zoho API if possible, otherwise remove it
      try {
        if ((window as any).$zoho?.salesiq?.floatwindow) {
          (window as any).$zoho.salesiq.floatwindow.visible('hide');
        }
      } catch (e) { }

      if (existing) existing.remove();
      const widget = document.getElementById('zsiqwidget');
      if (widget) widget.remove();
      const float = document.querySelector('.zsiq_floatmain');
      if (float) (float as HTMLElement).style.display = 'none';
      return;
    }

    if (!existing) {
      (window as any).$zoho = (window as any).$zoho || {};
      (window as any).$zoho.salesiq = (window as any).$zoho.salesiq || { ready: function () { } };
      const script = document.createElement('script');
      script.id = 'zsiqscript';
      script.src = 'https://salesiq.zohopublic.com/widget?wc=siqdede007dae40d69aa1fece84f6d4dc7eaea8e5df4a674b7e8fa534e6b534354e';
      script.defer = true;
      document.head.appendChild(script);

      // Configure chat to stay minimized by default
      script.onload = () => {
        try {
          if ((window as any).$zoho?.salesiq?.ready) {
            (window as any).$zoho.salesiq.ready(() => {
              // Keep the widget minimized, don't auto-open
              (window as any).$zoho.salesiq.floatwindow.visible('hide');
            });
          }
        } catch (e) {
          console.warn('Zoho chat configuration failed:', e);
        }
      };
    } else {
      // Widget already exists - don't auto-show it, let user click to open
      // Remove the auto-show logic to prevent popup on every page refresh
      try {
        const float = document.querySelector('.zsiq_floatmain');
        if (float) (float as HTMLElement).style.display = 'block';
      } catch (e) { }
    }
  }, [location.pathname]);
  */

  useEffect(() => {
    const path = location.pathname || '';
    const isAdmin = path.startsWith('/admin') || path.startsWith('/salesteam');
    if (isAdmin) return;
    const g = (window as any).gtag;
    if (typeof g === 'function') {
      g('event', 'page_view', { page_path: path });
    }
    const dl = (window as any).dataLayer;
    if (Array.isArray(dl)) {
      dl.push({ event: 'page_view', page_path: path });
    }
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname || '';
    const isAdmin = path.startsWith('/admin') || path.startsWith('/salesteam');
    if (isAdmin) return;
    try {
      if (typeof sessionStorage !== 'undefined') {
        const already = sessionStorage.getItem('__utm_captured') === '1';
        const params = new URLSearchParams(location.search || '');
        const utm_source = params.get('utm_source') || '';
        const utm_medium = params.get('utm_medium') || '';
        const utm_campaign = params.get('utm_campaign') || '';
        const utm_term = params.get('utm_term') || '';
        const utm_content = params.get('utm_content') || '';
        const gclid = params.get('gclid') || '';
        const payload = { utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid };
        const hasAny = Object.values(payload).some((v) => !!v);
        if (hasAny) {
          sessionStorage.setItem('__utm', JSON.stringify(payload));
        }
        if (!already && hasAny) {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({ event: 'session_start', page_path: path, ...payload });
          sessionStorage.setItem('__utm_captured', '1');
        }
      }
    } catch { }
  }, [location.search]);
  return (
    <div className="flex flex-col min-h-screen font-sans text-navy-900 bg-slate-50">
      {!(location.pathname || '').startsWith('/admin') && !(location.pathname || '').startsWith('/salesteam') && <GoogleAnalytics />}
      {!(location.pathname || '').startsWith('/admin') && !(location.pathname || '').startsWith('/salesteam') && content.settings.activeTheme === 'christmas' && <SnowOverlay />}
      {!(location.pathname || '').startsWith('/admin') && !(location.pathname || '').startsWith('/salesteam') && content.settings.activeTheme === 'new_year' && <FireworksOverlay />}
      {children ? children : <Outlet />}
      {!(location.pathname || '').startsWith('/admin') && !(location.pathname || '').startsWith('/salesteam') && <ExitIntentModal />}
    </div>
  );
};

export default Layout;
