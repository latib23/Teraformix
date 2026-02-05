import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { CmsService } from './cms/cms.service';
import { ProductsService } from './products/products.service';
import compression from 'compression';

async function bootstrap() {
  // Disable default body parser to handle large payloads manually
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  (app as any).set('trust proxy', true);

  // Set global prefix with exclusions
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'warranty', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET },
      { path: 'favicon.ico', method: RequestMethod.GET },
      { path: 'robots.txt', method: RequestMethod.GET },
      { path: 'sitemap.xml', method: RequestMethod.GET },
      { path: 'landing', method: RequestMethod.GET },
      { path: 'landing/:slug', method: RequestMethod.GET },
      { path: 'product/:id', method: RequestMethod.GET },
      { path: 'category', method: RequestMethod.GET },
      { path: 'category', method: RequestMethod.GET },
      { path: 'category/:id', method: RequestMethod.GET },
      { path: 'admin', method: RequestMethod.GET },
      { path: 'admin', method: RequestMethod.GET },
      { path: 'admin/(.*)', method: RequestMethod.GET },
      { path: 'contact', method: RequestMethod.GET },
      { path: 'returns', method: RequestMethod.GET },
    ],
  });

  // Increase body payload limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use(compression());

  // Enable robust CORS
  const originsEnv = process.env.CORS_ORIGINS || '';
  const allowlist = originsEnv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow same-origin or server-to-server calls (no origin)
      if (!origin) return callback(null, true);

      // If no explicit allowlist, allow all origins
      if (allowlist.length === 0 || allowlist.includes('*')) return callback(null, true);

      const originLower = origin.toLowerCase();
      const isLocal = originLower.includes('localhost') || originLower.includes('127.0.0.1') || originLower.includes('[::1]');

      // Check if origin matches any entry in allowlist
      const isInAllowlist = allowlist.some(allowed => {
        const a = allowed.toLowerCase().trim();
        if (!a) return false;

        // Match exact, with protocols, or as subdomain
        return originLower === a ||
          originLower === `https://${a}` ||
          originLower === `http://${a}` ||
          originLower.endsWith(`.${a}`) ||
          originLower.includes(a.replace(/^https?:\/\//, ''));
      });

      if (isLocal || isInAllowlist) {
        callback(null, true);
      } else {
        // High visibility warning in logs to help identify mission-critical missing origins
        console.warn(`\n!!! CORS BLOCKED origin: ${origin} !!!`);
        console.warn(`Current Allowlist: ${JSON.stringify(allowlist)}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Origin, X-Requested-With',
    credentials: true,
    optionsSuccessStatus: 204,
  });

  // Security headers & optional HTTPS enforcement
  const enforceHttps = (process.env.ENFORCE_HTTPS || '').toLowerCase() === 'true';
  const cmsService = app.get(CmsService);
  app.use(async (req: any, res: any, next: any) => {
    // HTTPS redirect when enabled
    if (enforceHttps) {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
      if (proto !== 'https') {
        const host = req.get('host');
        return res.redirect(301, `https://${host}${req.originalUrl}`);
      }
    }

    // WWW to non-WWW redirect
    const host = req.get('host') || '';
    if (host.startsWith('www.')) {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const nonWwwHost = host.replace(/^www\./, '');
      return res.redirect(301, `${proto}://${nonWwwHost}${req.originalUrl}`);
    }

    // Set common security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Origin-Agent-Cluster', '?1');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader(
      'Permissions-Policy',
      [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=*',
        'usb=()',
        'interest-cohort=()'
      ].join(', ')
    );
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
      if (proto === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      }
    } catch (_e) { void _e; }
    // CSP allowing our own assets and required CDNs, with tighter defaults
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        'upgrade-insecure-requests',
        "img-src 'self' data: https: https://*.zohostatic.com https://static.zohocdn.com https://*.zohocdn.com https://*.zohopublic.com https://*.zoho.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://css.zohocdn.com https://static.zohocdn.com https://*.zohostatic.com https://*.zohocdn.com data:",
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://css.zohocdn.com https://static.zohocdn.com https://*.zohostatic.com https://*.zohocdn.com data:",
        "font-src 'self' https://fonts.gstatic.com https://css.zohocdn.com https://static.zohocdn.com https://*.zohostatic.com https://*.zohocdn.com data:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://salesiq.zohopublic.com https://salesiq.zoho.com https://*.zohopublic.com https://*.zoho.com https://js.zohocdn.com https://static.zohocdn.com https://*.zohocdn.com https://*.zohostatic.com https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://www.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://www.recaptcha.net https://www.clarity.ms https://*.clarity.ms https://assets.apollo.io https://widget.trustpilot.com https://leadpipe.aws53.cloud https://master.aws53.cloud https://cdn.pixel.leadpipe.com https://pxdrop.lijit.com data: blob:",
        "script-src-elem 'self' 'unsafe-inline' https://*.stripe.com https://salesiq.zohopublic.com https://salesiq.zoho.com https://*.zohopublic.com https://*.zoho.com https://js.zohocdn.com https://static.zohocdn.com https://*.zohocdn.com https://*.zohostatic.com https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://www.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://www.recaptcha.net https://www.clarity.ms https://*.clarity.ms https://assets.apollo.io https://widget.trustpilot.com https://leadpipe.aws53.cloud https://master.aws53.cloud https://cdn.pixel.leadpipe.com https://pxdrop.lijit.com data: blob:",
        "frame-src 'self' https://*.stripe.com https://salesiq.zohopublic.com https://salesiq.zoho.com https://*.zohopublic.com https://*.zoho.com https://static.zohocdn.com https://*.zohocdn.com https://*.zohostatic.com https://www.google.com https://www.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://www.recaptcha.net https://www.googletagmanager.com https://widget.trustpilot.com https://pxdrop.lijit.com",
        "connect-src 'self' https: wss: ws: https://*.stripe.com https://salesiq.zohopublic.com https://salesiq.zoho.com https://vts.zohopublic.com https://*.zohopublic.com https://*.zoho.com https://static.zohocdn.com https://*.zohocdn.com https://*.zohostatic.com https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://www.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://www.recaptcha.net https://www.clarity.ms https://*.clarity.ms https://c.bing.com https://aplo-evnt.com https://leadpipe.aws53.cloud https://master.aws53.cloud https://cdn.pixel.leadpipe.com https://pxdrop.lijit.com",
      ].join('; ')
    );
    next();
  });

  // Simple in-memory rate limiter (sufficient for ~1k visits/day). For production, use Redis.
  const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const MAX_GLOBAL = Number(process.env.RATE_LIMIT_MAX || 600);
  const MAX_LOGIN = Number(process.env.RATE_LIMIT_LOGIN_MAX || 40);
  const MAX_HEAVY = Number(process.env.RATE_LIMIT_HEAVY_MAX || 120);
  const VIOLATION_LIMIT = Number(process.env.RATE_LIMIT_VIOLATIONS || 5);
  const BLOCK_MS = Number(process.env.RATE_LIMIT_BLOCK_MS || 300_000);
  const buckets = new Map<string, { resetAt: number; count: number; violations: number; blockedUntil?: number }>();
  function take(key: string, max: number) {
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || (b.blockedUntil && b.blockedUntil <= now) || b.resetAt <= now) {
      buckets.set(key, { resetAt: now + WINDOW_MS, count: 1, violations: b?.violations ?? 0 });
      return { ok: true, delay: 0 };
    }
    b.count++;
    if (b.count > max) {
      b.violations = (b.violations || 0) + 1;
      if (b.violations >= VIOLATION_LIMIT) {
        b.blockedUntil = now + BLOCK_MS;
      }
      return { ok: false, delay: 0 };
    }
    const threshold = Math.ceil(max * 0.7);
    const delay = b.count > threshold ? Math.min(500, (b.count - threshold) * 10) : 0;
    return { ok: true, delay };
  }
  app.use(async (req: any, res: any, next: any) => {
    const m = req.method;
    if (m !== 'GET' && m !== 'POST' && m !== 'PUT' && m !== 'PATCH' && m !== 'DELETE') return next();
    const ipHeader = (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.split(',')[0]?.trim() || req.ip || 'unknown';
    const path = req.path || req.url || '';
    const isLogin = path.startsWith('/api/auth/login');
    const isHeavy = (path.startsWith('/api/orders') || path.startsWith('/api/quotes') || path.startsWith('/api/checkout')) && !path.endsWith('/abandon');
    const base = isLogin ? 'login' : isHeavy ? 'heavy' : 'global';
    const key = `${ip}:${base}`;
    const max = isLogin ? MAX_LOGIN : isHeavy ? MAX_HEAVY : MAX_GLOBAL;
    const b = buckets.get(key);
    const now = Date.now();
    if (b && b.blockedUntil && b.blockedUntil > now) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    const { ok, delay } = take(key, max);
    if (!ok) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    if (delay > 0) {
      setTimeout(() => next(), delay);
    } else {
      next();
    }
  });

  app.use((req: any, _res: any, next: any) => {
    try {
      const raw = String(req.path || req.url || '');
      if (!raw.toLowerCase().startsWith('/api')) return next();
      const qIndex = raw.indexOf('?');
      const pathOnly = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
      const parts = pathOnly.split('/').filter(Boolean); // e.g., ['', 'api', 'settings'] → ['api','settings']
      const seg = parts[1] || ''; // after 'api'
      if (!seg) return next();

      // Map non-CMS endpoints to CMS
      const map: Record<string, string> = {
        'content': '',
        'general': 'general',
        'home': 'home',
        'categorypage': 'categoryPage',
        'privacypolicy': 'privacyPolicy',
        'termsofsale': 'termsOfSale',
        'termsandconditions': 'termsAndConditions',
        'returnpolicy': 'returnPolicy',
        'sitemapsettings': 'sitemapSettings',
        'footer': 'footer',
        'aboutpage': 'aboutPage',
        'contactpage': 'contactPage',
        'settings': 'settings',
        'payment': 'payment',
        'security': 'security',
        'redirects': 'redirects',
        'categories': 'categories',
        'blogposts': 'blogPosts',
        'landingcollections': 'landingCollections',
        'warrantypage': 'warrantyPage',
      };

      const keyLower = seg.toLowerCase();
      if (keyLower in map) {
        const targetKey = map[keyLower];
        if (targetKey === '') {
          // /api/content → /api/cms (get all)
          if (req.url) req.url = req.url.replace(/\/api\/content/i, '/api/cms');
          if (req.path) req.path = req.path.replace(/\/api\/content/i, '/api/cms');
        } else {
          const fromRegex = new RegExp('^/api/' + seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          const toPath = '/api/cms/' + targetKey;
          if (req.url) req.url = req.url.replace(fromRegex, toPath);
          if (req.path) req.path = req.path.replace(fromRegex, toPath);
        }
      }
    } catch (_e) { void _e; }
    next();
  });

  // Apply global validation pipes
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Server Tech Central B2B API')
    .setDescription('Enterprise Hardware Reseller API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  if (!isProduction) {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  const port = process.env.PORT || 3000;

  // Redirect rules from CMS (supports exact and simple pattern matching like /old/:sku)
  const cms = app.get(CmsService);
  const productsService = app.get(ProductsService);
  const rawRules = (await cms.getContent('redirects')) || [];
  type Rule = { from: string; to: string; permanent?: boolean };
  const rules: Array<Rule & { regex?: RegExp; params?: string[] }> = Array.isArray(rawRules) ? rawRules.map((r: Rule) => {
    const params: string[] = [];
    const pattern = r.from.replace(/:[^/]+/g, (m) => { params.push(m.slice(1)); return '([^/]+)'; });
    const hasParams = params.length > 0;
    const regex = new RegExp('^' + pattern.replace(/\*$/, '.*') + '$');
    return { ...r, regex: hasParams || /\*/.test(r.from) ? regex : undefined, params: hasParams ? params : undefined };
  }) : [];

  app.use((req: any, res: any, next: any) => {
    const path = (req.path || req.url || '').replace(/\/$/, '') || '/';
    const isApi = path.startsWith('/api');
    if (req.method === 'GET' && !isApi) {
      // Try exact match first
      const exact = rules.find(r => r.from.replace(/\/$/, '') === path);
      if (exact) {
        return res.redirect(exact.permanent ? 301 : 302, exact.to);
      }
      // Try regex/pattern match
      for (const r of rules) {
        if (r.regex) {
          const m = path.match(r.regex);
          if (m) {
            let dest = r.to;
            if (r.params && r.params.length > 0) {
              r.params.forEach((p, idx) => {
                dest = dest.replace(':' + p, m[idx + 1]);
              });
            }
            return res.redirect(r.permanent ? 301 : 302, dest);
          }
        }
      }
    }
    next();
  });

  // Server-side JSON-LD injection for product pages (for validators that don't run JS)
  app.use(async (req: any, res: any, next: any) => {
    const path = req.path || req.url || '';
    if (req.method === 'GET' && path.startsWith('/product/')) {
      try {
        const sku = decodeURIComponent(path.split('/').pop() || '');
        const p = await productsService.findOne(String(sku));
        const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
        const rawHost = req.get('host');
        // Always use non-www version for canonical URLs
        const host = rawHost.replace(/^www\./, '');
        const origin = `${proto}://${host}`;
        const productUrl = `${origin}/product/${encodeURIComponent(String((p as any).sku))}`;
        const settings = (await cms.getContent('settings')) || {};
        const siteName = String((settings as any)?.siteTitle || 'Server Tech Central');
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
        const defaultOg = 'https://servertechcentral.com/og-default.jpg';
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
        try { if (typeof reviews === 'string') reviews = JSON.parse(reviews); } catch { reviews = undefined; }
        if (Array.isArray(reviews) && reviews.length > 0) {
          schemaData.review = reviews.slice(0, 10).map((r: any) => ({
            "@type": "Review",
            "author": r.author ? { "@type": "Person", "name": String(r.author) } : undefined,
            "datePublished": r.datePublished ? String(r.datePublished) : undefined,
            "reviewBody": r.reviewBody ? String(r.reviewBody) : undefined,
            "reviewRating": r.ratingValue ? { "@type": "Rating", "ratingValue": String(r.ratingValue) } : undefined
          })).filter(Boolean);
        }
        const category = String((p as any).category || '').trim();
        const slug = category ? category.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
        const breadcrumb = {
          '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: category || 'Components', item: slug ? `${origin}/category/${slug}` : `${origin}/category` },
            { '@type': 'ListItem', position: 3, name: (p as any).name, item: productUrl }
          ]
        };
        const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
        let html = readFileSync(indexHtmlPath, 'utf8');
        try {
          html = html.replace(/<link[^>]*rel=(?:"|')modulepreload(?:"|')[^>]*href=(?:"|')data:[^"']*(?:"|')[^>]*>/gi, '');
          html = html.replace(/<script[^>]*type=(?:"|')importmap(?:"|')[^>]*>[\s\S]*?<\u002Fscript>/i, '');
          const gaId = process.env.GA_MEASUREMENT_ID || '';
          if (gaId) {
            html = html.replace('</head>', `<script>window.__GA_ID__='${gaId}'</script></head>`);
          }
          const gtmId = process.env.GTM_CONTAINER_ID || '';
          if (gtmId) {
            const headInject = `<script>window.__GTM_ID__='${gtmId}';(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`;
            const bodyNoscript = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
            html = html.replace('</head>', `${headInject}</head>`);
            html = html.replace('<body>', `<body>${bodyNoscript}`);
          }
          const clarityId = process.env.CLARITY_PROJECT_ID || 'so49yg178g';
          const pth = req.path || req.url || '';
          const isAdmin = pth.startsWith('/admin');
          const isAuth = pth.startsWith('/account') || pth.startsWith('/login') || pth.startsWith('/register');
          if (clarityId && !isAdmin && !isAuth) {
            const clarityScript = `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','${clarityId}');</script>`;
            html = html.replace('</head>', `${clarityScript}</head>`);
          }
        } catch (e) { void 0; }
        const pageTitle = `${(p as any).name} | Server Tech Central`;
        const pageDesc = String((p as any).description || `${(p as any).brand || ''} ${(p as any).sku || ''}`).slice(0, 160).replace(/"/g, '');
        html = html.replace(/<title>[^<]*<\u002Ftitle>/i, `<title>${pageTitle}<\u002Ftitle>`);
        const canonicalTag = `<link rel="canonical" href="${productUrl}">`;
        const metaDescTag = `<meta name="description" content="${pageDesc}">`;
        const jsonldProduct = `<script type="application/ld+json">${JSON.stringify(schemaData)}</script>`;
        const jsonldBreadcrumb = `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`;
        const metaDescRegex = /<meta[^>]*name=(?:"|')description(?:"|')[^>]*>/i;
        if (metaDescRegex.test(html)) {
          html = html.replace(metaDescRegex, metaDescTag);
          html = html.replace('</head>', `${canonicalTag}${jsonldProduct}${jsonldBreadcrumb}</head>`);
        } else {
          html = html.replace('</head>', `${canonicalTag}${metaDescTag}${jsonldProduct}${jsonldBreadcrumb}</head>`);
        }
        const stockUnits = Number((p as any).stockLevel || 0);
        const availabilityText = stockUnits > 0 ? `In Stock • ${stockUnits} units` : 'Out of Stock';
        const priceText = Number((p as any).basePrice || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const dims = String((p as any).dimensions || '').trim();
        const weight = String((p as any).weight || '').trim();
        const warranty = String((p as any).warranty || '3-Year Warranty').trim();
        const safeOverview = String((p as any).overview || '').replace(/<[^>]+>/g, '').slice(0, 500);
        const imgTag = schemaData.image && schemaData.image.length > 0 ? `<img src="${schemaData.image[0]}" alt="${(p as any).name}" style="max-width:100%;height:auto" />` : '';
        const categoriesContent = await cms.getContent('categories');
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
            ${!safeOverview ? `<section class="mt-6"><h2 class="text-lg font-bold text-navy-900 mb-3">Key Features</h2><ul class="list-disc pl-6 text-sm text-gray-800 space-y-1"><li>OEM Genuine Component verified by certified technicians.</li><li>Clean serial number ready for service contract registration.</li><li>Electrostatic Discharge (ESD) safe packaging.</li><li>Supports hot-swapping for zero-downtime maintenance.</li></ul></section>` : ''}
            ${reviewsHtml}
            ${resourcesHtml}
            ${relatedCategoriesHtml}
          </section>
        `;
        html = html.replace('<body>', `<body><noscript>${ssrBlock}</noscript>`);
        return res.send(html);
      } catch { /* fallthrough to next */ }
    }
    next();
  });

  // SPA fallback: serve index.html for non-API GET routes (exclude robots.txt and sitemap.xml)
  app.use((req: any, res: any, next: any) => {
    const path = req.path || req.url || '';
    if (path.includes('warranty')) {
      console.log(`[Middleware] Path: ${path}, Method: ${req.method}`);
    }
    if (req.method === 'GET' && (path === '/' || path === '')) return next();
    const isApi = path.startsWith('/api');
    const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|map|txt|xml)$/i.test(path);
    const isSpecial = path === '/robots.txt' || path === '/sitemap.xml';
    const isHandledRoute = path.startsWith('/product/') || path.startsWith('/category/') || path.startsWith('/landing') || path.startsWith('/products') || path.startsWith('/admin') || path.startsWith('/warranty') || path.startsWith('/contact') || path.startsWith('/returns') || path.startsWith('/upload-bom') || path.startsWith('/cart') || path.startsWith('/checkout') || path.startsWith('/thank-you') || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/account') || path.startsWith('/about') || path.startsWith('/sitemap') || path.startsWith('/track') || path.startsWith('/privacy') || path.startsWith('/terms');
    if (req.method === 'GET' && !isApi && !isAsset && !isSpecial && !isHandledRoute) {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
      const rawHost = req.get('host');
      const host = rawHost.replace(/^www\./, '');
      const origin = `${proto}://${host}`;
      const settingsPromise = cms.getContent('settings');
      return Promise.resolve(settingsPromise).then((settings: any) => {
        const siteName = String(settings?.siteTitle || 'Server Tech Central');
        const org: any = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          'name': siteName,
          'url': origin
        };
        const website: any = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': siteName,
          'url': origin,
          'potentialAction': {
            '@type': 'SearchAction',
            'target': `${origin}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        };
        const indexHtmlPath = join(__dirname, '..', 'dist-client', 'index.html');
        let html = readFileSync(indexHtmlPath, 'utf8');
        try {
          html = html.replace(/<link[^>]*rel=(?:"|')modulepreload(?:"|')[^>]*href=(?:"|')data:[^"']*(?:"|')[^>]*>/gi, '');
          html = html.replace(/<script[^>]*type=(?:"|')importmap(?:"|')[^>]*>[\s\S]*?<\u002Fscript>/i, '');
          const gaId = process.env.GA_MEASUREMENT_ID || '';
          if (gaId) {
            html = html.replace('</head>', `<script>window.__GA_ID__='${gaId}'</script></head>`);
          }
          const gtmId = process.env.GTM_CONTAINER_ID || '';
          if (gtmId) {
            const headInject = `<script>window.__GTM_ID__='${gtmId}';(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`;
            const bodyNoscript = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
            html = html.replace('</head>', `${headInject}</head>`);
            html = html.replace('<body>', `<body>${bodyNoscript}`);
          }
        } catch (e) { void 0; }
        const scriptOrg = `<script type="application/ld+json">${JSON.stringify(org)}</script>`;
        const scriptWeb = `<script type="application/ld+json">${JSON.stringify(website)}</script>`;
        html = html.replace('</head>', `${scriptOrg}${scriptWeb}</head>`);
        const assetBase = (process.env.ASSET_BASE_URL || '').trim();
        if (assetBase) {
          html = html.replace(/(href|src)=("|')\/assets\//gi, `$1=$2${assetBase.replace(/\/$/, '')}/assets/`);
        }
        const pth = req.path || req.url || '';
        const noscriptH1 = pth.startsWith('/category')
          ? 'Enterprise Servers & Storage Solutions'
          : pth.startsWith('/product')
            ? 'Product Details'
            : pth.startsWith('/blog')
              ? 'Blog'
              : 'Server Tech Central';
        html = html.replace('<body>', `<body><noscript><h1 class="text-3xl font-bold text-navy-900">${noscriptH1}</h1></noscript>`);
        const ssr404 = `
          <section id="ssr-404" class="container mx-auto px-4 py-16">
            <h1 class="text-3xl font-bold text-navy-900 mb-4">Page Not Found</h1>
            <p class="text-gray-600 mb-6">The page you’re looking for doesn’t exist or may have moved.</p>
            <div class="flex flex-wrap gap-3">
              <a href="/" class="px-4 py-2 bg-action-600 text-white rounded">Go to Home</a>
              <a href="/category" class="px-4 py-2 bg-white border border-gray-300 rounded text-navy-900">Browse Categories</a>
              <a href="/sitemap" class="px-4 py-2 bg-white border border-gray-300 rounded text-navy-900">View Sitemap</a>
            </div>
          </section>
        `;
        html = html.replace('<body>', `<body><noscript>${ssr404}</noscript>`);
        const isClientRoute = pth.startsWith('/admin') || pth.startsWith('/cart') || pth.startsWith('/checkout') || pth.startsWith('/login');
        res.status(isClientRoute ? 200 : 404);
        try {
          const enc = String(req.headers?.['accept-encoding'] || req.headers?.['Accept-Encoding'] || '');
          if (enc.toLowerCase().includes('gzip')) {
            const buf = gzipSync(Buffer.from(html, 'utf8'));
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Vary', 'Accept-Encoding');
            return res.end(buf);
          }
        } catch (_e) { void _e; }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      }).catch(() => {
        return res.sendFile(join(__dirname, '..', 'dist-client', 'index.html'));
      });
    }
    next();
  });

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);
}

// Bootstrap with error handling
bootstrap().catch(err => {
  console.error('Fatal: Application failed to start', err);
  process.exit(1);
});
