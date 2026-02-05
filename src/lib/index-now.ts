
import { Logger } from '@nestjs/common';

const logger = new Logger('IndexNow');

/**
 * Pings IndexNow API to notify search engines of URL changes.
 * Recommended by Bing for faster indexing.
 */
export async function pingIndexNow(urls: string | string[]) {
    const key = 'c9573827bc124806a88b577189cc2138';
    const urlList = Array.isArray(urls) ? urls : [urls];

    if (urlList.length === 0) return;

    const domains = ['www.bing.com', 'search.yandex.ru', 'indexnow.org'];

    for (const domain of domains) {
        try {
            const response = await fetch(`https://${domain}/indexnow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({
                    host: 'servertechcentral.com',
                    key: key,
                    keyLocation: `https://servertechcentral.com/${key}.txt`,
                    urlList: urlList,
                }),
            });

            if (response.ok) {
                logger.log(`Successfully pinged IndexNow via ${domain} for ${urlList.length} URL(s)`);
            } else {
                logger.warn(`Failed to ping IndexNow via ${domain}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            logger.error(`Error pinging IndexNow via ${domain}:`, error);
        }
    }
}
