"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGlobalContent = exports.GlobalContentProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const db_1 = require("../lib/db");
const api_1 = require("../lib/api");
const defaultContent = {
    general: {
        phone: '1-800-555-0199',
        email: 'sales@servertechcentral.com',
        address: '100 Tech Plaza, Austin, TX 78701',
        announcement: 'Same Day Shipping on In-Stock Items',
        cageCode: '8H7V2',
        dunsNumber: '09-882-1234'
    },
    home: {
        heroTitle: "Powering the World's Data Infrastructure.",
        heroSubtitle: 'The trusted source for Enterprise Servers, Storage, and Networking hardware. We keep your data center running with rapid procurement and expert support.',
        heroCta: 'Shop All Inventory',
        heroImage: 'https://images.unsplash.com/photo-1558494949-ef526b0042a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        partnerLogos: [],
        trustTitle: 'Trusted Certifications & Partners',
        whyTitle: 'Why Procurement Teams Trust Us',
        whyDescription: 'We understand that downtime is not an option. Our infrastructure is built to support yours with speed, reliability, and financial flexibility.',
        whyCards: [
            { title: 'Global Logistics Network', description: 'With distribution centers in New York, California, and Texas, we offer same-day shipping on 95% of in-stock inventory. We provide blind drop-shipping and international pallet freight to data centers worldwide.' },
            { title: 'Rigorous QA Testing', description: 'Every server and drive that leaves our facility undergoes a 24-hour stress test. Our certified engineers verify firmware updates, clear logs, and ensure strict cosmetic standards for a "like-new" deployment experience.' },
            { title: 'Financial Services', description: 'We streamline procurement for enterprise clients. Access Net 30 terms, volume discounts, and detailed BOM (Bill of Materials) auditing. We accept University and Government Purchase Orders instantly.' }
        ],
        featuredTitle: 'Featured Inventory',
        featuredSubtitle: 'High-demand components ready to ship.',
        featuredViewAllText: 'View All →',
        exploreTitle: 'Explore by Category',
        exploreSubtitle: 'Browse our specialized hardware divisions',
        verticalsHeaderTagline: 'Public Sector Speed',
        publicSectorTitle: 'Fast Hardware for Public Sector Timelines',
        publicSectorParagraphs: [
            'Government, education, healthcare, and research institutions need enterprise hardware fast, but procurement moves slow. Server Tech Central solves this.',
            'We stock both legacy components for aging infrastructure and cutting-edge servers for AI workloads, then handle the compliance complexity that delays public sector IT. TAA compliance for federal contracts. E-Rate processes for schools. Audit documentation for institutional buyers. Security vetting for classified systems.',
            "We deliver same-day on the hardware while managing the regulatory requirements that typically add weeks to timelines. When your infrastructure supports national security, student learning, patient care, or research operations, waiting isn't realistic. We eliminate the wait."
        ],
        verticalCards: [
            { title: 'Hyperscale Data Centers', description: 'Pallets of compute nodes and NVMe storage shipped same-day, because cloud capacity waits for no one.' },
            { title: 'Federal & Local Government', description: 'TAA-compliant hardware with secure chain of custody and GSA-ready account management. Federal procurement without federal delays.' },
            { title: 'Education & Research', description: 'HPC clusters for breakthrough research and reliable infrastructure for student networks, E-Rate ready, shipped fast.' }
        ]
    },
    categoryPage: {
        title: "Enterprise Servers & Storage Solutions | Server Tech Central",
        description: "Browse our catalog of over 500,000 enterprise servers, storage drives, and networking components. In-stock items ship same day. ISO 9001 Certified.",
        h1: "Enterprise Servers & Storage Solutions",
        introText: "Browse our extensive catalog of new and refurbished enterprise hardware. We stock over 500,000 SKUs including Dell PowerEdge Servers, HPE ProLiant, and Cisco Networking equipment. All items are fully tested, include warranty, and are available for same-day shipping."
    },
    privacyPolicy: {
        content: `## Privacy Policy\n\n**Effective Date:** January 1, 2024\n\nAt Server Tech Central, we prioritize your data privacy. We collect only the information necessary to process your orders and provide customer support.\n\n### Information We Collect\n- Contact details (Name, Email, Phone)\n- Shipping and Billing Addresses\n- Transaction History\n\nWe do not sell your personal data to third parties.`,
    },
    termsOfSale: {
        content: `## Terms of Sale\n\n**1. Acceptance of Order**\nAll orders are subject to acceptance by Server Tech Central. We reserve the right to cancel orders due to pricing errors or stock discrepancies.\n\n**2. Warranty**\nAll hardware comes with a standard 3-Year Warranty unless otherwise noted. This covers hardware defects only.\n\n**3. Returns**\nReturns are accepted within 30 days of delivery. A 15% restocking fee may apply to non-defective items opened by the customer.`,
    },
    termsAndConditions: {
        content: `## Terms & Conditions\n\n**Use of Website**\nBy accessing this website, you agree to comply with our terms. Unauthorized scraping, data mining, or automated ordering is prohibited.\n\n**Payment Terms**\nWe accept major credit cards, Purchase Orders for qualified entities, and bank transfers. Orders may be held pending verification.\n\n**Limitation of Liability**\nServer Tech Central is not liable for indirect or consequential damages arising from product use.`,
    },
    returnPolicy: {
        content: `## Return Policy\n\n**30-Day Returns**\nReturns accepted within 30 days of delivery with RMA authorization. Items must be in original condition and packaging.\n\n**Defective Items**\nDefective or DOA products qualify for full replacement or refund.\n\n**Restocking Fees**\nNon-defective returns may be subject to up to a 15% restocking fee.\n\n**Process**\nContact support with your order reference to initiate an RMA.`,
    },
    sitemapSettings: {
        introText: "Navigate our entire catalog of enterprise hardware solutions. Use the links below to find specific categories, products, and information pages.",
    },
    footer: {
        aboutText: 'The premier B2B reseller for enterprise hardware, storage, and networking solutions.',
        social: {
            facebook: '',
            linkedin: '',
            twitter: '',
            instagram: ''
        }
    },
    aboutPage: {
        content: `## About Us\n\nServer Tech Central supplies enterprise-grade servers, storage, and networking hardware to data centers, MSPs, and public sector organizations. Our mission is rapid, reliable fulfillment backed by technical expertise.\n\n**Why Choose Us**\n- Large in-stock inventory\n- Fast, professional procurement\n- 3-Year standard warranty\n- Dedicated account managers`,
    },
    contactPage: {
        content: `## Contact Us\n\nReach our team via the channels below. For urgent sourcing or order updates, include your reference number.\n\n**Sales & Support**\n- Phone: 1-800-555-0199\n- Email: sales@servertechcentral.com\n\n**Headquarters**\n100 Tech Plaza, Austin, TX 78701`,
    },
    settings: {
        favicon: 'https://cdn-icons-png.flaticon.com/512/4400/4400508.png',
        faviconDarkUrl: '',
        siteTitle: 'Server Tech Central | Enterprise Hardware Reseller',
        logoUrl: '',
        logoText: 'SERVER TECH CENTRAL',
        activeTheme: 'christmas',
    },
    payment: {
        stripePublicKey: '',
        enablePO: true,
        enableBankTransfer: false,
        bankInstructions: '',
    },
    security: {
        allowPkIp: '',
        allowedIps: [],
    },
    categories: [
        {
            id: 'servers',
            name: 'Servers',
            description: 'Rack, Tower, & Blade Systems',
            image: '',
            isActive: true,
            seoTitle: "Enterprise Servers | Dell PowerEdge & HPE ProLiant | Server Tech Central",
            seoDescription: "Buy new and refurbished enterprise servers. Huge inventory of Dell PowerEdge and HPE ProLiant rack, tower, and blade servers. 3-Year Warranty.",
            seoH1: "Enterprise Server Solutions",
            seoText: "Scale your data center with high-performance compute nodes. We stock the latest generation hardware as well as legacy systems for maintenance continuity. Our certified engineers rigorously test every unit to ensure mission-critical reliability."
        },
        {
            id: 'storage',
            name: 'Storage',
            description: 'HDD, SSD, & NVMe Arrays',
            image: '',
            isActive: true,
            seoTitle: "Enterprise Storage Arrays & Hard Drives | SAS, SATA, NVMe",
            seoDescription: "High-capacity storage solutions. Shop enterprise hard drives (HDD) and solid state drives (SSD) from Seagate, WD, and Samsung. Immediate availability.",
            seoH1: "Data Center Storage & Archives",
            seoText: "From high-IOPS NVMe arrays for AI workloads to bulk SAS storage for archival, we provide the density and reliability your data demands. Secure your digital assets with industry-leading drive technology."
        },
        {
            id: 'networking',
            name: 'Networking',
            description: 'Switches, Routers, & Optics',
            image: '',
            isActive: true,
            seoTitle: "Enterprise Networking Equipment | Cisco Switches & Routers",
            seoDescription: "Upgrade your network infrastructure with Cisco Catalyst switches, routers, and SFP+ modules. Fully tested and ready to deploy.",
            seoH1: "Network Infrastructure",
            seoText: "Build a resilient backbone with our curated selection of top-tier networking hardware. Whether you need core switching or edge connectivity, our inventory is verified for performance and compatibility."
        },
        {
            id: 'components',
            name: 'Components',
            description: 'Processors, RAM, & Parts',
            image: '',
            isActive: true,
            seoTitle: "Server Components & Parts | RAM, CPU, Power Supplies",
            seoDescription: "Find genuine OEM replacement parts. Server memory, processors, power supplies, and raid controllers. Fast shipping for critical repairs.",
            seoH1: "Critical Server Components",
            seoText: "Keep your systems online with genuine OEM parts. We maintain an extensive inventory of processors, memory modules, and power supplies for rapid replacement and upgrades."
        }
    ],
    blogPosts: [],
    landingCollections: [
        {
            slug: 'ubiquiti-enterprise',
            title: 'Ubiquiti Enterprise',
            heroTitle: 'Authorized Ubiquiti Reseller - Bulk Stock Available.',
            heroSubtitle: 'MSPs and WISPs rely on our UniFi inventory and fast fulfillment.',
            bannerImage: '',
            description: 'Featuring UniFi Dream Machine Pro, PoE Switches, and U6 Pro Access Points. Modern, clean, and in-stock now.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        },
        {
            slug: 'mikrotik-isp',
            title: 'MikroTik ISP',
            heroTitle: 'MikroTik Routing & Switching Solutions.',
            heroSubtitle: 'Technical, no-nonsense hardware for network engineers.',
            bannerImage: '',
            description: 'Highlight CCR, CRS, and RouterBOARD. Emphasize 10GbE and SFP+ ports.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        },
        {
            slug: 'cisco-refurbished',
            title: 'Cisco Refurbished',
            heroTitle: 'Certified Refurbished Cisco. Lifetime Warranty.',
            heroSubtitle: 'Value and reliability for legacy replacements and budget enterprise gear.',
            bannerImage: '',
            description: 'Feature Catalyst 2960/3750 and ISR Routers. Save up to 80% vs new.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        },
        {
            slug: 'general-networking',
            title: 'Enterprise Networking',
            heroTitle: 'Enterprise Networking Infrastructure.',
            heroSubtitle: 'Everything for your office network and wireless controllers.',
            bannerImage: '',
            description: 'Best-sellers from Ubiquiti, Netgear ProSafe, and Cisco.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        },
        {
            slug: 'server-processors',
            title: 'Server Processors',
            heroTitle: 'Server CPUs: Xeon E5 & Threadripper Pro.',
            heroSubtitle: 'Specific upgrades for existing servers. Part numbers visible immediately.',
            bannerImage: '',
            description: 'Feature Intel Xeon E5-2600 v4, AMD EPYC, and Threadripper Pro.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        },
        {
            slug: 'server-motherboards',
            title: 'Server Motherboards',
            heroTitle: 'Replacement Server Boards - Supermicro & Gigabyte.',
            heroSubtitle: 'System building and repair with compatibility focus.',
            bannerImage: '',
            description: 'Supermicro X10/X11 and Gigabyte. Sockets: 2011-3, LGA 3647.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        },
        {
            slug: 'data-center-components',
            title: 'Data Center Components',
            heroTitle: 'Server Upgrades: NICs, HBAs & Memory.',
            heroSubtitle: 'Hard-to-find parts in stock.',
            bannerImage: '',
            description: 'Mellanox ConnectX, LSI SAS controllers, ECC RAM.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        },
        {
            slug: 'general-server-hardware',
            title: 'General Server Hardware',
            heroTitle: 'Enterprise Server Parts & Accessories.',
            heroSubtitle: 'Procurement-friendly selection.',
            bannerImage: '',
            description: 'Chassis, power supplies, rail kits, and mixed components.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        },
        {
            slug: 'sfp-transceivers',
            title: 'SFP Transceivers',
            heroTitle: 'Enterprise SFP/SFP+ Optical Modules.',
            heroSubtitle: '10G and 1G optics for Cisco, HPE, Juniper, and compatible gear.',
            bannerImage: '',
            description: 'Reliable fiber connectivity modules including SR/LR/CWDM. Tested compatibility, fast shipping, and bulk pricing for MSPs and data centers.',
            productIds: [],
            testimonials: [],
            logos: [],
            faqs: []
        }
    ],
    redirects: []
};
const GlobalContentContext = (0, react_1.createContext)({
    content: defaultContent,
    updateContent: async () => { },
    isLoading: false,
});
const GlobalContentProvider = ({ children }) => {
    const [content, setContent] = (0, react_1.useState)(() => {
        return db_1.db.content.get(defaultContent);
    });
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchContent = async () => {
            try {
                const apiBase = (0, api_1.getApiBase)();
                const res = await fetch(`${apiBase}/content?t=${Date.now()}`);
                const contentType = res.headers.get("content-type");
                if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
                    const serverData = await res.json();
                    setContent(prev => {
                        const merged = Object.assign({}, prev);
                        Object.keys(serverData).forEach(key => {
                            if (serverData[key] && typeof serverData[key] === 'object') {
                                if (Array.isArray(serverData[key])) {
                                    merged[key] = serverData[key];
                                }
                                else {
                                    merged[key] = Object.assign(Object.assign({}, prev[key]), serverData[key]);
                                }
                            }
                        });
                        if (!merged.home.heroImage)
                            merged.home.heroImage = defaultContent.home.heroImage;
                        if (!merged.settings.logoText)
                            merged.settings.logoText = defaultContent.settings.logoText;
                        if (!merged.settings.favicon)
                            merged.settings.favicon = defaultContent.settings.favicon;
                        if (!merged.privacyPolicy)
                            merged.privacyPolicy = defaultContent.privacyPolicy;
                        db_1.db.content.save(merged);
                        return merged;
                    });
                }
                else {
                    console.warn(`[CMS] API did not return JSON. Using local cache. Status: ${res.status}`);
                }
            }
            catch (error) {
                console.warn("[CMS] Network Error (Using local cache):", error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, []);
    (0, react_1.useEffect)(() => {
        if (content.settings) {
            if (content.settings.siteTitle && document.title !== content.settings.siteTitle) {
                document.title = content.settings.siteTitle;
            }
            const updateFavicon = () => {
                const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                const faviconUrl = (isDark && content.settings.faviconDarkUrl)
                    ? content.settings.faviconDarkUrl
                    : content.settings.favicon;
                if (faviconUrl) {
                    let link = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }
                    if (link.href !== faviconUrl) {
                        link.href = faviconUrl;
                    }
                }
            };
            updateFavicon();
            const matcher = window.matchMedia('(prefers-color-scheme: dark)');
            matcher.addEventListener('change', updateFavicon);
            return () => matcher.removeEventListener('change', updateFavicon);
        }
    }, [content.settings]);
    const updateContent = async (updates) => {
        const newContentState = Object.assign({}, content);
        Object.keys(updates).forEach(key => {
            if (Array.isArray(updates[key])) {
                newContentState[key] = updates[key];
            }
            else {
                newContentState[key] = Object.assign(Object.assign({}, content[key]), updates[key]);
            }
        });
        setContent(newContentState);
        db_1.db.content.save(newContentState);
        const apiBase = (0, api_1.getApiBase)();
        await Promise.all(Object.keys(updates).map(async (key) => {
            const sectionData = newContentState[key];
            try {
                await api_1.api.post(`${key}`, sectionData);
            }
            catch (err) {
                console.error(`Failed to sync ${key} to backend:`, err);
                throw err;
            }
        }));
    };
    return ((0, jsx_runtime_1.jsx)(GlobalContentContext.Provider, { value: { content, updateContent, isLoading }, children: children }));
};
exports.GlobalContentProvider = GlobalContentProvider;
const useGlobalContent = () => (0, react_1.useContext)(GlobalContentContext);
exports.useGlobalContent = useGlobalContent;
//# sourceMappingURL=GlobalContent.js.map