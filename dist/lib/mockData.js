"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockProducts = void 0;
exports.mockProducts = [
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
    }
];
//# sourceMappingURL=mockData.js.map