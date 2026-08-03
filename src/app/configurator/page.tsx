import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clipboard,
  Cpu,
  HardDrive,
  Info,
  Network,
  RotateCcw,
  Server,
  Shield,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import SEOHead from '../../components/SEO/SEOHead';
import Image from '../../components/Image';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useCart } from '../../contexts/CartContext';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { useUI } from '../../contexts/UIContext';

type ComponentItem = {
  partNumber: string;
  name: string;
  price: number;
  category?: string;
  family?: string;
  type?: string;
  formFactor?: string;
  compatibleBrands?: string[];
};

type ServerModel = {
  id: string;
  name: string;
  brand: string;
  description: string;
  basePrice: number;
  baseImage: string;
  specs: {
    formFactor?: string;
    maxRam?: string;
    maxStorage?: string;
    cpuSockets?: number;
    pciSlots?: string;
    generation?: string;
    maxDriveCount?: number;
    memorySlots?: number;
  };
  compatibility?: {
    cpuFamily?: string;
    ramType?: string;
    diskResult?: string;
    raidFamily?: string;
  };
};

type Catalog = {
  title: string;
  description: string;
  models: ServerModel[];
  availableComponents: {
    processors: ComponentItem[];
    memory: ComponentItem[];
    storage: ComponentItem[];
    raidControllers: ComponentItem[];
    networking: ComponentItem[];
    powerSupplies: ComponentItem[];
  };
};

type BuilderConfig = {
  cpu: ComponentItem | null;
  ram: ComponentItem | null;
  ram_qty: number;
  storage: ComponentItem | null;
  storage_qty: number;
  raid: ComponentItem | null;
  nic: ComponentItem | null;
  psu: ComponentItem | null;
  psu_qty: number;
  support: 'standard' | 'advanced' | 'mission-critical';
  burnIn: boolean;
};

const DEFAULT_CATALOG: Catalog = {
  title: 'Enterprise Server Builder',
  description: 'Build deployment-ready Dell, HPE, Lenovo, and Supermicro rack servers with compatible CPUs, memory, storage, networking, and support.',
  models: [
    {
      id: 'dell-r760',
      name: 'Dell PowerEdge R760',
      brand: 'Dell',
      description: '2U dual-socket platform for virtualization, database, analytics, and dense NVMe workloads.',
      basePrice: 2895,
      baseImage: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/r760/media-gallery/server-poweredge-r760-gallery-1.psd?fmt=png-alpha&wid=600',
      specs: { formFactor: '2U Rack', maxRam: '4TB DDR5', maxStorage: '24x 2.5 in NVMe/SAS/SATA', cpuSockets: 2, pciSlots: '6x PCIe Gen5', generation: '16th Gen', maxDriveCount: 24, memorySlots: 32 },
      compatibility: { cpuFamily: 'intel-sapphire-rapids', ramType: 'ddr5-ecc', diskResult: 'sff-2.5', raidFamily: 'dell-perc12' },
    },
    {
      id: 'hpe-dl380a-gen11',
      name: 'HPE ProLiant DL380a Gen11',
      brand: 'HPE',
      description: '2U Gen11 platform with PCIe Gen5 expansion for hybrid cloud, GPU, and storage-heavy builds.',
      basePrice: 3150,
      baseImage: 'https://www.hpe.com/psnow/doc/a00008180enw.png',
      specs: { formFactor: '2U Rack', maxRam: '4TB DDR5', maxStorage: '20x SFF + 2x rear SFF', cpuSockets: 2, pciSlots: '8x PCIe Gen5', generation: 'Gen11', maxDriveCount: 20, memorySlots: 32 },
      compatibility: { cpuFamily: 'intel-sapphire-rapids', ramType: 'ddr5-ecc', diskResult: 'sff-2.5', raidFamily: 'hpe-mr416i' },
    },
    {
      id: 'supermicro-621c',
      name: 'Supermicro SYS-621C-TN12R',
      brand: 'Supermicro',
      description: '2U CloudDC system with 12 large-form-factor bays for HCI, backup, and bulk storage.',
      basePrice: 2450,
      baseImage: 'https://www.supermicro.com/a_images/products/Aplus/system/2U/AS_-2015HS-TNR_main.png',
      specs: { formFactor: '2U Rack', maxRam: '4TB DDR5', maxStorage: '12x 3.5 in + rear 2.5 in', cpuSockets: 2, pciSlots: '6x PCIe Gen5', generation: 'CloudDC', maxDriveCount: 12, memorySlots: 32 },
      compatibility: { cpuFamily: 'intel-sapphire-rapids', ramType: 'ddr5-ecc', diskResult: 'lff-3.5', raidFamily: 'broadcom-9500' },
    },
    {
      id: 'lenovo-sr650-v3',
      name: 'Lenovo ThinkSystem SR650 V3',
      brand: 'Lenovo',
      description: 'Balanced 2U enterprise platform for databases, virtualization clusters, and analytics workloads.',
      basePrice: 2795,
      baseImage: 'https://lenovopress.lenovo.com/assets/images/LP1612/ThinkSystem%20SR650%20V3%20-%20front.png',
      specs: { formFactor: '2U Rack', maxRam: '4TB DDR5', maxStorage: '24x 2.5 in or 12x 3.5 in', cpuSockets: 2, pciSlots: '8x PCIe Gen5', generation: 'V3', maxDriveCount: 24, memorySlots: 32 },
      compatibility: { cpuFamily: 'intel-sapphire-rapids', ramType: 'ddr5-ecc', diskResult: 'sff-2.5', raidFamily: 'broadcom-9500' },
    },
  ],
  availableComponents: {
    processors: [
      { partNumber: 'PK8071305120601', name: 'Intel Xeon Silver 4410Y (12C/24T, 2.0GHz, 150W)', price: 485, family: 'intel-sapphire-rapids' },
      { partNumber: 'PK8071305120801', name: 'Intel Xeon Silver 4416+ (20C/40T, 2.0GHz, 165W)', price: 715, family: 'intel-sapphire-rapids' },
      { partNumber: 'PK8071305077001', name: 'Intel Xeon Gold 6430 (32C/64T, 2.1GHz, 270W)', price: 1850, family: 'intel-sapphire-rapids' },
      { partNumber: 'PK8071305074600', name: 'Intel Xeon Platinum 8480+ (56C/112T, 2.0GHz, 350W)', price: 6950, family: 'intel-sapphire-rapids' },
    ],
    memory: [
      { partNumber: 'M321R2GA3BB6', name: '16GB DDR5-4800 ECC RDIMM', price: 55, type: 'ddr5-ecc' },
      { partNumber: 'M321R4GA3BB6', name: '32GB DDR5-4800 ECC RDIMM', price: 95, type: 'ddr5-ecc' },
      { partNumber: 'M321R8GA0BB0', name: '64GB DDR5-4800 ECC RDIMM', price: 185, type: 'ddr5-ecc' },
      { partNumber: 'M321RADGA0B3', name: '128GB DDR5-4800 ECC RDIMM', price: 450, type: 'ddr5-ecc' },
      { partNumber: 'M321RFAGA0B5', name: '256GB DDR5-4800 ECC LRDIMM', price: 1250, type: 'ddr5-ecc' },
    ],
    storage: [
      { partNumber: 'MZWLO1T9HCJR', name: '1.92TB NVMe U.2 Enterprise SSD', price: 295, formFactor: 'sff-2.5' },
      { partNumber: 'MZWLO3T8HCLS', name: '3.84TB NVMe U.2 Enterprise SSD', price: 520, formFactor: 'sff-2.5' },
      { partNumber: 'MZWLO7T6HBLA', name: '7.68TB NVMe U.2 Enterprise SSD', price: 950, formFactor: 'sff-2.5' },
      { partNumber: 'ST16000NM004J', name: '16TB 7.2K SAS 3.5 in HDD', price: 310, formFactor: 'lff-3.5' },
      { partNumber: 'ST20000NM007D', name: '20TB 7.2K SATA 3.5 in HDD', price: 385, formFactor: 'lff-3.5' },
    ],
    raidControllers: [
      { partNumber: '405-ABDS', name: 'Dell PERC H965i 8GB NV Cache', price: 385, family: 'dell-perc12' },
      { partNumber: 'P48635-B21', name: 'HPE MR416i-a Gen11 4GB Cache', price: 395, family: 'hpe-mr416i' },
      { partNumber: '05-50077-00', name: 'Broadcom MegaRAID 9560-16i 8GB Cache', price: 425, family: 'broadcom-9500' },
      { partNumber: 'HBA-NONE', name: 'No RAID Controller (software RAID / HBA mode)', price: 0, family: 'universal' },
    ],
    networking: [
      { partNumber: '540-BDFQ', name: 'Broadcom 57416 Dual Port 10GbE Base-T OCP 3.0', price: 115 },
      { partNumber: 'E810-XXVDA2', name: 'Intel E810 Dual Port 25GbE SFP28', price: 290 },
      { partNumber: 'E810-CQDA2', name: 'Intel E810 Dual Port 100GbE QSFP28', price: 650 },
      { partNumber: 'MCX713106AS', name: 'NVIDIA ConnectX-7 Dual Port 100GbE QSFP56', price: 895 },
    ],
    powerSupplies: [
      { partNumber: '450-AKLG', name: 'Dell 800W Platinum Hot-Plug PSU', price: 85, compatibleBrands: ['Dell'] },
      { partNumber: '450-AKLT', name: 'Dell 1400W Platinum Hot-Plug PSU', price: 175, compatibleBrands: ['Dell'] },
      { partNumber: 'P44412-B21', name: 'HPE 800W Flex Slot Platinum PSU', price: 95, compatibleBrands: ['HPE'] },
      { partNumber: 'P44413-B21', name: 'HPE 1600W Flex Slot PSU', price: 195, compatibleBrands: ['HPE'] },
      { partNumber: 'PWS-1K28P-SQ', name: 'Supermicro 1200W Platinum Hot-Swap PSU', price: 125, compatibleBrands: ['Supermicro'] },
      { partNumber: '4P57A72765', name: 'Lenovo 1100W Platinum Hot-Swap PSU', price: 135, compatibleBrands: ['Lenovo'] },
    ],
  },
};

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const toArray = <T,>(value: unknown, fallback: T[]): T[] => (Array.isArray(value) && value.length > 0 ? value as T[] : fallback);

const normalizeCatalog = (cmsCatalog: any): Catalog => {
  const cms = cmsCatalog && typeof cmsCatalog === 'object' ? cmsCatalog : {};
  const components = cms.availableComponents || {};

  return {
    title: String(cms.title || DEFAULT_CATALOG.title),
    description: String(cms.description || DEFAULT_CATALOG.description),
    models: toArray<ServerModel>(cms.models, DEFAULT_CATALOG.models),
    availableComponents: {
      processors: toArray<ComponentItem>(components.processors, DEFAULT_CATALOG.availableComponents.processors),
      memory: toArray<ComponentItem>(components.memory, DEFAULT_CATALOG.availableComponents.memory),
      storage: toArray<ComponentItem>(components.storage, DEFAULT_CATALOG.availableComponents.storage),
      raidControllers: toArray<ComponentItem>(components.raidControllers, DEFAULT_CATALOG.availableComponents.raidControllers),
      networking: toArray<ComponentItem>(components.networking, DEFAULT_CATALOG.availableComponents.networking),
      powerSupplies: toArray<ComponentItem>(components.powerSupplies, DEFAULT_CATALOG.availableComponents.powerSupplies),
    },
  };
};

const firstNumber = (value: string, unit: 'GB' | 'TB' | 'W') => {
  const match = value.match(new RegExp(`([0-9]+(?:\\.[0-9]+)?)\\s*${unit}`, 'i'));
  return match ? Number(match[1]) : 0;
};

const getCompatibleItems = (model: ServerModel | undefined, items: ComponentItem[], kind: keyof Catalog['availableComponents']) => {
  if (!model) return [];
  const compatibility = model.compatibility || {};
  const brand = String(model.brand || '').toLowerCase();

  return items.filter((item) => {
    if (kind === 'processors' && compatibility.cpuFamily) return item.family === compatibility.cpuFamily;
    if (kind === 'memory' && compatibility.ramType) return item.type === compatibility.ramType;
    if (kind === 'storage' && compatibility.diskResult) return item.formFactor === compatibility.diskResult;
    if (kind === 'raidControllers' && compatibility.raidFamily) return item.family === compatibility.raidFamily || item.family === 'universal';
    if (kind === 'powerSupplies' && item.compatibleBrands?.length) {
      return item.compatibleBrands.some((compatibleBrand) => compatibleBrand.toLowerCase() === brand);
    }
    return true;
  });
};

const buildQuoteText = (model: ServerModel, config: BuilderConfig, totalPrice: number, metrics: { memoryGb: number; storageTb: number; powerWatts: number }) => [
  `${model.name} custom server configuration`,
  `Estimated build price: ${money(totalPrice)}`,
  '',
  `Base platform: ${model.name}`,
  `Processor: ${model.specs.cpuSockets || 2}x ${config.cpu?.name || 'TBD'} (${config.cpu?.partNumber || 'TBD'})`,
  `Memory: ${config.ram_qty}x ${config.ram?.name || 'TBD'} (${metrics.memoryGb}GB total)`,
  `Storage: ${config.storage_qty}x ${config.storage?.name || 'TBD'} (${metrics.storageTb.toFixed(metrics.storageTb >= 10 ? 0 : 2)}TB raw)`,
  `RAID/HBA: ${config.raid?.name || 'TBD'}`,
  `Networking: ${config.nic?.name || 'TBD'}`,
  `Power: ${config.psu_qty}x ${config.psu?.name || 'TBD'}`,
  `Support: ${config.support}`,
  `Burn-in validation: ${config.burnIn ? 'Yes' : 'No'}`,
].join('\n');

const ConfiguratorPage = () => {
  const { content } = useGlobalContent();
  const { addToCart } = useCart();
  const { openQuoteModal, showToast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  const catalog = useMemo(() => normalizeCatalog(content.serverConfigurator), [content.serverConfigurator]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [configuration, setConfiguration] = useState<BuilderConfig>({
    cpu: null,
    ram: null,
    ram_qty: 4,
    storage: null,
    storage_qty: 4,
    raid: null,
    nic: null,
    psu: null,
    psu_qty: 2,
    support: 'standard',
    burnIn: true,
  });

  const selectedModel = catalog.models.find((model) => model.id === selectedModelId) || catalog.models[0];
  const compatible = useMemo(() => ({
    processors: getCompatibleItems(selectedModel, catalog.availableComponents.processors, 'processors'),
    memory: getCompatibleItems(selectedModel, catalog.availableComponents.memory, 'memory'),
    storage: getCompatibleItems(selectedModel, catalog.availableComponents.storage, 'storage'),
    raidControllers: getCompatibleItems(selectedModel, catalog.availableComponents.raidControllers, 'raidControllers'),
    networking: getCompatibleItems(selectedModel, catalog.availableComponents.networking, 'networking'),
    powerSupplies: getCompatibleItems(selectedModel, catalog.availableComponents.powerSupplies, 'powerSupplies'),
  }), [catalog, selectedModel]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('model');
    const nextModel = catalog.models.find((model) => model.id === fromUrl)?.id || catalog.models[0]?.id || '';
    if (nextModel && nextModel !== selectedModelId) setSelectedModelId(nextModel);
  }, [catalog.models, location.search, selectedModelId]);

  useEffect(() => {
    if (!selectedModel) return;

    setConfiguration((prev) => ({
      ...prev,
      cpu: compatible.processors.find((item) => item.partNumber === prev.cpu?.partNumber) || compatible.processors[0] || null,
      ram: compatible.memory.find((item) => item.partNumber === prev.ram?.partNumber) || compatible.memory[1] || compatible.memory[0] || null,
      storage: compatible.storage.find((item) => item.partNumber === prev.storage?.partNumber) || compatible.storage[0] || null,
      raid: compatible.raidControllers.find((item) => item.partNumber === prev.raid?.partNumber) || compatible.raidControllers[0] || null,
      nic: compatible.networking.find((item) => item.partNumber === prev.nic?.partNumber) || compatible.networking[0] || null,
      psu: compatible.powerSupplies.find((item) => item.partNumber === prev.psu?.partNumber) || compatible.powerSupplies[0] || null,
      ram_qty: Math.min(prev.ram_qty || 4, selectedModel.specs.memorySlots || 32),
      storage_qty: Math.min(prev.storage_qty || 4, selectedModel.specs.maxDriveCount || 24),
      psu_qty: Math.max(prev.psu_qty || 2, 1),
    }));
  }, [selectedModel?.id, compatible.processors, compatible.memory, compatible.storage, compatible.raidControllers, compatible.networking, compatible.powerSupplies]);

  const metrics = useMemo(() => {
    const cpuSockets = selectedModel?.specs.cpuSockets || 2;
    const memoryGb = firstNumber(configuration.ram?.name || '', 'GB') * (configuration.ram_qty || 0);
    const storageTb = firstNumber(configuration.storage?.name || '', 'TB') * (configuration.storage_qty || 0);
    const cpuWatts = firstNumber(configuration.cpu?.name || '', 'W') * cpuSockets;
    const powerWatts = Math.ceil(240 + cpuWatts + ((configuration.ram_qty || 0) * 8) + ((configuration.storage_qty || 0) * 14) + (configuration.nic?.price && configuration.nic.price > 500 ? 45 : 20));
    return { memoryGb, storageTb, powerWatts };
  }, [configuration, selectedModel]);

  const totalPrice = useMemo(() => {
    if (!selectedModel) return 0;
    const cpuSockets = selectedModel.specs.cpuSockets || 2;
    const supportPrice = configuration.support === 'mission-critical' ? 895 : configuration.support === 'advanced' ? 395 : 0;
    const burnInPrice = configuration.burnIn ? 149 : 0;

    return selectedModel.basePrice
      + ((configuration.cpu?.price || 0) * cpuSockets)
      + ((configuration.ram?.price || 0) * (configuration.ram_qty || 0))
      + ((configuration.storage?.price || 0) * (configuration.storage_qty || 0))
      + (configuration.raid?.price || 0)
      + (configuration.nic?.price || 0)
      + ((configuration.psu?.price || 0) * (configuration.psu_qty || 0))
      + supportPrice
      + burnInPrice;
  }, [configuration, selectedModel]);

  const warnings = useMemo(() => {
    if (!selectedModel) return [];
    const list: Array<{ type: 'error' | 'warning'; message: string }> = [];
    const cpuSockets = selectedModel.specs.cpuSockets || 2;
    const maxDrives = selectedModel.specs.maxDriveCount || 24;

    if (!configuration.cpu || !configuration.ram || !configuration.storage || !configuration.psu) {
      list.push({ type: 'error', message: 'Select a CPU, memory kit, storage drive, and power supply to complete the build.' });
    }
    if ((configuration.ram_qty || 0) < cpuSockets) {
      list.push({ type: 'error', message: `Use at least ${cpuSockets} DIMMs so each CPU has memory populated.` });
    }
    if ((configuration.ram_qty || 0) % cpuSockets !== 0) {
      list.push({ type: 'warning', message: 'Memory quantity should be balanced evenly across CPU sockets.' });
    }
    if ((configuration.storage_qty || 0) > maxDrives) {
      list.push({ type: 'error', message: `This chassis supports up to ${maxDrives} front drive bays.` });
    }
    if ((configuration.psu_qty || 0) < 2) {
      list.push({ type: 'warning', message: 'Use dual power supplies for redundant production deployments.' });
    }
    if (metrics.powerWatts > 1200 && /800W/i.test(configuration.psu?.name || '')) {
      list.push({ type: 'warning', message: 'Estimated draw is high. Consider a 1100W, 1400W, or 1600W PSU option.' });
    }

    return list;
  }, [configuration, metrics.powerWatts, selectedModel]);

  const hasBlockingIssue = warnings.some((warning) => warning.type === 'error');
  const quoteText = selectedModel ? buildQuoteText(selectedModel, configuration, totalPrice, metrics) : '';

  const selectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    const params = new URLSearchParams(location.search);
    params.set('model', modelId);
    navigate({ pathname: '/configurator', search: params.toString() }, { replace: false });
  };

  const updateOption = (key: keyof BuilderConfig, item: ComponentItem) => {
    setConfiguration((prev) => ({ ...prev, [key]: item }));
  };

  const updateQuantity = (key: 'ram_qty' | 'storage_qty' | 'psu_qty', qty: number) => {
    setConfiguration((prev) => ({ ...prev, [key]: qty }));
  };

  const handleAddToCart = () => {
    if (!selectedModel || hasBlockingIssue) {
      showToast('Please resolve the build checks before adding this server.', 'error');
      return;
    }

    const sku = `CFG-${selectedModel.id.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    addToCart({
      id: sku,
      name: `${selectedModel.name} - Custom Build`,
      price: totalPrice,
      image: selectedModel.baseImage,
      sku,
      stockStatus: 'IN_STOCK',
      category: 'server-config',
      slug: 'custom-server',
      description: quoteText,
    } as any, 1);
    navigate('/cart');
  };

  const copyBuild = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/configurator?model=${selectedModel.id}\n\n${quoteText}`);
      showToast('Configuration copied to clipboard.', 'success');
    } catch {
      showToast('Could not copy configuration in this browser.', 'error');
    }
  };

  const OptionList = ({
    title,
    icon,
    items,
    configKey,
    qtyKey,
    qtyOptions,
    qtyLabel,
  }: {
    title: string;
    icon: React.ReactNode;
    items: ComponentItem[];
    configKey: 'cpu' | 'ram' | 'storage' | 'raid' | 'nic' | 'psu';
    qtyKey?: 'ram_qty' | 'storage_qty' | 'psu_qty';
    qtyOptions?: number[];
    qtyLabel?: string;
  }) => (
    <section className="border-t border-slate-200 py-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-slate-950 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {qtyKey && qtyOptions ? (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            {qtyLabel || 'Qty'}
            <select
              value={configuration[qtyKey]}
              onChange={(event) => updateQuantity(qtyKey, Number(event.target.value))}
              className="bg-white border border-slate-300 rounded-sm px-2 py-1 text-sm text-slate-950 focus:border-emerald-600"
            >
              {qtyOptions.map((qty) => <option key={qty} value={qty}>{qty}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => {
          const isSelected = configuration[configKey]?.partNumber === item.partNumber;
          return (
            <button
              type="button"
              key={item.partNumber}
              onClick={() => updateOption(configKey, item)}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 border p-3 text-left transition ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-white hover:border-slate-500'}`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300'}`}>
                {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-950">{item.name}</span>
                <span className="block text-xs font-mono text-slate-500">{item.partNumber}</span>
              </span>
              <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{item.price === 0 ? 'Included' : `+${money(item.price)}`}</span>
            </button>
          );
        })}
      </div>
    </section>
  );

  if (!selectedModel) {
    return (
      <div className="min-h-screen bg-white text-slate-950">
        <Header />
        <main className="px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Server builder unavailable</h1>
          <p className="mt-2 text-slate-600">No server platforms are configured yet.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const memoryQtyOptions = [2, 4, 6, 8, 12, 16, 24, 32].filter((qty) => qty <= (selectedModel.specs.memorySlots || 32));
  const storageQtyOptions = [0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24].filter((qty) => qty <= (selectedModel.specs.maxDriveCount || 24));

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-emerald-700 selection:text-white">
      <SEOHead
        title="Enterprise Server Builder | Teraformix"
        description="Configure production-ready Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem, and Supermicro rack servers with compatible CPU, RAM, storage, RAID, networking, and support options."
        canonicalUrl="https://teraformix.com/configurator"
      />
      <Header />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-emerald-700">Validated configuration workspace</p>
            <h1 className="text-3xl font-bold text-slate-950 lg:text-4xl">{catalog.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{catalog.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setConfiguration((prev) => ({ ...prev, burnIn: true, support: 'standard' }))}
            className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:border-emerald-600"
          >
            <RotateCcw className="h-4 w-4" />
            Reset services
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-950">
                <span className="flex h-6 w-6 items-center justify-center bg-emerald-700 text-sm text-white">1</span>
                Select platform
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {catalog.models.map((model) => (
                  <button
                    type="button"
                    key={model.id}
                    onClick={() => selectModel(model.id)}
                    className={`relative border p-4 text-left transition ${selectedModel.id === model.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-white hover:border-slate-500'}`}
                  >
                    <div className="mb-3 flex aspect-[4/3] items-center justify-center bg-slate-50 p-3">
                      <Image src={model.baseImage} alt={model.name} className="h-full w-full object-contain" priority={selectedModel.id === model.id} />
                    </div>
                    <div className="text-sm font-black text-slate-950">{model.name}</div>
                    <div className="mt-1 line-clamp-3 text-xs text-slate-500">{model.description}</div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {[model.specs.formFactor, model.specs.maxRam, model.specs.generation].filter(Boolean).map((badge) => (
                        <span key={badge} className="bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-700">{badge}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs text-slate-500">Base</span>
                      <span className="font-bold text-slate-950">{money(model.basePrice)}</span>
                    </div>
                    {selectedModel.id === model.id ? (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-emerald-700 text-white">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-950">
                <span className="flex h-6 w-6 items-center justify-center bg-emerald-700 text-sm text-white">2</span>
                Configure compatible parts
              </h2>

              <div className="mb-6 grid grid-cols-2 gap-4 border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
                <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Form factor</div><div className="text-sm font-bold text-slate-950">{selectedModel.specs.formFactor}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-slate-500">CPU sockets</div><div className="text-sm font-bold text-slate-950">{selectedModel.specs.cpuSockets || 2}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Max memory</div><div className="text-sm font-bold text-slate-950">{selectedModel.specs.maxRam}</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Drive bays</div><div className="text-sm font-bold text-slate-950">{selectedModel.specs.maxStorage}</div></div>
              </div>

              <OptionList title="Processors" icon={<Cpu className="h-4 w-4 text-slate-600" />} items={compatible.processors} configKey="cpu" />
              <OptionList title="Memory" icon={<Server className="h-4 w-4 text-slate-600" />} items={compatible.memory} configKey="ram" qtyKey="ram_qty" qtyOptions={memoryQtyOptions} qtyLabel="DIMMs" />
              <OptionList title="Storage" icon={<HardDrive className="h-4 w-4 text-slate-600" />} items={compatible.storage} configKey="storage" qtyKey="storage_qty" qtyOptions={storageQtyOptions} qtyLabel="Drives" />
              <OptionList title="RAID / HBA" icon={<Shield className="h-4 w-4 text-slate-600" />} items={compatible.raidControllers} configKey="raid" />
              <OptionList title="Networking" icon={<Network className="h-4 w-4 text-slate-600" />} items={compatible.networking} configKey="nic" />
              <OptionList title="Power supplies" icon={<Zap className="h-4 w-4 text-slate-600" />} items={compatible.powerSupplies} configKey="psu" qtyKey="psu_qty" qtyOptions={[1, 2]} qtyLabel="PSUs" />
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-950">
                <span className="flex h-6 w-6 items-center justify-center bg-emerald-700 text-sm text-white">3</span>
                Deployment services
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  ['standard', 'Standard warranty', '3-year parts coverage included.', 0],
                  ['advanced', 'Advanced support', 'Priority replacement and config review.', 395],
                  ['mission-critical', 'Mission critical', 'Expedited handling for production clusters.', 895],
                ].map(([value, label, description, price]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setConfiguration((prev) => ({ ...prev, support: value as BuilderConfig['support'] }))}
                    className={`border p-4 text-left ${configuration.support === value ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-white hover:border-slate-500'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-slate-950">{label}</div>
                      <div className="text-sm font-bold text-slate-700">{price ? `+${money(Number(price))}` : 'Included'}</div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{description}</div>
                  </button>
                ))}
              </div>
              <label className="mt-4 flex items-start gap-3 border border-slate-300 bg-white p-4">
                <input
                  type="checkbox"
                  checked={configuration.burnIn}
                  onChange={(event) => setConfiguration((prev) => ({ ...prev, burnIn: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  <span className="block font-bold text-slate-950">48-hour burn-in, firmware validation, and asset report (+{money(149)})</span>
                  <span className="mt-1 block text-xs text-slate-500">Recommended for production deploys. Includes BIOS/iDRAC/iLO baseline checks and drive health report.</span>
                </span>
              </label>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-32 space-y-4">
              <section className="overflow-hidden border border-slate-300 bg-white shadow-lg">
                <div className="border-b border-slate-300 bg-slate-50 p-4">
                  <h2 className="text-lg font-bold text-slate-950">Build summary</h2>
                  <div className="mt-1 font-mono text-xs text-slate-500">{selectedModel.id.toUpperCase()}</div>
                </div>
                <div className="space-y-5 p-5">
                  <div>
                    <div className="flex justify-between gap-3 text-sm font-bold text-slate-950">
                      <span>{selectedModel.name}</span>
                      <span>{money(selectedModel.basePrice)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{selectedModel.specs.formFactor} | {selectedModel.specs.maxRam} | {selectedModel.specs.maxStorage}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-slate-200 py-4 text-center">
                    <div><div className="text-lg font-black text-slate-950">{metrics.memoryGb}</div><div className="text-[10px] uppercase text-slate-500">GB RAM</div></div>
                    <div><div className="text-lg font-black text-slate-950">{metrics.storageTb.toFixed(metrics.storageTb >= 10 ? 0 : 1)}</div><div className="text-[10px] uppercase text-slate-500">TB raw</div></div>
                    <div><div className="text-lg font-black text-slate-950">{metrics.powerWatts}</div><div className="text-[10px] uppercase text-slate-500">Est. watts</div></div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {[
                      [`${selectedModel.specs.cpuSockets || 2}x CPU`, configuration.cpu?.name, (configuration.cpu?.price || 0) * (selectedModel.specs.cpuSockets || 2)],
                      [`${configuration.ram_qty}x DIMM`, configuration.ram?.name, (configuration.ram?.price || 0) * configuration.ram_qty],
                      [`${configuration.storage_qty}x drive`, configuration.storage?.name, (configuration.storage?.price || 0) * configuration.storage_qty],
                      ['RAID/HBA', configuration.raid?.name, configuration.raid?.price || 0],
                      ['NIC', configuration.nic?.name, configuration.nic?.price || 0],
                      [`${configuration.psu_qty}x PSU`, configuration.psu?.name, (configuration.psu?.price || 0) * configuration.psu_qty],
                    ].map(([label, name, price]) => (
                      <div key={String(label)} className="grid grid-cols-[90px_1fr_auto] gap-2">
                        <span className="text-slate-500">{label}</span>
                        <span className="truncate text-slate-700">{String(name || 'Not selected')}</span>
                        <span className="font-medium text-slate-800">{money(Number(price || 0))}</span>
                      </div>
                    ))}
                  </div>

                  {warnings.length > 0 ? (
                    <div className="space-y-2">
                      {warnings.map((warning) => (
                        <div key={warning.message} className={`flex items-start gap-2 border p-3 text-xs ${warning.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{warning.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Compatibility checks passed. This build is ready for quote or checkout.</span>
                    </div>
                  )}

                  <div className="border-t border-slate-300 pt-4">
                    <div className="mb-1 flex items-end justify-between gap-3">
                      <span className="text-xs font-bold uppercase text-slate-500">Estimated total</span>
                      <span className="text-3xl font-black text-slate-950">{money(totalPrice)}</span>
                    </div>
                    <div className="mb-5 text-right text-xs font-bold text-emerald-700">Freight quote finalized after validation</div>

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={hasBlockingIssue}
                      className="mb-3 flex w-full items-center justify-center gap-2 bg-emerald-700 px-4 py-4 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => openQuoteModal(quoteText)}
                      className="mb-3 flex w-full items-center justify-center gap-2 border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-900"
                    >
                      Request official quote
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={copyBuild}
                      className="flex w-full items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-900"
                    >
                      <Clipboard className="h-4 w-4" />
                      Copy build
                    </button>
                  </div>
                </div>
              </section>

              <section className="border border-slate-200 bg-white p-4 text-xs text-slate-500">
                <div className="mb-2 flex items-center gap-2 font-bold text-slate-700">
                  <Info className="h-4 w-4" />
                  Production notes
                </div>
                <p>All custom builds are validated by sales engineering before shipment. Pricing is an estimate until live stock and firmware requirements are confirmed.</p>
              </section>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConfiguratorPage;
