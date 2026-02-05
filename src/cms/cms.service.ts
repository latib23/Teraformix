
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from './entities/content-block.entity';
import { pingIndexNow } from '../lib/index-now';
import * as fs from 'fs';
import csvParser = require('csv-parser');

@Injectable()
export class CmsService implements OnModuleInit {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    @InjectRepository(ContentBlock)
    private contentRepository: Repository<ContentBlock>,
  ) { }

  async onModuleInit() {
    try {
      // Ensure upload directories exist
      if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
      if (!fs.existsSync('./uploads/temp')) fs.mkdirSync('./uploads/temp');

      // Define all default content blocks
      const defaults = {
        general: {
          phone: '1-800-555-0199',
          email: 'sales@teraformix.com',
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
        },
        categoryPage: {
          title: "Enterprise Servers & Storage Solutions | Teraformix",
          description: "Browse our catalog of over 500,000 enterprise servers, storage drives, and networking components. In-stock items ship same day. ISO 9001 Certified.",
          h1: "Enterprise Servers & Storage Solutions",
          introText: "Browse our extensive catalog of new and refurbished enterprise hardware. We stock over 500,000 SKUs including Dell PowerEdge Servers, HPE ProLiant, and Cisco Networking equipment. All items are fully tested, include warranty, and are available for same-day shipping."
        },
        privacyPolicy: {
          content: `## Privacy Policy\n\n**Effective Date:** January 1, 2024\n\nAt Teraformix, we prioritize your data privacy. We collect only the information necessary to process your orders and provide customer support.\n\n### Information We Collect\n- Contact details (Name, Email, Phone)\n- Shipping and Billing Addresses\n- Transaction History\n\nWe do not sell your personal data to third parties.`,
        },
        termsOfSale: {
          content: `## Terms of Sale\n\n**1. Acceptance of Order**\nAll orders are subject to acceptance by Teraformix. We reserve the right to cancel orders due to pricing errors or stock discrepancies.\n\n**2. Warranty**\nAll hardware comes with a standard 3-Year Warranty unless otherwise noted. This covers hardware defects only.\n\n**3. Returns**\nReturns are accepted within 30 days of delivery. A 15% restocking fee may apply to non-defective items opened by the customer.`,
        },
        termsAndConditions: {
          content: `## Terms & Conditions\n\n**Use of Website**\nBy accessing this website, you agree to comply with our terms. Unauthorized scraping, data mining, or automated ordering is prohibited.\n\n**Payment Terms**\nWe accept major credit cards, Purchase Orders for qualified entities, and bank transfers. Orders may be held pending verification.\n\n**Limitation of Liability**\nTeraformix is not liable for indirect or consequential damages arising from product use.`,
        },
        returnPolicy: {
          content: `## Return Policy\n\n**30-Day Returns**\nReturns accepted within 30 days of delivery with RMA authorization. Items must be in original condition and packaging.\n\n**Defective Items**\nDefective or DOA products qualify for full replacement or refund.\n\n**Restocking Fees**\nNon-defective returns may be subject to up to a 15% restocking fee.\n\n**Process**\nContact support with your order reference to initiate an RMA.`,
        },
        sitemapSettings: {
          introText: "Navigate our entire catalog of enterprise hardware solutions. Use the links below to find specific categories, products, and information pages.",
        },
        footer: {
          aboutText: 'The premier B2B reseller for enterprise hardware, storage, and networking solutions.',
        },
        aboutPage: {
          content: `## About Us\n\nTeraformix supplies enterprise-grade servers, storage, and networking hardware to data centers, MSPs, and public sector organizations. Our mission is rapid, reliable fulfillment backed by technical expertise.\n\n**Why Choose Us**\n- Large in-stock inventory\n- Fast, professional procurement\n- 3-Year standard warranty\n- Dedicated account managers`,
        },
        contactPage: {
          content: `## Contact Us\n\nReach our team via the channels below. For urgent sourcing or order updates, include your reference number.`,
        },
        warrantyPage: {
          content: `## Warranty Policy\n\n**3-Year Advanced Replacement Warranty**\nWe stand behind our hardware. All refurbished servers, storage, and networking equipment include our standard 3-Year Warranty.\n\n### How It Works\n1. **Report Issue:** Contact support with your order number and serial number.\n2. **Troubleshoot:** Our engineers will verify the failure remotely.\n3. **Shipment:** We ship a replacement part immediately, often before receiving your return.\n4. **Return:** Use the improved label to return the defective unit within 14 days.\n\n**New Retail Items**\nNew items carry the original manufacturer's warranty (e.g., 1-Year or 3-Year OEM coverage). We assist with the RMA process.\n\n## Return Policy\n\n**Defective Items**\nDOA or failing items are replaced at no cost. We cover round-trip shipping.\n\n**Non-Defective Returns**\n- Accepted within 30 days.\n- Subject to a **25% Restocking Fee**.\n- Buyer pays return shipping.\n- Items must be in original condition (unopened/sealed if new).`,
        },
        settings: {
          favicon: 'https://cdn-icons-png.flaticon.com/512/4400/4400508.png',
          faviconDarkUrl: '',
          siteTitle: 'Teraformix | Enterprise Hardware Reseller',
          logoUrl: '',
          logoText: 'TERAFORMIX',
        },
        payment: {
          stripePublicKey: '',
          enablePO: true,
          enableBankTransfer: false,
          bankInstructions: ''
        },
        security: {
          trueguardPublicId: '',
          allowPkIp: ''
        },
        redirects: [
          // Old product URL with descriptive slug → canonical product route by SKU
          { from: '/product/st18000nm003d-seagate-18tb-7200rpm-sas-12gbs-35-in-hdd', to: '/product/ST18000NM003D', permanent: true },
          // Old category URL → canonical category
          { from: '/category/wireless-routers', to: '/category/networking', permanent: true },
        ],
        categories: [
          {
            id: 'servers',
            name: 'Servers',
            description: 'Rack, Tower, & Blade Systems',
            image: '',
            isActive: true,
            seoTitle: "Enterprise Servers | Dell PowerEdge & HPE ProLiant | Teraformix",
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
        ]
        ,
        serverConfigurator: {
          title: "Build Your Custom Server",
          description: "Configure your enterprise server with our easy-to-use builder.",
          models: [
            {
              id: "dell-r740xd-lff",
              name: "Dell PowerEdge R740xd LFF",
              brand: "Dell",
              description: "2U Rack Server, 12x 3.5\" Drive Bays. The gold standard for storage-dense virtualization and data analytics workloads.",
              basePrice: 1295.00,
              baseImage: "https://i.dell.com/sites/csimages/Video_Imagery/all/PowerEdge_R740xd.png",
              specs: {
                formFactor: "2U Rack",
                maxRam: "3TB DDR4",
                maxStorage: "192TB (12x 16TB)",
                cpuSockets: 2
              },
              compatibility: {
                cpuFamily: "intel-scalable-gen2",
                ramType: "ddr4-ecc",
                diskResult: "lff-3.5",
                raidFamily: "dell-perc"
              }
            },
            {
              id: "hpe-dl380-gen10",
              name: "HPE ProLiant DL380 Gen10",
              brand: "HPE",
              description: "The industry standard 2U server. Unmatched versatility and resilience for diverse enterprise workloads.",
              basePrice: 1450.00,
              baseImage: "https://www.hpe.com/psnow/doc/a00008180enw.png",
              specs: {
                formFactor: "2U Rack",
                maxRam: "3TB DDR4",
                maxStorage: "200TB+ (with mid-plane)",
                cpuSockets: 2
              },
              compatibility: {
                cpuFamily: "intel-scalable-gen2",
                ramType: "ddr4-ecc",
                diskResult: "sff-2.5",
                raidFamily: "hpe-smartarray"
              }
            },
            {
              id: "cisco-c240-m5",
              name: "Cisco UCS C240 M5",
              brand: "Cisco",
              description: "2U Rack Server for high-performance computing, big data, and storage-intensive infrastructure.",
              basePrice: 1350.00,
              baseImage: "https://www.cisco.com/c/dam/en/us/products/servers-unified-computing/ucs-c-series-rack-servers/c240-m5-front.png",
              specs: {
                formFactor: "2U Rack",
                maxRam: "3TB DDR4",
                maxStorage: "180TB",
                cpuSockets: 2
              },
              compatibility: {
                cpuFamily: "intel-scalable-gen2",
                ramType: "ddr4-ecc",
                diskResult: "lff-3.5",
                raidFamily: "cisco-12g"
              }
            }
          ],
          availableComponents: {
            processors: [
              { partNumber: "SRF9K", name: "Intel Xeon Silver 4210 (10C/20T, 2.2GHz, 13.75MB, 85W)", price: 385.00, category: "cpu", family: "intel-scalable-gen2" },
              { partNumber: "SRF9J", name: "Intel Xeon Silver 4214 (12C/24T, 2.2GHz, 16.5MB, 85W)", price: 450.00, category: "cpu", family: "intel-scalable-gen2" },
              { partNumber: "SRF9H", name: "Intel Xeon Silver 4216 (16C/32T, 2.1GHz, 22MB, 100W)", price: 595.00, category: "cpu", family: "intel-scalable-gen2" },
              { partNumber: "SRF9A", name: "Intel Xeon Gold 5218 (16C/32T, 2.3GHz, 22MB, 125W)", price: 850.00, category: "cpu", family: "intel-scalable-gen2" },
              { partNumber: "SRF95", name: "Intel Xeon Gold 6230 (20C/40T, 2.1GHz, 27.5MB, 125W)", price: 1250.00, category: "cpu", family: "intel-scalable-gen2" },
              { partNumber: "SRF90", name: "Intel Xeon Gold 6248 (20C/40T, 2.5GHz, 27.5MB, 150W)", price: 1800.00, category: "cpu", family: "intel-scalable-gen2" },
              { partNumber: "SRF8Z", name: "Intel Xeon Platinum 8260 (24C/48T, 2.4GHz, 35.75MB, 165W)", price: 2950.00, category: "cpu", family: "intel-scalable-gen2" }
            ],
            memory: [
              { partNumber: "M393A2K43CB2", name: "16GB DDR4-2933 ECC RDIMM (Samsung/Hynix)", price: 65.00, category: "ram", type: "ddr4-ecc" },
              { partNumber: "M393A4K40CB2", name: "32GB DDR4-2933 ECC RDIMM (Samsung/Hynix)", price: 110.00, category: "ram", type: "ddr4-ecc" },
              { partNumber: "M393A8G40AB2", name: "64GB DDR4-2933 ECC RDIMM (Samsung/Hynix)", price: 210.00, category: "ram", type: "ddr4-ecc" },
              { partNumber: "M393AAG40M32", name: "128GB DDR4-2933 ECC LRDIMM (Samsung/Hynix)", price: 550.00, category: "ram", type: "ddr4-ecc" }
            ],
            storage: [
              { partNumber: "HUH721212AL5200", name: "12TB 7.2K SAS 12Gbps 3.5\" HDD (HGST/Seagate)", price: 245.00, category: "hdd", formFactor: "lff-3.5" },
              { partNumber: "ST16000NM002G", name: "16TB 7.2K SAS 12Gbps 3.5\" HDD (Seagate Exos)", price: 320.00, category: "hdd", formFactor: "lff-3.5" },
              { partNumber: "ST8000NM0075", name: "8TB 7.2K SAS 12Gbps 3.5\" HDD (Enterprise)", price: 165.00, category: "hdd", formFactor: "lff-3.5" },
              { partNumber: "HUS726T4TALS200", name: "4TB 7.2K SAS 12Gbps 3.5\" HDD (Ultrastar)", price: 95.00, category: "hdd", formFactor: "lff-3.5" },
              { partNumber: "MZ-7L31T900", name: "1.92TB SATA Enterprise SSD (Samsung PM883)", price: 220.00, category: "ssd", formFactor: "sff-2.5" },
              { partNumber: "MZ-7L33T800", name: "3.84TB SATA Enterprise SSD (Samsung PM883)", price: 410.00, category: "ssd", formFactor: "sff-2.5" },
              { partNumber: "KPM5XRUG3T84", name: "3.84TB SAS 12Gbps Enterprise SSD (Kioxia/Toshiba)", price: 480.00, category: "ssd", formFactor: "sff-2.5" },
              { partNumber: "KPM5XRUG7T68", name: "7.68TB SAS 12Gbps Enterprise SSD (Kioxia/Toshiba)", price: 950.00, category: "ssd", formFactor: "sff-2.5" }
            ],
            raidControllers: [
              { partNumber: "405-AAES", name: "Dell PERC H730P 2GB NV Cache", price: 185.00, category: "raid", family: "dell-perc" },
              { partNumber: "405-AAMR", name: "Dell PERC H740P 8GB NV Cache", price: 345.00, category: "raid", family: "dell-perc" },
              { partNumber: "804331-B21", name: "HPE Smart Array P408i-a SR Gen10 Controller", price: 210.00, category: "raid", family: "hpe-smartarray" },
              { partNumber: "804338-B21", name: "HPE Smart Array P816i-a SR Gen10 Controller", price: 395.00, category: "raid", family: "hpe-smartarray" },
              { partNumber: "UCSC-RAID-M5", name: "Cisco 12G SAS Modular RAID Controller (2GB)", price: 225.00, category: "raid", family: "cisco-12g" }
            ],
            networking: [
              { partNumber: "540-BBGY", name: "Broadcom 57414 Dual Port 25GbE SFP28", price: 240.00, category: "nic" },
              { partNumber: "540-BBUK", name: "Intel X550 Dual Port 10GbE Network Adapter (Base-T)", price: 140.00, category: "nic" },
              { partNumber: "540-BBGU", name: "Intel X710 Dual Port 10GbE SFP+", price: 160.00, category: "nic" },
              { partNumber: "817749-B21", name: "HPE Ethernet 10/25Gb 2-port 640FLR-SFP28 Adapter", price: 215.00, category: "nic" }
            ],
            powerSupplies: [
              { partNumber: "450-AGMN", name: "Dell 750W Platinum Hot-Plug PSU", price: 75.00, category: "psu" },
              { partNumber: "450-AGMY", name: "Dell 1100W Platinum Hot-Plug PSU", price: 120.00, category: "psu" },
              { partNumber: "865414-B21", name: "HPE 800W Flex Slot Platinum Hot Plug Low Halogen PSU", price: 85.00, category: "psu" },
              { partNumber: "865428-B21", name: "HPE 800W Flex Slot Titanium Hot Plug Low Halogen PSU", price: 115.00, category: "psu" },
              { partNumber: "UCS-PSU1-770W", name: "Cisco 770W AC Hot-Plug Power Supply", price: 95.00, category: "psu" }
            ]
          }
        },
        blogPosts: []
        ,
        landingCollections: [
          {
            slug: 'ubiquiti-enterprise',
            title: 'Ubiquiti Enterprise',
            heroTitle: 'Authorized Ubiquiti Reseller - Bulk Stock Available.',
            heroSubtitle: 'MSPs and WISPs rely on our UniFi inventory and fast fulfillment.',
            bannerImage: 'https://i.postimg.cc/3NCdggvN/Gemini-Generated-Image-l6pqjfl6pqjfl6pq.jpg',
            description: "MSPs and WISPs rely on our UniFi inventory and fast fulfilment. We keep UniFi Dream Machine Pro gateways, enterprise PoE switches, and U6 Pro access points in stock, ready for managed service deployments, wireless ISP builds, and multi-site enterprise networks. \n\nOne controller for everything, scalable from single locations to hundreds of sites. \n",
            productIds: [
              '4d60124a-3aae-415d-be65-39321bd08346',
              '8021591b-901e-4a39-9453-745854eda507',
              'd6a88f1a-7fd5-4ec5-882c-d51ac62deb78',
              '0e0e7152-e288-4646-9194-4f6f5866777e',
              '75571cf7-0007-42e9-900e-773e0a4e8e8f',
              '046554ac-52b6-4040-bf78-18cb0b6efc72',
              'c6b034a4-9a7f-4d84-a316-506598f37fb5',
              'd51f876d-dee4-4e6b-85c4-262b146a8377'
            ],
            logos: [
              { name: 'ZT Systems', imageUrl: 'https://ztsystems.com/wp-content/uploads/2022/03/zt-logo-white.svg' }
            ],
            testimonials: [
              { role: 'CTO', quote: 'You guys are amazing', author: 'sam', company: 'Linum Group' }
            ],
            faqs: []
          }
          ,
          {
            slug: 'sfp-transceivers',
            title: 'SFP Transceivers',
            heroTitle: 'Enterprise SFP/SFP+ Optical Modules.',
            heroSubtitle: '1G and 10G optics compatible with Cisco, HPE, Juniper.',
            bannerImage: '',
            description: 'SR/LR/CWDM modules for datacenter and campus networks. Tested for compatibility and backed by warranty. Bulk discounts available for MSPs.',
            productIds: [],
            logos: [],
            testimonials: [],
            faqs: []
          }
        ]
      };

      // Seeding logic
      for (const [key, data] of Object.entries(defaults)) {
        try {
          const existing = await this.contentRepository.findOneBy({ key });
          if (!existing) {
            this.logger.log(`Seeding missing CMS content block: ${key}`);
            await this.contentRepository.save({ key, data });
          } else {
            // Backfill check for settings to ensure new keys exist
            let updated = false;

            if (key === 'settings' && existing.data) {
              if (!('logoUrl' in existing.data)) { existing.data.logoUrl = ''; updated = true; }
              if (!('faviconDarkUrl' in existing.data)) { existing.data.faviconDarkUrl = ''; updated = true; }
              if (!('logoText' in existing.data)) { existing.data.logoText = 'TERAFORMIX'; updated = true; }
            }

            if (key === 'general' && existing.data) {
              if (!('cageCode' in existing.data)) { existing.data.cageCode = '8H7V2'; updated = true; }
              if (!('dunsNumber' in existing.data)) { existing.data.dunsNumber = '09-882-1234'; updated = true; }
            }

            if (updated) {
              this.logger.log(`Backfilling missing fields in ${key}`);
              await this.contentRepository.save(existing);
            }

            // FORCE: Replace categories with only the 4 approved categories
            if (key === 'categories') {
              const allowed = ['servers', 'storage', 'networking', 'components'];
              const currentCategories = Array.isArray(existing.data) ? existing.data : [];
              const currentIds = currentCategories.map((c: any) => String(c.id || '').toLowerCase());

              // Check if we have categories other than the allowed 4
              const hasExtraCategories = currentIds.some(id => !allowed.includes(id));
              const isMissingRequired = allowed.some(id => !currentIds.includes(id));

              if (hasExtraCategories || isMissingRequired || currentCategories.length !== 4) {
                this.logger.log(`Cleaning up categories: Replacing with only the 4 approved categories (Servers, Storage, Networking, Components)`);
                existing.data = defaults.categories;
                await this.contentRepository.save(existing);
              }
            }

            // Backfill/merge for landingCollections when empty or missing entries
            if (key === 'landingCollections') {
              const isArray = Array.isArray(existing.data);
              const needsBackfill = !isArray || (isArray && existing.data.length === 0);
              if (needsBackfill) {
                this.logger.log('Backfilling default landingCollections');
                existing.data = defaults.landingCollections;
                await this.contentRepository.save(existing);
              } else if (isArray) {
                try {
                  const current = existing.data as any[];
                  const present = new Set(current.map((c: any) => String(c.slug || '').trim()).filter(Boolean));
                  const toAdd = (defaults.landingCollections || []).filter((c: any) => !present.has(String(c.slug || '').trim()));
                  if (toAdd.length > 0) {
                    this.logger.log(`Appending ${toAdd.length} missing landingCollections from defaults`);
                    existing.data = current.concat(toAdd);
                    await this.contentRepository.save(existing);
                  }
                } catch (e) {
                  this.logger.warn('Failed to merge landingCollections defaults', e as any);
                }
              }
            }
          }
        } catch (innerError) {
          this.logger.error(`Failed to seed block ${key}`, innerError);
        }
      }
      this.logger.log('CMS Content Check Complete.');
    } catch (error) {
      this.logger.error('Failed to seed CMS content (General Error)', error);
    }
  }

  async getContent(key: string): Promise<any> {
    try {
      const block = await this.contentRepository.findOneBy({ key });
      if (!block) return null;

      // Check payment expiry
      if (key === 'payment' && block.data?.enableBankTransfer && block.data?.bankTransferExpiresAt) {
        if (Date.now() > block.data.bankTransferExpiresAt) {
          this.logger.log('Bank Transfer expired. Auto-disabling.');
          block.data.enableBankTransfer = false;
          block.data.bankTransferExpiresAt = null;
          await this.contentRepository.save(block);
        }
      }

      return block.data;
    } catch (error) {
      this.logger.error(`Error fetching content for key: ${key}`, error);
      return null;
    }
  }

  async getAllContent(): Promise<Record<string, any>> {
    try {
      const blocks = await this.contentRepository.find();

      // Check for expiry in the batch
      let paymentBlock = blocks.find(b => b.key === 'payment');
      if (paymentBlock && paymentBlock.data?.enableBankTransfer && paymentBlock.data?.bankTransferExpiresAt) {
        if (Date.now() > paymentBlock.data.bankTransferExpiresAt) {
          this.logger.log('Bank Transfer expired (detected in getAll). Auto-disabling.');
          paymentBlock.data.enableBankTransfer = false;
          paymentBlock.data.bankTransferExpiresAt = null;
          await this.contentRepository.save(paymentBlock);
        }
      }

      return blocks.reduce((acc, block) => {
        acc[block.key] = block.data;
        return acc;
      }, {});
    } catch (error) {
      this.logger.error('Error fetching all content', error);
      return {};
    }
  }

  async updateContent(key: string, data: any): Promise<ContentBlock> {
    if (!data) {
      throw new Error("Cannot save empty data");
    }

    this.logger.log(`PERSIST: Updating content block '${key}'`);
    if (key === 'settings') {
      this.logger.debug(`Settings Payload: ${JSON.stringify(data).substring(0, 200)}...`);
    }

    // Special logic for Payment Settings - Auto-turn off Bank Transfer after 10 minutes
    if (key === 'payment' && data.enableBankTransfer) {
      // If enabling, set expiry time
      const TEN_MINUTES = 10 * 60 * 1000;
      data.bankTransferEnabledAt = Date.now();
      data.bankTransferExpiresAt = Date.now() + TEN_MINUTES;
      this.logger.log(`Bank Transfer enabled. Will expire at ${new Date(data.bankTransferExpiresAt).toISOString()}`);
    } else if (key === 'payment' && data.enableBankTransfer === false) {
      // Clear if disabled
      data.bankTransferExpiresAt = null;
    }

    const block = this.contentRepository.create({ key, data });
    const saved = await this.contentRepository.save(block);
    this.logger.log(`PERSIST: Success '${key}'`);

    // SEO: Notify search engines if public content changed
    const publicKeys = ['home', 'categoryPage', 'privacyPolicy', 'termsOfSale', 'termsAndConditions', 'returnPolicy', 'aboutPage', 'contactPage', 'categories', 'serverConfigurator'];
    if (publicKeys.includes(key)) {
      const origin = 'https://teraformix.com';
      if (key === 'categories' && Array.isArray(data)) {
        const urls = data.filter(c => c.isActive && c.id).map(c => `${origin}/category/${c.id}`);
        if (urls.length > 0) pingIndexNow(urls);
      } else {
        const map: Record<string, string> = {
          'home': '/',
          'categoryPage': '/category',
          'privacyPolicy': '/privacy',
          'termsOfSale': '/terms',
          'termsAndConditions': '/terms-and-conditions',
          'returnPolicy': '/returns',
          'aboutPage': '/about',
          'contactPage': '/contact',
          'serverConfigurator': '/configurator',
        };
        if (map[key]) pingIndexNow(`${origin}${map[key]}`);
      }
    }

    return saved;
  }
  async importRedirectsFromCsv(filePath: string): Promise<{ imported: number; skipped: number }> {
    const existingBlock = await this.contentRepository.findOneBy({ key: 'redirects' });
    const existingRedirects = Array.isArray(existingBlock?.data) ? existingBlock.data : [];
    const existingFroms = new Set(existingRedirects.map((r: any) => r.from.toLowerCase().trim()));

    const newRedirects: any[] = [];
    let skippedCount = 0;

    return new Promise((resolve, reject) => {
      let isFirstRow = true;
      fs.createReadStream(filePath)
        .pipe(csvParser({ headers: false }))
        .on('data', (row) => {
          // Detect and skip header row if present
          if (isFirstRow) {
            isFirstRow = false;
            const col1 = String(row[0] || '').toLowerCase().trim();
            if (col1 === 'old url' || col1 === 'from' || col1 === 'url' || col1 === 'source') {
              this.logger.log('Skipping CSV header row');
              return;
            }
          }

          // Map columns by index: 0 -> from, 1 -> to
          const from = (row[0] || '').trim();
          const to = (row[1] || '').trim();

          if (from && to) {
            const normalizedFrom = from.toLowerCase();
            if (!existingFroms.has(normalizedFrom)) {
              newRedirects.push({ from, to, permanent: true });
              existingFroms.add(normalizedFrom);
            } else {
              skippedCount++;
            }
          }
        })
        .on('end', async () => {
          try {
            if (newRedirects.length > 0) {
              const merged = [...existingRedirects, ...newRedirects];
              await this.updateContent('redirects', merged);
              this.logger.log(`Imported ${newRedirects.length} redirects, skipped ${skippedCount} duplicates.`);
            }
            // Cleanup temp file
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            resolve({ imported: newRedirects.length, skipped: skippedCount });
          } catch (error) {
            this.logger.error('Failed to save imported redirects', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          this.logger.error('Error parsing redirects CSV', error);
          reject(error);
        });
    });
  }
}
