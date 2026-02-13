
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { FileText, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { content } = useGlobalContent();
  const { cageCode, dunsNumber } = content.general;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!cart || cart.length === 0) return;
    try {
      const items = cart.map((item) => ({
        item_id: item.sku,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }));
      const g = (window as any).gtag;
      if (typeof g === 'function') {
        g('event', 'view_cart', {
          items,
          value: cartTotal,
          currency: 'USD'
        });
      }
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'view_cart', items, value: cartTotal, currency: 'USD' });
    } catch { }
  }, [cart, cartTotal]);

  const handleDownloadQuote = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors
    const navy = '#0F172A';
    const actionColor = '#15803D';
    const gray = '#64748B';
    const lightGray = '#F8FAFC';

    // --- Header Background ---
    doc.setFillColor(navy);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // --- Company Title / Logo ---
    doc.setFontSize(18);
    doc.setTextColor('#FFFFFF');
    doc.setFont("helvetica", "bold");
    doc.text(content.settings.logoText || "TERAFORMIX", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Enterprise Hardware Reseller", 14, 26);

    // --- "OFFICIAL QUOTE" Badge ---
    doc.setFontSize(24);
    doc.setTextColor('#FFFFFF');
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL QUOTE", pageWidth - 14, 25, { align: "right" });

    // --- Quote Meta Info (Right Side) ---
    const startY = 55;
    const quoteNum = `QTE-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(10);
    doc.setTextColor(navy);
    doc.text(`Reference #: ${quoteNum}`, pageWidth - 14, 50, { align: "right" });
    doc.text(`Date: ${today}`, pageWidth - 14, 55, { align: "right" });
    doc.text(`Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, pageWidth - 14, 60, { align: "right" });

    // --- Company Info (Left Side) ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("From:", 14, 50);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(gray);
    const addressLines = doc.splitTextToSize(content.general.address || "100 Tech Plaza, Austin, TX 78701", 80);
    doc.text(addressLines, 14, 55);

    let currentY = 55 + (addressLines.length * 5);
    doc.text(`Phone: ${content.general.phone}`, 14, currentY);
    doc.text(`Email: ${content.general.email}`, 14, currentY + 5);
    doc.text(`Web: teraformix.com`, 14, currentY + 10);

    // --- Table ---
    const tableBody = cart.map((item, index) => [
      index + 1,
      `${item.name}\nMPN: ${item.sku}`,
      item.quantity,
      `$${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY + 20,
      head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
      body: tableBody,
      styles: { fontSize: 9, cellPadding: 4, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: navy, textColor: '#ffffff', fontStyle: 'bold', halign: 'left' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: { fillColor: lightGray },
      foot: [
        ['', '', '', 'Subtotal:', `$${cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['', '', '', 'Shipping:', 'Calculated at Checkout'],
        ['', '', '', 'Total:', `$${cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
      ],
      footStyles: { fillColor: '#ffffff', textColor: navy, fontStyle: 'bold', halign: 'right', fontSize: 11 },
      theme: 'grid'
    });

    // --- Footer Certifications & Terms ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 15;

    // Certs Strip
    doc.setFillColor(lightGray);
    doc.roundedRect(14, finalY, pageWidth - 28, 20, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(navy);
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Reseller & Compliance", 18, finalY + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.text(`ISO 9001:2015 Quality Management | ISO 27001 Information Security | TAA Compliant | CAGE: ${cageCode} | DUNS: ${dunsNumber}`, 18, finalY + 14);

    // Terms
    const termsY = finalY + 30;
    doc.setFontSize(8);
    doc.setTextColor('#94a3b8');
    const terms = [
      "Terms & Conditions:",
      "1. This quote is valid for 30 days from the date of issuance.",
      "2. Prices are subject to change based on global component availability.",
      "3. Standard 3-Year Warranty included on all enterprise hardware unless otherwise noted.",
      "4. Returns accepted within 30 days (restocking fees may apply for opened items)."
    ];

    terms.forEach((term, i) => {
      doc.text(term, 14, termsY + (i * 4));
    });

    doc.save(`Teraformix_Quote_${quoteNum}.pdf`);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 mb-2">Your Cart is Empty</h1>
          <p className="text-gray-500 mb-8 max-w-md">Looks like you haven't added any enterprise hardware to your quote yet.</p>
          <Link to="/category" className="bg-action-600 hover:bg-action-500 text-white px-6 py-3 rounded font-bold transition">
            Browse Inventory
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-10 flex-grow">
        <h1 className="text-3xl font-bold text-navy-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cart Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-16 w-16 flex-shrink-0 border border-gray-200 rounded overflow-hidden bg-white flex items-center justify-center">
                            <img className="h-full w-full object-contain" src={item.image} alt={item.name} />
                          </div>
                          <div className="ml-4">
                            <Link to={`/product/${item.sku}`} className="text-sm font-medium text-navy-900 hover:text-action-600 transition line-clamp-1">
                              {item.name}
                            </Link>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">MPN: {item.sku}</div>
                            <div className="text-xs text-gray-500 mt-1">Unit Price: ${item.price.toLocaleString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max={typeof item.stockLevel === 'number' && item.stockLevel > 0 ? item.stockLevel : 999}
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              const maxStock = typeof item.stockLevel === 'number' && item.stockLevel > 0 ? item.stockLevel : 999;
                              updateQuantity(item.id, Math.min(newQty, maxStock));
                            }}
                            className="w-16 border border-gray-300 rounded text-center text-sm py-1 bg-white text-navy-900 focus:ring-2 focus:ring-navy-900 outline-none"
                          />
                          {typeof item.stockLevel === 'number' && item.stockLevel > 0 && (
                            <span className="text-xs text-gray-500">Max: {item.stockLevel}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-navy-900">
                        ${(item.price * item.quantity).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            try {
                              const g = (window as any).gtag;
                              const payload = { items: [{ item_id: item.sku, item_name: item.name, price: item.price, quantity: item.quantity }] } as any;
                              if (typeof g === 'function') { g('event', 'remove_from_cart', payload); }
                              (window as any).dataLayer = (window as any).dataLayer || [];
                              (window as any).dataLayer.push({ event: 'remove_from_cart', ...payload });
                            } catch { }
                            removeFromCart(item.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link to="/category" className="text-navy-700 font-medium hover:text-navy-900 flex items-center gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
              </Link>
              <button
                onClick={handleDownloadQuote}
                className="flex items-center gap-2 text-sm bg-white border border-gray-300 px-5 py-2.5 rounded shadow-sm hover:bg-gray-50 text-navy-900 font-bold transition w-full sm:w-auto justify-center"
              >
                <FileText className="w-4 h-4 text-red-600" /> Download Official Quote (PDF)
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-navy-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-navy-900">${cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Estimate</span>
                  <span className="text-gray-500 italic">Calculated at checkout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-500 italic">--</span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold text-navy-900 mb-6">
                <span>Total</span>
                <span>${cartTotal.toLocaleString()}</span>
              </div>
              <Link
                to="/checkout"
                className="block w-full text-center bg-action-600 hover:bg-action-500 text-white font-bold py-3 rounded shadow-sm transition"
              >
                Proceed to Checkout
              </Link>
              <div className="mt-4 text-center">
                <span className="text-xs text-gray-500">Secure checkout via SSL</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
