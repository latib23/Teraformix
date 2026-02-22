
import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Dell PowerEdge R740 Rack Server',
    sku: 'R740-XEON-GOLD',
    price: 3499.00,
    stockStatus: 'IN_STOCK',
    image: 'https://picsum.photos/id/0/500/500',
    category: 'Servers',
    brand: 'Dell',
    description: 'The PowerEdge R740 was designed to accelerate application performance leveraging accelerator cards and storage scalability. The 2-socket, 2U platform has the optimum balance of resources to power the most demanding environments.',
    specs: {
      'Processor': '2x Intel Xeon Gold 6248R',
      'RAM': '64GB DDR4 ECC',
      'Storage': '2x 480GB SSD SATA',
      'Form Factor': '2U Rack',
      'Power Supply': 'Dual Hot-Plug 750W'
    },
    weight: '65 lbs',
    dimensions: '3.41" x 17.08" x 28.98"',
    compatibility: 'Compatible with Dell EMC OpenManage, iDRAC9, and vSphere 7.0.',
    warranty: '3 Year Basic Hardware Warranty Repair, 5X10 HW-Only, 5x10 NBD Onsite',
    overview: 'The PowerEdge R740 was designed to accelerate application performance leveraging accelerator cards and storage scalability. The 2-socket, 2U platform has the optimum balance of resources to power the most demanding environments.'
  },
  {
    id: '2',
    name: 'Seagate Exos X16 14TB SAS HDD',
    sku: 'ST14000NM001G',
    price: 285.50,
    stockStatus: 'IN_STOCK',
    image: 'https://picsum.photos/id/1/500/500',
    category: 'Storage',
    brand: 'Seagate',
    description: 'Scalable, responsive, and innovative, the Exos X16 enterprise hard drive is designed for maximum storage capacity and the highest rack-space efficiency.',
    specs: {
      'Capacity': '14TB',
      'Interface': 'SAS 12Gb/s',
      'RPM': '7200',
      'Cache': '256MB',
      'Form Factor': '3.5 inch'
    },
    weight: '1.48 lbs',
    dimensions: '1.028" x 4.01" x 5.787"',
    compatibility: 'Compatible with standard 3.5-inch SAS backplanes and enterprise storage arrays.',
    warranty: '5-Year Limited Manufacturer Warranty',
    overview: 'Hyperscale cloud data centers and massive scale-out data centers benefit from the Exos X16. It offers the highest rack-space efficiency and is tuned for low-latency, high-throughput applications.'
  },
  {
    id: '3',
    name: 'Cisco Catalyst 9200L 48-Port Switch',
    sku: 'C9200L-48P-4G-E',
    price: 4250.00,
    stockStatus: 'BACKORDER',
    image: 'https://picsum.photos/id/2/500/500',
    category: 'Networking',
    brand: 'Cisco',
    description: 'Cisco Catalyst 9200 Series switches extend the power of intent-based networking and Catalyst 9000 hardware and software innovation to a broader set of deployments.',
    specs: {
      'Ports': '48 x 10/100/1000 (PoE+)',
      'Uplinks': '4 x 1G SFP',
      'PoE Budget': '740W',
      'Layer': 'Layer 3',
      'Stackable': 'Yes'
    },
    weight: '10.5 lbs',
    dimensions: '1.73" x 17.5" x 11.3"',
    compatibility: 'Compatible with DNA Center, Cisco ISE, and standard 19-inch racks.',
    warranty: 'Enhanced Limited Lifetime Warranty (E-LLW)',
    overview: 'Extend intent-based networking everywhere. Cisco Catalyst 9200 Series switches extend the power of intent-based networking and Catalyst 9000 hardware and software innovation to a broader set of deployments. With its family pedigree, Catalyst 9200 Series switches offer simplicity without compromise – it is secure, always on, and IT simplified.'
  },
  {
    id: '4',
    name: 'HPE ProLiant DL380 Gen10',
    sku: 'P24841-B21',
    price: 2999.00,
    stockStatus: 'IN_STOCK',
    image: 'https://picsum.photos/id/3/500/500',
    category: 'Servers',
    brand: 'HPE',
    description: 'Adaptable for diverse workloads and environments, the secure 2P 2U HPE ProLiant DL380 Gen10 Server delivers world-class performance.',
    specs: {
      'Processor': 'Intel Xeon Silver 4208',
      'RAM': '32GB DDR4',
      'Storage Controller': 'P408i-a',
      'Form Factor': '2U Rack'
    },
    weight: '32.6 lbs',
    dimensions: '3.44" x 17.54" x 26.75"',
    compatibility: 'Compatible with HPE iLO 5, OneView, and standard 19-inch racks.',
    warranty: '3/3/3 - Server Warranty includes three years of parts, three years of labor, three years of onsite support coverage.',
    overview: 'The HPE ProLiant DL380 Gen10 Server delivers the latest in security, performance and expandability, backed by a comprehensive warranty. Standardize on the industry\'s most trusted compute platform.'
  },
  {
    id: '5',
    name: 'Samsung PM1733 3.84TB NVMe SSD',
    sku: 'MZWLJ3T8HALS-00007',
    price: 550.00,
    stockStatus: 'IN_STOCK',
    image: 'https://picsum.photos/id/4/500/500',
    category: 'Storage',
    brand: 'Samsung',
    description: 'Samsung PM1733 PCIe Gen4 NVMe SSDs provide industry-leading performance for enterprise applications.',
    specs: {
      'Capacity': '3.84TB',
      'Interface': 'PCIe Gen4 x4',
      'Form Factor': 'U.2',
      'Read Speed': '7000 MB/s'
    },
    weight: '0.3 lbs',
    dimensions: '2.75" x 3.94" x 0.59"',
    compatibility: 'Compatible with PCIe Gen4 backplanes and U.2 enablement kits.',
    warranty: '5-Year Limited Warranty',
    overview: 'Samsung PM1733 NVMe SSDs deliver high performance for read-intensive workloads such as data warehousing, web servers, media streaming, and video on demand (VOD).'
  },
  {
    id: '6',
    name: 'Ubiquiti UniFi Dream Machine Pro',
    sku: 'UDM-Pro',
    price: 379.00,
    stockStatus: 'IN_STOCK',
    image: 'https://picsum.photos/id/5/500/500',
    category: 'Networking',
    brand: 'Ubiquiti',
    description: 'All-in-one enterprise security gateway and network appliance for small to medium-sized businesses.',
    specs: {
      'Processor': 'Quad-Core ARM Cortex-A57',
      'Memory': '4GB DDR4',
      'Flash': '16GB eMMC',
      'Rackmount': '1U'
    },
    weight: '8.6 lbs',
    dimensions: '1.72" x 17.42" x 11.24"',
    compatibility: 'Works with the UniFi Network Controller and standard 19-inch racks.',
    warranty: '1-Year Limited Warranty',
    overview: 'The UniFi Dream Machine Pro (UDM-Pro) is an all-in-one enterprise network appliance. It integrates a security gateway, 10G SFP+ WAN/LAN support, and an 8-port Gigabit Switch.'
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVER CONFIGURATOR COMPONENTS — Processors
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cfg-cpu-1', name: 'Intel Xeon Silver 4410Y Processor', sku: 'PK8071305120601', price: 485.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/xeon-workspace-702x395.png.rendition.intel.web.480.270.png', category: 'Components', brand: 'Intel',
    description: '4th Gen Intel Xeon Scalable processor with 12 cores, 24 threads, 2.0GHz base clock, 30MB cache, and 150W TDP. Ideal for entry-level enterprise workloads.',
    specs: { 'Cores/Threads': '12C/24T', 'Base Clock': '2.0 GHz', 'Cache': '30MB', 'TDP': '150W', 'Socket': 'LGA 4677', 'Generation': '4th Gen Sapphire Rapids' },
    weight: '0.2 lbs', warranty: '3-Year Intel Limited Warranty', overview: 'The Intel Xeon Silver 4410Y delivers reliable performance for mainstream data center workloads including virtualization, storage, and networking.'
  },
  {
    id: 'cfg-cpu-2', name: 'Intel Xeon Silver 4416+ Processor', sku: 'PK8071305120801', price: 715.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/xeon-workspace-702x395.png.rendition.intel.web.480.270.png', category: 'Components', brand: 'Intel',
    description: '4th Gen Intel Xeon Scalable processor with 20 cores, 40 threads, 2.0GHz base clock, 37.5MB cache, and 165W TDP.',
    specs: { 'Cores/Threads': '20C/40T', 'Base Clock': '2.0 GHz', 'Cache': '37.5MB', 'TDP': '165W', 'Socket': 'LGA 4677', 'Generation': '4th Gen Sapphire Rapids' },
    weight: '0.2 lbs', warranty: '3-Year Intel Limited Warranty', overview: 'Mid-range Xeon Silver with 20 cores for balanced compute performance across virtualization, analytics, and general-purpose enterprise workloads.'
  },
  {
    id: 'cfg-cpu-3', name: 'Intel Xeon Gold 5416S Processor', sku: 'PK8071305076800', price: 985.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/xeon-workspace-702x395.png.rendition.intel.web.480.270.png', category: 'Components', brand: 'Intel',
    description: '4th Gen Intel Xeon Scalable Gold processor with 16 cores, 32 threads, 2.0GHz base clock, 30MB cache, and 150W TDP.',
    specs: { 'Cores/Threads': '16C/32T', 'Base Clock': '2.0 GHz', 'Cache': '30MB', 'TDP': '150W', 'Socket': 'LGA 4677', 'Generation': '4th Gen Sapphire Rapids' },
    weight: '0.2 lbs', warranty: '3-Year Intel Limited Warranty', overview: 'Xeon Gold 5416S is optimized for demanding enterprise applications requiring high single-thread performance and advanced Intel technologies.'
  },
  {
    id: 'cfg-cpu-4', name: 'Intel Xeon Gold 6430 Processor', sku: 'PK8071305077001', price: 1850.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/xeon-workspace-702x395.png.rendition.intel.web.480.270.png', category: 'Components', brand: 'Intel',
    description: '4th Gen Intel Xeon Scalable Gold processor with 32 cores, 64 threads, 2.1GHz base clock, 60MB cache, and 270W TDP.',
    specs: { 'Cores/Threads': '32C/64T', 'Base Clock': '2.1 GHz', 'Cache': '60MB', 'TDP': '270W', 'Socket': 'LGA 4677', 'Generation': '4th Gen Sapphire Rapids' },
    weight: '0.2 lbs', warranty: '3-Year Intel Limited Warranty', overview: 'High-core-count Gold 6430 for compute-intensive workloads such as HPC, AI inference, and large-scale virtualization deployments.'
  },
  {
    id: 'cfg-cpu-5', name: 'Intel Xeon Gold 6438Y+ Processor', sku: 'PK8071305121200', price: 2250.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/xeon-workspace-702x395.png.rendition.intel.web.480.270.png', category: 'Components', brand: 'Intel',
    description: '4th Gen Intel Xeon Scalable Gold processor with 32 cores, 64 threads, 2.0GHz base clock, 60MB cache, and 205W TDP.',
    specs: { 'Cores/Threads': '32C/64T', 'Base Clock': '2.0 GHz', 'Cache': '60MB', 'TDP': '205W', 'Socket': 'LGA 4677', 'Generation': '4th Gen Sapphire Rapids' },
    weight: '0.2 lbs', warranty: '3-Year Intel Limited Warranty', overview: 'Power-efficient Gold 6438Y+ balances high core count with lower TDP for dense compute environments.'
  },
  {
    id: 'cfg-cpu-6', name: 'Intel Xeon Gold 6448Y Processor', sku: 'PK8071305072800', price: 2895.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/xeon-workspace-702x395.png.rendition.intel.web.480.270.png', category: 'Components', brand: 'Intel',
    description: '4th Gen Intel Xeon Scalable Gold processor with 32 cores, 64 threads, 2.1GHz base clock, 60MB cache, and 225W TDP.',
    specs: { 'Cores/Threads': '32C/64T', 'Base Clock': '2.1 GHz', 'Cache': '60MB', 'TDP': '225W', 'Socket': 'LGA 4677', 'Generation': '4th Gen Sapphire Rapids' },
    weight: '0.2 lbs', warranty: '3-Year Intel Limited Warranty', overview: 'Premium Gold 6448Y delivers exceptional throughput for database, ERP, and mission-critical enterprise applications.'
  },
  {
    id: 'cfg-cpu-7', name: 'Intel Xeon Platinum 8462Y+ Processor', sku: 'PK8071305073400', price: 4295.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/xeon-workspace-702x395.png.rendition.intel.web.480.270.png', category: 'Components', brand: 'Intel',
    description: '4th Gen Intel Xeon Scalable Platinum processor with 32 cores, 64 threads, 2.8GHz base clock, 60MB cache, and 300W TDP.',
    specs: { 'Cores/Threads': '32C/64T', 'Base Clock': '2.8 GHz', 'Cache': '60MB', 'TDP': '300W', 'Socket': 'LGA 4677', 'Generation': '4th Gen Sapphire Rapids' },
    weight: '0.2 lbs', warranty: '3-Year Intel Limited Warranty', overview: 'Xeon Platinum 8462Y+ delivers the highest per-core performance in its class for latency-sensitive and mission-critical workloads.'
  },
  {
    id: 'cfg-cpu-8', name: 'Intel Xeon Platinum 8480+ Processor', sku: 'PK8071305074600', price: 6950.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/xeon-workspace-702x395.png.rendition.intel.web.480.270.png', category: 'Components', brand: 'Intel',
    description: '4th Gen Intel Xeon Scalable Platinum processor with 56 cores, 112 threads, 2.0GHz base clock, 105MB cache, and 350W TDP. Flagship processor.',
    specs: { 'Cores/Threads': '56C/112T', 'Base Clock': '2.0 GHz', 'Cache': '105MB', 'TDP': '350W', 'Socket': 'LGA 4677', 'Generation': '4th Gen Sapphire Rapids' },
    weight: '0.2 lbs', warranty: '3-Year Intel Limited Warranty', overview: 'The flagship Xeon Platinum 8480+ with 56 cores delivers maximum throughput for HPC, AI/ML training, and the most demanding enterprise workloads.'
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVER CONFIGURATOR COMPONENTS — Memory (DDR5 ECC)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cfg-ram-1', name: '16GB DDR5-4800 ECC RDIMM', sku: 'M321R2GA3BB6', price: 55.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/dram/module/rdimm/m321r2ga3bb6-cqk/images/M321R2GA3BB6-CQK_001_Front_Green-Gallery.jpg', category: 'Components', brand: 'Samsung',
    description: '16GB DDR5-4800MHz ECC Registered DIMM. Compatible with 4th/5th Gen Intel Xeon and AMD EPYC platforms.',
    specs: { 'Capacity': '16GB', 'Speed': 'DDR5-4800', 'Type': 'ECC RDIMM', 'Voltage': '1.1V', 'Form Factor': '288-pin' },
    weight: '0.1 lbs', warranty: 'Lifetime Limited Warranty', overview: 'Enterprise-grade 16GB DDR5 registered memory module for server and workstation platforms requiring ECC data integrity.'
  },
  {
    id: 'cfg-ram-2', name: '32GB DDR5-4800 ECC RDIMM', sku: 'M321R4GA3BB6', price: 95.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/dram/module/rdimm/m321r2ga3bb6-cqk/images/M321R2GA3BB6-CQK_001_Front_Green-Gallery.jpg', category: 'Components', brand: 'Samsung',
    description: '32GB DDR5-4800MHz ECC Registered DIMM for enterprise servers.',
    specs: { 'Capacity': '32GB', 'Speed': 'DDR5-4800', 'Type': 'ECC RDIMM', 'Voltage': '1.1V', 'Form Factor': '288-pin' },
    weight: '0.1 lbs', warranty: 'Lifetime Limited Warranty', overview: 'Popular 32GB DDR5 ECC module optimized for mainstream server deployments with balanced capacity and cost.'
  },
  {
    id: 'cfg-ram-3', name: '64GB DDR5-4800 ECC RDIMM', sku: 'M321R8GA0BB0', price: 185.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/dram/module/rdimm/m321r2ga3bb6-cqk/images/M321R2GA3BB6-CQK_001_Front_Green-Gallery.jpg', category: 'Components', brand: 'Samsung',
    description: '64GB DDR5-4800MHz ECC Registered DIMM for high-memory enterprise applications.',
    specs: { 'Capacity': '64GB', 'Speed': 'DDR5-4800', 'Type': 'ECC RDIMM', 'Voltage': '1.1V', 'Form Factor': '288-pin' },
    weight: '0.1 lbs', warranty: 'Lifetime Limited Warranty', overview: 'High-density 64GB DDR5 ECC module ideal for virtualization hosts, databases, and in-memory analytics platforms.'
  },
  {
    id: 'cfg-ram-4', name: '128GB DDR5-4800 ECC RDIMM', sku: 'M321RADGA0B3', price: 450.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/dram/module/rdimm/m321r2ga3bb6-cqk/images/M321R2GA3BB6-CQK_001_Front_Green-Gallery.jpg', category: 'Components', brand: 'Samsung',
    description: '128GB DDR5-4800MHz ECC Registered DIMM for memory-intensive enterprise platforms.',
    specs: { 'Capacity': '128GB', 'Speed': 'DDR5-4800', 'Type': 'ECC RDIMM', 'Voltage': '1.1V', 'Form Factor': '288-pin' },
    weight: '0.1 lbs', warranty: 'Lifetime Limited Warranty', overview: 'Ultra-high-density 128GB module for SAP HANA, large-scale VDI, and scientific computing workloads requiring maximum memory per DIMM slot.'
  },
  {
    id: 'cfg-ram-5', name: '256GB DDR5-4800 ECC LRDIMM', sku: 'M321RFAGA0B5', price: 1250.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/dram/module/rdimm/m321r2ga3bb6-cqk/images/M321R2GA3BB6-CQK_001_Front_Green-Gallery.jpg', category: 'Components', brand: 'Samsung',
    description: '256GB DDR5-4800MHz ECC Load-Reduced DIMM for maximum memory capacity.',
    specs: { 'Capacity': '256GB', 'Speed': 'DDR5-4800', 'Type': 'ECC LRDIMM', 'Voltage': '1.1V', 'Form Factor': '288-pin' },
    weight: '0.1 lbs', warranty: 'Lifetime Limited Warranty', overview: 'Maximum-capacity 256GB LRDIMM for platforms requiring terabytes of memory — SAP HANA, in-memory databases, and large-scale analytics.'
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVER CONFIGURATOR COMPONENTS — Storage (SSDs & HDDs)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cfg-ssd-1', name: 'Samsung PM1733 1.92TB NVMe U.2 SSD', sku: 'MZWLO1T9HCJR', price: 295.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/ssd/enterprise-ssd/pm1733/images/PM1733_001_Front_Green-Gallery.jpg', category: 'Storage', brand: 'Samsung',
    description: '1.92TB NVMe U.2 enterprise SSD with PCIe Gen4 interface. Read-intensive workloads.',
    specs: { 'Capacity': '1.92TB', 'Interface': 'NVMe PCIe Gen4 x4', 'Form Factor': 'U.2 2.5"', 'Sequential Read': '7000 MB/s', 'Sequential Write': '2000 MB/s', 'DWPD': '1' },
    weight: '0.2 lbs', warranty: '5-Year Limited Warranty', overview: 'Enterprise NVMe SSD delivering exceptional read performance for data warehousing, web servers, and virtualized environments.'
  },
  {
    id: 'cfg-ssd-2', name: 'Samsung PM1733 3.84TB NVMe U.2 SSD', sku: 'MZWLO3T8HCLS', price: 520.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/ssd/enterprise-ssd/pm1733/images/PM1733_001_Front_Green-Gallery.jpg', category: 'Storage', brand: 'Samsung',
    description: '3.84TB NVMe U.2 enterprise SSD with PCIe Gen4 interface.',
    specs: { 'Capacity': '3.84TB', 'Interface': 'NVMe PCIe Gen4 x4', 'Form Factor': 'U.2 2.5"', 'Sequential Read': '7000 MB/s', 'Sequential Write': '2000 MB/s', 'DWPD': '1' },
    weight: '0.2 lbs', warranty: '5-Year Limited Warranty', overview: 'High-capacity enterprise NVMe drive for storage-intensive platform deployments.'
  },
  {
    id: 'cfg-ssd-3', name: 'Samsung PM1733 7.68TB NVMe U.2 SSD', sku: 'MZWLO7T6HBLA', price: 950.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/ssd/enterprise-ssd/pm1733/images/PM1733_001_Front_Green-Gallery.jpg', category: 'Storage', brand: 'Samsung',
    description: '7.68TB NVMe U.2 enterprise SSD with PCIe Gen4 interface. Maximum capacity NVMe.',
    specs: { 'Capacity': '7.68TB', 'Interface': 'NVMe PCIe Gen4 x4', 'Form Factor': 'U.2 2.5"', 'Sequential Read': '7000 MB/s', 'Sequential Write': '2000 MB/s', 'DWPD': '1' },
    weight: '0.2 lbs', warranty: '5-Year Limited Warranty', overview: 'Maximum-capacity enterprise NVMe for all-flash arrays, hyperconverged infrastructure, and cloud storage nodes.'
  },
  {
    id: 'cfg-ssd-4', name: 'Kioxia CM6-R 3.84TB NVMe U.2 SSD', sku: 'KCM61RUL3T84', price: 480.00, stockStatus: 'IN_STOCK', image: 'https://business.kioxia.com/content/dam/kioxia/shared/business/ssd/enterprise-ssd/cm6-r/images/cm6-r_product.png', category: 'Storage', brand: 'Kioxia',
    description: '3.84TB NVMe U.2 enterprise SSD by Kioxia (formerly Toshiba). Read-intensive, PCIe Gen4.',
    specs: { 'Capacity': '3.84TB', 'Interface': 'NVMe PCIe Gen4 x4', 'Form Factor': 'U.2 2.5"', 'Sequential Read': '6900 MB/s', 'Sequential Write': '1400 MB/s', 'DWPD': '1' },
    weight: '0.2 lbs', warranty: '5-Year Limited Warranty', overview: 'Kioxia CM6-R provides cost-effective, high-performance NVMe storage for enterprise data centers.'
  },
  {
    id: 'cfg-ssd-5', name: 'Kioxia CM6-R 7.68TB NVMe U.2 SSD', sku: 'KCM61RUL7T68', price: 895.00, stockStatus: 'IN_STOCK', image: 'https://business.kioxia.com/content/dam/kioxia/shared/business/ssd/enterprise-ssd/cm6-r/images/cm6-r_product.png', category: 'Storage', brand: 'Kioxia',
    description: '7.68TB NVMe U.2 enterprise SSD by Kioxia. Maximum read-intensive capacity.',
    specs: { 'Capacity': '7.68TB', 'Interface': 'NVMe PCIe Gen4 x4', 'Form Factor': 'U.2 2.5"', 'Sequential Read': '6900 MB/s', 'Sequential Write': '1400 MB/s', 'DWPD': '1' },
    weight: '0.2 lbs', warranty: '5-Year Limited Warranty', overview: 'High-capacity Kioxia NVMe drive for dense storage applications.'
  },
  {
    id: 'cfg-hdd-1', name: 'Seagate Exos X18 16TB SAS HDD', sku: 'ST16000NM004J', price: 310.00, stockStatus: 'IN_STOCK', image: 'https://www.seagate.com/content/dam/seagate/migrated-assets/www-content/product-content/enterprise-drives-tab/exos-x-drives/_shared/images/exos-x-drive-background-600x400.png', category: 'Storage', brand: 'Seagate',
    description: '16TB 7200RPM SAS 12Gbps 3.5" Enterprise HDD. Optimized for bulk storage.',
    specs: { 'Capacity': '16TB', 'Interface': 'SAS 12Gb/s', 'RPM': '7200', 'Form Factor': '3.5"', 'Cache': '256MB' },
    weight: '1.6 lbs', warranty: '5-Year Limited Warranty', overview: 'Enterprise-class helium-sealed HDD for high-capacity storage arrays and NAS environments.'
  },
  {
    id: 'cfg-hdd-2', name: 'Seagate Exos X20 20TB SATA HDD', sku: 'ST20000NM007D', price: 385.00, stockStatus: 'IN_STOCK', image: 'https://www.seagate.com/content/dam/seagate/migrated-assets/www-content/product-content/enterprise-drives-tab/exos-x-drives/_shared/images/exos-x-drive-background-600x400.png', category: 'Storage', brand: 'Seagate',
    description: '20TB 7200RPM SATA 6Gbps 3.5" Enterprise HDD.',
    specs: { 'Capacity': '20TB', 'Interface': 'SATA 6Gb/s', 'RPM': '7200', 'Form Factor': '3.5"', 'Cache': '256MB' },
    weight: '1.6 lbs', warranty: '5-Year Limited Warranty', overview: 'Maximum-capacity SATA drive for cost-effective bulk storage in enterprise environments.'
  },
  {
    id: 'cfg-hdd-3', name: 'WD Ultrastar HC560 20TB SAS HDD', sku: 'WUH722020AL5204', price: 395.00, stockStatus: 'IN_STOCK', image: 'https://www.westerndigital.com/content/dam/store/en-us/assets/products/internal-storage/ultrastar-dc-hc560-sata-hdd/gallery/ultrastar-dc-hc560-sata-front.png.thumb.1280.1280.png', category: 'Storage', brand: 'Western Digital',
    description: '20TB 7200RPM SAS 12Gbps 3.5" Enterprise HDD by Western Digital.',
    specs: { 'Capacity': '20TB', 'Interface': 'SAS 12Gb/s', 'RPM': '7200', 'Form Factor': '3.5"', 'Cache': '512MB' },
    weight: '1.6 lbs', warranty: '5-Year Limited Warranty', overview: 'WD Ultrastar HC560 provides enterprise reliability and maximum capacity for cloud and hyperscale storage.'
  },
  {
    id: 'cfg-ssd-6', name: 'Samsung PM893 1.92TB SATA SSD', sku: 'MZ-7L31T9B', price: 195.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/ssd/enterprise-ssd/pm893/images/PM893_001_Front_Green-Gallery.jpg', category: 'Storage', brand: 'Samsung',
    description: '1.92TB SATA 2.5" enterprise SSD for read-intensive mixed workloads.',
    specs: { 'Capacity': '1.92TB', 'Interface': 'SATA 6Gb/s', 'Form Factor': '2.5"', 'Sequential Read': '560 MB/s', 'Sequential Write': '530 MB/s', 'DWPD': '1' },
    weight: '0.15 lbs', warranty: '5-Year Limited Warranty', overview: 'Cost-effective enterprise SATA SSD for boot drives and moderate read/write workloads.'
  },
  {
    id: 'cfg-ssd-7', name: 'Samsung PM893 3.84TB SATA SSD', sku: 'MZ-7L33T8C', price: 365.00, stockStatus: 'IN_STOCK', image: 'https://semiconductor.samsung.com/us/ssd/enterprise-ssd/pm893/images/PM893_001_Front_Green-Gallery.jpg', category: 'Storage', brand: 'Samsung',
    description: '3.84TB SATA 2.5" enterprise SSD for high-capacity SATA deployments.',
    specs: { 'Capacity': '3.84TB', 'Interface': 'SATA 6Gb/s', 'Form Factor': '2.5"', 'Sequential Read': '560 MB/s', 'Sequential Write': '530 MB/s', 'DWPD': '1' },
    weight: '0.15 lbs', warranty: '5-Year Limited Warranty', overview: 'High-capacity SATA SSD for legacy storage arrays and mixed-use enterprise applications.'
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVER CONFIGURATOR COMPONENTS — RAID Controllers
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cfg-raid-1', name: 'Dell PERC H965i RAID Controller', sku: '405-ABDS', price: 385.00, stockStatus: 'IN_STOCK', image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-accessories/storage-adapters/perc-h965i/pdp/storage-adapter-perc-h965i-pdp-hero.psd?fmt=png-alpha&wid=400', category: 'Components', brand: 'Dell',
    description: 'Dell PERC H965i 8GB NV Cache SAS/SATA/NVMe RAID controller (PCIe Gen4).',
    specs: { 'Cache': '8GB NV Flash', 'Interface': 'PCIe Gen4', 'RAID Levels': '0, 1, 5, 6, 10, 50, 60', 'Internal Ports': '16', 'Compatible': 'Dell 16th Gen' },
    weight: '0.3 lbs', warranty: '1-Year Dell Limited Warranty', overview: 'Top-tier Dell PERC controller for 16th Gen PowerEdge servers with NVMe tri-mode support.'
  },
  {
    id: 'cfg-raid-2', name: 'Dell PERC H755 Front RAID Controller', sku: '405-ABDT', price: 295.00, stockStatus: 'IN_STOCK', image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-accessories/storage-adapters/perc-h965i/pdp/storage-adapter-perc-h965i-pdp-hero.psd?fmt=png-alpha&wid=400', category: 'Components', brand: 'Dell',
    description: 'Dell PERC H755 Front 8GB NV RAID controller (PCIe Gen4).',
    specs: { 'Cache': '8GB NV Flash', 'Interface': 'PCIe Gen4', 'RAID Levels': '0, 1, 5, 6, 10, 50, 60', 'Internal Ports': '8', 'Compatible': 'Dell 16th Gen' },
    weight: '0.3 lbs', warranty: '1-Year Dell Limited Warranty', overview: 'Dell PERC H755 for front-facing drive bays in PowerEdge 16th Gen servers.'
  },
  {
    id: 'cfg-raid-3', name: 'HPE MR416i-a Gen11 RAID Controller', sku: 'P48635-B21', price: 395.00, stockStatus: 'IN_STOCK', image: 'https://www.hpe.com/us/en/psnow/doc/a00008180enw.png', category: 'Components', brand: 'HPE',
    description: 'HPE MR416i-a Gen11 4GB Flash Backed Cache SAS/SATA RAID controller.',
    specs: { 'Cache': '4GB Flash Backed', 'Interface': 'PCIe Gen4', 'RAID Levels': '0, 1, 5, 6, 10, 50, 60', 'Internal Ports': '16', 'Compatible': 'HPE Gen11' },
    weight: '0.3 lbs', warranty: '3-Year HPE Limited Warranty', overview: 'Primary RAID controller for HPE ProLiant Gen11 servers with hardware RAID acceleration.'
  },
  {
    id: 'cfg-raid-4', name: 'HPE MR408i-o Gen11 Controller', sku: 'P26325-B21', price: 310.00, stockStatus: 'IN_STOCK', image: 'https://www.hpe.com/us/en/psnow/doc/a00008180enw.png', category: 'Components', brand: 'HPE',
    description: 'HPE MR408i-o Gen11 Controller with 8 internal lanes.',
    specs: { 'Interface': 'PCIe Gen4', 'RAID Levels': '0, 1, 5, 6, 10', 'Internal Ports': '8', 'Compatible': 'HPE Gen11' },
    weight: '0.3 lbs', warranty: '3-Year HPE Limited Warranty', overview: 'Entry-level HPE Gen11 RAID controller for basic hardware RAID requirements.'
  },
  {
    id: 'cfg-raid-5', name: 'Broadcom MegaRAID 9560-16i Controller', sku: '05-50077-00', price: 425.00, stockStatus: 'IN_STOCK', image: 'https://www.broadcom.com/media/products/MegaRAID_front-top-900x900.png', category: 'Components', brand: 'Broadcom',
    description: 'Broadcom MegaRAID 9560-16i 8GB PCIe Gen4 SAS/SATA/NVMe RAID controller.',
    specs: { 'Cache': '8GB', 'Interface': 'PCIe Gen4 x8', 'RAID Levels': '0, 1, 5, 6, 10, 50, 60', 'Internal Ports': '16', 'Compatible': 'Universal' },
    weight: '0.3 lbs', warranty: '3-Year Broadcom Warranty', overview: 'Industry-standard Broadcom MegaRAID controller compatible with Supermicro, Lenovo, and other OEM platforms.'
  },
  {
    id: 'cfg-raid-6', name: 'Broadcom MegaRAID 9560-8i Controller', sku: '05-50076-00', price: 310.00, stockStatus: 'IN_STOCK', image: 'https://www.broadcom.com/media/products/MegaRAID_front-top-900x900.png', category: 'Components', brand: 'Broadcom',
    description: 'Broadcom MegaRAID 9560-8i 4GB PCIe Gen4 SAS/SATA/NVMe RAID controller.',
    specs: { 'Cache': '4GB', 'Interface': 'PCIe Gen4 x8', 'RAID Levels': '0, 1, 5, 6, 10, 50, 60', 'Internal Ports': '8', 'Compatible': 'Universal' },
    weight: '0.3 lbs', warranty: '3-Year Broadcom Warranty', overview: 'Cost-effective MegaRAID controller for mid-range configurations.'
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVER CONFIGURATOR COMPONENTS — Networking (NICs)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cfg-nic-1', name: 'Broadcom 57416 Dual 10GbE Base-T OCP 3.0', sku: '540-BDFQ', price: 115.00, stockStatus: 'IN_STOCK', image: 'https://www.broadcom.com/media/products/ethernet-NIC-900x900.png', category: 'Networking', brand: 'Broadcom',
    description: 'Broadcom 57416 Dual Port 10GbE Base-T OCP 3.0 network adapter.',
    specs: { 'Ports': '2x 10GbE RJ45', 'Interface': 'OCP 3.0', 'Speed': '10 Gbps', 'Compatible': 'Dell, HPE, Lenovo' },
    weight: '0.15 lbs', warranty: '1-Year Limited Warranty', overview: 'Entry-level 10GbE copper networking for enterprise servers using standard Cat6a cabling.'
  },
  {
    id: 'cfg-nic-2', name: 'Broadcom 57414 Dual 25GbE SFP28 OCP 3.0', sku: '540-BDHS', price: 225.00, stockStatus: 'IN_STOCK', image: 'https://www.broadcom.com/media/products/ethernet-NIC-900x900.png', category: 'Networking', brand: 'Broadcom',
    description: 'Broadcom 57414 Dual Port 25GbE SFP28 OCP 3.0 network adapter.',
    specs: { 'Ports': '2x 25GbE SFP28', 'Interface': 'OCP 3.0', 'Speed': '25 Gbps', 'Compatible': 'Dell, HPE, Lenovo' },
    weight: '0.15 lbs', warranty: '1-Year Limited Warranty', overview: '25GbE SFP28 networking for high-bandwidth server connectivity in modern data centers.'
  },
  {
    id: 'cfg-nic-3', name: 'Intel E810-XXVDA2 Dual 25GbE SFP28', sku: 'E810-XXVDA2', price: 290.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/products/hero/foreground/ethernet-network-adapter-e810-702x395.png.rendition.intel.web.480.270.png', category: 'Networking', brand: 'Intel',
    description: 'Intel Ethernet Network Adapter E810-XXVDA2 Dual Port 25GbE SFP28 (PCIe Gen4).',
    specs: { 'Ports': '2x 25GbE SFP28', 'Interface': 'PCIe Gen4 x8', 'Speed': '25 Gbps', 'Features': 'ADQ, RDMA, iWARP' },
    weight: '0.2 lbs', warranty: '1-Year Intel Limited Warranty', overview: 'Intel E810 series with Application Device Queues (ADQ) for workload-optimized networking performance.'
  },
  {
    id: 'cfg-nic-4', name: 'Intel E810-CQDA2 Dual 100GbE QSFP28', sku: 'E810-CQDA2', price: 650.00, stockStatus: 'IN_STOCK', image: 'https://www.intel.com/content/dam/products/hero/foreground/ethernet-network-adapter-e810-702x395.png.rendition.intel.web.480.270.png', category: 'Networking', brand: 'Intel',
    description: 'Intel Ethernet Network Adapter E810-CQDA2 Dual Port 100GbE QSFP28 (PCIe Gen4).',
    specs: { 'Ports': '2x 100GbE QSFP28', 'Interface': 'PCIe Gen4 x16', 'Speed': '100 Gbps', 'Features': 'ADQ, RDMA, RoCEv2' },
    weight: '0.3 lbs', warranty: '1-Year Intel Limited Warranty', overview: 'High-performance 100GbE dual-port adapter for HPC, AI/ML, and storage fabric interconnects.'
  },
  {
    id: 'cfg-nic-5', name: 'NVIDIA ConnectX-6 Dx Dual 25GbE SFP28', sku: 'MCX623106AN', price: 345.00, stockStatus: 'IN_STOCK', image: 'https://www.nvidia.com/content/dam/en-zz/Solutions/networking/ethernet-adapters/connectx-6-dx-702x395.jpg', category: 'Networking', brand: 'NVIDIA',
    description: 'NVIDIA ConnectX-6 Dx Dual Port 25GbE SFP28 SmartNIC (PCIe Gen4).',
    specs: { 'Ports': '2x 25GbE SFP28', 'Interface': 'PCIe Gen4 x8', 'Speed': '25 Gbps', 'Features': 'Hardware offloads, OVS, IPsec, TLS' },
    weight: '0.2 lbs', warranty: '1-Year NVIDIA Warranty', overview: 'NVIDIA ConnectX-6 Dx SmartNIC with hardware offloads for security, virtualization, and cloud-native networking.'
  },
  {
    id: 'cfg-nic-6', name: 'NVIDIA ConnectX-7 Dual 100GbE QSFP56', sku: 'MCX713106AS', price: 895.00, stockStatus: 'IN_STOCK', image: 'https://www.nvidia.com/content/dam/en-zz/Solutions/networking/ethernet-adapters/connectx-7-702x395.jpg', category: 'Networking', brand: 'NVIDIA',
    description: 'NVIDIA ConnectX-7 Dual Port 100GbE QSFP56 SmartNIC (PCIe Gen5).',
    specs: { 'Ports': '2x 100GbE QSFP56', 'Interface': 'PCIe Gen5 x16', 'Speed': '100 Gbps', 'Features': 'Crypto offload, RDMA, RoCEv2, InfiniBand' },
    weight: '0.3 lbs', warranty: '1-Year NVIDIA Warranty', overview: 'Next-gen PCIe Gen5 SmartNIC for the most demanding AI, HPC, and cloud infrastructure workloads.'
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVER CONFIGURATOR COMPONENTS — Power Supplies
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cfg-psu-1', name: 'Dell 800W Platinum Hot-Plug PSU', sku: '450-AKLG', price: 85.00, stockStatus: 'IN_STOCK', image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-accessories/power-supplies/power-supplies-702x395.png', category: 'Components', brand: 'Dell',
    description: 'Dell 800W 80+ Platinum Hot-Plug Redundant Power Supply for PowerEdge 16th Gen servers.',
    specs: { 'Wattage': '800W', 'Efficiency': '80+ Platinum', 'Hot-Plug': 'Yes', 'Compatible': 'Dell PowerEdge 16th Gen' },
    weight: '2.5 lbs', warranty: '1-Year Dell Limited Warranty', overview: 'Efficient 800W platinum-rated PSU for standard enterprise workloads.'
  },
  {
    id: 'cfg-psu-2', name: 'Dell 1100W Titanium Hot-Plug PSU', sku: '450-AKLS', price: 145.00, stockStatus: 'IN_STOCK', image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-accessories/power-supplies/power-supplies-702x395.png', category: 'Components', brand: 'Dell',
    description: 'Dell 1100W 80+ Titanium Hot-Plug Redundant Power Supply for high-performance configs.',
    specs: { 'Wattage': '1100W', 'Efficiency': '80+ Titanium', 'Hot-Plug': 'Yes', 'Compatible': 'Dell PowerEdge 16th Gen' },
    weight: '3.0 lbs', warranty: '1-Year Dell Limited Warranty', overview: 'Premium titanium-rated efficiency for power-hungry CPU and GPU configurations.'
  },
  {
    id: 'cfg-psu-3', name: 'Dell 1400W Platinum Hot-Plug PSU', sku: '450-AKLT', price: 175.00, stockStatus: 'IN_STOCK', image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-accessories/power-supplies/power-supplies-702x395.png', category: 'Components', brand: 'Dell',
    description: 'Dell 1400W 80+ Platinum Hot-Plug PSU for maximum power headroom.',
    specs: { 'Wattage': '1400W', 'Efficiency': '80+ Platinum', 'Hot-Plug': 'Yes', 'Compatible': 'Dell PowerEdge 16th Gen' },
    weight: '3.5 lbs', warranty: '1-Year Dell Limited Warranty', overview: 'High-wattage PSU for fully loaded dual-CPU configurations with GPU accelerators.'
  },
  {
    id: 'cfg-psu-4', name: 'HPE 800W Flex Slot Platinum PSU', sku: 'P44412-B21', price: 95.00, stockStatus: 'IN_STOCK', image: 'https://www.hpe.com/us/en/psnow/doc/a00008180enw.png', category: 'Components', brand: 'HPE',
    description: 'HPE 800W Flex Slot Platinum Hot Plug Low Halogen PSU for Gen11 servers.',
    specs: { 'Wattage': '800W', 'Efficiency': '80+ Platinum', 'Hot-Plug': 'Yes', 'Compatible': 'HPE ProLiant Gen11' },
    weight: '2.5 lbs', warranty: '3-Year HPE Limited Warranty', overview: 'Standard-efficiency PSU for HPE ProLiant Gen11 server platforms.'
  },
  {
    id: 'cfg-psu-5', name: 'HPE 1600W Flex Slot Platinum PSU', sku: 'P44413-B21', price: 195.00, stockStatus: 'IN_STOCK', image: 'https://www.hpe.com/us/en/psnow/doc/a00008180enw.png', category: 'Components', brand: 'HPE',
    description: 'HPE 1600W Flex Slot Platinum Hot Plug Low Halogen PSU for Gen11 servers.',
    specs: { 'Wattage': '1600W', 'Efficiency': '80+ Platinum', 'Hot-Plug': 'Yes', 'Compatible': 'HPE ProLiant Gen11' },
    weight: '3.5 lbs', warranty: '3-Year HPE Limited Warranty', overview: 'High-wattage PSU for fully loaded HPE Gen11 configurations with GPU accelerators.'
  },
  {
    id: 'cfg-psu-6', name: 'Supermicro 1200W Platinum Hot-Swap PSU', sku: 'PWS-1K28P-SQ', price: 125.00, stockStatus: 'IN_STOCK', image: 'https://www.supermicro.com/a_images/products/Accessories/Power_Supplies/PWS-1K28P-SQ.png', category: 'Components', brand: 'Supermicro',
    description: 'Supermicro 1200W 80+ Platinum Hot-Swap Redundant Power Supply.',
    specs: { 'Wattage': '1200W', 'Efficiency': '80+ Platinum', 'Hot-Plug': 'Yes', 'Compatible': 'Supermicro Platforms' },
    weight: '3.0 lbs', warranty: '3-Year Supermicro Warranty', overview: 'Reliable platinum-rated PSU for Supermicro server and storage platforms.'
  },
  {
    id: 'cfg-psu-7', name: 'Lenovo 1100W Platinum Hot-Swap PSU', sku: '4P57A72765', price: 135.00, stockStatus: 'IN_STOCK', image: 'https://lenovopress.lenovo.com/assets/images/LP1612/ThinkSystem%20SR650%20V3%20-%20front.png', category: 'Components', brand: 'Lenovo',
    description: 'Lenovo ThinkSystem 1100W Platinum Hot-Swap PSU for V3 servers.',
    specs: { 'Wattage': '1100W', 'Efficiency': '80+ Platinum', 'Hot-Plug': 'Yes', 'Compatible': 'Lenovo ThinkSystem V3' },
    weight: '3.0 lbs', warranty: '3-Year Lenovo Limited Warranty', overview: 'Efficient hot-swap PSU for Lenovo ThinkSystem V3 server platforms.'
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVER CONFIGURATOR — Server Chassis / Base Platforms
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cfg-srv-1', name: 'Dell PowerEdge R760 2U Rack Server', sku: 'PER760-BASE', price: 2895.00, stockStatus: 'IN_STOCK', image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/r760/media-gallery/server-poweredge-r760-gallery-1.psd?fmt=png-alpha&wid=600', category: 'Servers', brand: 'Dell',
    description: '16th Gen 2U Rack Server with PCIe Gen5, DDR5, and up to 24x 2.5" NVMe bays. Ideal for AI inference, virtualization, and high-density compute.',
    specs: { 'Form Factor': '2U Rack', 'Max Memory': '4TB DDR5', 'Drive Bays': '24x 2.5" NVMe/SAS/SATA', 'CPU Sockets': '2', 'PCIe Slots': '6x Gen5', 'Generation': '16th Gen' },
    weight: '55 lbs', dimensions: '3.44" x 17.09" x 29.53"', warranty: '3-Year Dell ProSupport', overview: 'The Dell PowerEdge R760 is a versatile 2U platform designed for mainstream data center workloads including virtualization, databases, and AI inference.'
  },
  {
    id: 'cfg-srv-2', name: 'Dell PowerEdge R660 1U Rack Server', sku: 'PER660-BASE', price: 2495.00, stockStatus: 'IN_STOCK', image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/r660/media-gallery/server-poweredge-r660-gallery-1.psd?fmt=png-alpha&wid=600', category: 'Servers', brand: 'Dell',
    description: '16th Gen 1U Rack Server optimized for dense compute. DDR5, PCIe Gen5, and up to 10x 2.5" bays.',
    specs: { 'Form Factor': '1U Rack', 'Max Memory': '4TB DDR5', 'Drive Bays': '10x 2.5" NVMe/SAS/SATA', 'CPU Sockets': '2', 'PCIe Slots': '3x Gen5', 'Generation': '16th Gen' },
    weight: '40 lbs', dimensions: '1.68" x 17.09" x 29.53"', warranty: '3-Year Dell ProSupport', overview: 'Compact 1U PowerEdge R660 maximizes rack density for compute-intensive deployments.'
  },
  {
    id: 'cfg-srv-3', name: 'HPE ProLiant DL380a Gen11 2U Server', sku: 'DL380A-G11-BASE', price: 3150.00, stockStatus: 'IN_STOCK', image: 'https://www.hpe.com/psnow/doc/a00008180enw.png', category: 'Servers', brand: 'HPE',
    description: '2U Rack Server with 4th Gen Intel Xeon Scalable, DDR5, PCIe Gen5, and GPU-ready design.',
    specs: { 'Form Factor': '2U Rack', 'Max Memory': '4TB DDR5', 'Drive Bays': '8x SFF + 2x Rear', 'CPU Sockets': '2', 'PCIe Slots': '5x Gen5', 'Generation': 'Gen11' },
    weight: '48 lbs', dimensions: '3.44" x 17.54" x 29.5"', warranty: '3-Year HPE Foundation Care', overview: 'HPE ProLiant DL380a Gen11 is the industry-standard platform for hybrid cloud workloads.'
  },
  {
    id: 'cfg-srv-4', name: 'HPE ProLiant DL360 Gen11 1U Server', sku: 'DL360-G11-BASE', price: 2750.00, stockStatus: 'IN_STOCK', image: 'https://www.hpe.com/psnow/doc/a00008180enw.png', category: 'Servers', brand: 'HPE',
    description: '1U Rack Server with 4th Gen Intel Xeon, DDR5, and PCIe Gen5 for dense rack deployments.',
    specs: { 'Form Factor': '1U Rack', 'Max Memory': '4TB DDR5', 'Drive Bays': '10x SFF', 'CPU Sockets': '2', 'PCIe Slots': '3x Gen5', 'Generation': 'Gen11' },
    weight: '35 lbs', dimensions: '1.7" x 17.54" x 27.5"', warranty: '3-Year HPE Foundation Care', overview: 'Compact 1U DL360 for compute-dense deployments requiring maximum rack efficiency.'
  },
  {
    id: 'cfg-srv-5', name: 'Supermicro CloudDC 2U Server', sku: 'AS-2015HS-TNR-BASE', price: 2450.00, stockStatus: 'IN_STOCK', image: 'https://www.supermicro.com/a_images/products/Aplus/system/2U/AS_-2015HS-TNR_main.png', category: 'Servers', brand: 'Supermicro',
    description: '2U CloudDC Server with dual 4th Gen Intel Xeon, 32 DIMM slots, 12x 3.5" hot-swap bays.',
    specs: { 'Form Factor': '2U Rack', 'Max Memory': '4TB DDR5', 'Drive Bays': '12x 3.5" + 2x 2.5" Rear', 'CPU Sockets': '2', 'PCIe Slots': '6x Gen5', 'Generation': 'CloudDC' },
    weight: '60 lbs', dimensions: '3.44" x 17.6" x 28"', warranty: '3-Year Supermicro Warranty', overview: 'Purpose-built for cloud infrastructure and HCI deployments with massive storage capacity.'
  },
  {
    id: 'cfg-srv-6', name: 'Lenovo ThinkSystem SR650 V3 2U Server', sku: 'SR650-V3-BASE', price: 2795.00, stockStatus: 'IN_STOCK', image: 'https://lenovopress.lenovo.com/assets/images/LP1612/ThinkSystem%20SR650%20V3%20-%20front.png', category: 'Servers', brand: 'Lenovo',
    description: '2U Rack Server with 4th/5th Gen Intel Xeon, DDR5, and PCIe Gen5. Versatile platform.',
    specs: { 'Form Factor': '2U Rack', 'Max Memory': '4TB DDR5', 'Drive Bays': '24x 2.5" or 12x 3.5"', 'CPU Sockets': '2', 'PCIe Slots': '8x Gen5', 'Generation': 'V3' },
    weight: '55 lbs', dimensions: '3.44" x 17.5" x 29.4"', warranty: '3-Year Lenovo Limited Warranty', overview: 'Versatile Lenovo SR650 V3 for database, analytics, and virtualization workloads with maximum PCIe expandability.'
  }
];
