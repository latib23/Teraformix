
import React, { useState, useEffect } from "react";
import { useGlobalContent } from "../../contexts/GlobalContent";
import SEOHead from "../../components/SEO/SEOHead";
import { ChevronRight, Server, Check, ShoppingCart, Info, RotateCcw, Cpu, HardDrive, Network, Zap, Shield } from "lucide-react";
import Image from "../../components/Image";
import { useCart } from "../../contexts/CartContext";
import { useUI } from "../../contexts/UIContext";
import { useNavigate, useLocation } from "react-router-dom";

const ConfiguratorPage = () => {
    const { content } = useGlobalContent();
    const { addToCart } = useCart();
    const { openQuoteModal } = useUI();
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
    const [configuration, setConfiguration] = useState<Record<string, any>>({});
    const [totalPrice, setTotalPrice] = useState<number>(0);

    // Initialize data from CMS (with fallback)
    const serverData = content.serverConfigurator || {
        title: "Server Configurator",
        description: "Custom build your enterprise server.",
        models: [],
        availableComponents: {
            processors: [], memory: [], storage: [], raidControllers: [], networking: [], powerSupplies: []
        }
    };

    const selectedModel = serverData.models.find(m => m.id === selectedModelId);

    // Auto-select model from URL or default to first
    useEffect(() => {
        if (serverData.models.length > 0) {
            const params = new URLSearchParams(location.search);
            const modelParam = params.get('model');

            if (modelParam && serverData.models.find(m => m.id === modelParam)) {
                if (selectedModelId !== modelParam) setSelectedModelId(modelParam);
            } else if (!selectedModelId) {
                setSelectedModelId(serverData.models[0].id);
            }
        }
    }, [serverData.models, location.search]);

    // Reset configuration when model changes
    useEffect(() => {
        if (selectedModel) {
            setConfiguration({
                cpu: serverData.availableComponents.processors[0] || null,
                ram_qty: 2,
                ram: serverData.availableComponents.memory[0] || null,
                storage_qty: 2,
                storage: serverData.availableComponents.storage[0] || null,
                raid: serverData.availableComponents.raidControllers[0] || null,
                nic: serverData.availableComponents.networking[0] || null,
                psu_qty: 2,
                psu: serverData.availableComponents.powerSupplies[0] || null,
            });
        }
    }, [selectedModel, serverData.availableComponents]);

    // Calculate Total Price
    useEffect(() => {
        if (!selectedModel) return;
        let total = selectedModel.basePrice || 0;

        if (configuration.cpu) total += (configuration.cpu.price || 0) * (selectedModel.specs.cpuSockets || 2);
        if (configuration.ram && configuration.ram_qty) total += (configuration.ram.price || 0) * configuration.ram_qty;
        if (configuration.storage && configuration.storage_qty) total += (configuration.storage.price || 0) * configuration.storage_qty;
        if (configuration.raid) total += (configuration.raid.price || 0);
        if (configuration.nic) total += (configuration.nic.price || 0);
        if (configuration.psu && configuration.psu_qty) total += (configuration.psu.price || 0) * configuration.psu_qty;

        setTotalPrice(total);
    }, [configuration, selectedModel]);


    const handleOptionChange = (category: string, item: any) => {
        setConfiguration(prev => ({ ...prev, [category]: item }));
    };

    const handleQtyChange = (category: string, qty: number) => {
        setConfiguration(prev => ({ ...prev, [`${category}_qty`]: qty }));
    };

    const handleAddToCart = () => {
        if (!selectedModel) return;

        const description = `
      ${selectedModel.name} Config:
      ${selectedModel.specs.cpuSockets || 2}x ${configuration.cpu?.name || 'N/A'}
      ${configuration.ram_qty}x ${configuration.ram?.name || 'N/A'}
      ${configuration.storage_qty}x ${configuration.storage?.name || 'N/A'}
      RAID: ${configuration.raid?.name || 'None'}
      NIC: ${configuration.nic?.name || 'None'}
      PSU: ${configuration.psu_qty}x ${configuration.psu?.name || 'N/A'}
    `;

        addToCart({
            id: `custom-${Date.now()}`,
            name: `${selectedModel.name} (Custom Build)`,
            price: totalPrice,
            image: selectedModel.baseImage,
            sku: `CFG-${selectedModel.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
            stockStatus: 'IN_STOCK',
            category: 'server-config',
            slug: 'custom-server',
            description: description
        } as any, 1);

        navigate('/cart');
    };

    // Component Section Renderer
    const renderRadioSection = (
        label: string,
        icon: React.ReactNode,
        sectionNum: number,
        items: any[],
        configKey: string,
        qtyKey?: string,
        qtyOptions?: number[],
        qtyLabel?: string
    ) => (
        <div className="mb-8 border-b border-gray-100 pb-8 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-center mb-4">
                <label className="font-bold text-navy-800 flex items-center gap-2">
                    {icon} {label}
                </label>
                {qtyKey && qtyOptions && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{qtyLabel || 'Qty'}:</span>
                        <select
                            value={configuration[qtyKey] || 0}
                            onChange={(e) => handleQtyChange(qtyKey.replace('_qty', ''), parseInt(e.target.value))}
                            className="text-sm border-gray-300 rounded-sm focus:ring-action-500 focus:border-action-500 py-1 pr-8"
                        >
                            {qtyOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                )}
                {!qtyKey && configKey === 'cpu' && selectedModel && (
                    <span className="text-xs font-mono text-gray-400 bg-navy-800 px-2 py-1 rounded border border-navy-700">
                        {selectedModel.specs.cpuSockets || 2}x Included
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 gap-2">
                {items.map((item: any) => (
                    <label
                        key={item.partNumber}
                        className={`flex items-center justify-between p-3 border rounded-sm cursor-pointer hover:bg-navy-800 transition-colors ${configuration[configKey]?.partNumber === item.partNumber
                            ? 'border-action-500 bg-action-500/10 ring-1 ring-action-500'
                            : 'border-navy-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="radio"
                                name={configKey}
                                checked={configuration[configKey]?.partNumber === item.partNumber}
                                onChange={() => handleOptionChange(configKey, item)}
                                className="text-action-500 focus:ring-action-500 bg-navy-800 border-navy-600"
                            />
                            <div>
                                <div className="font-bold text-sm text-white">{item.name}</div>
                                <div className="text-xs text-gray-500 font-mono">{item.partNumber}</div>
                            </div>
                        </div>
                        <div className="text-sm font-bold text-gray-300 whitespace-nowrap">
                            {item.price === 0 ? 'Included' : `+$${item.price.toLocaleString()} ea.`}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );

    // Dropdown Section Renderer
    const renderDropdownSection = (
        label: string,
        items: any[],
        configKey: string
    ) => (
        <div className="mb-8 border-b border-navy-800 pb-8 last:border-0 last:pb-0 last:mb-0">
            <h3 className="font-bold text-gray-200 mb-4">{label}</h3>
            <select
                className="w-full p-3 border border-navy-700 rounded-sm focus:ring-action-500 focus:border-action-500 bg-navy-800 text-white"
                onChange={(e) => {
                    const item = items.find((r: any) => r.partNumber === e.target.value);
                    handleOptionChange(configKey, item);
                }}
                value={configuration[configKey]?.partNumber || ''}
            >
                {items.map((item: any) => (
                    <option key={item.partNumber} value={item.partNumber}>
                        {item.name} {item.price === 0 ? '(Included)' : `(+$${item.price.toLocaleString()})`}
                    </option>
                ))}
            </select>
        </div>
    );

    if (!serverData.models.length) {
        return (
            <div className="min-h-screen bg-navy-950 pt-32 pb-20 px-4 text-center">
                <h2 className="text-2xl font-bold text-white">Configurator Loading...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy-950 font-sans text-gray-200 selection:bg-action-500 selection:text-white">
            <SEOHead
                title="Server Configurator | Build Your Own | Teraformix"
                description="Customize Dell PowerEdge R760, HPE ProLiant DL380a Gen11, Supermicro, and Lenovo servers. Select 4th Gen Intel Xeon processors, DDR5 memory, and NVMe storage."
                canonicalUrl="https://teraformix.com/configurator"
            />

            {/* Header Spacer */}
            <div className="h-20 bg-navy-900"></div>

            <div className="container mx-auto px-4 py-12">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-10 h-[1px] bg-action-500"></span>
                        <span className="text-action-500 font-mono text-xs tracking-widest uppercase">Build & Deploy</span>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">{serverData.title}</h1>
                    <p className="text-lg text-gray-400 max-w-2xl">{serverData.description}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Configurator Area */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. Model Selection */}
                        <section className="bg-navy-900 rounded-sm border border-navy-800 p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                <span className="bg-action-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                Select Platform
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {serverData.models.map((model: any) => (
                                    <button
                                        key={model.id}
                                        onClick={() => navigate(`?model=${model.id}`)}
                                        className={`relative p-4 rounded-sm border-2 transition-all text-left group
                      ${selectedModelId === model.id ? 'border-action-500 bg-action-500/10 shadow-md' : 'border-navy-700 hover:border-action-500/50 bg-navy-800 hover:shadow-sm'}
                    `}
                                    >
                                        <div className="aspect-[4/3] mb-3 bg-navy-700 rounded-sm p-3 flex items-center justify-center">
                                            <Image src={model.baseImage} alt={model.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="font-bold text-sm text-white mb-1 leading-tight">{model.name}</div>
                                        <div className="text-[11px] text-gray-500 line-clamp-2 mb-3">{model.description}</div>

                                        {/* Spec Badges */}
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-[10px] bg-navy-700 text-gray-300 px-1.5 py-0.5 rounded font-mono">{model.specs.formFactor}</span>
                                            <span className="text-[10px] bg-navy-600 text-gray-200 px-1.5 py-0.5 rounded font-mono">{model.specs.maxRam}</span>
                                            {model.specs.generation && (
                                                <span className="text-[10px] bg-action-500/20 text-action-400 px-1.5 py-0.5 rounded font-mono">{model.specs.generation}</span>
                                            )}
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-navy-700 flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">From</span>
                                            <span className="font-bold text-white">${model.basePrice.toLocaleString()}</span>
                                        </div>

                                        {selectedModelId === model.id && (
                                            <div className="absolute top-2 right-2 bg-action-500 text-white rounded-full p-0.5">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 2. Components */}
                        {selectedModel && (
                            <section className="bg-navy-900 rounded-sm border border-navy-800 p-6 animate-fadeIn">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                    <span className="bg-action-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                    Customize Specifications
                                </h2>

                                {/* Platform Specs Banner */}
                                <div className="bg-navy-950 rounded-sm p-4 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Form Factor</div>
                                        <div className="text-sm font-bold text-white">{selectedModel.specs.formFactor}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Max Memory</div>
                                        <div className="text-sm font-bold text-white">{selectedModel.specs.maxRam}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Drive Bays</div>
                                        <div className="text-sm font-bold text-white">{selectedModel.specs.maxStorage}</div>
                                    </div>
                                    {selectedModel.specs.pciSlots && (
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">PCIe Slots</div>
                                            <div className="text-sm font-bold text-white">{selectedModel.specs.pciSlots}</div>
                                        </div>
                                    )}
                                </div>

                                {/* CPU */}
                                {renderRadioSection(
                                    `Processors (${selectedModel.specs.cpuSockets || 2}-Socket)`,
                                    <Cpu className="w-4 h-4 text-gray-400" />,
                                    1,
                                    serverData.availableComponents.processors,
                                    'cpu'
                                )}

                                {/* RAM */}
                                {renderRadioSection(
                                    'Memory (DDR5 ECC)',
                                    <Server className="w-4 h-4 text-gray-400" />,
                                    2,
                                    serverData.availableComponents.memory,
                                    'ram',
                                    'ram_qty',
                                    [2, 4, 6, 8, 12, 16, 24, 32],
                                    'DIMMs'
                                )}

                                {/* Storage */}
                                {renderRadioSection(
                                    'Storage Drives',
                                    <HardDrive className="w-4 h-4 text-gray-400" />,
                                    3,
                                    serverData.availableComponents.storage,
                                    'storage',
                                    'storage_qty',
                                    [0, 1, 2, 4, 6, 8, 10, 12, 16, 24],
                                    'Drives'
                                )}

                                {/* RAID Controller */}
                                {renderDropdownSection(
                                    'RAID Controller',
                                    serverData.availableComponents.raidControllers,
                                    'raid'
                                )}

                                {/* Network Card */}
                                {renderDropdownSection(
                                    'Network Daughter Card / Adapter',
                                    serverData.availableComponents.networking,
                                    'nic'
                                )}

                                {/* Power Supply */}
                                {renderRadioSection(
                                    'Power Supply',
                                    <Zap className="w-4 h-4 text-gray-400" />,
                                    4,
                                    serverData.availableComponents.powerSupplies,
                                    'psu',
                                    'psu_qty',
                                    [1, 2],
                                    'PSUs'
                                )}

                            </section>
                        )}

                    </div>

                    {/* Sidebar: Summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-navy-900 rounded-sm border border-navy-800 overflow-hidden">
                                <div className="bg-navy-800 p-4 text-white border-b border-navy-700">
                                    <h3 className="font-bold text-lg">Configuration Summary</h3>
                                    <div className="text-xs opacity-70 font-mono mt-1">
                                        {selectedModel?.id.toUpperCase()}
                                    </div>
                                </div>

                                {selectedModel && (
                                    <div className="p-6 space-y-4">
                                        <div className="text-sm border-b border-navy-800 pb-4">
                                            <div className="flex justify-between font-bold text-white mb-1">
                                                <span>Base Platform</span>
                                                <span>${selectedModel.basePrice.toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">{selectedModel.name}</div>
                                            <div className="text-[10px] text-gray-600 mt-1">{selectedModel.specs.formFactor} • {selectedModel.specs.maxRam} • {selectedModel.specs.maxStorage}</div>
                                        </div>

                                        {/* Line Items */}
                                        <div className="space-y-3 text-sm">
                                            {configuration.cpu && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">{selectedModel.specs.cpuSockets || 2}x {configuration.cpu.name.replace(/Intel Xeon/g, '').replace(/\(.*\)/g, '').trim()}</span>
                                                    <span className="font-medium text-gray-200">${(configuration.cpu.price * (selectedModel.specs.cpuSockets || 2)).toLocaleString()}</span>
                                                </div>
                                            )}

                                            {configuration.ram && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">{configuration.ram_qty}x {configuration.ram.name.replace(/DDR5.*ECC/g, 'RAM').replace(/\(.*\)/g, '').trim()}</span>
                                                    <span className="font-medium text-gray-200">${(configuration.ram.price * configuration.ram_qty).toLocaleString()}</span>
                                                </div>
                                            )}

                                            {configuration.storage && configuration.storage_qty > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">{configuration.storage_qty}x {configuration.storage.name.replace(/\(.*\)/g, '').trim().slice(0, 30)}...</span>
                                                    <span className="font-medium text-gray-200">${(configuration.storage.price * configuration.storage_qty).toLocaleString()}</span>
                                                </div>
                                            )}

                                            {configuration.raid && configuration.raid.price > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">{configuration.raid.name.split(' ').slice(0, 3).join(' ')}...</span>
                                                    <span className="font-medium text-gray-200">${configuration.raid.price.toLocaleString()}</span>
                                                </div>
                                            )}

                                            {configuration.nic && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">{configuration.nic.name.split(' ').slice(0, 3).join(' ')}...</span>
                                                    <span className="font-medium text-gray-200">${configuration.nic.price.toLocaleString()}</span>
                                                </div>
                                            )}

                                            {configuration.psu && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">{configuration.psu_qty}x {configuration.psu.name.split(' ').slice(0, 3).join(' ')}...</span>
                                                    <span className="font-medium text-gray-200">${(configuration.psu.price * (configuration.psu_qty || 1)).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-navy-700 pt-4 mt-4">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-gray-500 font-bold uppercase text-xs">Total Price</span>
                                                <span className="text-3xl font-black text-white">${totalPrice.toLocaleString()}</span>
                                            </div>
                                            <div className="text-right text-xs text-action-400 font-bold mb-6">Free Shipping Included</div>

                                            <button
                                                onClick={handleAddToCart}
                                                className="w-full py-4 bg-action-500 hover:bg-action-600 text-white font-bold rounded-sm shadow-md transition-all flex items-center justify-center gap-2 mb-3"
                                            >
                                                <ShoppingCart className="w-5 h-5" /> ADD TO CART
                                            </button>

                                            <button
                                                onClick={() => openQuoteModal(`${selectedModel.name} Custom Config`)}
                                                className="w-full py-3 bg-navy-800 border border-navy-700 hover:border-gray-500 text-gray-200 font-bold rounded-sm transition-all text-sm"
                                            >
                                                REQUEST OFFICIAL QUOTE
                                            </button>
                                        </div>

                                        <div className="bg-action-500/10 border border-action-500/20 p-3 rounded text-xs text-gray-300 flex items-start gap-2">
                                            <Shield className="w-4 h-4 shrink-0 mt-0.5 text-action-500" />
                                            <div>
                                                <strong className="text-white">Standard 3-Year Warranty</strong> included with this configuration. Logic boards, drives, and power supplies covered.
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>

                            <div className="bg-navy-900 p-4 rounded-sm border border-navy-800 text-xs text-center text-gray-500">
                                Part availability subject to change. <br />
                                Prices update daily based on market authorized distributors.
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ConfiguratorPage;
