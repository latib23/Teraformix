
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Check, Printer, ArrowRight, Mail, Phone, Copy, Download, FileText, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGlobalContent } from '../../contexts/GlobalContent';

const ThankYouPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { content } = useGlobalContent();
  const supportPhone = content.general.phone || '1-800-555-0199';
  const supportTelHref = 'tel:' + supportPhone.replace(/[^0-9+]/g, '');
  
  // Robust data retrieval: State > URL Param > Default
  const state = location.state || {};
  const searchParams = new URLSearchParams(location.search);
  
  const orderNumber = state.orderNumber || searchParams.get('order');
  const quoteNumber = state.quoteNumber || searchParams.get('quote');
  
  const referenceNumber = orderNumber || quoteNumber || "CONFIRMED";
  const isQuote = !!quoteNumber;
  
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    let lastOrderId = '';
    let lastQuoteNumber = '';
    try {
      lastOrderId = sessionStorage.getItem('lastOrderId') || '';
      lastQuoteNumber = sessionStorage.getItem('lastQuoteNumber') || '';
    } catch (_e) { void _e; }
    const hasStateRef = !!(state.orderNumber || state.quoteNumber);
    const matchesSession = (!!orderNumber && orderNumber === lastOrderId) || (!!quoteNumber && quoteNumber === lastQuoteNumber);
    if (!hasStateRef && !matchesSession) {
      navigate('/', { replace: true });
    }
  }, [orderNumber, quoteNumber]);

  useEffect(() => {
    const fire = async () => {
      if (isQuote) return;
      const g = (window as any).gtag;
      if (!orderNumber || !g) return;
      try {
        const order = await api.get<any>(`/orders/${orderNumber}`);
        const total = Number(order?.total || 0);
        g('event', 'conversion', {
          send_to: 'AW-16944175494/Zu_YCI6qicobEIazzo8_',
          value: 5.0,
          currency: 'USD',
          transaction_id: order?.id
        });
        try {
          const items = (order.items || []).map((it: any) => ({
            item_id: it.sku,
            item_name: it.name,
            price: Number(it.price || 0),
            quantity: Number(it.quantity || 0)
          }));
          g('event', 'purchase', {
            transaction_id: order?.id,
            value: total,
            currency: 'USD',
            items
          });
        } catch {}
        try {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({
            event: 'purchase',
            order_id: order?.id,
            value: total,
            currency: 'USD',
            items: (order.items || []).map((it: any) => ({ item_id: it.sku, item_name: it.name, price: Number(it.price || 0), quantity: Number(it.quantity || 0) }))
          });
        } catch {}
      } catch {}
    };
    fire();
  }, [isQuote, orderNumber]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadInvoice = async () => {
    if (!orderNumber) return;
    try {
      const order = await api.get<any>(`/orders/${orderNumber}`);
      if (!order || order.message) return;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const navy = '#0F172A';
      const gray = '#64748B';
      const lightGray = '#F8FAFC';

      doc.setFillColor(navy);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setFontSize(18);
      doc.setTextColor('#FFFFFF');
      doc.setFont('helvetica', 'bold');
      doc.text('TERAFORMIX', 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Enterprise Hardware Reseller', 14, 26);

      doc.setFontSize(24);
      doc.setTextColor('#FFFFFF');
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth - 14, 25, { align: 'right' });

      const startY = 55;
      const createdDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFontSize(10);
      doc.setTextColor(navy);
      doc.text(`Order #: ${order.id}`, pageWidth - 14, 50, { align: 'right' });
      doc.text(`Date: ${createdDate}`, pageWidth - 14, 55, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 14, 50);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray);
      const bill = order.billingAddress || order.shippingAddress || {};
      const billLines = [bill.name, bill.company, bill.street, `${bill.city || ''} ${bill.state || ''} ${bill.zip || ''}`, bill.email, bill.phone].filter(Boolean);
      const arr = billLines.join('\n');
      const addressLines = doc.splitTextToSize(arr || '', 80);
      doc.text(addressLines, 14, 55);
      let currentY = 55 + (addressLines.length * 5);

      const tableBody = (order.items || []).map((item: any, index: number) => [
        index + 1,
        `${item.name}\nMPN: ${item.sku}`,
        item.quantity,
        `$${(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${(((item.price || 0) * (item.quantity || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: currentY + 20,
        head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
        body: tableBody,
        styles: { fontSize: 9, cellPadding: 4, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
        headStyles: { fillColor: navy, textColor: '#ffffff', fontStyle: 'bold', halign: 'left' },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }, 3: { cellWidth: 35, halign: 'right' }, 4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: lightGray },
        foot: [
          ['', '', '', 'Subtotal:', `$${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
          ['', '', '', 'Shipping:', 'Calculated'],
          ['', '', '', 'Total:', `$${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
        ],
        footStyles: { fillColor: '#ffffff', textColor: navy, fontStyle: 'bold', halign: 'right', fontSize: 11 },
        theme: 'grid'
      });

      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.save(`STC_Invoice_${order.id}.pdf`);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow relative">
        {/* Dark Header Background */}
        <div className="bg-navy-900 pb-32 pt-16">
           <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-action-500 text-white mb-6 shadow-lg shadow-action-900/50">
                  {isQuote ? <FileText className="w-10 h-10" /> : <Check className="w-10 h-10 stroke-[3]" />}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">
                  {isQuote ? 'Quote Request Received' : 'Order Successfully Placed'}
                </h1>
                <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
                  {isQuote 
                    ? 'Our engineering team has received your Bill of Materials and is currently reviewing inventory availability.' 
                    : 'Your hardware order is being processed at our distribution center. A confirmation email has been sent.'}
                </p>
           </div>
        </div>

        {/* Overlapping Content Card */}
        <div className="container mx-auto px-4 -mt-20 pb-20">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex flex-col md:flex-row">
                
                {/* Left Side: Order Details */}
                <div className="p-8 md:p-10 flex-grow">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-8 border-b border-gray-100 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          {isQuote ? 'Quote Reference #' : 'Order Reference #'}
                        </p>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 w-fit">
                           <span className="text-2xl font-mono font-bold text-navy-900 tracking-tight">{referenceNumber}</span>
                           <div className="w-px h-6 bg-gray-300"></div>
                           <button 
                             onClick={handleCopy}
                             className="text-gray-500 hover:text-action-600 transition flex items-center gap-1 text-xs font-medium uppercase"
                           >
                             {copied ? <span className="text-action-600 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span> : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>}
                           </button>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Submitted</p>
                        <p className="text-lg font-semibold text-navy-900">{today}</p>
                      </div>
                   </div>

                   <h3 className="text-lg font-bold text-navy-900 mb-6">What happens next?</h3>
                   <div className="space-y-6 mb-10">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">1</div>
                        <div>
                          <h4 className="font-bold text-navy-900 text-sm">Verification</h4>
                          <p className="text-sm text-gray-500 mt-1">Our system verifies stock levels and credit approval.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center font-bold text-sm border border-gray-200">2</div>
                         <div>
                           <h4 className="font-bold text-navy-900 text-sm">Fulfillment</h4>
                           <p className="text-sm text-gray-500 mt-1">Items are picked, packed, and stress-tested in our facility.</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center font-bold text-sm border border-gray-200">3</div>
                         <div>
                           <h4 className="font-bold text-navy-900 text-sm">Shipping</h4>
                           <p className="text-sm text-gray-500 mt-1">Tracking number generated and sent via email.</p>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-wrap gap-4">
                      <Link 
                        to="/category"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-navy-900 text-white rounded-lg font-bold hover:bg-navy-800 transition shadow-lg hover:shadow-xl flex-grow md:flex-grow-0"
                      >
                        Continue Shopping <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition flex-grow md:flex-grow-0"
                      >
                        <Printer className="w-4 h-4" /> Print Receipt
                      </button>
                   </div>
                </div>

                {/* Right Side: Status Visual */}
                <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 p-8 md:w-72 flex-shrink-0 flex flex-col">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Status Tracker</h3>
                   
                   <div className="relative border-l-2 border-gray-200 ml-2.5 space-y-12 pb-2">
                       {/* Node 1 */}
                       <div className="relative pl-8">
                         <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white ring-2 ring-gray-100 shadow-sm"></span>
                         <h4 className="font-bold text-sm text-navy-900">Received</h4>
                         <p className="text-[10px] text-gray-500 mt-1 uppercase">{today}</p>
                       </div>
                       
                       {/* Node 2 */}
                       <div className="relative pl-8">
                         <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 animate-pulse border-2 border-white ring-2 ring-blue-100 shadow-sm"></span>
                         <h4 className="font-bold text-sm text-navy-900">Processing</h4>
                         <p className="text-[10px] text-blue-600 font-medium mt-1 uppercase">In Progress</p>
                       </div>

                       {/* Node 3 */}
                       <div className="relative pl-8 opacity-50">
                         <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></span>
                         <h4 className="font-bold text-sm text-gray-500">Shipping</h4>
                         <p className="text-[10px] text-gray-400 mt-1 uppercase">Pending</p>
                       </div>
                   </div>

                   <div className="mt-auto pt-8 border-t border-gray-200">
                     {!isQuote && (
                        <button onClick={handleDownloadInvoice} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-navy-700 bg-white p-3 rounded border border-gray-200 shadow-sm hover:bg-gray-50 transition mb-4">
                           <Download className="w-4 h-4 text-action-600" />
                           DOWNLOAD INVOICE
                        </button>
                     )}
                     <div className="text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-[10px] text-gray-500 border border-gray-200 shadow-sm">
                            <ShieldCheck className="w-3 h-3 text-green-500" />
                            <span>Secure Transaction</span>
                        </div>
                     </div>
                   </div>
                </div>
            </div>
            
            {/* Support Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
               <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center gap-4 hover:border-gray-300 transition">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                     <Phone className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 font-bold uppercase">Enterprise Support</p>
                     <p className="text-sm font-bold text-navy-900"><a href={supportTelHref} className="hover:underline">{supportPhone}</a></p>
                  </div>
               </div>
               <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center gap-4 hover:border-gray-300 transition">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                     <Mail className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 font-bold uppercase">Account Manager</p>
                     <p className="text-sm font-bold text-navy-900">sales@teraformix.com</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ThankYouPage;
