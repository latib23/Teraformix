import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

const ENV_RECAPTCHA_SITE_KEY = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || '';

export const useRecaptcha = () => {
    const [isReady, setIsReady] = useState(false);
    const [siteKey, setSiteKey] = useState(ENV_RECAPTCHA_SITE_KEY);
    const scriptLoadedRef = useRef(false);

    // Fetch site key if not available
    useEffect(() => {
        if (!siteKey) {
            api.get<{ key: string }>('payments/recaptcha-key')
                .then((data) => {
                    if (data?.key) setSiteKey(String(data.key));
                })
                .catch(() => { });
        }
    }, []);

    // Lazy load Recaptcha Script
    const loadScript = () => {
        if (!siteKey) return Promise.reject('No site key');
        if ((window as any).grecaptcha) {
            setIsReady(true);
            return Promise.resolve((window as any).grecaptcha);
        }

        if (scriptLoadedRef.current) {
            // Wait for it to be ready
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if ((window as any).grecaptcha) {
                        setIsReady(true);
                        clearInterval(interval);
                        resolve((window as any).grecaptcha);
                    }
                }, 100);
            });
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setIsReady(true);
                scriptLoadedRef.current = true;
                resolve((window as any).grecaptcha);
            };
            script.onerror = reject;
            document.head.appendChild(script);
            scriptLoadedRef.current = true;
        });
    };

    const execute = async (action: string): Promise<string> => {
        if (!siteKey) {
            console.warn('Recaptcha missing key');
            return '';
        }

        try {
            const g = await loadScript();
            return new Promise((resolve) => {
                g.ready(async () => {
                    try {
                        const token = await g.execute(siteKey, { action });
                        resolve(token);
                    } catch (error) {
                        console.error('Recaptcha execution failed:', error);
                        resolve('');
                    }
                });
            });
        } catch (err) {
            console.error('Recaptcha load failed:', err);
            return '';
        }
    };

    return { execute, isReady };
};
