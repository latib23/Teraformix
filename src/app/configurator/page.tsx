
import React, { useState, useEffect } from "react";
import { useGlobalContent } from "../../contexts/GlobalContent";
import SEOHead from "../../components/SEO/SEOHead";
import { ChevronRight, Server, Check, ShoppingCart, Info, RotateCcw } from "lucide-react";
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
                // Default to first if no valid param and no current selection (initial load)
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

        if (configuration.cpu) total += (configuration.cpu.price || 0) * (selectedModel.specs.cpuSockets || 2); // Assume dual socket fill for simplicity or make configurable
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

        // Construct a composite product object
        // In a real app, this might need a specific backend endpoint to handle BOMs
        // For now, we utilize the Quote/Cart system by adding a "Custom Server" item
        const description = `
      ${selectedModel.name} Config:
      2x ${configuration.cpu?.name}
      ${configuration.ram_qty}x ${configuration.ram?.name}
      ${configuration.storage_qty}x ${configuration.storage?.name}
      RAID: ${configuration.raid?.name}
      NIC: ${configuration.nic?.name}
      PSU: ${configuration.psu_qty}x ${configuration.psu?.name}
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

    if (!serverData.models.length) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4 text-center">
                <h2 className="text-2xl font-bold text-navy-900">Configurator Loading...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-navy-900 selection:bg-action-500 selection:text-white">
            <SEOHead
                title="Server Configurator | Build Your Own | Teraformix"
                description="Customize Dell PowerEdge, HPE ProLiant, and Cisco UCS servers. Select processors, memory, and storage to meet your exact specifications."
                canonicalUrl="https://teraformix.com/configurator"
            />

            {/* Header Spacer */}
            <div className="h-20 bg-navy-900"></div>

            <div className="container mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-navy-950 mb-2">{serverData.title}</h1>
                    <p className="text-lg text-gray-600">{serverData.description}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Configurator Area */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. Model Selection */}
                        <section className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="bg-navy-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                Select Platform
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {serverData.models.map((model: any) => (
                                    <button
                                        key={model.id}
                                        onClick={() => navigate(`?model=${model.id}`)}
                                        className={`relative p-4 rounded-sm border-2 transition-all text-left group
                      ${selectedModelId === model.id ? 'border-action-500 bg-action-50' : 'border-gray-200 hover:border-action-300 bg-white'}
                    `}
                                    >
                                        <div className="aspect-[4/3] mb-4 bg-gray-100 rounded-sm p-4 flex items-center justify-center">
                                            <Image src={model.baseImage} alt={model.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="font-bold text-sm text-navy-900 mb-1">{model.name}</div>
                                        <div className="text-xs text-gray-500 line-clamp-2">{model.description}</div>
                                        {selectedModelId === model.id && (
                                            <div className="absolute top-2 right-2 text-action-500"><Check className="w-5 h-5" /></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 2. Components */}
                        {selectedModel && (
                            <section className="bg-white rounded-sm shadow-sm border border-gray-200 p-6 animate-fadeIn">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <span className="bg-navy-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                    Customize Specifications
                                </h2>

                                {/* CPU */}
                                <div className="mb-8 border-b border-gray-100 pb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="font-bold text-navy-800 flex items-center gap-2">
                                            <Info className="w-4 h-4 text-gray-400" /> Processors (Dual Socket)
                                        </label>
                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">2x Included</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {serverData.availableComponents.processors.map((cpu: any) => (
                                            <label key={cpu.partNumber} className={`flex items-center justify-between p-3 border rounded-sm cursor-pointer hover:bg-gray-50 transition-colors ${configuration.cpu?.partNumber === cpu.partNumber ? 'border-action-500 bg-action-50 ring-1 ring-action-500' : 'border-gray-200'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="cpu"
                                                        checked={configuration.cpu?.partNumber === cpu.partNumber}
                                                        onChange={() => handleOptionChange('cpu', cpu)}
                                                        className="text-action-600 focus:ring-action-500"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-sm text-navy-900">{cpu.name}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{cpu.partNumber}</div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-navy-700">+${cpu.price.toLocaleString()} ea.</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* RAM */}
                                <div className="mb-8 border-b border-gray-100 pb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="font-bold text-navy-800 flex items-center gap-2">
                                            <Server className="w-4 h-4 text-gray-400" /> Memory (RAM)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Qty:</span>
                                            <select
                                                value={configuration.ram_qty}
                                                onChange={(e) => handleQtyChange('ram', parseInt(e.target.value))}
                                                className="text-sm border-gray-300 rounded-sm focus:ring-action-500 focus:border-action-500 py-1"
                                            >
                                                {[2, 4, 6, 8, 12, 16, 24].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {serverData.availableComponents.memory.map((mem: any) => (
                                            <label key={mem.partNumber} className={`flex items-center justify-between p-3 border rounded-sm cursor-pointer hover:bg-gray-50 transition-colors ${configuration.ram?.partNumber === mem.partNumber ? 'border-action-500 bg-action-50 ring-1 ring-action-500' : 'border-gray-200'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="ram"
                                                        checked={configuration.ram?.partNumber === mem.partNumber}
                                                        onChange={() => handleOptionChange('ram', mem)}
                                                        className="text-action-600 focus:ring-action-500"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-sm text-navy-900">{mem.name}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{mem.partNumber}</div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-navy-700">+${mem.price.toLocaleString()} ea.</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Storage */}
                                <div className="mb-8 border-b border-gray-100 pb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="font-bold text-navy-800 flex items-center gap-2">
                                            <Server className="w-4 h-4 text-gray-400" /> Storage Drives
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Qty:</span>
                                            <select
                                                value={configuration.storage_qty}
                                                onChange={(e) => handleQtyChange('storage', parseInt(e.target.value))}
                                                className="text-sm border-gray-300 rounded-sm focus:ring-action-500 focus:border-action-500 py-1"
                                            >
                                                {[0, 1, 2, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {serverData.availableComponents.storage.map((drive: any) => (
                                            <label key={drive.partNumber} className={`flex items-center justify-between p-3 border rounded-sm cursor-pointer hover:bg-gray-50 transition-colors ${configuration.storage?.partNumber === drive.partNumber ? 'border-action-500 bg-action-50 ring-1 ring-action-500' : 'border-gray-200'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="storage"
                                                        checked={configuration.storage?.partNumber === drive.partNumber}
                                                        onChange={() => handleOptionChange('storage', drive)}
                                                        className="text-action-600 focus:ring-action-500"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-sm text-navy-900">{drive.name}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{drive.partNumber}</div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-navy-700">+${drive.price.toLocaleString()} ea.</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* RAID Controller */}
                                <div className="mb-8 border-b border-gray-100 pb-8">
                                    <h3 className="font-bold text-navy-800 mb-4">RAID Controller</h3>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-sm focus:ring-action-500 focus:border-action-500"
                                        onChange={(e) => {
                                            const item = serverData.availableComponents.raidControllers.find((r: any) => r.partNumber === e.target.value);
                                            handleOptionChange('raid', item);
                                        }}
                                        value={configuration.raid?.partNumber || ''}
                                    >
                                        {serverData.availableComponents.raidControllers.map((raid: any) => (
                                            <option key={raid.partNumber} value={raid.partNumber}>
                                                {raid.name} (+${raid.price})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Network Card */}
                                <div className="mb-8">
                                    <h3 className="font-bold text-navy-800 mb-4">Network Daughter Card / Adapter</h3>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-sm focus:ring-action-500 focus:border-action-500"
                                        onChange={(e) => {
                                            const item = serverData.availableComponents.networking.find((n: any) => n.partNumber === e.target.value);
                                            handleOptionChange('nic', item);
                                        }}
                                        value={configuration.nic?.partNumber || ''}
                                    >
                                        {serverData.availableComponents.networking.map((nic: any) => (
                                            <option key={nic.partNumber} value={nic.partNumber}>
                                                {nic.name} (+${nic.price})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                            </section>
                        )}

                    </div>

                    {/* Sidebar: Summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-white rounded-sm shadow-xl border border-gray-200 overflow-hidden">
                                <div className="bg-navy-950 p-4 text-white">
                                    <h3 className="font-bold text-lg">Configuration Summary</h3>
                                    <div className="text-xs opacity-70 font-mono mt-1">
                                        {selectedModel?.id.toUpperCase()}
                                    </div>
                                </div>

                                {selectedModel && (
                                    <div className="p-6 space-y-4">
                                        <div className="text-sm border-b border-gray-100 pb-4">
                                            <div className="flex justify-between font-bold text-navy-900 mb-1">
                                                <span>Base Platform</span>
                                                <span>${selectedModel.basePrice.toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">{selectedModel.name}</div>
                                        </div>

                                        {/* Line Items */}
                                        <div className="space-y-3 text-sm">
                                            {configuration.cpu && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">2x {configuration.cpu.name.replace(/Intel Xeon/g, '').replace(/\(.*\)/g, '').trim()}</span>
                                                    <span className="font-medium text-navy-800">${(configuration.cpu.price * 2).toLocaleString()}</span>
                                                </div>
                                            )}

                                            {configuration.ram && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{configuration.ram_qty}x {configuration.ram.name.replace(/DDR4.*ECC/g, 'RAM')}</span>
                                                    <span className="font-medium text-navy-800">${(configuration.ram.price * configuration.ram_qty).toLocaleString()}</span>
                                                </div>
                                            )}

                                            {configuration.storage && configuration.storage_qty > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{configuration.storage_qty}x {configuration.storage.name.replace(/\(.*\)/g, '').trim()}</span>
                                                    <span className="font-medium text-navy-800">${(configuration.storage.price * configuration.storage_qty).toLocaleString()}</span>
                                                </div>
                                            )}

                                            {configuration.raid && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{configuration.raid.name.split(' ').slice(0, 3).join(' ')}...</span>
                                                    <span className="font-medium text-navy-800">${configuration.raid.price.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-200 pt-4 mt-4">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-gray-500 font-bold uppercase text-xs">Total Price</span>
                                                <span className="text-3xl font-black text-navy-900">${totalPrice.toLocaleString()}</span>
                                            </div>
                                            <div className="text-right text-xs text-green-600 font-bold mb-6">Free Shipping Included</div>

                                            <button
                                                onClick={handleAddToCart}
                                                className="w-full py-4 bg-action-500 hover:bg-action-600 text-white font-bold rounded-sm shadow-md transition-all flex items-center justify-center gap-2 mb-3"
                                            >
                                                <ShoppingCart className="w-5 h-5" /> ADD TO CART
                                            </button>

                                            <button
                                                onClick={() => openQuoteModal(`${selectedModel.name} Custom Config`)}
                                                className="w-full py-3 bg-white border border-navy-200 hover:border-navy-400 text-navy-900 font-bold rounded-sm transition-all text-sm"
                                            >
                                                REQUEST OFFICIAL QUOTE
                                            </button>
                                        </div>

                                        <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 flex items-start gap-2">
                                            <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" />
                                            <div>
                                                <strong>Standard 3-Year Warranty</strong> included with this configuration. Logic boards, drives, and power supplies covered.
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-sm border border-gray-200 text-xs text-center text-gray-400">
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
