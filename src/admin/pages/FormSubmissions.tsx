import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { getApiBase } from '../../lib/api';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../lib/auth';
import { FormSubmission } from '../../types';
import { Loader2, MessageSquare, FileText, Clock, CheckCircle, Mail, Trash2, RefreshCw, Check, TrendingDown, FileDown, CreditCard, Link as LinkIcon, X, Database } from 'lucide-react';
import { api } from '../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useGlobalContent } from '../../contexts/GlobalContent';

const QUOTE_TERMS = `1. Quotation Validity 
Unless otherwise stated in writing, this quotation is valid for 15 calendar days from the date issued. After the expiration date, Teraformix Inc. ("Seller") reserves the right to revise pricing, availability, or other terms.

2. Non-Binding Offer 
This quotation is not a binding agreement. It is provided solely for Buyer's review and does not obligate Seller to deliver goods or services until a formal Sales Order is accepted and confirmed by both parties in writing.

3. Availability & Lead Time 
All items quoted are subject to availability at the time of order placement. Inventory status can change rapidly, and Seller makes no guarantee of stock until a Sales Order is processed. Lead times provided are estimates and may vary due to supply chain constraints or vendor availability.

4. Pricing Adjustments 
Prices are based on current supplier costs, exchange rates, and applicable tariffs at the time of quotation. Seller reserves the right to adjust prices prior to final order confirmation if any of these conditions materially change.

5. Shipping & Handling 
Quoted prices may or may not include shipping, depending on how the quote is structured. If shipping is not included, it will be calculated and added upon order confirmation. Any shipping charges will be FOB Origin unless stated otherwise.

6. Taxes 
Quoted prices do not include applicable sales tax, unless explicitly stated. Buyer will be responsible for all applicable state, local, or federal taxes unless a valid resale or tax-exempt certificate is provided.

7. Payment Terms 
Payment terms will be specified at the time of final Sales Order issuance. Quoted items may be subject to credit approval. Accepted payment methods include ACH, Wire Transfer, Check, Credit Card, and PayPal (processing fees may apply for certain methods).

8. Custom and Special Orders 
Items marked as custom, non-stock, or special order are non-cancellable and non-returnable once the order is placed. These items may require additional lead time.

9. Typographical Errors 
Seller reserves the right to correct any typographical or clerical errors in the quotation without liability. If a pricing or specification error is found after quotation, an updated quote will be issued.

10. Governing Law 
This quotation, and any resulting transaction, shall be governed by the laws of the State of Texas, and any disputes shall be resolved exclusively in the state or federal courts located in Texas.`;

const FormSubmissions = () => {
  const { content } = useGlobalContent();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'ALL' | 'ABANDONED' | 'ABANDONED_FORM' | 'BOM' | 'CONCIERGE' | 'BULK_QUOTE' | 'QUOTE_BEATING' | 'MANUAL_QUOTE' | 'CONTACT_US'>('ALL');

  // PDF Generation State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfMode, setPdfMode] = useState<'QUOTE' | 'INVOICE'>('QUOTE');
  const [selectedQuoteForPdf, setSelectedQuoteForPdf] = useState<FormSubmission | null>(null);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Quote Editor State (Create/Revise)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editorForm, setEditorForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: '',
    paymentTerms: 'Net 30',
    notes: '',
    shippingCost: 0,
    discount: 0,
    items: [] as Array<{ name: string; sku: string; quantity: number; unitPrice: number }>
  });
  const [newItem, setNewItem] = useState({ name: '', sku: '', quantity: 1, unitPrice: 0 });

  // Invoice Link State
  const [invoiceLink, setInvoiceLink] = useState<string | null>(null);

  const mapQuoteToSubmission = (q: any): FormSubmission => {
    const contactName = q.guestName || q.user?.name || '';
    const contactEmail = q.guestEmail || q.user?.email || '';
    const contactPhone = q.guestPhone || '';
    const contactCompany = q.guestCompany || q.user?.company?.name || '';
    const data = q.submissionData || {};

    let status: FormSubmission['status'] = 'NEW';

    // Explicitly cast the status string from the backend to the specific union type
    if (q.status === 'REVIEWED') status = 'QUOTE_READY';
    else if (q.status === 'ACCEPTED') status = 'COMPLETED';
    else if (q.status === 'REJECTED') status = 'ARCHIVED';
    else if (q.status === 'AWAITING_PAYMENT') status = 'AWAITING_PAYMENT';
    else if (q.status === 'PAID') status = 'PAID';
    else if (q.status === 'PENDING') status = 'NEW';
    // Handle cases where the backend might return 'NEW' or 'READ' or 'QUOTE_READY' etc. directly
    else if (['NEW', 'READ', 'QUOTE_READY', 'COMPLETED', 'ARCHIVED', 'PENDING', 'AWAITING_PAYMENT', 'PAID'].includes(q.status)) {
      status = q.status as FormSubmission['status'];
    }

    return {
      id: q.id,
      type: q.type,
      submittedAt: q.createdAt,
      sourceUrl: '',
      status: status,
      data: {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        company: contactCompany,
        subject: data.subject,
        message: data.message,
        parts: data.parts,
        timeline: data.timeline,
        fileName: data.fileName,
        fileContent: data.fileContent,
        notes: data.notes,
        quoteNumber: q.referenceNumber,
        competitorPrice: data.competitorPrice,
        shipping: data.shipping,
        billing: data.billing,
        cartCount: Array.isArray(data.cart) ? data.cart.length : undefined,
        source: data.source,
        cart: Array.isArray(data.cart) ? data.cart.map((i: any) => ({ name: i?.name, sku: i?.sku, quantity: i?.quantity, unitPrice: i?.unitPrice })) : undefined,
        shippingCost: data.shippingCost,
        discount: data.discount,
        subtotal: data.subtotal,
        total: data.total,
        paymentTerms: data.paymentTerms || q.paymentTerms
      },
    };
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const quotes = await api.get<any[]>('/quotes');
      if (quotes && Array.isArray(quotes)) {
        const mapped = quotes.map(mapQuoteToSubmission);
        setSubmissions(mapped);
        return;
      }
      throw new Error('No data');
    } catch (e) {
      const fallback = db.submissions.getAll();
      setSubmissions(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (sub: FormSubmission) => {
    try {
      const apiBase = getApiBase();
      const url = `${apiBase}/quotes/${sub.id}/file`;
      const token = (() => { try { return localStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch (_e) { void _e; return ''; } })();
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = sub.data.fileName || `bom-${sub.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      alert('Failed to download BOM file.');
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const counts = {
    total: submissions.length,
    abandoned: submissions.filter(s => s.type === 'ABANDONED_CHECKOUT').length,
    abandonedForm: submissions.filter(s => s.type === 'ABANDONED_FORM').length,
    bom: submissions.filter(s => s.type === 'BOM_UPLOAD').length,
    concierge: submissions.filter(s => s.type === 'CONCIERGE').length,
    bulk: submissions.filter(s => s.type === 'BULK_QUOTE').length,
    quoteBeating: submissions.filter(s => s.type === 'QUOTE_BEATING').length,
    manualQuote: submissions.filter(s => s.type === 'STANDARD_CART').length,
    contact: submissions.filter(s => s.type === 'CONTACT_US').length,
  };

  const filtered = submissions.filter(s => {
    if (activeSection === 'ALL') return true;
    if (activeSection === 'ABANDONED') return s.type === 'ABANDONED_CHECKOUT';
    if (activeSection === 'ABANDONED_FORM') return s.type === 'ABANDONED_FORM';
    if (activeSection === 'BOM') return s.type === 'BOM_UPLOAD';
    if (activeSection === 'CONCIERGE') return s.type === 'CONCIERGE';
    if (activeSection === 'BULK_QUOTE') return s.type === 'BULK_QUOTE';
    if (activeSection === 'QUOTE_BEATING') return s.type === 'QUOTE_BEATING';
    if (activeSection === 'MANUAL_QUOTE') return s.type === 'STANDARD_CART';
    if (activeSection === 'CONTACT_US') return s.type === 'CONTACT_US';
    return true;
  });

  const handleDelete = (id: string) => {
    if (confirm("Delete this request?")) {
      db.submissions.delete(id);
      fetchSubmissions();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update local DB
    db.submissions.updateStatus(id, newStatus as any);

    // Refresh UI
    const updated = submissions.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setSubmissions(updated as any);
    setUpdatingId(null);
  };

  const handleSyncToAirtable = async (id: string) => {
    if (!confirm("Sync this lead to Airtable?")) return;
    setUpdatingId(id);
    try {
      await api.post(`/quotes/${id}/sync`, {});
      alert("Sync triggered successfully!");
    } catch (e: any) {
      alert("Sync failed: " + (e.message || "Unknown error"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedQuoteForPdf) return;
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- Colors & Fonts ---
      const navyBlue = [10, 25, 47]; // #0a192f
      const lightGray = [245, 247, 250];
      const slate = [100, 116, 139];

      // --- Authenticated User (Sales Rep) ---
      const currentUser = (() => {
        try {
          const stored = localStorage.getItem(AUTH_USER_KEY);
          return stored ? JSON.parse(stored) : null;
        } catch { return null; }
      })();

      // --- Header Section ---
      // Blue Header Bar
      doc.setFillColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // White Logo Text / Image
      doc.setTextColor(255, 255, 255);
      if (content.settings.logoUrl) {
        try {
          let logoUrl = content.settings.logoUrl;
          if (logoUrl.startsWith('/')) logoUrl = window.location.origin + logoUrl;

          const loadImage = (url: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'Anonymous';
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = url;
            });
          };

          const img = await loadImage(logoUrl);
          // Maintain aspect ratio
          const aspectRatio = img.width / img.height;
          const logoHeight = 20;
          const logoWidth = logoHeight * aspectRatio;
          doc.addImage(img, 'PNG', 15, 10, logoWidth, logoHeight);
        } catch (e) {
          console.warn("PDF Logo Load Failed", e);
          doc.setFontSize(22);
          doc.setFont("helvetica", "bold");
          doc.text(content.settings.logoText || "Teraformix", 15, 25);
        }
      } else {
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(content.settings.logoText || "Teraformix", 15, 25);
      }

      // Document Title (Right Side of Blue Bar)
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      const title = pdfMode === 'INVOICE' ? 'INVOICE' : 'QUOTATION';
      doc.text(title, pageWidth - 15, 25, { align: "right" });

      // --- Info Section (Below Header) ---
      let currentY = 55;

      // Left: Vendor Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Teraformix Inc.", 15, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text(content.general.address || "123 Tech Blvd, Austin, TX 78701", 15, currentY + 5);
      doc.text(`Phone: ${content.general.phone || "N/A"}`, 15, currentY + 10);
      doc.text(`Email: ${content.general.email || "sales@teraformix.com"}`, 15, currentY + 15);

      if (currentUser && currentUser.name) {
        doc.text(`Sales Rep: ${currentUser.name}`, 15, currentY + 20);
      }

      // Credentials Row
      doc.setFontSize(8);
      let credY = currentY + 28;
      doc.setFont("helvetica", "bold");
      doc.text("CAGE:", 15, credY); doc.setFont("helvetica", "normal"); doc.text(content.general.cageCode || "N/A", 27, credY);
      doc.text("DUNS:", 45, credY); doc.setFont("helvetica", "normal"); doc.text(content.general.dunsNumber || "N/A", 57, credY);

      // Right: Key Dates & Reference
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const rightColX = pageWidth - 60;

      const today = new Date();
      const validUntil = new Date();
      validUntil.setDate(today.getDate() + 15);
      const refLabel = pdfMode === 'INVOICE' ? 'Invoice #' : 'Quote #';

      doc.setFont("helvetica", "bold");
      doc.text(refLabel, rightColX, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedQuoteForPdf.data.quoteNumber || selectedQuoteForPdf.id.slice(0, 8).toUpperCase(), pageWidth - 15, currentY, { align: 'right' });

      currentY += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Date:", rightColX, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(today.toLocaleDateString(), pageWidth - 15, currentY, { align: 'right' });

      currentY += 6;
      doc.setFont("helvetica", "bold");
      doc.text(pdfMode === 'INVOICE' ? "Due Date:" : "Expiry Date:", rightColX, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(validUntil.toLocaleDateString(), pageWidth - 15, currentY, { align: 'right' });

      currentY += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Payment Terms:", rightColX, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(paymentTerms, pageWidth - 15, currentY, { align: 'right' });

      // --- Address Boxes (Bill To / Ship To) ---
      currentY += 25;

      // Box Dimensions
      const boxWidth = (pageWidth - 40) / 2;
      const boxHeight = 35;

      // Bill To Box
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(15, currentY, boxWidth, boxHeight, 2, 2, 'F');

      // Ship To Box
      doc.roundedRect(15 + boxWidth + 10, currentY, boxWidth, boxHeight, 2, 2, 'F');

      // Bill To Text
      doc.setFontSize(9);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.setFont("helvetica", "bold");
      doc.text("BILL TO:", 20, currentY + 8);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(selectedQuoteForPdf.data.company || selectedQuoteForPdf.data.name || "Valued Customer", 20, currentY + 16);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(slate[0], slate[1], slate[2]);
      let billY = currentY + 22;

      const billing = selectedQuoteForPdf.data.billing;
      if (billing) {
        doc.text(`${billing.street || ''}`, 20, billY);
        doc.text(`${billing.city || ''}, ${billing.state || ''} ${billing.zip || ''}`, 20, billY + 4);
        if (billing.country) doc.text(billing.country, 20, billY + 8);
      } else {
        doc.text(selectedQuoteForPdf.data.email || "", 20, billY);
      }

      // Ship To Text
      doc.setFontSize(9);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.setFont("helvetica", "bold");
      doc.text("SHIP TO:", 20 + boxWidth + 10, currentY + 8);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      // Use Shipping or fallback to Billing/Company
      const shipping = selectedQuoteForPdf.data.shipping;
      if (shipping && (shipping.firstName || shipping.lastName)) {
        doc.text(`${shipping.firstName} ${shipping.lastName}`, 20 + boxWidth + 10, currentY + 16);
      } else {
        doc.text(selectedQuoteForPdf.data.company || selectedQuoteForPdf.data.name || "Same as Billing", 20 + boxWidth + 10, currentY + 16);
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(slate[0], slate[1], slate[2]);
      let shipY = currentY + 22;

      if (shipping) {
        doc.text(`${shipping.street || ''}`, 20 + boxWidth + 10, shipY);
        doc.text(`${shipping.city || ''}, ${shipping.state || ''} ${shipping.zip || ''}`, 20 + boxWidth + 10, shipY + 4);
        if (shipping.country) doc.text(shipping.country, 20 + boxWidth + 10, shipY + 8);
      } else if (billing) {
        doc.text(`${billing.street || ''}`, 20 + boxWidth + 10, shipY);
        doc.text(`${billing.city || ''}, ${billing.state || ''} ${billing.zip || ''}`, 20 + boxWidth + 10, shipY + 4);
        if (billing.country) doc.text(billing.country, 20 + boxWidth + 10, shipY + 8);
      }

      if (pdfMode === 'INVOICE') {
        doc.setTextColor(59, 130, 246);
        const linkY = currentY + boxHeight + 8;
        doc.textWithLink("PAY ONLINE NOW >>", pageWidth - 15, linkY, { align: "right", url: `${window.location.origin}/pay-quote/${selectedQuoteForPdf.id}` });
      }

      // --- Items Table ---
      const items = selectedQuoteForPdf.data.cart || [];
      const tableData = items.length > 0 ? items.map((item: any) => [
        item.name || "Item Request",
        item.sku || "N/A",
        item.quantity || 1,
        `$${(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ]) : [
        ["Consultation / Custom Request", "SVC-CUSTOM", "1", "TBD", "TBD"]
      ];

      // @ts-ignore
      autoTable(doc, {
        startY: currentY + boxHeight + 15,
        head: [['Description', 'Part #', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [10, 25, 47],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240]
        },
        columnStyles: {
          0: { cellWidth: 80 }, // Description
          2: { halign: 'center' }, // Qty
          3: { halign: 'right' }, // Price
          4: { halign: 'right' } // Total
        },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      // --- Totals ---
      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY + 10;

      const subtotal = selectedQuoteForPdf.data.subtotal || 0;
      const shippingCost = selectedQuoteForPdf.data.shippingCost || 0;
      const discount = selectedQuoteForPdf.data.discount || 0;
      const total = selectedQuoteForPdf.data.total || (subtotal + shippingCost - discount);

      const totalsX = pageWidth - 80;
      const totalsValX = pageWidth - 15;

      let tY = finalY;

      const drawTotalLine = (label: string, value: string, bold = false, size = 10) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(bold ? 0 : 50, bold ? 0 : 50, bold ? 0 : 50);
        doc.text(label, totalsX, tY);
        doc.text(value, totalsValX, tY, { align: "right" });
        tY += 6;
      };

      drawTotalLine("Subtotal:", `$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      if (shippingCost > 0) drawTotalLine("Shipping:", `$${shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      if (discount > 0) drawTotalLine("Discount:", `-$${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

      tY += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(totalsX, tY - 6, totalsValX, tY - 6); // Divider
      drawTotalLine("Total:", `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, true, 12);

      // --- Footer / Terms ---
      // Move to bottom of page for terms
      const bottomY = pageHeight - 50;

      // If content overlaps, add page.
      // @ts-ignore
      if (tY > bottomY - 30) {
        doc.addPage();
        tY = 20;
      } else {
        tY = Math.max(tY + 10, bottomY);
      }

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Terms & Conditions:", 15, tY);
      doc.setFontSize(7);
      const termsLines = doc.splitTextToSize(QUOTE_TERMS, pageWidth - 30);
      doc.text(termsLines, 15, tY + 4);

      const fileName = `${pdfMode === 'INVOICE' ? 'Invoice' : 'Quote'}-${selectedQuoteForPdf.data.quoteNumber || selectedQuoteForPdf.id.slice(0, 8)}.pdf`;
      doc.save(fileName);
      setPdfModalOpen(false);

      // Save Terms
      await api.patch(`/quotes/${selectedQuoteForPdf.id}`, {
        paymentTerms,
        status: pdfMode === 'INVOICE' && selectedQuoteForPdf.status !== 'PAID' ? 'AWAITING_PAYMENT' : selectedQuoteForPdf.status
      });

      fetchSubmissions(); // Refresh UI

    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCreateInvoice = async (submission: FormSubmission) => {
    try {
      setUpdatingId(submission.id);

      // 1. Update status
      await api.patch(`/quotes/${submission.id}`, { status: 'AWAITING_PAYMENT' });

      // 2. Generate Link
      const link = `${window.location.origin}/pay-quote/${submission.id}`;

      // 3. Show Link to User (Copy to Clipboard)
      try {
        await navigator.clipboard.writeText(link);
        alert(`Invoice Created & Link Copied to Clipboard!\n\nLink: ${link}`);
      } catch (e) {
        setInvoiceLink(link); // Fallback to showing it in UI if clipboard fails
      }

      // Refresh local status
      const updated = submissions.map(s => s.id === submission.id ? { ...s, status: 'AWAITING_PAYMENT' as FormSubmission['status'] } : s);
      setSubmissions(updated);

    } catch (error: any) {
      console.error("Invoice creation failed", error);
      alert(`Failed to create invoice link: ${error.message || 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const openNewQuoteEditor = () => {
    setEditingQuoteId(null);
    setEditorForm({
      name: '', company: '', email: '', phone: '',
      billingStreet: '', billingCity: '', billingState: '', billingZip: '', billingCountry: '',
      shippingStreet: '', shippingCity: '', shippingState: '', shippingZip: '', shippingCountry: '',
      paymentTerms: 'Net 30', notes: '', shippingCost: 0, discount: 0, items: []
    });
    setEditorOpen(true);
  };

  const openReviseQuoteEditor = (sub: FormSubmission) => {
    setEditingQuoteId(sub.id);
    const billing = sub.data.billing || {} as any;
    const shipping = sub.data.shipping || {} as any;
    const cart = (sub.data.cart || []).map((i: any) => ({
      name: i.name || '',
      sku: i.sku || '',
      quantity: i.quantity || 1,
      unitPrice: i.unitPrice || 0
    }));

    setEditorForm({
      name: sub.data.name || '',
      company: sub.data.company || '',
      email: sub.data.email || '',
      phone: sub.data.phone || '',
      billingStreet: billing.street || '',
      billingCity: billing.city || '',
      billingState: billing.state || '',
      billingZip: billing.zip || '',
      billingCountry: billing.country || '',
      shippingStreet: shipping.street || '',
      shippingCity: shipping.city || '',
      shippingState: shipping.state || '',
      shippingZip: shipping.zip || '',
      shippingCountry: shipping.country || '',
      paymentTerms: sub.data.paymentTerms || 'Net 30',
      notes: sub.data.notes || '',
      shippingCost: sub.data.shippingCost || 0,
      discount: sub.data.discount || 0,
      items: cart
    });
    setEditorOpen(true);
  };

  const handleSaveQuote = async () => {
    try {
      setLoading(true);
      const payload = {
        name: editorForm.name,
        company: editorForm.company,
        email: editorForm.email,
        phone: editorForm.phone,
        billing: {
          street: editorForm.billingStreet,
          city: editorForm.billingCity,
          state: editorForm.billingState,
          zip: editorForm.billingZip,
          country: editorForm.billingCountry
        },
        shipping: {
          street: editorForm.shippingStreet,
          city: editorForm.shippingCity,
          state: editorForm.shippingState,
          zip: editorForm.shippingZip,
          country: editorForm.shippingCountry
        },
        paymentTerms: editorForm.paymentTerms,
        notes: editorForm.notes,
        cart: editorForm.items,
        shippingCost: Number(editorForm.shippingCost),
        discount: Number(editorForm.discount)
      };

      if (editingQuoteId) {
        // Update
        await api.patch(`/quotes/${editingQuoteId}`, payload);
      } else {
        // Create
        await api.post('/quotes/manual', payload);
      }

      // --- Customer Upsert Logic ---
      if (editorForm.email) {
        try {
          // Check if exists locally first to avoid unnecessary API calls if we can
          const existingBuyers = db.users.getBuyers();
          const exists = existingBuyers.find(b => b.email.toLowerCase() === editorForm.email.toLowerCase());

          if (!exists) {
            const newBuyer = {
              name: editorForm.name || editorForm.company || 'Unknown',
              email: editorForm.email,
              role: 'BUYER',
              joinedAt: new Date().toISOString()
            };

            // Try API first
            try {
              await api.post('/users/buyers', {
                name: newBuyer.name,
                email: newBuyer.email,
                password: Math.random().toString(36).slice(-8) // Temp password
              });
            } catch (apiErr) {
              // Fallback to local DB
              db.users.add(newBuyer);
            }
            console.log("Auto-created customer from quote:", newBuyer.email);
          }
        } catch (e) {
          console.error("Failed to auto-add customer", e);
        }
      }

      setEditorOpen(false);
      fetchSubmissions();
    } catch (e) {
      alert("Failed to save quote");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addItemToQuote = () => {
    if (!newItem.name) return;
    setEditorForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setNewItem({ name: '', sku: '', quantity: 1, unitPrice: 0 });
  };

  const removeItemFromQuote = (idx: number) => {
    setEditorForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-navy-900">Inbound Requests</h3>
          <p className="text-sm text-gray-500">Track Quote requests and BOM uploads.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openNewQuoteEditor} className="bg-navy-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-navy-800 transition flex items-center gap-2">
            <FileText className="w-4 h-4" /> Create Quote
          </button>
          <button onClick={fetchSubmissions} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setActiveSection('ALL')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'ALL' ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-700'}`}>All ({counts.total})</button>
            <button onClick={() => setActiveSection('ABANDONED')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'ABANDONED' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800'}`}>Abandoned Carts ({counts.abandoned})</button>
            <button onClick={() => setActiveSection('ABANDONED_FORM')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'ABANDONED_FORM' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}>Abandoned Forms ({counts.abandonedForm})</button>
            <button onClick={() => setActiveSection('BOM')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'BOM' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}`}>BOM Uploads ({counts.bom})</button>
            <button onClick={() => setActiveSection('CONCIERGE')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'CONCIERGE' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>Concierge ({counts.concierge})</button>
            <button onClick={() => setActiveSection('BULK_QUOTE')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'BULK_QUOTE' ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-800'}`}>Bulk Quotes ({counts.bulk})</button>
            <button onClick={() => setActiveSection('QUOTE_BEATING')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'QUOTE_BEATING' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}>Quote Beating ({counts.quoteBeating})</button>
            <button onClick={() => setActiveSection('MANUAL_QUOTE')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'MANUAL_QUOTE' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'}`}>Quotes ({counts.manualQuote})</button>
            <button onClick={() => setActiveSection('CONTACT_US')} className={`px-3 py-1.5 text-xs font-bold rounded ${activeSection === 'CONTACT_US' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}>Contact ({counts.contact})</button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No submissions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((sub) => (
                <div key={sub.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-gray-50">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">

                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        {sub.type === 'BOM_UPLOAD' ? (
                          <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <FileText className="w-3 h-3" /> BOM Upload
                          </span>
                        ) : sub.type === 'ABANDONED_CHECKOUT' ? (
                          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Abandoned Checkout
                          </span>
                        ) : sub.type === 'ABANDONED_FORM' ? (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Abandoned Form
                          </span>
                        ) : sub.type === 'QUOTE_BEATING' ? (
                          <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Quote Beating
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {sub.type === 'BULK_QUOTE' ? 'Bulk Quote' : sub.type === 'CONTACT_US' ? 'Contact Message' : 'Concierge'}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 font-mono">Ref: {sub.data.quoteNumber || sub.id}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(sub.submittedAt).toLocaleString()}</span>
                      </div>

                      <div className="mb-2">
                        <h4 className="font-bold text-navy-900 text-sm">
                          {sub.data.company ? `${sub.data.company} - ` : ''}{sub.data.name || 'Guest'}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {sub.data.email}</span>
                          {sub.data.phone && <span>{sub.data.phone}</span>}
                        </div>
                      </div>

                      {sub.data.competitorPrice && (
                        <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 font-mono mb-2">
                          <span className="text-gray-500 font-sans font-bold text-xs uppercase mr-2">Target Price:</span>
                          {sub.data.competitorPrice}
                        </div>
                      )}

                      {sub.data.subject && (
                        <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 font-mono mb-2">
                          <div className="font-bold text-navy-900 border-b border-gray-100 pb-1 mb-1 font-sans">{sub.data.subject}</div>
                          <div className="whitespace-pre-wrap font-sans">{sub.data.message}</div>
                        </div>
                      )}

                      {sub.data.parts && (
                        <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 font-mono mb-2">
                          {sub.data.parts}
                        </div>
                      )}
                      {sub.type === 'ABANDONED_CHECKOUT' && (
                        <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 mb-2">
                          <div className="flex gap-6">
                            <div>
                              <div><span className="text-gray-500">Email:</span> <span className="font-bold text-navy-900">{sub.data.email}</span></div>
                              {sub.data.cartCount ? <div><span className="text-gray-500">Cart Items:</span> <span className="font-bold text-navy-900">{sub.data.cartCount}</span></div> : null}
                            </div>
                            {sub.data.shipping ? (
                              <div>
                                <div className="text-gray-500">Shipping</div>
                                <div className="text-navy-900 font-medium">{sub.data.shipping.street}</div>
                                <div className="text-navy-900">{sub.data.shipping.city}, {sub.data.shipping.state} {sub.data.shipping.zip}</div>
                              </div>
                            ) : null}
                            {sub.data.billing ? (
                              <div>
                                <div className="text-gray-500">Billing</div>
                                <div className="text-navy-900 font-medium">{sub.data.billing.street}</div>
                                <div className="text-navy-900">{sub.data.billing.city}, {sub.data.billing.state} {sub.data.billing.zip}</div>
                              </div>
                            ) : null}
                          </div>
                          {Array.isArray(sub.data.cart) && sub.data.cart.length > 0 && (
                            <div className="mt-2 border-t border-gray-100 pt-2">
                              <div className="text-gray-500 mb-1">Products</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {sub.data.cart.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <div className="text-navy-900 font-medium truncate mr-2">{item.name || item.sku}</div>
                                    <div className="text-gray-500 font-mono text-xs">{item.sku}</div>
                                    <div className="text-gray-700 text-xs ml-2">x{item.quantity || 1}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {sub.type === 'ABANDONED_FORM' && (
                        <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 mb-2">
                          <div><span className="text-gray-500">Email:</span> <span className="font-bold text-navy-900">{sub.data.email}</span></div>
                          {sub.data.company ? <div><span className="text-gray-500">Company:</span> <span className="font-bold text-navy-900">{sub.data.company}</span></div> : null}
                          {sub.data.notes ? <div><span className="text-gray-500">Notes:</span> <span className="text-navy-900">{sub.data.notes}</span></div> : null}
                        </div>
                      )}
                      {sub.data.fileName && (
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 w-fit mb-2">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-navy-900">{sub.data.fileName}</span>
                          {sub.data.fileContent && (
                            <span className="text-xs text-gray-500">• {getFileSizeLabel(sub.data.fileContent)}</span>
                          )}
                          <button onClick={() => handleDownload(sub)} className="ml-2 px-2 py-1 text-xs font-bold text-action-700 bg-action-100 rounded hover:bg-action-200">
                            Download
                          </button>
                        </div>
                      )}
                      {sub.data.notes && (
                        <p className="text-xs text-gray-500 italic">Note: {sub.data.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 min-w-[150px]">
                      <div className="w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-right">Status</label>
                        <select
                          value={sub.status}
                          disabled={updatingId === sub.id}
                          onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                          className="w-full bg-white border border-gray-300 text-sm rounded p-1.5 focus:ring-2 focus:ring-navy-900 outline-none"
                        >
                          <option value="NEW">New Request</option>
                          <option value="READ">In Review</option>
                          <option value="QUOTE_READY">Quote Sent</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                        {updatingId === sub.id && <span className="text-xs text-gray-400 block text-right mt-1">Updating...</span>}
                      </div>

                      <div className="flex flex-col gap-2 mt-2 w-full">
                        <button
                          onClick={() => { setSelectedQuoteForPdf(sub); setPdfModalOpen(true); }}
                          className="w-full flex items-center justify-center gap-2 bg-navy-50 text-navy-900 border border-navy-200 hover:bg-navy-100 rounded px-3 py-1.5 text-xs font-bold transition"
                        >
                          <FileDown className="w-3 h-3" /> Generate PDF
                        </button>
                        <button
                          onClick={() => openReviseQuoteEditor(sub)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded px-3 py-1.5 text-xs font-bold transition"
                        >
                          <RefreshCw className="w-3 h-3" /> Revise Quote
                        </button>
                        <button
                          onClick={() => handleCreateInvoice(sub)}
                          disabled={updatingId === sub.id}
                          className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded px-3 py-1.5 text-xs font-bold transition"
                        >
                          <CreditCard className="w-3 h-3" /> Create Invoice
                        </button>

                        <button
                          onClick={() => handleSyncToAirtable(sub.id)}
                          disabled={updatingId === sub.id}
                          className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 rounded px-3 py-1.5 text-xs font-bold transition"
                        >
                          {updatingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />} Sync to Airtable
                        </button>
                      </div>

                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition mt-auto self-end"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF Generation Modal */}
      {pdfModalOpen && selectedQuoteForPdf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-navy-900 text-lg flex items-center gap-2">
                <FileDown className="w-5 h-5 text-navy-600" />
                Generate PDF {pdfMode === 'INVOICE' ? 'Invoice' : 'Quote'}
              </h3>
              <button onClick={() => setPdfModalOpen(false)} className="text-gray-400 hover:text-red-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* PDF Mode Toggle */}
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                  <button
                    onClick={() => setPdfMode('QUOTE')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition ${pdfMode === 'QUOTE' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}
                  >
                    Quote
                  </button>
                  <button
                    onClick={() => setPdfMode('INVOICE')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition ${pdfMode === 'INVOICE' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}
                  >
                    Invoice
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex items-start gap-3">
                <div className="bg-blue-200 p-1 rounded-full"><FileText className="w-4 h-4 text-blue-700" /></div>
                <div>
                  <p className="font-bold">Ready to generate</p>
                  <p className="opacity-90 mt-1">
                    Generating quote PDF for <span className="font-bold">{selectedQuoteForPdf.data.name}</span>
                    {selectedQuoteForPdf.data.company && <span> from {selectedQuoteForPdf.data.company}</span>}.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-navy-900 outline-none"
                >
                  <option value="Net 30">Net 30 (Standard)</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Prepayment">Prepayment Required</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">This will appear on the final PDF document.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setPdfModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={generatingPdf}
                className="px-6 py-2 bg-navy-900 text-white font-bold text-sm rounded-lg hover:bg-navy-800 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-navy-900/20"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" /> Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-navy-900 text-white rounded-t-xl">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {editingQuoteId ? 'Revise Quote' : 'Create New Quote'}
              </h3>
              <button onClick={() => setEditorOpen(false)} className="text-white/70 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-navy-900 border-b pb-2">Customer Info</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name *</label>
                      <input type="text" value={editorForm.name} onChange={e => setEditorForm({ ...editorForm, name: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company *</label>
                      <input type="text" value={editorForm.company} onChange={e => setEditorForm({ ...editorForm, company: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="Acme Inc" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input type="email" value={editorForm.email} onChange={e => setEditorForm({ ...editorForm, email: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                      <input type="tel" value={editorForm.phone} onChange={e => setEditorForm({ ...editorForm, phone: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="+1 555..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-navy-900 border-b pb-2">Terms & Notes</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Terms</label>
                    <select value={editorForm.paymentTerms} onChange={e => setEditorForm({ ...editorForm, paymentTerms: e.target.value })} className="w-full border p-2 rounded text-sm">
                      <option value="Net 30">Net 30</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Prepayment">Prepayment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Notes</label>
                    <textarea value={editorForm.notes} onChange={e => setEditorForm({ ...editorForm, notes: e.target.value })} className="w-full border p-2 rounded text-sm h-20" placeholder="Notes..." />
                  </div>
                </div>
              </div>

              {/* Addresses */}
              {/* Addresses */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-700 text-sm">Addresses</h4>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={JSON.stringify({
                        street: editorForm.shippingStreet,
                        city: editorForm.shippingCity,
                        state: editorForm.shippingState,
                        zip: editorForm.shippingZip,
                        country: editorForm.shippingCountry
                      }) === JSON.stringify({
                        street: editorForm.billingStreet,
                        city: editorForm.billingCity,
                        state: editorForm.billingState,
                        zip: editorForm.billingZip,
                        country: editorForm.billingCountry
                      })}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditorForm(prev => ({
                            ...prev,
                            shippingStreet: prev.billingStreet,
                            shippingCity: prev.billingCity,
                            shippingState: prev.billingState,
                            shippingZip: prev.billingZip,
                            shippingCountry: prev.billingCountry
                          }));
                        }
                      }}
                      className="text-navy-900 rounded focus:ring-navy-900"
                    />
                    Shipping same as Billing
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-bold text-navy-900 text-xs uppercase border-b border-gray-200 pb-1">Billing Address</h5>
                    <input type="text" placeholder="Street" value={editorForm.billingStreet} onChange={e => setEditorForm({ ...editorForm, billingStreet: e.target.value })} className="w-full border p-2 rounded text-xs" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="City" value={editorForm.billingCity} onChange={e => setEditorForm({ ...editorForm, billingCity: e.target.value })} className="w-full border p-2 rounded text-xs" />
                      <input type="text" placeholder="State" value={editorForm.billingState} onChange={e => setEditorForm({ ...editorForm, billingState: e.target.value })} className="w-full border p-2 rounded text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Zip" value={editorForm.billingZip} onChange={e => setEditorForm({ ...editorForm, billingZip: e.target.value })} className="w-full border p-2 rounded text-xs" />
                      <input type="text" placeholder="Country" value={editorForm.billingCountry} onChange={e => setEditorForm({ ...editorForm, billingCountry: e.target.value })} className="w-full border p-2 rounded text-xs" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-navy-900 text-xs uppercase border-b border-gray-200 pb-1">Shipping Address</h5>
                    <input type="text" placeholder="Street" value={editorForm.shippingStreet} onChange={e => setEditorForm({ ...editorForm, shippingStreet: e.target.value })} className="w-full border p-2 rounded text-xs" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="City" value={editorForm.shippingCity} onChange={e => setEditorForm({ ...editorForm, shippingCity: e.target.value })} className="w-full border p-2 rounded text-xs" />
                      <input type="text" placeholder="State" value={editorForm.shippingState} onChange={e => setEditorForm({ ...editorForm, shippingState: e.target.value })} className="w-full border p-2 rounded text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Zip" value={editorForm.shippingZip} onChange={e => setEditorForm({ ...editorForm, shippingZip: e.target.value })} className="w-full border p-2 rounded text-xs" />
                      <input type="text" placeholder="Country" value={editorForm.shippingCountry} onChange={e => setEditorForm({ ...editorForm, shippingCountry: e.target.value })} className="w-full border p-2 rounded text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="font-bold text-navy-900 border-b pb-2 mb-4">Line Items</h4>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                  {editorForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                      <div className="flex-grow grid grid-cols-12 gap-2 text-sm">
                        <div className="col-span-5 font-medium">{item.name}</div>
                        <div className="col-span-3 text-gray-500 font-mono text-xs">{item.sku}</div>
                        <div className="col-span-2 text-right">x{item.quantity}</div>
                        <div className="col-span-2 text-right">${item.unitPrice}</div>
                      </div>
                      <button onClick={() => removeItemFromQuote(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {editorForm.items.length === 0 && <p className="text-center text-gray-400 text-sm py-2">No items added yet.</p>}
                </div>

                <div className="flex gap-2 items-end bg-gray-100 p-3 rounded-lg">
                  <div className="flex-grow">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
                    <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="Server Rack..." />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU</label>
                    <input type="text" value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} className="w-full border p-2 rounded text-sm" placeholder="SKU-123" />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qty</label>
                    <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} className="w-full border p-2 rounded text-sm" />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price</label>
                    <input type="number" value={newItem.unitPrice} onChange={e => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })} className="w-full border p-2 rounded text-sm" />
                  </div>
                  <button onClick={addItemToQuote} className="bg-navy-900 text-white p-2 rounded hover:bg-navy-800 transition h-[38px]">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Financials */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-navy-900 border-b pb-2 mb-4">Financials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shipping Cost ($)</label>
                    <input type="number" value={editorForm.shippingCost} onChange={e => setEditorForm({ ...editorForm, shippingCost: parseFloat(e.target.value) || 0 })} className="w-full border p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount ($)</label>
                    <input type="number" value={editorForm.discount} onChange={e => setEditorForm({ ...editorForm, discount: parseFloat(e.target.value) || 0 })} className="w-full border p-2 rounded text-sm" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-bold">${editorForm.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span>${(editorForm.shippingCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="text-gray-600">Discount:</span>
                    <span>-${(editorForm.discount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-navy-900 pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span>${(
                      editorForm.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) +
                      (editorForm.shippingCost || 0) -
                      (editorForm.discount || 0)
                    ).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setEditorOpen(false)} className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button onClick={handleSaveQuote} disabled={loading} className="px-6 py-2 bg-navy-900 text-white font-bold text-sm rounded-lg hover:bg-navy-800 transition flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editingQuoteId ? 'Update Quote' : 'Create Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSubmissions;
const getFileSizeLabel = (dataUrl?: string) => {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  const m = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!m) return '';
  const b64 = m[2];
  const sizeBytes = Math.floor((b64.length * 3) / 4);
  const sizeMB = sizeBytes / (1024 * 1024);
  if (sizeMB >= 1) return `${sizeMB.toFixed(2)} MB`;
  const sizeKB = sizeBytes / 1024;
  return `${Math.max(1, sizeKB).toFixed(0)} KB`;
};
