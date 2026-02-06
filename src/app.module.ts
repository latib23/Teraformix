import { Module, Controller, Get, Res, Req, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductsModule } from './products/products.module';
import { QuotesModule } from './quotes/quotes.module';
import { OrdersModule } from './orders/orders.module';
import { SearchModule } from './search/search.module';
import { CmsModule } from './cms/cms.module';
import { ShippingModule } from './shipping/shipping.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsService } from './products/products.service';
import { CmsService } from './cms/cms.service';
import { load as cheerioLoad } from 'cheerio';

// Entities
import { User } from './users/entities/user.entity';
import { Company } from './companies/entities/company.entity';
import { Product } from './products/entities/product.entity';
import { Quote } from './quotes/entities/quote.entity';
import { Order } from './orders/entities/order.entity';
import { ContentBlock } from './cms/entities/content-block.entity';

@Controller()
class HealthController {
  constructor(private readonly dataSource: DataSource, private readonly config: ConfigService) { }

  @Get('health')
  status() {
    return { status: 'ok' };
  }

  @Get('health/db')
  async db() {
    try {
      await this.dataSource.query('SELECT 1');
      const databaseUrl = this.config.get<string>('DATABASE_URL');
      const host = databaseUrl
        ? new URL(databaseUrl).hostname
        : this.config.get<string>('PGHOST') || this.config.get<string>('PGHOST_PUBLIC') || 'localhost';
      const database = databaseUrl
        ? decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ''))
        : this.config.get<string>('PGDATABASE') || 'postgres';
      return { connected: true, host, database };
    } catch (e: any) {
      return { connected: false, error: String(e?.message || e) };
    }
  }
}


const loadIndex = (html: string) => {
  const assetBase = (process.env.ASSET_BASE_URL || '').trim();
  if (assetBase) {
    html = html.replace(/(href|src)=("|')\/assets\//gi, `$1=$2${assetBase.replace(/\/$/, '')}/assets/`);
  }

  // Strip malformed modulepreloads with data URIs which cause MIME type errors
  html = html.replace(/<link[^>]*rel=(?:"|')modulepreload(?:"|')[^>]*href=(?:"|')data:[^"']*(?:"|')[^>]*>/gi, '');

  const $ = cheerioLoad(html);

  try {
    const adsId = process.env.GOOGLE_ADS_ID || 'AW-16944175494';
    const leadLabel = process.env.GOOGLE_ADS_LEAD_LABEL || 'RfRjCM2SicobEIazzo8_';
    const clarityId = process.env.CLARITY_PROJECT_ID || 'so49yg178g';
    const apolloAppId = process.env.APOLLO_TRACKER_APP_ID || '690885af03516b0019eab87a';

    const deferredScript = `
      <script>
      window.addEventListener('load', function() {
        setTimeout(function() {
          ${adsId ? `
            // Google Ads Conversion
            (function(){window.gtag_report_conversion=window.gtag_report_conversion||function(url){try{if(window.gtag){var cb=function(){if(typeof url!=='undefined'){window.location=url;}};window.gtag('event','conversion',{send_to:'${adsId}/${leadLabel}',value:1.0,currency:'USD',event_callback:cb});}}catch(e){}return false;};})();
          ` : ''}

          ${clarityId ? `
            // Clarity
            (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','${clarityId}');
          ` : ''}

          ${apolloAppId ? `
            // Apollo
            (function(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n,o.async=!0,o.defer=!0,o.onload=function(){window.trackingFunctions&&window.trackingFunctions.onLoad&&window.trackingFunctions.onLoad({appId:"${apolloAppId}"})},document.head.appendChild(o)})();
          ` : ''}

          // LeadPipe
          (function(){var s=document.createElement("script");s.src="https://leadpipe.aws53.cloud/p/be5b1709-41f1-4f08-b272-6487fb4618fc.js";s.async=true;document.head.appendChild(s);})();

        }, 5000); // 5s extra delay for absolute safety
      });
      </script>
    `;

    $('body').append(deferredScript);
  } catch (e) { void 0; }
  return $;
};

const sendHtml = (req: any, res: Response, html: string) => {
  try {
    const enc = String(req.headers?.['accept-encoding'] || req.headers?.['Accept-Encoding'] || '');
    if (enc.toLowerCase().includes('gzip')) {
      const buf = gzipSync(Buffer.from(html, 'utf8'));
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Vary', 'Accept-Encoding');
      return res.end(buf);
    }
  } catch (e) { void e; }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
};

@Controller()
class SpaController {
  constructor(private readonly productsService: ProductsService, private readonly cmsService: CmsService) { }
  @Get()
  async root(@Req() req: any, @Res() res: Response) {
    try {
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `https://${host}`;
      const settings = await this.cmsService.getContent('settings');
      const siteName = (settings && settings.siteTitle) ? String(settings.siteTitle) : 'Teraformix';
      const siteDesc = (settings && settings.siteDescription) ? String(settings.siteDescription) : 'Enterprise Hardware Reseller. Servers, Storage, and Networking.';
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `${siteName}`;
      const pageDesc = siteDesc.replace(/"/g, '').slice(0, 160);
      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="https://teraformix.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
        <link rel="alternate" hreflang="en-US" href="${origin}/">
        <link rel="alternate" hreflang="x-default" href="${origin}/">
      `);

      const org: any = { '@context': 'https://schema.org', '@type': 'Organization', name: siteName, url: origin };
      const website: any = { '@context': 'https://schema.org', '@type': 'WebSite', name: siteName, url: origin, potentialAction: { '@type': 'SearchAction', target: `${origin}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
      $('head').append(`<script type="application/ld+json">${JSON.stringify(org)}</script>`);
      $('head').append(`<script type="application/ld+json">${JSON.stringify(website)}</script>`);
      const categoriesContent = await this.cmsService.getContent('categories');
      const activeCategories = Array.isArray(categoriesContent) ? categoriesContent.filter((c: any) => c && c.isActive) : [];
      const homeContent = await this.cmsService.getContent('home');
      const partnerLogos = Array.isArray(homeContent?.partnerLogos) ? homeContent.partnerLogos : [];
      const partnerHtml = partnerLogos.length > 0
        ? `<div class="flex items-center gap-10">${partnerLogos.map((logo: any) => {
          const img = `<img src="${String(logo.image)}" alt="${String(logo.alt || 'Partner')}" class="h-8 w-auto object-contain" />`;
          return logo.url ? `<a href="${String(logo.url)}" rel="sponsored noopener" target="_blank" class="inline-flex items-center">${img}</a>` : `<div class="inline-flex items-center">${img}</div>`;
        }).join('')}</div>`
        : `<div class="flex items-center gap-10 opacity-100">
            <div class="flex items-center gap-2"><span class="text-xs font-bold">Cisco</span><span class="text-xs">Partner</span></div>
            <div class="flex items-center gap-2"><span class="text-xs font-bold">Seagate</span><span class="text-xs">Partner</span></div>
            <div class="flex items-center gap-2"><span class="text-xs font-bold">Fortinet</span><span class="text-xs">Authorized</span></div>
          </div>`;
      const { items: featuredItems } = await this.productsService.findPaginated({ limit: 8, offset: 0 }); // Match client limit

      const mappedFeatured = featuredItems.map(p => {
        const a: any = p.attributes || {};
        const s: any = p.schema || {};
        const derived = {
          mpn: a.__schema_mpn,
          itemCondition: a.__schema_itemCondition,
          gtin13: a.__schema_gtin13,
          gtin14: a.__schema_gtin14,
          priceValidUntil: a.__schema_priceValidUntil,
          seller: a.__schema_seller,
          ratingValue: a.__schema_ratingValue,
          reviewCount: a.__schema_reviewCount,
          reviews: a.__schema_reviews,
        };
        const hasSchema = p.schema && Object.keys(p.schema || {}).length > 0;
        const schema = hasSchema ? p.schema : derived;
        return {
          ...p,
          price: Number(p.basePrice),
          specs: a,
          schema,
          stockStatus: p.stockLevel > 0 ? 'IN_STOCK' : 'BACKORDER',
          brand: p.brand || 'Generic',
          category: p.category || 'Uncategorized',
          image: p.image || ''
        };
      });

      const initialDataScript = `<script>window.INITIAL_DATA = { featuredItems: ${JSON.stringify(mappedFeatured)} };</script>`;
      $('head').append(initialDataScript);

      const featuredHtml = Array.isArray(featuredItems) && featuredItems.length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">${featuredItems.slice(0, 4).map((p: any, idx: number) => {
          const price = p.showPrice
            ? Number(p.basePrice || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            : 'Request for Quote';
          const img = String(p.image || '');
          const priorityAttr = idx === 0 ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"';
          const imgTag = img ? `<img src="${img}" alt="${String(p.name)}" class="h-48 w-full object-cover rounded mb-4" ${priorityAttr} width="400" height="192" />` : `<div class="h-48 w-full bg-gray-200 rounded mb-4"></div>`;
          return `<a href="/product/${encodeURIComponent(String(p.sku))}" class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition block">
              ${imgTag}
              <div class="text-sm font-bold text-navy-900 mb-1">${String(p.name)}</div>
              <div class="text-xs text-gray-600 mb-4">${String(p.brand || '')}</div>
              <div class="text-sm font-bold text-action-600">${price}</div>
            </a>`;
        }).join('')}</div>`
        : '';
      const categoryCards = activeCategories.filter((c: any) => c && c.isActive).slice(0, 8).map((c: any) => {
        const img = String(c.image || '');
        const imgTag = img ? `<img src="${img}" alt="${String(c.name)}" class="w-16 h-16 object-cover rounded-full mb-4" />` : `<div class="w-16 h-16 bg-blue-100 text-blue-700 rounded-full mb-4"></div>`;
        return `<a href="/category/${encodeURIComponent(String(c.id))}" class="group p-6 border border-gray-200 rounded-xl hover:border-action-500 hover:shadow-md transition flex flex-col items-center text-center bg-gray-50 hover:bg-white">
          ${imgTag}
          <div class="font-bold text-navy-900 group-hover:text-action-600 transition">${String(c.name)}</div>
          <div class="text-xs text-gray-500 mt-2">${String(c.description || '')}</div>
        </a>`;
      }).join('');
      const general = await this.cmsService.getContent('general');
      const cage = String(general?.cageCode || '');
      const duns = String(general?.dunsNumber || '');
      const ssrBlock = `
        <section id="ssr-home" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">${siteName}</h1>
          <p class="text-sm text-gray-700 mt-2">${pageDesc}</p>
          <div class="bg-white border-b border-gray-200 py-8 shadow-sm mt-6">
            <div class="container mx-auto px-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xs font-bold text-navy-900 uppercase tracking-wider">Trusted Certifications & Partners</h2>
              </div>
              <div class="flex flex-col lg:flex-row justify-between items-center gap-10">
                <div class="flex items-center gap-8 text-sm font-medium text-navy-800">
                  <div class="flex items-center gap-3"><span class="font-bold">ISO 9001</span><span class="text-xs text-gray-500">Quality</span></div>
                  <div class="w-px h-8 bg-gray-200"></div>
                  <div class="flex items-center gap-3"><span class="font-bold">ISO 14001</span><span class="text-xs text-gray-500">Environmental</span></div>
                  <div class="w-px h-8 bg-gray-200"></div>
                  <div class="flex items-center gap-3"><span class="font-bold">ISO 27001</span><span class="text-xs text-gray-500">Security</span></div>
                </div>
                ${partnerHtml}
              </div>
            </div>
          </div>
          <section class="py-16 bg-white">
            <div class="container mx-auto px-4">
              <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-navy-900 mb-4">Why Procurement Teams Trust Us</h2>
                <p class="text-gray-600 max-w-2xl mx-auto">We understand that downtime is not an option. Our infrastructure is built to support yours with speed, reliability, and financial flexibility.</p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg mb-6"></div>
                  <h3 class="text-xl font-bold text-navy-900 mb-3">Global Logistics Network</h3>
                  <p class="text-gray-600 text-sm">With distribution centers in New York, California, and Texas, we offer same-day shipping on most in-stock inventory. Blind drop-shipping and international pallet freight available.</p>
                </div>
                <div class="p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <div class="w-12 h-12 bg-action-100 rounded-lg mb-6"></div>
                  <h3 class="text-xl font-bold text-navy-900 mb-3">Rigorous QA Testing</h3>
                  <p class="text-gray-600 text-sm">Every server and drive undergoes 24-hour stress testing. Firmware, logs, and cosmetics verified by certified engineers for a like-new experience.</p>
                </div>
                <div class="p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <div class="w-12 h-12 bg-orange-100 rounded-lg mb-6"></div>
                  <h3 class="text-xl font-bold text-navy-900 mb-3">Financial Services</h3>
                  <p class="text-gray-600 text-sm">Access Net 30 terms, volume discounts, and BOM auditing. University and Government Purchase Orders accepted.</p>
                </div>
              </div>
            </div>
          </section>
          <section class="bg-gray-50 py-16 border-t border-gray-200">
            <div class="container mx-auto px-4">
              <div class="flex justify-between items-end mb-8">
                <div>
                  <h2 class="text-2xl font-bold text-navy-900">Featured Inventory</h2>
                  <p class="text-gray-500 mt-1">High-demand components ready to ship.</p>
                </div>
                <a href="/category" class="text-action-600 font-semibold">View All →</a>
              </div>
              ${featuredHtml}
            </div>
          </section>
          <section class="py-16 bg-white border-t border-gray-200">
            <div class="container mx-auto px-4">
              <div class="text-center mb-10">
                <h2 class="text-2xl font-bold text-navy-900">Explore by Category</h2>
                <p class="text-gray-500 mt-2">Browse our specialized hardware divisions</p>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">${categoryCards || ['Servers', 'Storage', 'Networking', 'Components'].map((name) => `<a href="/category" class="group p-6 border border-gray-200 rounded-xl transition flex flex-col items-center text-center bg-gray-50"><div class="w-16 h-16 bg-blue-100 rounded-full mb-4"></div><div class="font-bold text-navy-900">${name}</div></a>`).join('')}</div>
            </div>
          </section>
          <section class="py-20 bg-navy-900 text-white">
            <div class="container mx-auto px-4">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <span class="text-action-500 font-bold tracking-wider uppercase text-sm mb-2 block">Specialized Verticals</span>
                  <h2 class="text-3xl md:text-4xl font-bold mb-6">Tailored Hardware Solutions for Critical Industries</h2>
                  <div class="space-y-6 text-gray-300">
                    <p>We are a strategic partner for organizations where uptime is critical. We source legacy parts for aging infrastructure and the latest generation hardware for AI clusters.</p>
                    <p>We understand public sector billing and compliance requirements, including TAA compliance and E-Rate funding cycles.</p>
                    <div class="flex gap-4 mt-6 items-center text-sm font-mono text-gray-400 bg-navy-950/50 p-4 rounded border border-navy-700 inline-block">
                      <span>CAGE: <span class="text-white">${cage}</span></span>
                      <span class="w-px h-4 bg-gray-600"></span>
                      <span>DUNS: <span class="text-white">${duns}</span></span>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-6">
                  <div class="bg-navy-800 p-6 rounded-lg border border-navy-700">
                    <h3 class="text-lg font-bold text-white mb-2">Hyperscale Data Centers</h3>
                    <p class="text-sm text-gray-400">High-density compute nodes and bulk NVMe storage. Rapid provisioning for cloud expansion.</p>
                  </div>
                  <div class="bg-navy-800 p-6 rounded-lg border border-navy-700">
                    <h3 class="text-lg font-bold text-white mb-2">Federal & Local Government</h3>
                    <p class="text-sm text-gray-400">TAA-compliant hardware, secure chain of custody, and dedicated account managers.</p>
                  </div>
                  <div class="bg-navy-800 p-6 rounded-lg border border-navy-700">
                    <h3 class="text-lg font-bold text-white mb-2">Education & Research</h3>
                    <p class="text-sm text-gray-400">HPC clusters for universities and reliable networking for K-12.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }





  @Get('landing')
  async landingRoot(@Req() req: any, @Res() res: Response) {
    try {
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('landing/:slug')
  async landingSlug(@Req() req: any, @Res() res: Response) {
    try {
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }


  @Get('product/:id')
  async productRoute(@Req() req: any, @Res() res: Response) {
    try {
      const p = await this.productsService.findOne(String(req.params.id));

      const toRaw = String((p as any)?.redirectTo || '').trim();
      const isPerm = !!(p as any)?.redirectPermanent;

      if (toRaw) {
        const cur = String(req.originalUrl || req.url || '')
          .split('?')[0]
          .replace(/\/+$/, '')
          .toLowerCase();

        const dest = toRaw
          .split('?')[0]
          .replace(/\/+$/, '')
          .toLowerCase();

        // 🛑 STOP infinite redirect loops
        if (cur !== dest) {
          return res.redirect(isPerm ? 301 : 302, toRaw);
        }

        // console.log('[BLOCKED LOOP]', cur, '=>', dest);
      }

      // Server-side inject JSON-LD for validators that don't execute JS
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `https://${host}`;
      const productUrl = `${origin}/product/${encodeURIComponent(String((p as any).sku))}`;

      const settings = await this.cmsService.getContent('settings');
      const siteName = (settings && settings.siteTitle) ? String(settings.siteTitle) : 'Teraformix';
      const a: any = (p as any).attributes || {};
      const s: any = (p as any).schema || {};
      const schemaData: any = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": (p as any).name,
        "image": [],
        "description": (p as any).description,
        "sku": (p as any).sku,
        "mpn": s.mpn || a.__schema_mpn || (p as any).sku,
        "brand": { "@type": "Brand", "name": (p as any).brand },
        "offers": {
          "@type": "Offer",
          "url": productUrl,
          "priceCurrency": "USD",
          "price": Number((p as any).basePrice ?? 0),
          "itemCondition": `https://schema.org/${s.itemCondition || a.__schema_itemCondition || 'NewCondition'}`,
          "availability": ((p as any).stockLevel > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": { "@type": "Organization", "name": s.seller || a.__schema_seller || siteName },
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": { "@type": "MonetaryAmount", "value": 0, "currency": "USD" },
            "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "US" },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
              "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 5, "unitCode": "DAY" }
            }
          },
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 30,
            "applicableCountry": "US",
            "returnLabelSource": "https://schema.org/MerchantReturnLabelSourceCustomerService",
            "returnMethod": "https://schema.org/ReturnByMail",
            "returnFees": "https://schema.org/FreeReturn"
          }
        },

      };
      const img = String((p as any).image || '');
      const defaultOg = 'https://teraformix.com/og-default.jpg';
      schemaData.image = img && !img.startsWith('data:') ? [img] : [defaultOg];
      if (s.gtin13 || a.__schema_gtin13) schemaData.gtin13 = String(s.gtin13 || a.__schema_gtin13);
      if (s.gtin14 || a.__schema_gtin14) schemaData.gtin14 = String(s.gtin14 || a.__schema_gtin14);
      if (s.priceValidUntil || a.__schema_priceValidUntil) schemaData.offers.priceValidUntil = String(s.priceValidUntil || a.__schema_priceValidUntil);
      const ratingValue = s.ratingValue ?? a.__schema_ratingValue;
      const reviewCount = s.reviewCount ?? a.__schema_reviewCount;
      if (ratingValue !== undefined && reviewCount !== undefined) {
        schemaData.aggregateRating = { "@type": "AggregateRating", "ratingValue": String(ratingValue), "reviewCount": String(reviewCount) };
      }
      let reviews: any = s.reviews ?? a.__schema_reviews;
      try {
        if (typeof reviews === 'string') reviews = JSON.parse(reviews);
      } catch { reviews = undefined; }
      if (Array.isArray(reviews) && reviews.length > 0) {
        schemaData.review = reviews.slice(0, 10).map((r: any) => ({
          "@type": "Review",
          "author": r.author ? { "@type": "Person", "name": String(r.author) } : undefined,
          "datePublished": r.datePublished ? String(r.datePublished) : undefined,
          "reviewBody": r.reviewBody ? String(r.reviewBody) : undefined,
          "reviewRating": r.ratingValue ? { "@type": "Rating", "ratingValue": String(r.ratingValue) } : undefined
        })).filter(Boolean);
      }

      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const category = String((p as any).category || '').trim();
      const slug = category
        ? category.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : '';
      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: category || 'Components', item: slug ? `${origin}/category/${slug}` : `${origin}/category` },
          { '@type': 'ListItem', position: 3, name: (p as any).name, item: productUrl }
        ]
      };
      const rawName = String((p as any).name || '');
      const truncName = rawName.length > 40 ? rawName.substring(0, 40) + '...' : rawName;
      const pageTitle = `${truncName} | Teraformix`;
      const pageDesc = String((p as any).description || `${(p as any).brand || ''} ${(p as any).sku || ''}`).slice(0, 160).replace(/"/g, '');
      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${productUrl}">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="product">
        <meta property="og:url" content="${productUrl}">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="${schemaData.image[0]}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="${schemaData.image[0]}">
        ${(p as any).basePrice ? `<meta property="product:price:amount" content="${(p as any).basePrice}">` : ''}
        <meta property="product:price:currency" content="USD">
        <link rel="alternate" hreflang="en-US" href="${productUrl}">
        <link rel="alternate" hreflang="x-default" href="${productUrl}">
      `);

      $('head').append(`<script type="application/ld+json">${JSON.stringify(schemaData)}</script>`);
      $('head').append(`<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`);
      const stockUnits = Number((p as any).stockLevel || 0);
      const availabilityText = stockUnits > 0 ? `In Stock • ${stockUnits} units` : 'Out of Stock';
      const priceText = Number((p as any).basePrice || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      const dims = String((p as any).dimensions || '').trim();
      const weight = String((p as any).weight || '').trim();
      const warranty = String((p as any).warranty || '3-Year Warranty').trim();
      const safeOverview = String((p as any).overview || '').replace(/<[^>]+>/g, '').slice(0, 500);
      const imgTag = schemaData.image && schemaData.image.length > 0 ? `<img src="${schemaData.image[0]}" alt="${(p as any).name}" style="max-width:100%;height:auto" />` : '';
      const categoriesContent = await this.cmsService.getContent('categories');
      const activeCategories = Array.isArray(categoriesContent) ? categoriesContent.filter((c: any) => c && c.isActive) : [];
      const currentCat = String(category || '').toLowerCase();
      const categoryPicks = activeCategories.filter((c: any) => String(c.name || '').toLowerCase() !== currentCat).slice(0, 6);
      const relatedCategoriesHtml = categoryPicks.length > 0
        ? `<section class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Explore Related Categories</h2><div class="flex flex-wrap gap-2">${categoryPicks.map((c: any) => `<a href="/category/${encodeURIComponent(String(c.id))}" class="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:text-action-600 hover:border-action-500 transition">${String(c.name)}</a>`).join('')}</div></section>`
        : `<section class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Explore Related Categories</h2><div class="flex flex-wrap gap-2">${['Servers', 'Storage', 'Networking'].slice(0, 6).map((name) => `<a href="/category" class="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:text-action-600 hover:border-action-500 transition">${name}</a>`).join('')}</div></section>`;
      const reviewsHtml = Array.isArray(reviews) && reviews.length > 0
        ? `<section class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Verified Buyer Reviews</h2><div class="space-y-4">${reviews.slice(0, 3).map((r: any) => {
          const author = r.author ? String(r.author) : 'Anonymous';
          const body = r.reviewBody ? String(r.reviewBody) : '';
          const rating = r.ratingValue ? Number(r.ratingValue) : undefined;
          const stars = rating ? '★'.repeat(Math.max(1, Math.min(5, Math.round(rating)))) : '';
          return `<div class="border rounded p-3"><div class="text-sm text-gray-700">${stars ? `<span class="text-yellow-600">${stars}</span> ` : ''}<strong>${author}</strong></div><p class="text-sm text-gray-800 mt-1">${body}</p></div>`;
        }).join('')}</div></section>`
        : '';
      const resourcesHtml = (p as any).datasheet ? `<section class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Resources</h2><ul class="list-disc pl-6 text-sm text-navy-900"><li><a href="${(p as any).datasheet}" rel="noopener" target="_blank">Datasheet (PDF)</a></li></ul></section>` : '';
      const landingContent = await this.cmsService.getContent('landingCollections');
      const allLogos = Array.isArray(landingContent) ? landingContent.flatMap((c: any) => c.logos || []) : [];
      const uniqueLogos = allLogos.filter((v, i, a) => a.findIndex(t => t.imageUrl === v.imageUrl) === i).slice(0, 6);
      const logosHtml = uniqueLogos.length > 0
        ? `<div class="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">${uniqueLogos.map((l: any) => `<div class="p-2 bg-white border border-gray-100 rounded flex items-center justify-center grayscale opacity-80 shadow-sm"><img src="${l.imageUrl}" alt="${l.name}" style="max-height:24px;object-fit:contain" /></div>`).join('')}</div>`
        : `<div class="flex flex-wrap gap-8 items-center opacity-70 grayscale">
              <div class="flex items-center gap-2"><span class="font-bold text-navy-900">Fortune 500</span> <span class="text-xs">Certified Supply Chain</span></div>
              <div class="flex items-center gap-2"><span class="font-bold text-navy-900">ISO 9001</span> <span class="text-xs">Quality Management</span></div>
              <div class="flex items-center gap-2"><span class="font-bold text-navy-900">TAA</span> <span class="text-xs">Compliant Hardware</span></div>
              <div class="flex items-center gap-2"><span class="font-bold text-navy-900">NIST</span> <span class="text-xs">Secure Procurement</span></div>
            </div>`;

      const ssrBlock = `
        <section id="ssr-product" class="container mx-auto px-4 py-6">
          <h1>${(p as any).name}</h1>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>${imgTag}</div>
            <div>
              <div class="text-2xl font-bold text-navy-900 mb-2">${priceText}</div>
              <div class="text-sm text-gray-700 mb-4">${availabilityText}</div>
              <h3 class="text-sm font-bold text-navy-900 mb-2">Specifications</h3>
              <ul class="text-sm text-gray-800 space-y-1">
                <li><strong>SKU:</strong> ${(p as any).sku}</li>
                <li><strong>Brand:</strong> ${(p as any).brand}</li>
                ${warranty ? `<li><strong>Warranty:</strong> ${warranty}</li>` : ''}
                ${dims ? `<li><strong>Dimensions:</strong> ${dims}</li>` : ''}
                ${weight ? `<li><strong>Weight:</strong> ${weight}</li>` : ''}
              </ul>
              ${category ? `<div class="mt-3"><a href="${slug ? `${origin}/category/${slug}` : `${origin}/category`}" class="text-action-600 text-sm font-semibold hover:underline">View ${category} Products</a></div>` : ''}
            </div>
          </div>
          ${safeOverview ? `<div class="mt-6"><h2 class="text-lg font-bold text-navy-900 mb-3">Key Features</h2><p class="text-gray-800">${safeOverview}</p></div>` : ''}
          ${!safeOverview ? `<section class="mt-6"><h2 class="text-lg font-bold text-navy-900 mb-3">Key Features</h2><p class="text-gray-800 mb-4">This enterprise-grade component is rigorously tested to ensure maximum reliability and performance for mission-critical server environments. Sourced from trusted OEM channels, it comes with our comprehensive warranty support.</p><ul class="list-disc pl-6 text-sm text-gray-800 space-y-1"><li>OEM Genuine Component verified by certified technicians.</li><li>Clean serial number ready for service contract registration.</li><li>Electrostatic Discharge (ESD) safe packaging.</li><li>Supports hot-swapping for zero-downtime maintenance.</li><li>Fully compatible with specified generation hardware.</li></ul></section>` : ''}
          ${reviewsHtml}
          <section class="mt-8 border-t border-gray-100 pt-6">
            <h2 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Trusted by Professionals Worldwide</h2>
            ${logosHtml}
            <p class="text-[11px] text-gray-500 mt-4 italic">Join over 10,000 IT professionals who rely on Teraformix for mission-critical infrastructure.</p>
          </section>
          ${resourcesHtml}
          ${relatedCategoriesHtml}
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (e: any) {
      if (e instanceof NotFoundException || e.status === 404 || e.message?.includes('not found')) {
        res.status(404);
      }
    }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('category/:id')
  async categoryRoute(@Req() req: any, @Res() res: Response) {
    try {
      const id = String(req.params.id);
      const proto = process.env.NODE_ENV === 'production' ? 'https' : ((req.headers['x-forwarded-proto'] as string) || req.protocol || 'http');
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `${proto}://${host}`;
      const categories = await this.cmsService.getContent('categories');
      const cat = Array.isArray(categories) ? categories.find((c: any) => String(c.id) === id) : null;
      if (cat) {
        const to = cat?.redirectTo || '';
        const isPerm = !!cat?.redirectPermanent;
        if (to && typeof to === 'string') {
          return res.redirect(isPerm ? 301 : 302, to);
        }
        const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
        const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
        const catName = String(cat.name || '');
        const truncCat = catName.length > 40 ? catName.substring(0, 40) + '...' : catName;
        const pageTitle = String(cat.seoTitle || `${truncCat} | Teraformix`);
        const pageDesc = String(cat.seoDescription || cat.description || `${cat.name} inventory`).replace(/"/g, '').slice(0, 160);
        $('title').text(pageTitle);

        $('link[rel="canonical"]').remove();
        $('head').append(`<link rel="canonical" href="${origin}/category/${encodeURIComponent(String(cat.id))}">`);

        $('meta[name="description"]').remove();
        $('head').append(`<meta name="description" content="${pageDesc}">`);

        // Social Meta
        $('meta[property^="og:"]').remove();
        $('meta[name^="twitter:"]').remove();
        $('head').append(`
          <meta property="og:title" content="${pageTitle}">
          <meta property="og:description" content="${pageDesc}">
          <meta property="og:type" content="website">
          <meta property="og:url" content="${origin}/category/${encodeURIComponent(String(cat.id))}">
          <meta property="og:site_name" content="Teraformix">
          <meta property="og:image" content="https://teraformix.com/og-default.jpg">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:site" content="@Teraformix">
          <meta name="twitter:creator" content="@Teraformix">
          <meta name="twitter:title" content="${pageTitle}">
          <meta name="twitter:description" content="${pageDesc}">
          <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
          <link rel="alternate" hreflang="en-US" href="${origin}/category/${encodeURIComponent(String(cat.id))}">
          <link rel="alternate" hreflang="x-default" href="${origin}/category/${encodeURIComponent(String(cat.id))}">
        `);

        const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` }, { '@type': 'ListItem', position: 2, name: String(cat.name), item: `${origin}/category/${encodeURIComponent(String(cat.id))}` }] };
        $('head').append(`<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`);
        const { items: catProducts } = await this.productsService.findPaginated({ limit: 8, offset: 0, category: String(cat.name) });
        const productList = Array.isArray(catProducts) && catProducts.length > 0
          ? `<ul class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${catProducts.slice(0, 9).map((p: any) => {
            const price = Number(p.basePrice || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            return `<li class="border border-gray-200 rounded-lg bg-white p-4"><a href="/product/${encodeURIComponent(String(p.sku))}" class="text-navy-900 font-bold hover:underline">${String(p.name)}</a><div class="text-xs text-gray-600">${String(p.brand || '')}</div><div class="text-sm font-bold text-action-600 mt-2">${price}</div></li>`;
          }).join('')}</ul>`
          : '';
        const otherCategories = (Array.isArray(categories) ? categories : []).filter((c: any) => c && c.isActive && String(c.id) !== String(cat.id)).slice(0, 6);
        const relatedChips = otherCategories.length > 0
          ? `<div class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Explore Related Categories</h2><div class="flex flex-wrap gap-2">${otherCategories.map((c: any) => `<a href="/category/${encodeURIComponent(String(c.id))}" class="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:text-action-600 hover:border-action-500 transition">${String(c.name)}</a>`).join('')}</div></div>`
          : '';
        const ssrBlock = `
          <section id="ssr-category" class="container mx-auto px-4 py-8">
            <h1 class="text-2xl font-bold text-navy-900">${String(cat.seoH1 || cat.name)}</h1>
            ${cat.seoText ? `<p class="text-sm text-gray-700 mt-2">${String(cat.seoText)}</p>` : ''}
            ${productList}
            ${relatedChips}
          </section>
        `;
        const footerHtml = await this.getFooterHtml();
        $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
        return sendHtml(req, res, $.html());
      }
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('category')
  async categoryRoot(@Req() req: any, @Res() res: Response) {
    try {
      const proto = process.env.NODE_ENV === 'production' ? 'https' : ((req.headers['x-forwarded-proto'] as string) || req.protocol || 'http');
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `${proto}://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Categories | Teraformix`;
      const pageDesc = `Browse enterprise hardware categories: Servers, Storage, Networking.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/category">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);
      const categoriesContent = await this.cmsService.getContent('categories');
      const activeCategories = Array.isArray(categoriesContent) ? categoriesContent.filter((c: any) => c && c.isActive) : [];
      const cards = activeCategories.map((c: any) => {
        const img = String(c.image || '');
        const imgTag = img ? `<img src="${img}" alt="${String(c.name)}" class="w-16 h-16 object-cover rounded-full mb-4" />` : `<div class="w-16 h-16 bg-blue-100 rounded-full mb-4"></div>`;
        return `<a href="/category/${encodeURIComponent(String(c.id))}" class="group p-6 border border-gray-200 rounded-xl hover:border-action-500 hover:shadow-md transition flex flex-col items-center text-center bg-gray-50 hover:bg-white">
          ${imgTag}
          <div class="font-bold text-navy-900 group-hover:text-action-600 transition">${String(c.name)}</div>
          <div class="text-xs text-gray-500 mt-2">${String(c.description || '')}</div>
        </a>`;
      }).join('');
      const ssrBlock = `
        <section id="ssr-category-root" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Categories</h1>
          <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">${cards || ['Servers', 'Storage', 'Networking', 'Components'].map((name) => `<a href="/category" class="group p-6 border border-gray-200 rounded-xl transition flex flex-col items-center text-center bg-gray-50"><div class="w-16 h-16 bg-blue-100 rounded-full mb-4"></div><div class="font-bold text-navy-900">${name}</div></a>`).join('')}</div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }



  @Get('privacy')
  async privacy(@Req() req: any, @Res() res: Response) {
    try {
      const proto = process.env.NODE_ENV === 'production' ? 'https' : ((req.headers['x-forwarded-proto'] as string) || req.protocol || 'http');
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `${proto}://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Privacy Policy | Teraformix`;
      const pageDesc = `Read our privacy practices and data protection policy.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/privacy">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/privacy">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="https://teraformix.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
        <link rel="alternate" hreflang="en-US" href="${origin}/privacy">
        <link rel="alternate" hreflang="x-default" href="${origin}/privacy">
      `);
      const privacy = await this.cmsService.getContent('privacyPolicy');
      let body = String(privacy?.content || '').trim();
      body = body.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-navy-900 mt-6">$1</h3>');
      body = body.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-navy-900 mt-8">$1</h2>');
      body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      body = body.replace(/^-\s+(.*)$/gm, '<p class="text-sm text-gray-700">• $1</p>');
      const ssrBlock = `
        <section id="ssr-privacy" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Privacy Policy</h1>
          <div class="prose max-w-none text-gray-800 mt-4">${body || '<p class="text-sm text-gray-700">We respect your privacy and protect your data according to applicable laws.</p>'}</div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('terms')
  async terms(@Req() req: any, @Res() res: Response) {
    try {
      const proto = process.env.NODE_ENV === 'production' ? 'https' : ((req.headers['x-forwarded-proto'] as string) || req.protocol || 'http');
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `${proto}://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Terms of Sale | Teraformix`;
      const pageDesc = `View order policies, returns, warranties, and terms.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/terms">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/terms">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="https://teraformix.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
        <link rel="alternate" hreflang="en-US" href="${origin}/terms">
        <link rel="alternate" hreflang="x-default" href="${origin}/terms">
      `);
      const terms = await this.cmsService.getContent('termsOfSale');
      let body = String(terms?.content || '').trim();
      body = body.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-navy-900 mt-6">$1</h3>');
      body = body.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-navy-900 mt-8">$1</h2>');
      body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      body = body.replace(/^-\s+(.*)$/gm, '<p class="text-sm text-gray-700">• $1</p>');
      const ssrBlock = `
        <section id="ssr-terms" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Terms of Sale</h1>
          <div class="prose max-w-none text-gray-800 mt-4">${body || '<p class="text-sm text-gray-700">Understand our purchase, shipping, and warranty terms.</p>'}</div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('terms-and-conditions')
  async termsConditions(@Req() req: any, @Res() res: Response) {
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `https://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Terms & Conditions | Teraformix`;
      const pageDesc = `Website usage terms, payment policies, and liability disclaimers.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/terms-and-conditions">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/terms-and-conditions">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="https://teraformix.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
        <link rel="alternate" hreflang="en-US" href="${origin}/terms-and-conditions">
        <link rel="alternate" hreflang="x-default" href="${origin}/terms-and-conditions">
      `);
      const terms = await this.cmsService.getContent('termsAndConditions');
      let body = String(terms?.content || '').trim();
      body = body.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-navy-900 mt-6">$1</h3>');
      body = body.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-navy-900 mt-8">$1</h2>');
      body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      body = body.replace(/^-\s+(.*)$/gm, '<p class="text-sm text-gray-700">• $1</p>');
      const ssrBlock = `
        <section id="ssr-terms-conditions" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Terms & Conditions</h1>
          <div class="prose max-w-none text-gray-800 mt-4">${body || '<p class="text-sm text-gray-700">Website usage terms and conditions.</p>'}</div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('warranty')
  async warranty(@Req() req: any, @Res() res: Response) {
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `https://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Warranty Policy | Teraformix`;
      const pageDesc = `Standard 3-Year Warranty on all enterprise hardware. Advanced replacement and support terms.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/warranty">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/warranty">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="https://teraformix.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
        <link rel="alternate" hreflang="en-US" href="${origin}/warranty">
        <link rel="alternate" hreflang="x-default" href="${origin}/warranty">
      `);
      const content = await this.cmsService.getContent('warrantyPage');
      let body = String(content?.content || '').trim();
      body = body.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-navy-900 mt-6">$1</h3>');
      body = body.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-navy-900 mt-8">$1</h2>');
      body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      body = body.replace(/^-\s+(.*)$/gm, '<p class="text-sm text-gray-700">• $1</p>');
      const ssrBlock = `
        <section id="ssr-warranty" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Warranty Policy</h1>
          <div class="prose max-w-none text-gray-800 mt-4">${body || '<p class="text-sm text-gray-700">Review our warranty policy.</p>'}</div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('returns')
  async returns(@Req() req: any, @Res() res: Response) {
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `https://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Return Policy | Teraformix`;
      const pageDesc = `30-day return policy for enterprise hardware. RMA process and warranty info.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/returns">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/returns">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="https://teraformix.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
        <link rel="alternate" hreflang="en-US" href="${origin}/returns">
        <link rel="alternate" hreflang="x-default" href="${origin}/returns">
      `);
      const content = await this.cmsService.getContent('returnPolicy');
      let body = String(content?.content || '').trim();
      body = body.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-navy-900 mt-6">$1</h3>');
      body = body.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-navy-900 mt-8">$1</h2>');
      body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      body = body.replace(/^-\s+(.*)$/gm, '<p class="text-sm text-gray-700">• $1</p>');
      const ssrBlock = `
        <section id="ssr-returns" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Return Policy</h1>
          <div class="prose max-w-none text-gray-800 mt-4">${body || '<p class="text-sm text-gray-700">Review our return policy.</p>'}</div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('about')
  async about(@Req() req: any, @Res() res: Response) {
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `https://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `About Us | Teraformix`;
      const pageDesc = `Learn about Teraformix, our mission, and enterprise hardware expertise.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/about">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/about">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="https://teraformix.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
        <link rel="alternate" hreflang="en-US" href="${origin}/about">
        <link rel="alternate" hreflang="x-default" href="${origin}/about">
      `);
      const content = await this.cmsService.getContent('aboutPage');
      let body = String(content?.content || '').trim();
      body = body.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-navy-900 mt-6">$1</h3>');
      body = body.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-navy-900 mt-8">$1</h2>');
      body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      body = body.replace(/^-\s+(.*)$/gm, '<p class="text-sm text-gray-700">• $1</p>');
      const ssrBlock = `
        <section id="ssr-about" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">About Us</h1>
          <div class="prose max-w-none text-gray-800 mt-4">${body || '<p class="text-sm text-gray-700">About Teraformix.</p>'}</div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('contact')
  async contact(@Req() req: any, @Res() res: Response) {
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `https://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Contact Us | Teraformix`;
      const pageDesc = `Get in touch with our sales and support team for enterprise hardware needs.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/contact">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      // Social Meta
      $('meta[property^="og:"]').remove();
      $('meta[name^="twitter:"]').remove();
      $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/contact">
        <meta property="og:site_name" content="Teraformix">
        <meta property="og:image" content="https://teraformix.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@Teraformix">
        <meta name="twitter:creator" content="@Teraformix">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://teraformix.com/og-default.jpg">
        <link rel="alternate" hreflang="en-US" href="${origin}/contact">
        <link rel="alternate" hreflang="x-default" href="${origin}/contact">
      `);

      const content = await this.cmsService.getContent('contactPage');
      let body = String(content?.content || '').trim();
      body = body.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-navy-900 mt-6">$1</h3>');
      body = body.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-navy-900 mt-8">$1</h2>');
      body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      body = body.replace(/^-\s+(.*)$/gm, '<p class="text-sm text-gray-700">• $1</p>');
      const ssrBlock = `
        <section id="ssr-contact" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Contact Us</h1>
          <div class="prose max-w-none text-gray-800 mt-4">${body || '<p class="text-sm text-gray-700">Contact us for support.</p>'}</div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('sitemap')
  async sitemapHtml(@Req() req: any, @Res() res: Response) {
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `https://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Sitemap | Teraformix`;
      const pageDesc = `Navigate our complete catalog of enterprise servers, storage, and networking.`;

      $('title').text(pageTitle);

      $('link[rel="canonical"]').remove();
      $('head').append(`<link rel="canonical" href="${origin}/sitemap">`);

      $('meta[name="description"]').remove();
      $('head').append(`<meta name="description" content="${pageDesc}">`);

      const content = await this.cmsService.getContent('sitemapSettings');
      const intro = String(content?.introText || 'Browse our site map.');
      const categories = await this.cmsService.getContent('categories');
      const activeCategories = Array.isArray(categories) ? categories.filter((c: any) => c && c.isActive) : [];

      const ssrBlock = `
        <section id="ssr-sitemap" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Sitemap</h1>
          <p class="text-gray-600 mb-8">${intro}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h2 class="font-bold text-navy-800 mb-4">Main Pages</h2>
              <ul class="space-y-2 text-sm">
                <li><a href="/" class="text-action-600 hover:underline">Home</a></li>
                <li><a href="/category" class="text-action-600 hover:underline">Categories</a></li>
                <li><a href="/about" class="text-action-600 hover:underline">About Us</a></li>
                <li><a href="/contact" class="text-action-600 hover:underline">Contact Us</a></li>
                <li><a href="/track" class="text-action-600 hover:underline">Track Order</a></li>
              </ul>
            </div>
            <div>
              <h2 class="font-bold text-navy-800 mb-4">Categories</h2>
              <ul class="space-y-2 text-sm">
                ${activeCategories.map((c: any) => `<li><a href="/category/${c.id}" class="text-action-600 hover:underline">${c.name}</a></li>`).join('')}
              </ul>
            </div>
          </div>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('track')
  async track(@Req() req: any, @Res() res: Response) {
    try {
      const proto = process.env.NODE_ENV === 'production' ? 'https' : ((req.headers['x-forwarded-proto'] as string) || req.protocol || 'http');
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `${proto}://${host}`;
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Track Order | Teraformix`;
      $('title').text(pageTitle);

      const ssrBlock = `
        <section id="ssr-track" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">Track Your Order</h1>
          <p class="text-gray-600">Enter your order number to see status.</p>
        </section>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('c9573827bc124806a88b577189cc2138.txt')
  indexNowKey(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    res.send('c9573827bc124806a88b577189cc2138');
  }
  async adminLogin(@Req() req: any, @Res() res: Response) {
    try {
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      const pageTitle = `Admin Login | Teraformix`;
      $('title').text(pageTitle);

      const ssrBlock = `
        <div class="min-h-screen flex items-center justify-center bg-gray-100">
          <div class="bg-white p-8 rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
             <h1 class="text-xl font-bold text-navy-900 mb-4">Admin Login</h1>
             <p class="text-gray-600 text-sm">Please sign in to continue.</p>
          </div>
        </div>
      `;
      const footerHtml = await this.getFooterHtml();
      $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }



  @Get('sitemap.xml')
  async sitemap(@Req() req: any, @Res() res: Response) {
    const proto = process.env.NODE_ENV === 'production' ? 'https' : ((req.headers['x-forwarded-proto'] as string) || req.protocol || 'http');
    const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
    const origin = `${proto}://${host}`;

    const now = new Date().toISOString().slice(0, 10);
    const urls: Array<{ loc: string; changefreq?: string; priority?: string; lastmod?: string }> = [];

    // Main pages
    urls.push({ loc: `${origin}/`, changefreq: 'daily', priority: '1.0', lastmod: now });
    urls.push({ loc: `${origin}/category`, changefreq: 'weekly', priority: '0.8', lastmod: now });
    urls.push({ loc: `${origin}/about`, changefreq: 'monthly', priority: '0.7', lastmod: now });
    urls.push({ loc: `${origin}/contact`, changefreq: 'monthly', priority: '0.7', lastmod: now });
    urls.push({ loc: `${origin}/privacy`, changefreq: 'monthly', priority: '0.4', lastmod: now });
    urls.push({ loc: `${origin}/terms`, changefreq: 'monthly', priority: '0.4', lastmod: now });
    urls.push({ loc: `${origin}/returns`, changefreq: 'monthly', priority: '0.5', lastmod: now });
    urls.push({ loc: `${origin}/warranty`, changefreq: 'monthly', priority: '0.5', lastmod: now });
    urls.push({ loc: `${origin}/sitemap`, changefreq: 'weekly', priority: '0.3', lastmod: now });

    // Categories
    const categories = await this.cmsService.getContent('categories');
    const categoryList = Array.isArray(categories) ? categories.filter((c: any) => c && c.isActive && c.id) : [];
    for (const cat of categoryList) {
      urls.push({ loc: `${origin}/category/${encodeURIComponent(String(cat.id))}`, changefreq: 'weekly', priority: '0.7', lastmod: now });
    }

    // Products
    const products = await this.productsService.findAll();
    for (const p of products) {
      if (p && p.sku) {
        urls.push({ loc: `${origin}/product/${encodeURIComponent(String(p.sku))}`, changefreq: 'weekly', priority: '0.6', lastmod: now });
      }
    }

    // Blog posts - dynamically added from CMS
    const blogPosts = await this.cmsService.getContent('blogPosts');
    if (Array.isArray(blogPosts)) {
      for (const post of blogPosts) {
        if (post && post.slug && post.isPublished) {
          const postDate = post.publishDate || now;
          urls.push({
            loc: `${origin}/blog/${encodeURIComponent(String(post.slug))}`,
            changefreq: 'monthly',
            priority: '0.6',
            lastmod: typeof postDate === 'string' ? postDate.slice(0, 10) : now
          });
        }
      }

      // Add blog index page if there are published blog posts
      const publishedCount = blogPosts.filter((p: any) => p && p.isPublished).length;
      if (publishedCount > 0) {
        urls.push({ loc: `${origin}/blog`, changefreq: 'weekly', priority: '0.7', lastmod: now });
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}${u.priority ? `<priority>${u.priority}</priority>` : ''}</url>`).join('\n') +
      `\n</urlset>`;
    res.setHeader('Content-Type', 'text/xml');
    res.send(xml);
  }

  @Get('admin/blog')
  adminBlog(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('admin')
  adminRoot(@Req() req: any, @Res() res: Response) {
    try {
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('admin/*')
  adminAny(@Req() req: any, @Res() res: Response) {
    try {
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }

  @Get('robots.txt')
  async robots(@Req() req: any, @Res() res: Response) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
    const origin = `${proto}://${host}`;
    const lines = [
      'User-agent: *',
      'Allow: /*.js',
      'Allow: /*.css',
      'Allow: /*.png',
      'Allow: /*.jpg',
      'Allow: /*.svg',
      'Allow: /*.webp',
      'Disallow: /admin',
      'Disallow: /sales',
      'Disallow: /checkout',
      'Disallow: /thank-you',
      'Disallow: /cart',
      'Allow: /',
      `Sitemap: ${origin}/sitemap.xml`
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.send(lines);
  }

  private async getFooterHtml() {
    try {
      const [generalData, footerData, categories, productsResult] = await Promise.all([
        this.cmsService.getContent('general') || {},
        this.cmsService.getContent('footer') || {},
        this.cmsService.getContent('categories') || [],
        this.productsService.findPaginated({ limit: 30, offset: 0 })
      ]);
      const general = generalData as any;
      const footer = footerData as any;
      const products = productsResult.items || [];
      const activeCategories = Array.isArray(categories) ? categories.filter((c: any) => c && c.isActive) : [];

      const footerLinks: { label: string; path: string }[] = [];
      activeCategories.forEach((cat: any) => {
        footerLinks.push({ label: `${cat.name} Solutions`, path: `/category/${cat.id}` });
      });
      const brands = Array.from(new Set(products.map((p: any) => p.brand).filter(Boolean)));
      brands.slice(0, 5).forEach((brand: any) => {
        footerLinks.push({ label: `Buy ${brand}`, path: `/category?search=${encodeURIComponent(String(brand))}` });
      });
      products.slice(0, 10).forEach((p: any) => {
        const shortName = p.name.length > 30 ? p.name.substring(0, 27) + '...' : p.name;
        footerLinks.push({ label: shortName, path: `/product/${p.sku}` });
      });
      const displayLinks = footerLinks.slice(0, 18);

      const year = new Date().getFullYear();
      const social = footer.social || {};
      const socialHtml = `
        <div class="mt-4">
          <h5 class="text-xs font-bold text-gray-300 uppercase mb-2">Follow Us</h5>
          <div class="flex items-center gap-3">
            ${social.facebook ? `<a href="${social.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="p-2 rounded bg-navy-800 border border-navy-700 hover:bg-navy-700 transition"><svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>` : ''}
            ${social.linkedin ? `<a href="${social.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="p-2 rounded bg-navy-800 border border-navy-700 hover:bg-navy-700 transition"><svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>` : ''}
            ${social.twitter ? `<a href="${social.twitter}" target="_blank" rel="noopener noreferrer" aria-label="Twitter" class="p-2 rounded bg-navy-800 border border-navy-700 hover:bg-navy-700 transition"><svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>` : ''}
            ${social.instagram ? `<a href="${social.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="p-2 rounded bg-navy-800 border border-navy-700 hover:bg-navy-700 transition"><svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>` : ''}
          </div>
        </div>
      `;

      return `
        <footer class="bg-navy-900 text-white pt-12 border-t border-navy-800">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div>
                <h3 class="text-xl font-bold mb-4 tracking-tight">Teraformix</h3>
                <p class="text-gray-300 text-sm mb-6 leading-relaxed">${footer.aboutText || ''}</p>
                <div class="bg-navy-800 rounded p-4 border border-navy-700">
                  <h4 class="text-xs font-bold text-gray-200 uppercase mb-2 flex items-center gap-2">
                    <svg class="w-3 h-3 text-action-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg> Government Identifiers
                  </h4>
                  <div class="flex justify-between text-xs text-gray-200 font-mono">
                    <span>CAGE: <strong>${general.cageCode || ''}</strong></span>
                    <span>DUNS: <strong>${general.dunsNumber || ''}</strong></span>
                  </div>
                </div>
              </div>
              <div>
                <h4 class="font-semibold mb-4 text-gray-100">Authorized Lines</h4>
                <ul class="space-y-2 text-sm text-gray-300">
                  <li class="flex items-center gap-2"><div class="w-1.5 h-1.5 bg-action-500 rounded-full"></div> Cisco Enterprise</li>
                  <li class="flex items-center gap-2"><div class="w-1.5 h-1.5 bg-action-500 rounded-full"></div> Seagate Storage</li>
                  <li class="flex items-center gap-2"><div class="w-1.5 h-1.5 bg-action-500 rounded-full"></div> Fortinet Security</li>
                  <li>Dell Technologies</li>
                  <li>HPE</li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold mb-4 text-gray-100">Compliance</h4>
                <ul class="space-y-2 text-sm text-gray-300">
                  <li class="flex items-center gap-2"><svg class="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg> ISO 9001 (Quality)</li>
                  <li class="flex items-center gap-2"><svg class="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg> ISO 14001 (Env)</li>
                  <li class="flex items-center gap-2"><svg class="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg> ISO 27001 (InfoSec)</li>
                  <li>TAA Compliant</li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold mb-4 text-gray-100">Contact</h4>
                <p class="text-sm text-gray-300 mb-1">${general.phone || ''}</p>
                <p class="text-sm text-gray-300">${general.email || ''}</p>
                <div class="mt-4 text-xs text-gray-300">
                  <p>Headquarters:</p>
                  <p>${general.address || ''}</p>
                </div>
                ${socialHtml}
              </div>
            </div>
            <div class="border-t border-navy-800 pt-8 pb-8">
              <h4 class="text-xs font-bold text-gray-300 uppercase mb-4">Popular Hardware Searches</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-[11px] text-gray-300">
                ${displayLinks.map(link => `<a href="${link.path}" class="hover:text-white transition truncate block" title="${link.label}">${link.label}</a>`).join('')}
              </div>
            </div>
            <div class="border-t border-navy-800 py-8 flex flex-col lg:flex-row justify-between items-center gap-6 text-xs text-gray-300">
              <div class="flex flex-col md:flex-row items-center gap-4">
                <span>&copy; ${year} Teraformix. All rights reserved.</span>
                <div class="hidden md:block w-px h-4 bg-navy-700"></div>
                <div id="amex-logo" style="width: 230px; height: 50px;">
                  <img src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies-uplift/product/images/4_Card_color_horizontal.png" width="100%" height="100%" alt="American Express Accepted Here" />
                </div>
              </div>
              <div class="flex flex-wrap justify_center gap-4 items-center">
                <a href="/track" class="hover:text-white transition font-medium">Track Order</a>
                <a href="/privacy" class="hover:text-white transition">Privacy Policy</a>
                <a href="/terms" class="hover:text-white transition">Terms of Sale</a>
                <a href="/terms-and-conditions" class="hover:text-white transition">Terms & Conditions</a>
                <a href="/returns" class="hover:text-white transition">Return Policy</a>
                <a href="/about" class="hover:text-white transition">About Us</a>
                <a href="/contact" class="hover:text-white transition">Contact Us</a>
                <a href="https://www.iafcertsearch.org/certified-entity/cG4PRZ8w8KDgoIe7OuvfcNcO" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">ISO Certificates</a>
                <a href="/sitemap" class="hover:text-white transition">Sitemap</a>
                <a href="/admin/login" class="flex items-center gap-1 text-gray-300 hover:text-white transition"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Admin</a>
              </div>
            </div>
          </div>
        </footer>
      `;
    } catch (e) {
      return '';
    }
  }

  @Get('*')
  async catchAll(@Req() req: any, @Res() res: Response) {
    // Skip API and Uploads to let Nest handle 404s for them distinctively if needed, 
    // or let them fall through to global 404.
    // Actually, if I catch '*', I am the handler.
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      // Allow standard NestJS 404 response for API/Assets
      throw new NotFoundException();
    }

    try {
      const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
      const $ = loadIndex(readFileSync(indexHtmlPath, 'utf8'));

      // 1. Generic Meta Injection (SSR-like Fallback)
      const proto = process.env.NODE_ENV === 'production' ? 'https' : ((req.headers['x-forwarded-proto'] as string) || req.protocol || 'http');
      const rawHost = req.get('host'); const host = rawHost.replace(/^www\./, '');
      const origin = `${proto}://${host}`;
      const settings = await this.cmsService.getContent('settings');
      const siteName = (settings && settings.siteTitle) ? String(settings.siteTitle) : 'Teraformix';
      const siteDesc = (settings && settings.siteDescription) ? String(settings.siteDescription) : 'Enterprise Hardware Reseller';

      // Inject Schema (Organization & Website) - moved from main.ts
      const org: any = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteName,
        url: origin
      };
      const website: any = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: origin,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${origin}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
      $('head').append(`<script type="application/ld+json">${JSON.stringify(org)}</script>`);
      $('head').append(`<script type="application/ld+json">${JSON.stringify(website)}</script>`);

      // 2. Footer Injection
      const footerHtml = await this.getFooterHtml();

      // 3. NoScript H1 Fallback
      const pth = req.path || req.url || '';
      const noscriptH1 = pth.startsWith('/category')
        ? 'Enterprise Servers & Storage Solutions'
        : pth.startsWith('/product')
          ? 'Product Details'
          : pth.startsWith('/blog')
            ? 'Blog'
            : 'Teraformix';

      $('body').prepend(`<noscript><h1 class="text-3xl font-bold text-navy-900">${noscriptH1}</h1>${footerHtml}</noscript>`);

      // 4. Send Response (200 OK)
      // We purposefully send 200 OK because this is an SPA.
      // If the route is technically "Not Found" in the React App router, the React App will show its 404 page.
      // But for the server, it successfully served the App entry point.
      return sendHtml(req, res, $.html());
    } catch (_e) { void _e; }

    // Fallback if anything fails
    res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
  }


}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'dist-client'),
        exclude: ['/warranty', '/api/(.*)', '/robots.txt', '/sitemap.xml', '/health', '/health/db', '/landing', '/landing/(.*)', '/product/(.*)', '/category/(.*)', '/admin', '/admin/(.*)', '/products', '/products/(.*)', '/contact', '/returns', '/uploads/(.*)'],
        serveStaticOptions: {
          fallthrough: true,
          index: false,
          setHeaders: (res, path) => {
            const isAsset = path.includes(`${join(__dirname, '..', 'dist-client')}/assets/`) || /\/assets\//.test(path);
            if (isAsset) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else {
              res.setHeader('Cache-Control', 'public, max-age=600');
            }
          }
        }
      },
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
      }
    ),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const syncFlag = (configService.get<string>('DB_SYNC') || '').toLowerCase() === 'true';
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (databaseUrl) {
          const u = new URL(databaseUrl);
          const host = u.hostname;
          const port = Number(u.port || 5432);
          const username = decodeURIComponent(u.username || 'postgres');
          const password = decodeURIComponent(u.password || '');
          const database = decodeURIComponent(u.pathname.replace(/^\//, '') || 'postgres');
          const isLocal = host === 'localhost' || host === '127.0.0.1';
          const isInternal = host.endsWith('.railway.internal');
          const ssl = (!isLocal && !isInternal) ? { rejectUnauthorized: false } : false;
          return {
            type: 'postgres',
            host,
            port,
            username,
            password,
            database,
            ssl,
            entities: [User, Company, Product, Quote, Order, ContentBlock],
            autoLoadEntities: true,
            synchronize: syncFlag,
            logging: false,
            retryAttempts: 3,
            retryDelay: 3000,
          };
        }

        const host =
          configService.get<string>('PGHOST') ||
          configService.get<string>('PGHOST_PUBLIC') ||
          (isProduction ? 'postgres.railway.internal' : 'localhost');
        const explicitPort = configService.get<string>('PGPORT');
        const port = explicitPort
          ? Number(explicitPort)
          : configService.get<string>('PGHOST_PUBLIC')
            ? 12122
            : 5432;
        const username = configService.get<string>('PGUSER', 'postgres');
        const password = configService.get<string>('PGPASSWORD');
        const database = configService.get<string>('PGDATABASE', 'postgres');

        // Default to SSL for non-local and non-internal connections if not explicitly defined
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        const isInternal = host.endsWith('.railway.internal');
        const ssl = (!isLocal && !isInternal) ? { rejectUnauthorized: false } : false;
        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          ssl,
          entities: [User, Company, Product, Quote, Order, ContentBlock],
          autoLoadEntities: true,
          synchronize: syncFlag,
          logging: false,
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
    }),

    AuthModule,
    UsersModule,
    CompaniesModule,
    ProductsModule,
    QuotesModule,
    OrdersModule,
    SearchModule,
    CmsModule,
    ShippingModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [HealthController, SpaController],
})
export class AppModule { }
