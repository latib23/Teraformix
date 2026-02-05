"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const typeorm_2 = require("typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const companies_module_1 = require("./companies/companies.module");
const products_module_1 = require("./products/products.module");
const quotes_module_1 = require("./quotes/quotes.module");
const orders_module_1 = require("./orders/orders.module");
const search_module_1 = require("./search/search.module");
const cms_module_1 = require("./cms/cms.module");
const shipping_module_1 = require("./shipping/shipping.module");
const notifications_module_1 = require("./notifications/notifications.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const products_service_1 = require("./products/products.service");
const cms_service_1 = require("./cms/cms.service");
const cheerio_1 = require("cheerio");
const user_entity_1 = require("./users/entities/user.entity");
const company_entity_1 = require("./companies/entities/company.entity");
const product_entity_1 = require("./products/entities/product.entity");
const quote_entity_1 = require("./quotes/entities/quote.entity");
const order_entity_1 = require("./orders/entities/order.entity");
const content_block_entity_1 = require("./cms/entities/content-block.entity");
let HealthController = class HealthController {
    constructor(dataSource, config) {
        this.dataSource = dataSource;
        this.config = config;
    }
    status() {
        return { status: 'ok' };
    }
    async db() {
        try {
            await this.dataSource.query('SELECT 1');
            const databaseUrl = this.config.get('DATABASE_URL');
            const host = databaseUrl
                ? new URL(databaseUrl).hostname
                : this.config.get('PGHOST') || this.config.get('PGHOST_PUBLIC') || 'localhost';
            const database = databaseUrl
                ? decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ''))
                : this.config.get('PGDATABASE') || 'postgres';
            return { connected: true, host, database };
        }
        catch (e) {
            return { connected: false, error: String((e === null || e === void 0 ? void 0 : e.message) || e) };
        }
    }
};
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('health/db'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "db", null);
HealthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeorm_2.DataSource, config_1.ConfigService])
], HealthController);
const loadIndex = (html) => {
    const assetBase = (process.env.ASSET_BASE_URL || '').trim();
    if (assetBase) {
        html = html.replace(/(href|src)=("|')\/assets\//gi, `$1=$2${assetBase.replace(/\/$/, '')}/assets/`);
    }
    html = html.replace(/<link[^>]*rel=(?:"|')modulepreload(?:"|')[^>]*href=(?:"|')data:[^"']*(?:"|')[^>]*>/gi, '');
    const $ = (0, cheerio_1.load)(html);
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
    }
    catch (e) {
        void 0;
    }
    return $;
};
const sendHtml = (req, res, html) => {
    var _a, _b;
    try {
        const enc = String(((_a = req.headers) === null || _a === void 0 ? void 0 : _a['accept-encoding']) || ((_b = req.headers) === null || _b === void 0 ? void 0 : _b['Accept-Encoding']) || '');
        if (enc.toLowerCase().includes('gzip')) {
            const buf = (0, zlib_1.gzipSync)(Buffer.from(html, 'utf8'));
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Vary', 'Accept-Encoding');
            return res.end(buf);
        }
    }
    catch (e) {
        void e;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
};
let SpaController = class SpaController {
    constructor(productsService, cmsService) {
        this.productsService = productsService;
        this.cmsService = cmsService;
    }
    async root(req, res) {
        try {
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `https://${host}`;
            const settings = await this.cmsService.getContent('settings');
            const siteName = (settings && settings.siteTitle) ? String(settings.siteTitle) : 'Server Tech Central';
            const siteDesc = (settings && settings.siteDescription) ? String(settings.siteDescription) : 'Enterprise Hardware Reseller. Servers, Storage, and Networking.';
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `${siteName}`;
            const pageDesc = siteDesc.replace(/"/g, '').slice(0, 160);
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${origin}/">
        <meta property="og:image" content="https://servertechcentral.com/og-default.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="https://servertechcentral.com/og-default.jpg">
      `);
            const org = { '@context': 'https://schema.org', '@type': 'Organization', name: siteName, url: origin };
            const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: siteName, url: origin, potentialAction: { '@type': 'SearchAction', target: `${origin}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
            $('head').append(`<script type="application/ld+json">${JSON.stringify(org)}</script>`);
            $('head').append(`<script type="application/ld+json">${JSON.stringify(website)}</script>`);
            const categoriesContent = await this.cmsService.getContent('categories');
            const activeCategories = Array.isArray(categoriesContent) ? categoriesContent.filter((c) => c && c.isActive) : [];
            const homeContent = await this.cmsService.getContent('home');
            const partnerLogos = Array.isArray(homeContent === null || homeContent === void 0 ? void 0 : homeContent.partnerLogos) ? homeContent.partnerLogos : [];
            const partnerHtml = partnerLogos.length > 0
                ? `<div class="flex items-center gap-10">${partnerLogos.map((logo) => {
                    const img = `<img src="${String(logo.image)}" alt="${String(logo.alt || 'Partner')}" class="h-8 w-auto object-contain" />`;
                    return logo.url ? `<a href="${String(logo.url)}" rel="sponsored noopener" target="_blank" class="inline-flex items-center">${img}</a>` : `<div class="inline-flex items-center">${img}</div>`;
                }).join('')}</div>`
                : `<div class="flex items-center gap-10 opacity-100">
            <div class="flex items-center gap-2"><span class="text-xs font-bold">Cisco</span><span class="text-xs">Partner</span></div>
            <div class="flex items-center gap-2"><span class="text-xs font-bold">Seagate</span><span class="text-xs">Partner</span></div>
            <div class="flex items-center gap-2"><span class="text-xs font-bold">Fortinet</span><span class="text-xs">Authorized</span></div>
          </div>`;
            const { items: featuredItems } = await this.productsService.findPaginated({ limit: 8, offset: 0 });
            const mappedFeatured = featuredItems.map(p => {
                const a = p.attributes || {};
                const s = p.schema || {};
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
                return Object.assign(Object.assign({}, p), { price: Number(p.basePrice), specs: a, schema, stockStatus: p.stockLevel > 0 ? 'IN_STOCK' : 'BACKORDER', brand: p.brand || 'Generic', category: p.category || 'Uncategorized', image: p.image || '' });
            });
            const initialDataScript = `<script>window.INITIAL_DATA = { featuredItems: ${JSON.stringify(mappedFeatured)} };</script>`;
            $('head').append(initialDataScript);
            const featuredHtml = Array.isArray(featuredItems) && featuredItems.length > 0
                ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">${featuredItems.slice(0, 4).map((p, idx) => {
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
            const categoryCards = activeCategories.filter((c) => c && c.isActive).slice(0, 8).map((c) => {
                const img = String(c.image || '');
                const imgTag = img ? `<img src="${img}" alt="${String(c.name)}" class="w-16 h-16 object-cover rounded-full mb-4" />` : `<div class="w-16 h-16 bg-blue-100 text-blue-700 rounded-full mb-4"></div>`;
                return `<a href="/category/${encodeURIComponent(String(c.id))}" class="group p-6 border border-gray-200 rounded-xl hover:border-action-500 hover:shadow-md transition flex flex-col items-center text-center bg-gray-50 hover:bg-white">
          ${imgTag}
          <div class="font-bold text-navy-900 group-hover:text-action-600 transition">${String(c.name)}</div>
          <div class="text-xs text-gray-500 mt-2">${String(c.description || '')}</div>
        </a>`;
            }).join('');
            const general = await this.cmsService.getContent('general');
            const cage = String((general === null || general === void 0 ? void 0 : general.cageCode) || '');
            const duns = String((general === null || general === void 0 ? void 0 : general.dunsNumber) || '');
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async genericPages(req, res) {
        if (req.url === '/404') {
            res.status(404);
        }
        try {
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const footerHtml = await this.getFooterHtml();
            $('body').prepend(`<noscript>${footerHtml}</noscript>`);
            return sendHtml(req, res, $.html());
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async landingRoot(req, res) {
        try {
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const footerHtml = await this.getFooterHtml();
            $('body').prepend(`<noscript>${footerHtml}</noscript>`);
            return sendHtml(req, res, $.html());
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async landingSlug(req, res) {
        try {
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const footerHtml = await this.getFooterHtml();
            $('body').prepend(`<noscript>${footerHtml}</noscript>`);
            return sendHtml(req, res, $.html());
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async productRoute(req, res) {
        var _a, _b, _c, _d, _f;
        try {
            const p = await this.productsService.findOne(String(req.params.id));
            const toRaw = String((p === null || p === void 0 ? void 0 : p.redirectTo) || '').trim();
            const isPerm = !!(p === null || p === void 0 ? void 0 : p.redirectPermanent);
            if (toRaw) {
                const cur = String(req.originalUrl || req.url || '')
                    .split('?')[0]
                    .replace(/\/+$/, '')
                    .toLowerCase();
                const dest = toRaw
                    .split('?')[0]
                    .replace(/\/+$/, '')
                    .toLowerCase();
                if (cur !== dest) {
                    return res.redirect(isPerm ? 301 : 302, toRaw);
                }
            }
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `https://${host}`;
            const productUrl = `${origin}/product/${encodeURIComponent(String(p.sku))}`;
            const settings = await this.cmsService.getContent('settings');
            const siteName = (settings && settings.siteTitle) ? String(settings.siteTitle) : 'Server Tech Central';
            const a = p.attributes || {};
            const s = p.schema || {};
            const schemaData = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": p.name,
                "image": [],
                "description": p.description,
                "sku": p.sku,
                "mpn": s.mpn || a.__schema_mpn || p.sku,
                "brand": { "@type": "Brand", "name": p.brand },
                "offers": {
                    "@type": "Offer",
                    "url": productUrl,
                    "priceCurrency": "USD",
                    "price": Number((_a = p.basePrice) !== null && _a !== void 0 ? _a : 0),
                    "itemCondition": `https://schema.org/${s.itemCondition || a.__schema_itemCondition || 'NewCondition'}`,
                    "availability": (p.stockLevel > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
            const img = String(p.image || '');
            const defaultOg = 'https://servertechcentral.com/og-default.jpg';
            schemaData.image = img && !img.startsWith('data:') ? [img] : [defaultOg];
            if (s.gtin13 || a.__schema_gtin13)
                schemaData.gtin13 = String(s.gtin13 || a.__schema_gtin13);
            if (s.gtin14 || a.__schema_gtin14)
                schemaData.gtin14 = String(s.gtin14 || a.__schema_gtin14);
            if (s.priceValidUntil || a.__schema_priceValidUntil)
                schemaData.offers.priceValidUntil = String(s.priceValidUntil || a.__schema_priceValidUntil);
            const ratingValue = (_b = s.ratingValue) !== null && _b !== void 0 ? _b : a.__schema_ratingValue;
            const reviewCount = (_c = s.reviewCount) !== null && _c !== void 0 ? _c : a.__schema_reviewCount;
            if (ratingValue !== undefined && reviewCount !== undefined) {
                schemaData.aggregateRating = { "@type": "AggregateRating", "ratingValue": String(ratingValue), "reviewCount": String(reviewCount) };
            }
            let reviews = (_d = s.reviews) !== null && _d !== void 0 ? _d : a.__schema_reviews;
            try {
                if (typeof reviews === 'string')
                    reviews = JSON.parse(reviews);
            }
            catch (_g) {
                reviews = undefined;
            }
            if (Array.isArray(reviews) && reviews.length > 0) {
                schemaData.review = reviews.slice(0, 10).map((r) => ({
                    "@type": "Review",
                    "author": r.author ? { "@type": "Person", "name": String(r.author) } : undefined,
                    "datePublished": r.datePublished ? String(r.datePublished) : undefined,
                    "reviewBody": r.reviewBody ? String(r.reviewBody) : undefined,
                    "reviewRating": r.ratingValue ? { "@type": "Rating", "ratingValue": String(r.ratingValue) } : undefined
                })).filter(Boolean);
            }
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const category = String(p.category || '').trim();
            const slug = category
                ? category.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                : '';
            const breadcrumb = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                    { '@type': 'ListItem', position: 2, name: category || 'Components', item: slug ? `${origin}/category/${slug}` : `${origin}/category` },
                    { '@type': 'ListItem', position: 3, name: p.name, item: productUrl }
                ]
            };
            const pageTitle = `${p.name} | Server Tech Central`;
            const pageDesc = String(p.description || `${p.brand || ''} ${p.sku || ''}`).slice(0, 160).replace(/"/g, '');
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${productUrl}">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            $('head').append(`
        <meta property="og:title" content="${pageTitle}">
        <meta property="og:description" content="${pageDesc}">
        <meta property="og:type" content="product">
        <meta property="og:url" content="${productUrl}">
        <meta property="og:image" content="${schemaData.image[0]}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${pageTitle}">
        <meta name="twitter:description" content="${pageDesc}">
        <meta name="twitter:image" content="${schemaData.image[0]}">
        ${p.basePrice ? `<meta property="product:price:amount" content="${p.basePrice}">` : ''}
        <meta property="product:price:currency" content="USD">
      `);
            $('head').append(`<script type="application/ld+json">${JSON.stringify(schemaData)}</script>`);
            $('head').append(`<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`);
            const stockUnits = Number(p.stockLevel || 0);
            const availabilityText = stockUnits > 0 ? `In Stock • ${stockUnits} units` : 'Out of Stock';
            const priceText = Number(p.basePrice || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            const dims = String(p.dimensions || '').trim();
            const weight = String(p.weight || '').trim();
            const warranty = String(p.warranty || '3-Year Warranty').trim();
            const safeOverview = String(p.overview || '').replace(/<[^>]+>/g, '').slice(0, 500);
            const imgTag = schemaData.image && schemaData.image.length > 0 ? `<img src="${schemaData.image[0]}" alt="${p.name}" style="max-width:100%;height:auto" />` : '';
            const categoriesContent = await this.cmsService.getContent('categories');
            const activeCategories = Array.isArray(categoriesContent) ? categoriesContent.filter((c) => c && c.isActive) : [];
            const currentCat = String(category || '').toLowerCase();
            const categoryPicks = activeCategories.filter((c) => String(c.name || '').toLowerCase() !== currentCat).slice(0, 6);
            const relatedCategoriesHtml = categoryPicks.length > 0
                ? `<section class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Explore Related Categories</h2><div class="flex flex-wrap gap-2">${categoryPicks.map((c) => `<a href="/category/${encodeURIComponent(String(c.id))}" class="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:text-action-600 hover:border-action-500 transition">${String(c.name)}</a>`).join('')}</div></section>`
                : `<section class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Explore Related Categories</h2><div class="flex flex-wrap gap-2">${['Servers', 'Storage', 'Networking'].slice(0, 6).map((name) => `<a href="/category" class="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:text-action-600 hover:border-action-500 transition">${name}</a>`).join('')}</div></section>`;
            const reviewsHtml = Array.isArray(reviews) && reviews.length > 0
                ? `<section class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Verified Buyer Reviews</h2><div class="space-y-4">${reviews.slice(0, 3).map((r) => {
                    const author = r.author ? String(r.author) : 'Anonymous';
                    const body = r.reviewBody ? String(r.reviewBody) : '';
                    const rating = r.ratingValue ? Number(r.ratingValue) : undefined;
                    const stars = rating ? '★'.repeat(Math.max(1, Math.min(5, Math.round(rating)))) : '';
                    return `<div class="border rounded p-3"><div class="text-sm text-gray-700">${stars ? `<span class="text-yellow-600">${stars}</span> ` : ''}<strong>${author}</strong></div><p class="text-sm text-gray-800 mt-1">${body}</p></div>`;
                }).join('')}</div></section>`
                : '';
            const resourcesHtml = p.datasheet ? `<section class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Resources</h2><ul class="list-disc pl-6 text-sm text-navy-900"><li><a href="${p.datasheet}" rel="noopener" target="_blank">Datasheet (PDF)</a></li></ul></section>` : '';
            const landingContent = await this.cmsService.getContent('landingCollections');
            const allLogos = Array.isArray(landingContent) ? landingContent.flatMap((c) => c.logos || []) : [];
            const uniqueLogos = allLogos.filter((v, i, a) => a.findIndex(t => t.imageUrl === v.imageUrl) === i).slice(0, 6);
            const logosHtml = uniqueLogos.length > 0
                ? `<div class="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">${uniqueLogos.map((l) => `<div class="p-2 bg-white border border-gray-100 rounded flex items-center justify-center grayscale opacity-80 shadow-sm"><img src="${l.imageUrl}" alt="${l.name}" style="max-height:24px;object-fit:contain" /></div>`).join('')}</div>`
                : `<div class="flex flex-wrap gap-8 items-center opacity-70 grayscale">
              <div class="flex items-center gap-2"><span class="font-bold text-navy-900">Fortune 500</span> <span class="text-xs">Certified Supply Chain</span></div>
              <div class="flex items-center gap-2"><span class="font-bold text-navy-900">ISO 9001</span> <span class="text-xs">Quality Management</span></div>
              <div class="flex items-center gap-2"><span class="font-bold text-navy-900">TAA</span> <span class="text-xs">Compliant Hardware</span></div>
              <div class="flex items-center gap-2"><span class="font-bold text-navy-900">NIST</span> <span class="text-xs">Secure Procurement</span></div>
            </div>`;
            const ssrBlock = `
        <section id="ssr-product" class="container mx-auto px-4 py-6">
          <h1>${p.name}</h1>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>${imgTag}</div>
            <div>
              <div class="text-2xl font-bold text-navy-900 mb-2">${priceText}</div>
              <div class="text-sm text-gray-700 mb-4">${availabilityText}</div>
              <h3 class="text-sm font-bold text-navy-900 mb-2">Specifications</h3>
              <ul class="text-sm text-gray-800 space-y-1">
                <li><strong>SKU:</strong> ${p.sku}</li>
                <li><strong>Brand:</strong> ${p.brand}</li>
                ${warranty ? `<li><strong>Warranty:</strong> ${warranty}</li>` : ''}
                ${dims ? `<li><strong>Dimensions:</strong> ${dims}</li>` : ''}
                ${weight ? `<li><strong>Weight:</strong> ${weight}</li>` : ''}
              </ul>
              ${category ? `<div class="mt-3"><a href="${slug ? `${origin}/category/${slug}` : `${origin}/category`}" class="text-action-600 text-sm font-semibold hover:underline">View ${category} Products</a></div>` : ''}
            </div>
          </div>
          ${safeOverview ? `<div class="mt-6"><h2 class="text-lg font-bold text-navy-900 mb-3">Key Features</h2><p class="text-gray-800">${safeOverview}</p></div>` : ''}
          ${!safeOverview ? `<section class="mt-6"><h2 class="text-lg font-bold text-navy-900 mb-3">Key Features</h2><ul class="list-disc pl-6 text-sm text-gray-800 space-y-1"><li>OEM Genuine Component verified by certified technicians.</li><li>Clean serial number ready for service contract registration.</li><li>Electrostatic Discharge (ESD) safe packaging.</li><li>Supports hot-swapping for zero-downtime maintenance.</li></ul></section>` : ''}
          ${reviewsHtml}
          <section class="mt-8 border-t border-gray-100 pt-6">
            <h2 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Trusted by Professionals Worldwide</h2>
            ${logosHtml}
            <p class="text-[11px] text-gray-500 mt-4 italic">Join over 10,000 IT professionals who rely on Server Tech Central for mission-critical infrastructure.</p>
          </section>
          ${resourcesHtml}
          ${relatedCategoriesHtml}
        </section>
      `;
            const footerHtml = await this.getFooterHtml();
            $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
            return sendHtml(req, res, $.html());
        }
        catch (e) {
            if (e instanceof common_1.NotFoundException || e.status === 404 || ((_f = e.message) === null || _f === void 0 ? void 0 : _f.includes('not found'))) {
                res.status(404);
            }
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async categoryRoute(req, res) {
        try {
            const id = String(req.params.id);
            const proto = process.env.NODE_ENV === 'production' ? 'https' : (req.headers['x-forwarded-proto'] || req.protocol || 'http');
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `${proto}://${host}`;
            const categories = await this.cmsService.getContent('categories');
            const cat = Array.isArray(categories) ? categories.find((c) => String(c.id) === id) : null;
            if (cat) {
                const to = (cat === null || cat === void 0 ? void 0 : cat.redirectTo) || '';
                const isPerm = !!(cat === null || cat === void 0 ? void 0 : cat.redirectPermanent);
                if (to && typeof to === 'string') {
                    return res.redirect(isPerm ? 301 : 302, to);
                }
                const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
                const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
                const pageTitle = String(cat.seoTitle || `${cat.name} | Server Tech Central`);
                const pageDesc = String(cat.seoDescription || cat.description || `${cat.name} inventory`).replace(/"/g, '').slice(0, 160);
                $('title').text(pageTitle);
                $('link[rel="canonical"]').remove();
                $('head').append(`<link rel="canonical" href="${origin}/category/${encodeURIComponent(String(cat.id))}">`);
                $('meta[name="description"]').remove();
                $('head').append(`<meta name="description" content="${pageDesc}">`);
                $('head').append(`
          <meta property="og:title" content="${pageTitle}">
          <meta property="og:description" content="${pageDesc}">
          <meta property="og:type" content="website">
          <meta property="og:url" content="${origin}/category/${encodeURIComponent(String(cat.id))}">
          <meta property="og:image" content="https://servertechcentral.com/og-default.jpg">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${pageTitle}">
          <meta name="twitter:description" content="${pageDesc}">
          <meta name="twitter:image" content="https://servertechcentral.com/og-default.jpg">
        `);
                const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` }, { '@type': 'ListItem', position: 2, name: String(cat.name), item: `${origin}/category/${encodeURIComponent(String(cat.id))}` }] };
                $('head').append(`<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`);
                const { items: catProducts } = await this.productsService.findPaginated({ limit: 8, offset: 0, category: String(cat.name) });
                const productList = Array.isArray(catProducts) && catProducts.length > 0
                    ? `<ul class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${catProducts.slice(0, 9).map((p) => {
                        const price = Number(p.basePrice || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                        return `<li class="border border-gray-200 rounded-lg bg-white p-4"><a href="/product/${encodeURIComponent(String(p.sku))}" class="text-navy-900 font-bold hover:underline">${String(p.name)}</a><div class="text-xs text-gray-600">${String(p.brand || '')}</div><div class="text-sm font-bold text-action-600 mt-2">${price}</div></li>`;
                    }).join('')}</ul>`
                    : '';
                const otherCategories = (Array.isArray(categories) ? categories : []).filter((c) => c && c.isActive && String(c.id) !== String(cat.id)).slice(0, 6);
                const relatedChips = otherCategories.length > 0
                    ? `<div class="mt-8"><h2 class="text-lg font-bold text-navy-900 mb-3">Explore Related Categories</h2><div class="flex flex-wrap gap-2">${otherCategories.map((c) => `<a href="/category/${encodeURIComponent(String(c.id))}" class="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:text-action-600 hover:border-action-500 transition">${String(c.name)}</a>`).join('')}</div></div>`
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async categoryRoot(req, res) {
        try {
            const proto = process.env.NODE_ENV === 'production' ? 'https' : (req.headers['x-forwarded-proto'] || req.protocol || 'http');
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `${proto}://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Categories | Server Tech Central`;
            const pageDesc = `Browse enterprise hardware categories: Servers, Storage, Networking.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/category">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const categoriesContent = await this.cmsService.getContent('categories');
            const activeCategories = Array.isArray(categoriesContent) ? categoriesContent.filter((c) => c && c.isActive) : [];
            const cards = activeCategories.map((c) => {
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async productsRoot(req, res) {
        try {
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const footerHtml = await this.getFooterHtml();
            $('body').prepend(`<noscript>${footerHtml}</noscript>`);
            return sendHtml(req, res, $.html());
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async privacy(req, res) {
        try {
            const proto = process.env.NODE_ENV === 'production' ? 'https' : (req.headers['x-forwarded-proto'] || req.protocol || 'http');
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `${proto}://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Privacy Policy | Server Tech Central`;
            const pageDesc = `Read our privacy practices and data protection policy.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/privacy">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const privacy = await this.cmsService.getContent('privacyPolicy');
            let body = String((privacy === null || privacy === void 0 ? void 0 : privacy.content) || '').trim();
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async terms(req, res) {
        try {
            const proto = process.env.NODE_ENV === 'production' ? 'https' : (req.headers['x-forwarded-proto'] || req.protocol || 'http');
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `${proto}://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Terms of Sale | Server Tech Central`;
            const pageDesc = `View order policies, returns, warranties, and terms.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/terms">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const terms = await this.cmsService.getContent('termsOfSale');
            let body = String((terms === null || terms === void 0 ? void 0 : terms.content) || '').trim();
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async termsConditions(req, res) {
        try {
            const proto = req.headers['x-forwarded-proto'] || 'https';
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `https://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Terms & Conditions | Server Tech Central`;
            const pageDesc = `Website usage terms, payment policies, and liability disclaimers.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/terms-and-conditions">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const terms = await this.cmsService.getContent('termsAndConditions');
            let body = String((terms === null || terms === void 0 ? void 0 : terms.content) || '').trim();
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async warranty(req, res) {
        try {
            const proto = req.headers['x-forwarded-proto'] || 'https';
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `https://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Warranty Policy | Server Tech Central`;
            const pageDesc = `Standard 3-Year Warranty on all enterprise hardware. Advanced replacement and support terms.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/warranty">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const content = await this.cmsService.getContent('warrantyPage');
            let body = String((content === null || content === void 0 ? void 0 : content.content) || '').trim();
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async returns(req, res) {
        try {
            const proto = req.headers['x-forwarded-proto'] || 'https';
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `https://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Return Policy | Server Tech Central`;
            const pageDesc = `30-day return policy for enterprise hardware. RMA process and warranty info.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/returns">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const content = await this.cmsService.getContent('returnPolicy');
            let body = String((content === null || content === void 0 ? void 0 : content.content) || '').trim();
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async about(req, res) {
        try {
            const proto = req.headers['x-forwarded-proto'] || 'https';
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `https://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `About Us | Server Tech Central`;
            const pageDesc = `Learn about Server Tech Central, our mission, and enterprise hardware expertise.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/about">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const content = await this.cmsService.getContent('aboutPage');
            let body = String((content === null || content === void 0 ? void 0 : content.content) || '').trim();
            body = body.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-navy-900 mt-6">$1</h3>');
            body = body.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-navy-900 mt-8">$1</h2>');
            body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            body = body.replace(/^-\s+(.*)$/gm, '<p class="text-sm text-gray-700">• $1</p>');
            const ssrBlock = `
        <section id="ssr-about" class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-navy-900">About Us</h1>
          <div class="prose max-w-none text-gray-800 mt-4">${body || '<p class="text-sm text-gray-700">About Server Tech Central.</p>'}</div>
        </section>
      `;
            const footerHtml = await this.getFooterHtml();
            $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
            return sendHtml(req, res, $.html());
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async contact(req, res) {
        try {
            const proto = req.headers['x-forwarded-proto'] || 'https';
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `https://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Contact Us | Server Tech Central`;
            const pageDesc = `Get in touch with our sales and support team for enterprise hardware needs.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/contact">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const content = await this.cmsService.getContent('contactPage');
            let body = String((content === null || content === void 0 ? void 0 : content.content) || '').trim();
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async sitemapHtml(req, res) {
        try {
            const proto = req.headers['x-forwarded-proto'] || 'https';
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `https://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Sitemap | Server Tech Central`;
            const pageDesc = `Navigate our complete catalog of enterprise servers, storage, and networking.`;
            $('title').text(pageTitle);
            $('link[rel="canonical"]').remove();
            $('head').append(`<link rel="canonical" href="${origin}/sitemap">`);
            $('meta[name="description"]').remove();
            $('head').append(`<meta name="description" content="${pageDesc}">`);
            const content = await this.cmsService.getContent('sitemapSettings');
            const intro = String((content === null || content === void 0 ? void 0 : content.introText) || 'Browse our site map.');
            const categories = await this.cmsService.getContent('categories');
            const activeCategories = Array.isArray(categories) ? categories.filter((c) => c && c.isActive) : [];
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
                ${activeCategories.map((c) => `<li><a href="/category/${c.id}" class="text-action-600 hover:underline">${c.name}</a></li>`).join('')}
              </ul>
            </div>
          </div>
        </section>
      `;
            const footerHtml = await this.getFooterHtml();
            $('body').prepend(`<noscript>${ssrBlock}${footerHtml}</noscript>`);
            return sendHtml(req, res, $.html());
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async track(req, res) {
        try {
            const proto = process.env.NODE_ENV === 'production' ? 'https' : (req.headers['x-forwarded-proto'] || req.protocol || 'http');
            const rawHost = req.get('host');
            const host = rawHost.replace(/^www\./, '');
            const origin = `${proto}://${host}`;
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Track Order | Server Tech Central`;
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    indexNowKey(res) {
        res.setHeader('Content-Type', 'text/plain');
        res.send('c9573827bc124806a88b577189cc2138');
    }
    async adminLogin(req, res) {
        try {
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            const pageTitle = `Admin Login | Server Tech Central`;
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
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async sitemap(req, res) {
        const proto = process.env.NODE_ENV === 'production' ? 'https' : (req.headers['x-forwarded-proto'] || req.protocol || 'http');
        const rawHost = req.get('host');
        const host = rawHost.replace(/^www\./, '');
        const origin = `${proto}://${host}`;
        const now = new Date().toISOString().slice(0, 10);
        const urls = [];
        urls.push({ loc: `${origin}/`, changefreq: 'daily', priority: '1.0', lastmod: now });
        urls.push({ loc: `${origin}/category`, changefreq: 'weekly', priority: '0.8', lastmod: now });
        urls.push({ loc: `${origin}/about`, changefreq: 'monthly', priority: '0.7', lastmod: now });
        urls.push({ loc: `${origin}/contact`, changefreq: 'monthly', priority: '0.7', lastmod: now });
        urls.push({ loc: `${origin}/privacy`, changefreq: 'monthly', priority: '0.4', lastmod: now });
        urls.push({ loc: `${origin}/terms`, changefreq: 'monthly', priority: '0.4', lastmod: now });
        urls.push({ loc: `${origin}/returns`, changefreq: 'monthly', priority: '0.5', lastmod: now });
        urls.push({ loc: `${origin}/warranty`, changefreq: 'monthly', priority: '0.5', lastmod: now });
        urls.push({ loc: `${origin}/sitemap`, changefreq: 'weekly', priority: '0.3', lastmod: now });
        const categories = await this.cmsService.getContent('categories');
        const categoryList = Array.isArray(categories) ? categories.filter((c) => c && c.isActive && c.id) : [];
        for (const cat of categoryList) {
            urls.push({ loc: `${origin}/category/${encodeURIComponent(String(cat.id))}`, changefreq: 'weekly', priority: '0.7', lastmod: now });
        }
        const products = await this.productsService.findAll();
        for (const p of products) {
            if (p && p.sku) {
                urls.push({ loc: `${origin}/product/${encodeURIComponent(String(p.sku))}`, changefreq: 'weekly', priority: '0.6', lastmod: now });
            }
        }
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
            const publishedCount = blogPosts.filter((p) => p && p.isPublished).length;
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
    adminBlog(res) {
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    adminRoot(req, res) {
        try {
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            return sendHtml(req, res, $.html());
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    adminAny(req, res) {
        try {
            const indexHtmlPath = (0, path_1.join)(__dirname, '..', 'dist-client', 'index.html');
            const $ = loadIndex((0, fs_1.readFileSync)(indexHtmlPath, 'utf8'));
            return sendHtml(req, res, $.html());
        }
        catch (_e) {
            void _e;
        }
        res.sendFile((0, path_1.join)(__dirname, '..', 'dist-client', 'index.html'));
    }
    async robots(req, res) {
        const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const rawHost = req.get('host');
        const host = rawHost.replace(/^www\./, '');
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
    async getFooterHtml() {
        try {
            const [generalData, footerData, categories, productsResult] = await Promise.all([
                this.cmsService.getContent('general') || {},
                this.cmsService.getContent('footer') || {},
                this.cmsService.getContent('categories') || [],
                this.productsService.findPaginated({ limit: 30, offset: 0 })
            ]);
            const general = generalData;
            const footer = footerData;
            const products = productsResult.items || [];
            const activeCategories = Array.isArray(categories) ? categories.filter((c) => c && c.isActive) : [];
            const footerLinks = [];
            activeCategories.forEach((cat) => {
                footerLinks.push({ label: `${cat.name} Solutions`, path: `/category/${cat.id}` });
            });
            const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
            brands.slice(0, 5).forEach((brand) => {
                footerLinks.push({ label: `Buy ${brand}`, path: `/category?search=${encodeURIComponent(String(brand))}` });
            });
            products.slice(0, 10).forEach((p) => {
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
                <h3 class="text-xl font-bold mb-4 tracking-tight">Server Tech Central</h3>
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
                <span>&copy; ${year} Server Tech Central. All rights reserved.</span>
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
        }
        catch (e) {
            return '';
        }
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "root", null);
__decorate([
    (0, common_1.Get)(['/admin', '/admin/*', 'cart', 'checkout', 'upload-bom', 'thank-you', 'login', 'register', 'account', '404']),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "genericPages", null);
__decorate([
    (0, common_1.Get)('landing'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "landingRoot", null);
__decorate([
    (0, common_1.Get)('landing/:slug'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "landingSlug", null);
__decorate([
    (0, common_1.Get)('product/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "productRoute", null);
__decorate([
    (0, common_1.Get)('category/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "categoryRoute", null);
__decorate([
    (0, common_1.Get)('category'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "categoryRoot", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "productsRoot", null);
__decorate([
    (0, common_1.Get)('privacy'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "privacy", null);
__decorate([
    (0, common_1.Get)('terms'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "terms", null);
__decorate([
    (0, common_1.Get)('terms-and-conditions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "termsConditions", null);
__decorate([
    (0, common_1.Get)('warranty'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "warranty", null);
__decorate([
    (0, common_1.Get)('returns'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "returns", null);
__decorate([
    (0, common_1.Get)('about'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "about", null);
__decorate([
    (0, common_1.Get)('contact'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "contact", null);
__decorate([
    (0, common_1.Get)('sitemap'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "sitemapHtml", null);
__decorate([
    (0, common_1.Get)('track'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "track", null);
__decorate([
    (0, common_1.Get)('c9573827bc124806a88b577189cc2138.txt'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SpaController.prototype, "indexNowKey", null);
__decorate([
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Get)('sitemap.xml'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "sitemap", null);
__decorate([
    (0, common_1.Get)('admin/blog'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SpaController.prototype, "adminBlog", null);
__decorate([
    (0, common_1.Get)('admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SpaController.prototype, "adminRoot", null);
__decorate([
    (0, common_1.Get)('admin/*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SpaController.prototype, "adminAny", null);
__decorate([
    (0, common_1.Get)('robots.txt'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpaController.prototype, "robots", null);
SpaController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService, cms_service_1.CmsService])
], SpaController);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'dist-client'),
                exclude: ['/warranty', '/api/(.*)', '/robots.txt', '/sitemap.xml', '/health', '/health/db', '/landing', '/landing/(.*)', '/product/(.*)', '/category/(.*)', '/admin', '/admin/(.*)', '/products', '/products/(.*)', '/contact', '/returns', '/uploads/(.*)'],
                serveStaticOptions: {
                    fallthrough: true,
                    index: false,
                    setHeaders: (res, path) => {
                        const isAsset = path.includes(`${(0, path_1.join)(__dirname, '..', 'dist-client')}/assets/`) || /\/assets\//.test(path);
                        if (isAsset) {
                            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                        }
                        else {
                            res.setHeader('Cache-Control', 'public, max-age=600');
                        }
                    }
                }
            }, {
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const isProduction = configService.get('NODE_ENV') === 'production';
                    const syncFlag = (configService.get('DB_SYNC') || '').toLowerCase() === 'true';
                    const databaseUrl = configService.get('DATABASE_URL');
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
                            entities: [user_entity_1.User, company_entity_1.Company, product_entity_1.Product, quote_entity_1.Quote, order_entity_1.Order, content_block_entity_1.ContentBlock],
                            autoLoadEntities: true,
                            synchronize: syncFlag,
                            logging: false,
                            retryAttempts: 3,
                            retryDelay: 3000,
                        };
                    }
                    const host = configService.get('PGHOST') ||
                        configService.get('PGHOST_PUBLIC') ||
                        (isProduction ? 'postgres.railway.internal' : 'localhost');
                    const explicitPort = configService.get('PGPORT');
                    const port = explicitPort
                        ? Number(explicitPort)
                        : configService.get('PGHOST_PUBLIC')
                            ? 12122
                            : 5432;
                    const username = configService.get('PGUSER', 'postgres');
                    const password = configService.get('PGPASSWORD');
                    const database = configService.get('PGDATABASE', 'postgres');
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
                        entities: [user_entity_1.User, company_entity_1.Company, product_entity_1.Product, quote_entity_1.Quote, order_entity_1.Order, content_block_entity_1.ContentBlock],
                        autoLoadEntities: true,
                        synchronize: syncFlag,
                        logging: false,
                        retryAttempts: 3,
                        retryDelay: 3000,
                    };
                },
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            companies_module_1.CompaniesModule,
            products_module_1.ProductsModule,
            quotes_module_1.QuotesModule,
            orders_module_1.OrdersModule,
            search_module_1.SearchModule,
            cms_module_1.CmsModule,
            shipping_module_1.ShippingModule,
            notifications_module_1.NotificationsModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [HealthController, SpaController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map