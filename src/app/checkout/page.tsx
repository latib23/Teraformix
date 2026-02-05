import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from '../../components/Header';
import { api } from '../../lib/api';
import Footer from '../../components/Footer';
import { CreditCard, FileText, Check, Truck, MapPin, ShieldCheck, Package, Plane, X, Loader2, ShoppingCart, ChevronDown, ChevronUp, AlertCircle, RefreshCw, ArrowRight, Banknote } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useGlobalContent } from '../../contexts/GlobalContent';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { auth } from '../../lib/auth';

// --- Configuration Data ---
const COUNTRY_CONFIG: Record<string, { name: string; code: string; mask: string; labelState: string; labelZip: string; regions: string[] }> = {
  // Major Markets
  US: {
    name: "United States",
    code: "+1",
    mask: "(###) ###-####",
    labelState: "State",
    labelZip: "Zip Code",
    regions: [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ]
  },
  CA: {
    name: "Canada",
    code: "+1",
    mask: "(###) ###-####",
    labelState: "Province",
    labelZip: "Postal Code",
    regions: ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]
  },
  GB: {
    name: "United Kingdom",
    code: "+44",
    mask: "#### ######",
    labelState: "Region",
    labelZip: "Postcode",
    regions: ["England", "Scotland", "Wales", "Northern Ireland"]
  },
  AU: {
    name: "Australia",
    code: "+61",
    mask: "#### ### ###",
    labelState: "State",
    labelZip: "Postcode",
    regions: ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]
  },

  // Europe & Others (Alphabetical)
  AL: { name: "Albania", code: "+355", mask: "## ### ####", labelState: "County", labelZip: "Postal Code", regions: [] },
  AD: { name: "Andorra", code: "+376", mask: "### ###", labelState: "Parish", labelZip: "Postal Code", regions: [] },
  AM: { name: "Armenia", code: "+374", mask: "## ######", labelState: "Province", labelZip: "Postal Code", regions: [] },
  AT: { name: "Austria", code: "+43", mask: "#### #######", labelState: "State", labelZip: "Postcode", regions: [] },
  BY: { name: "Belarus", code: "+375", mask: "## ###-##-##", labelState: "Region", labelZip: "Postal Code", regions: [] },
  BE: { name: "Belgium", code: "+32", mask: "### ## ## ##", labelState: "Province", labelZip: "Postcode", regions: [] },
  BA: { name: "Bosnia and Herzegovina", code: "+387", mask: "## ###-###", labelState: "Canton", labelZip: "Postal Code", regions: [] },
  BG: { name: "Bulgaria", code: "+359", mask: "## ### ###", labelState: "District", labelZip: "Postal Code", regions: [] },
  HR: { name: "Croatia", code: "+385", mask: "## #### ###", labelState: "County", labelZip: "Postal Code", regions: [] },
  CY: { name: "Cyprus", code: "+357", mask: "## ######", labelState: "District", labelZip: "Postcode", regions: [] },
  CZ: { name: "Czech Republic", code: "+420", mask: "### ### ###", labelState: "Region", labelZip: "Postal Code", regions: [] },
  DK: { name: "Denmark", code: "+45", mask: "## ## ## ##", labelState: "Region", labelZip: "Postcode", regions: [] },
  EE: { name: "Estonia", code: "+372", mask: "#### ####", labelState: "County", labelZip: "Postal Code", regions: [] },
  FI: { name: "Finland", code: "+358", mask: "## ### ## ##", labelState: "Region", labelZip: "Postcode", regions: [] },
  FR: { name: "France", code: "+33", mask: "# ## ## ## ##", labelState: "Region", labelZip: "Postcode", regions: [] },
  GE: { name: "Georgia", code: "+995", mask: "### ## ## ##", labelState: "Region", labelZip: "Postal Code", regions: [] },
  DE: { name: "Germany", code: "+49", mask: "#### #######", labelState: "State", labelZip: "Postcode", regions: [] },
  GR: { name: "Greece", code: "+30", mask: "### #######", labelState: "Region", labelZip: "Postcode", regions: [] },
  HU: { name: "Hungary", code: "+36", mask: "## ### ####", labelState: "County", labelZip: "Postal Code", regions: [] },
  IS: { name: "Iceland", code: "+354", mask: "### ####", labelState: "Region", labelZip: "Postcode", regions: [] },
  IE: { name: "Ireland", code: "+353", mask: "## #######", labelState: "County", labelZip: "Eircode", regions: [] },
  IL: { name: "Israel", code: "+972", mask: "### ### ####", labelState: "District", labelZip: "Postal Code", regions: [] },
  IT: { name: "Italy", code: "+39", mask: "### #######", labelState: "Region", labelZip: "Postcode", regions: [] },
  JP: { name: "Japan", code: "+81", mask: "## #### ####", labelState: "Prefecture", labelZip: "Postal Code", regions: [] },
  KZ: { name: "Kazakhstan", code: "+7", mask: "(###) ###-##-##", labelState: "Region", labelZip: "Postal Code", regions: [] },
  XK: { name: "Kosovo", code: "+383", mask: "## ### ###", labelState: "District", labelZip: "Postal Code", regions: [] },
  LV: { name: "Latvia", code: "+371", mask: "## ### ###", labelState: "Municipality", labelZip: "Postal Code", regions: [] },
  LI: { name: "Liechtenstein", code: "+423", mask: "### ### ###", labelState: "Municipality", labelZip: "Postal Code", regions: [] },
  LT: { name: "Lithuania", code: "+370", mask: "(8-###) #####", labelState: "County", labelZip: "Postal Code", regions: [] },
  LU: { name: "Luxembourg", code: "+352", mask: "### #####", labelState: "District", labelZip: "Postcode", regions: [] },
  MT: { name: "Malta", code: "+356", mask: "#### ####", labelState: "Region", labelZip: "Postcode", regions: [] },
  MX: { name: "Mexico", code: "+52", mask: "## #### ####", labelState: "State", labelZip: "Postal Code", regions: [] },
  MD: { name: "Moldova", code: "+373", mask: "#### ####", labelState: "District", labelZip: "Postal Code", regions: [] },
  MC: { name: "Monaco", code: "+377", mask: "## ## ## ##", labelState: "District", labelZip: "Postcode", regions: [] },
  ME: { name: "Montenegro", code: "+382", mask: "## ### ###", labelState: "Municipality", labelZip: "Postal Code", regions: [] },
  NL: { name: "Netherlands", code: "+31", mask: "## #######", labelState: "Province", labelZip: "Postcode", regions: [] },
  MK: { name: "North Macedonia", code: "+389", mask: "## ### ###", labelState: "Municipality", labelZip: "Postal Code", regions: [] },
  NO: { name: "Norway", code: "+47", mask: "### ## ###", labelState: "County", labelZip: "Postcode", regions: [] },
  PL: { name: "Poland", code: "+48", mask: "### ### ###", labelState: "Voivodeship", labelZip: "Postcode", regions: [] },
  PT: { name: "Portugal", code: "+351", mask: "## ### ####", labelState: "District", labelZip: "Postcode", regions: [] },
  RO: { name: "Romania", code: "+40", mask: "## ### ####", labelState: "County", labelZip: "Postal Code", regions: [] },
  RU: { name: "Russia", code: "+7", mask: "(###) ###-##-##", labelState: "Oblast", labelZip: "Postal Code", regions: [] },
  SM: { name: "San Marino", code: "+378", mask: "#### ######", labelState: "Municipality", labelZip: "Postal Code", regions: [] },
  RS: { name: "Serbia", code: "+381", mask: "## ### ####", labelState: "District", labelZip: "Postal Code", regions: [] },
  SG: { name: "Singapore", code: "+65", mask: "#### ####", labelState: "Region", labelZip: "Postal Code", regions: [] },
  SK: { name: "Slovakia", code: "+421", mask: "### ### ###", labelState: "Region", labelZip: "Postal Code", regions: [] },
  SI: { name: "Slovenia", code: "+386", mask: "## ### ###", labelState: "Region", labelZip: "Postal Code", regions: [] },
  ES: { name: "Spain", code: "+34", mask: "### ## ## ##", labelState: "Province", labelZip: "Postal Code", regions: [] },
  SE: { name: "Sweden", code: "+46", mask: "##-### ## ##", labelState: "County", labelZip: "Postal Code", regions: [] },
  CH: { name: "Switzerland", code: "+41", mask: "## ### ## ##", labelState: "Canton", labelZip: "Postal Code", regions: [] },
  TR: { name: "Turkey", code: "+90", mask: "(###) ### ## ##", labelState: "Province", labelZip: "Postal Code", regions: [] },
  UA: { name: "Ukraine", code: "+380", mask: "## ### ## ##", labelState: "Oblast", labelZip: "Postal Code", regions: [] },
  VA: { name: "Vatican City", code: "+39", mask: "## #### ####", labelState: "AC", labelZip: "Postal Code", regions: [] },
  SA: {
    name: "Saudi Arabia",
    code: "+966",
    mask: "## ### ####",
    labelState: "Province",
    labelZip: "Postal Code",
    regions: ["Riyadh", "Makkah", "Madinah", "Eastern Province", "Asir", "Tabuk", "Hail", "Northern Borders", "Jazan", "Najran", "Al-Bahah", "Al-Jawf", "Al-Qassim"]
  },
  AE: {
    name: "United Arab Emirates",
    code: "+971",
    mask: "## ### ####",
    labelState: "Emirate",
    labelZip: "Postal Code",
    regions: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al-Quwain", "Ras Al-Khaimah", "Fujairah"]
  },
  QA: {
    name: "Qatar",
    code: "+974",
    mask: "#### ####",
    labelState: "Municipality",
    labelZip: "Postal Code",
    regions: ["Ad-Dawhah", "Al-Khawr", "Al-Wakrah", "Ar-Rayyan", "Ash-Shamahal", "Az-Zayayin", "Umm Salal", "Al-Daayen"]
  },
  KW: {
    name: "Kuwait",
    code: "+965",
    mask: "#### ####",
    labelState: "Governorate",
    labelZip: "Postal Code",
    regions: ["Al-Asimah", "Hawalli", "Farwaniya", "Mubarak Al-Kabeer", "Ahmadi", "Jahra"]
  },
  BH: {
    name: "Bahrain",
    code: "+973",
    mask: "#### ####",
    labelState: "Governorate",
    labelZip: "Postal Code",
    regions: ["Capital", "Muharraq", "Northern", "Southern"]
  },
  OM: {
    name: "Oman",
    code: "+968",
    mask: "#### ####",
    labelState: "Governorate",
    labelZip: "Postal Code",
    regions: ["Muscat", "Dhofar", "Musandam", "Al Buraimi", "Al Dakhiliyah", "Al Batinah North", "Al Batinah South", "Al Sharqiyah North", "Al Sharqiyah South", "Al Dhahirah", "Al Wusta"]
  },
};

let placesScriptPromise: Promise<void> | null = null;
let recaptchaPromise: Promise<void> | null = null;
const ENV_RECAPTCHA_SITE_KEY = ((import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || '').trim();

// --- Types ---
interface AddressData {
  firstName: string;
  lastName: string;
  company: string;
  email?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

interface ShippingRate {
  serviceName: string;
  serviceCode: string;
  shipmentCost: number;
  carrierCode: string;
  transitDays?: number;
  otherCost?: number;
}

// --- Utilities ---
const formatPhoneNumber = (value: string, countryCode: string) => {
  if (!value) return value;

  const onlyNums = value.replace(/\D/g, '');
  const config = COUNTRY_CONFIG[countryCode] || COUNTRY_CONFIG.US;

  // US/CA Formatting (###) ###-####
  if (countryCode === 'US' || countryCode === 'CA') {
    if (onlyNums.length <= 3) return onlyNums;
    if (onlyNums.length <= 6) return `(${onlyNums.slice(0, 3)}) ${onlyNums.slice(3)}`;
    return `(${onlyNums.slice(0, 3)}) ${onlyNums.slice(3, 6)}-${onlyNums.slice(6, 10)}`;
  }

  // Generic formatting for others (grouping by spaces logic or raw)
  return value;
};

// --- Child Component for Payment Form to access useStripe context ---
const PaymentForm = ({
  total,
  handlePlaceOrder,
  isProcessing,
  paymentMethod,
  setPaymentMethod,
  poNumber,
  setPoNumber,
  poFile,
  setPoFile,
  handlePoUpload,
  stripeError,
  bankInstructions,
  enablePO,
  enableBankTransfer,
}: any) => {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
        <span className="bg-navy-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
        Payment Method
      </h2>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setPaymentMethod('CC')}
          className={`flex-1 py-3 border rounded-lg bg-white flex items-center justify-center gap-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-navy-500 ${paymentMethod === 'CC' ? 'bg-navy-50 border-navy-500 text-navy-900 ring-1 ring-navy-500 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
        >
          <CreditCard className="w-5 h-5" /> Credit Card
        </button>
        {enablePO && (
          <button
            onClick={() => setPaymentMethod('PO')}
            className={`flex-1 py-3 border rounded-lg bg-white flex items-center justify-center gap-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-navy-500 ${paymentMethod === 'PO' ? 'bg-navy-50 border-navy-500 text-navy-900 ring-1 ring-navy-500 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText className="w-5 h-5" /> Purchase Order
          </button>
        )}
        {enableBankTransfer && (
          <button
            onClick={() => setPaymentMethod('BANK')}
            className={`flex-1 py-3 border rounded-lg bg-white flex items-center justify-center gap-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-navy-500 ${paymentMethod === 'BANK' ? 'bg-navy-50 border-navy-500 text-navy-900 ring-1 ring-navy-500 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            <Banknote className="w-5 h-5" /> Bank Transfer
          </button>
        )}
      </div>

      {paymentMethod === 'CC' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Stripe Card Element */}
          <div className="border border-gray-300 bg-white rounded p-4">
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }} />
          </div>
          {stripeError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {stripeError}
            </div>
          )}
        </div>
      ) : paymentMethod === 'PO' ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100">
            <span className="font-bold">Net 30 Terms:</span> Subject to credit approval. Please upload your signed PO.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full border border-gray-300 bg-white rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
              placeholder="PO-2023-XXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload PO Document (PDF) <span className="text-red-500">*</span></label>
            {!poFile ? (
              <input
                type="file"
                accept=".pdf"
                onChange={handlePoUpload}
                className="w-full border border-gray-300 bg-white rounded p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100 cursor-pointer"
              />
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded text-green-800 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-1.5 rounded-full">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-sm">
                    <span className="font-bold block text-green-700">File Uploaded Successfully</span>
                    <span className="text-xs text-green-600 block truncate max-w-[200px]">{poFile.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => setPoFile(null)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100">
            <span className="font-bold">Bank Transfer:</span> Use the instructions below to complete payment. Your order will be pending until we confirm receipt.
          </div>
          {bankInstructions && (
            <pre className="bg-white border border-gray-200 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {bankInstructions}
            </pre>
          )}
        </div>
      )}

      <button
        onClick={() => {
          if (paymentMethod === 'CC' && (!stripe || !elements)) {
            return;
          }
          handlePlaceOrder(stripe, elements);
        }}
        disabled={paymentMethod === 'CC' ? (isProcessing || !stripe || !elements) : isProcessing}
        className="w-full mt-8 bg-action-600 hover:bg-action-500 disabled:bg-gray-400 text-white font-bold py-3.5 rounded shadow-lg transition transform active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-600 flex items-center justify-center gap-2"
      >
        {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
        {isProcessing ? 'Processing Order...' : (paymentMethod === 'CC' && (!stripe || !elements) ? 'Initializing Payment…' : `Pay $${total.toLocaleString()}`)}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        256-bit SSL Encrypted Transaction
      </div>
    </div>
  )
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { content } = useGlobalContent();
  const { cageCode, dunsNumber } = content.general;

  // --- Form State ---
  const [shippingData, setShippingData] = useState<AddressData>({
    firstName: '', lastName: '', company: '', email: '', street: '', city: '', state: '', zip: '', country: 'US', phone: ''
  });

  const [billingData, setBillingData] = useState<AddressData>({
    firstName: '', lastName: '', company: '', email: '', street: '', city: '', state: '', zip: '', country: 'US', phone: ''
  });

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [paymentMethod, setPaymentMethod] = useState<'CC' | 'PO' | 'BANK'>('CC');
  const [addressTab, setAddressTab] = useState<'SHIPPING' | 'BILLING'>('SHIPPING');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [rateError, setRateError] = useState('');

  const [poFile, setPoFile] = useState<File | null>(null);
  const [showItems, setShowItems] = useState(false);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setShowItems(window.innerWidth >= 768);
      }
    } catch { }
  }, []);
  const pmInitRef = useRef<boolean>(true);

  // Checkout Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [stripeError, setStripeError] = useState('');
  const shippingStreetRef = useRef<HTMLInputElement | null>(null);
  const billingStreetRef = useRef<HTMLInputElement | null>(null);
  const mapsKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // Track state in refs for stable event listeners
  const shipRef = useRef(shippingData);
  const billRef = useRef(billingData);
  const cartRef = useRef(cart);
  useEffect(() => { shipRef.current = shippingData; }, [shippingData]);
  useEffect(() => { billRef.current = billingData; }, [billingData]);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const ensurePlacesScript = () => {
    if (!mapsKey) return Promise.resolve();
    if ((window as any).google?.maps?.places) return Promise.resolve();
    if (placesScriptPromise) return placesScriptPromise;
    const existing = Array.from(document.scripts).some(s => s.src.includes('maps.googleapis.com/maps/api/js'));
    if (existing) {
      placesScriptPromise = new Promise<void>((resolve) => {
        const check = () => {
          if ((window as any).google?.maps?.places) resolve(); else setTimeout(check, 50);
        };
        check();
      });
      return placesScriptPromise;
    }
    placesScriptPromise = new Promise<void>((resolve) => {
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
      s.async = true;
      s.onload = () => resolve();
      document.head.appendChild(s);
    });
    return placesScriptPromise;
  };

  const ensureRecaptcha = (siteKey?: string) => {
    const g = (window as any).grecaptcha;
    if (g && typeof g.ready === 'function') {
      return new Promise<void>((resolve) => {
        try { g.ready(() => resolve()); } catch { resolve(); }
      });
    }
    if (recaptchaPromise) return recaptchaPromise;
    const desiredKey = (siteKey || recaptchaSiteKey || '').trim();
    let existingSrc: string | null = null;
    for (const s of Array.from(document.scripts)) {
      if (s.src.includes('recaptcha/api.js')) { existingSrc = s.src; break; }
    }
    let existingKey = '';
    if (existingSrc) {
      const i = existingSrc.indexOf('render=');
      if (i >= 0) {
        const q = existingSrc.slice(i + 7);
        existingKey = q.split('&')[0];
      }
    }
    let existing = !!existingSrc;
    if (existing && desiredKey && existingKey && existingKey !== desiredKey) {
      for (const s of Array.from(document.scripts)) {
        if (s.src.includes('recaptcha/api.js')) { try { s.remove(); } catch { } }
      }
      try { delete (window as any).grecaptcha; } catch { }
      existing = false;
    }
    recaptchaPromise = new Promise<void>((resolve) => {
      const checkReady = () => {
        const gr = (window as any).grecaptcha;
        if (gr && typeof gr.ready === 'function') {
          try { gr.ready(() => resolve()); } catch { resolve(); }
        } else {
          setTimeout(checkReady, 50);
        }
      };
      if (existing) {
        checkReady();
      } else {
        const s = document.createElement('script');
        const key = desiredKey;
        s.src = `https://www.google.com/recaptcha/api.js?render=${key}`;
        s.async = true;
        s.onload = () => checkReady();
        s.onerror = () => {
          const alt = document.createElement('script');
          alt.src = `https://www.recaptcha.net/recaptcha/api.js?render=${key}`;
          alt.async = true;
          alt.onload = () => checkReady();
          document.head.appendChild(alt);
        };
        document.head.appendChild(s);
      }
    });
    return recaptchaPromise;
  };

  useEffect(() => {
    if (!shippingStreetRef.current) return;
    ensurePlacesScript().then(() => {
      const g = (window as any).google;
      if (!g?.maps?.places) return;
      const ac = new g.maps.places.Autocomplete(shippingStreetRef.current, { types: ['address'], componentRestrictions: shippingData.country ? { country: shippingData.country.toLowerCase() } : undefined });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const comps = place?.address_components || [];
        const findComp = (t: string) => comps.find((x: any) => Array.isArray(x.types) && x.types.includes(t));
        const pick = (t: string) => {
          const c = findComp(t);
          return c ? c.long_name : '';
        };
        const num = pick('street_number');
        const rt = pick('route');
        const street = [num, rt].filter(Boolean).join(' ') || shippingData.street;
        const city = pick('locality') || pick('postal_town') || shippingData.city;
        const stateComp = findComp('administrative_area_level_1');
        const state = (stateComp?.short_name || stateComp?.long_name || shippingData.state);
        const zip = pick('postal_code') || shippingData.zip;
        const countryComp = findComp('country');
        const country = (countryComp?.short_name || shippingData.country);
        setShippingData(prev => ({ ...prev, street, city, state, zip, country }));
        setErrors(prev => { const e = { ...prev }; delete e.street; delete e.city; delete e.state; delete e.zip; delete e.country; return e; });
      });
    });
  }, [shippingStreetRef.current, shippingData.country]);

  useEffect(() => {
    if (!billingStreetRef.current) return;
    ensurePlacesScript().then(() => {
      const g = (window as any).google;
      if (!g?.maps?.places) return;
      const ac = new g.maps.places.Autocomplete(billingStreetRef.current, { types: ['address'], componentRestrictions: billingData.country ? { country: billingData.country.toLowerCase() } : undefined });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const comps = place?.address_components || [];
        const findComp = (t: string) => comps.find((x: any) => Array.isArray(x.types) && x.types.includes(t));
        const pick = (t: string) => {
          const c = findComp(t);
          return c ? c.long_name : '';
        };
        const num = pick('street_number');
        const rt = pick('route');
        const street = [num, rt].filter(Boolean).join(' ') || billingData.street;
        const city = pick('locality') || pick('postal_town') || billingData.city;
        const stateComp = findComp('administrative_area_level_1');
        const state = (stateComp?.short_name || stateComp?.long_name || billingData.state);
        const zip = pick('postal_code') || billingData.zip;
        const countryComp = findComp('country');
        const country = (countryComp?.short_name || billingData.country);
        setBillingData(prev => ({ ...prev, street, city, state, zip, country }));
      });
    });
  }, [billingStreetRef.current, billingData.country]);

  const verifyCityStateZip = async (isShipping: boolean) => {
    const key = mapsKey;
    if (!key) return true;
    const addr = isShipping ? shippingData : billingData;
    if (!addr.city || !addr.state || !addr.zip || !addr.country) return true;
    const q = [addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&components=country:${addr.country}&key=${key}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const ok = data && data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0;
      if (!ok) return true;
      const comps = data.results[0].address_components || [];
      const match = (type: string, val: string) => !val || comps.some((c: any) => Array.isArray(c.types) && c.types.includes(type) && String(c.long_name).toLowerCase() === String(val).toLowerCase());
      const cityOk = match('locality', addr.city) || match('postal_town', addr.city);
      const stateOk = match('administrative_area_level_1', addr.state) || comps.some((c: any) => Array.isArray(c.types) && c.types.includes('administrative_area_level_1') && String(c.short_name).toLowerCase() === String(addr.state).toLowerCase());
      const zipShort = String(addr.zip).split('-')[0].trim();
      const zipOk = comps.some((c: any) => Array.isArray(c.types) && c.types.includes('postal_code') && c.long_name && (String(c.long_name).toLowerCase() === zipShort.toLowerCase()));
      const errs: Record<string, string> = {};
      if (!cityOk) errs.city = 'City does not match zip/state';
      if (!stateOk) errs.state = 'State does not match zip/city';
      if (!zipOk) errs.zip = 'Zip does not match city/state';
      if (isShipping) {
        setErrors(prev => ({ ...prev, ...errs }));
      } else {
        if (Object.keys(errs).length > 0) return false;
      }
      return Object.keys(errs).length === 0;
    } catch {
      return true;
    }
  };

  // Initialize Stripe Promise (CMS key with env & backend fallback)
  const [resolvedStripeKey, setResolvedStripeKey] = useState<string>('');
  const [stripeReady, setStripeReady] = useState<boolean>(false);
  const stripePublicKey = (content.payment?.stripePublicKey || (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY || resolvedStripeKey || '').trim();
  const [resolvedRecaptchaKey, setResolvedRecaptchaKey] = useState<string>('');
  const recaptchaSiteKey = (ENV_RECAPTCHA_SITE_KEY || resolvedRecaptchaKey || '').trim();
  const stripePromise = useMemo(() => {
    if (!stripePublicKey) return null;
    const p = loadStripe(stripePublicKey);
    p.then((s) => { if (s) setStripeReady(true); }).catch(() => {
      setStripeError('Failed to load Stripe.js. Please check network/ad blocker.');
    });
    return p;
  }, [stripePublicKey]);

  useEffect(() => {
    const poEnabled = !!content.payment?.enablePO;
    const bankEnabled = !!content.payment?.enableBankTransfer;
    if (paymentMethod === 'PO' && !poEnabled) setPaymentMethod('CC');
    if (paymentMethod === 'BANK' && !bankEnabled) setPaymentMethod('CC');
  }, [content.payment?.enablePO, content.payment?.enableBankTransfer]);

  useEffect(() => {
    if (!content.payment?.stripePublicKey && !(import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY) {
      api.get<{ key: string }>('payments/public-key').then((data) => {
        if (data?.key) setResolvedStripeKey(String(data.key));
      }).catch(() => { });
    }
  }, [content.payment?.stripePublicKey]);

  useEffect(() => {
    if (!ENV_RECAPTCHA_SITE_KEY) {
      api.get<{ key: string }>('payments/recaptcha-key').then((data) => {
        if (data?.key) setResolvedRecaptchaKey(String(data.key));
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    if (!stripePublicKey) {
      setStripeError('Card payments unavailable: missing Stripe publishable key.');
      return;
    }
    api.get<{ enabled: boolean; hasPublicKey: boolean }>('payments/availability').then((data) => {
      if (data && data.enabled) {
        setStripeError('');
      } else {
        setStripeError('Card payments unavailable: server Stripe configuration missing.');
      }
    }).catch((_e: any) => {
      setStripeError('Card payments unavailable: server Stripe configuration missing.');
    });
  }, [stripePublicKey]);

  useEffect(() => {
    const cmsKey = !!content.payment?.stripePublicKey;
    const envKey = !!(import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY;
    const resolved = !!resolvedStripeKey;
    if (cmsKey || envKey || resolved) {
      console.debug('[Checkout] Stripe key resolved', { cmsKey, envKey, resolved, stripePublicKey });
    } else {
      console.debug('[Checkout] Stripe key missing');
    }
  }, [stripePublicKey, resolvedStripeKey, content.payment?.stripePublicKey]);

  // Fetch Shipping Rates when valid address is present
  const fetchShippingRates = async (address: AddressData) => {
    if (!address.zip || !address.country || !address.city) return;

    setIsLoadingRates(true);
    setRateError('');
    setShippingRates([]);
    setSelectedRate(null);

    try {
      // Try real backend first
      const rates: ShippingRate[] | null = await api.post<ShippingRate[]>('shipping/rates', {
        address: {
          postalCode: address.zip,
          country: address.country || 'US',
          city: address.city,
          state: address.state
        },
        items: cart.map(item => ({
          sku: item.sku,
          quantity: item.quantity,
          weight: item.weight || "1 lb",
          dimensions: item.dimensions
        }))
      });

      if (rates) {
        setShippingRates(rates);
        if (rates.length > 0) setSelectedRate(rates[0]);
      }
    } catch (err) {
      // Mock Rates Logic
      setTimeout(() => {
        const isInternational = address.country !== 'US';
        let mockRates: ShippingRate[] = [];

        if (isInternational) {
          mockRates = [
            { serviceName: 'International Economy', serviceCode: 'INTL_ECO', shipmentCost: 125.00, carrierCode: 'FedEx', transitDays: 10, otherCost: 0 },
            { serviceName: 'International Priority', serviceCode: 'INTL_PRI', shipmentCost: 245.00, carrierCode: 'FedEx', transitDays: 4, otherCost: 0 },
          ];
        } else {
          mockRates = [
            { serviceName: 'Standard Ground', serviceCode: 'GND', shipmentCost: 0, carrierCode: 'UPS', transitDays: 5, otherCost: 0 },
            { serviceName: '2-Day Air', serviceCode: '2DA', shipmentCost: 45.50, carrierCode: 'UPS', transitDays: 2, otherCost: 0 },
            { serviceName: 'Overnight AM', serviceCode: '1DA', shipmentCost: 85.00, carrierCode: 'UPS', transitDays: 1, otherCost: 0 },
          ];
        }
        setShippingRates(mockRates);
        setSelectedRate(mockRates[0]);
        setRateError('');
      }, 800);
    } finally {
      // Ensure loading spinner shows for a moment for UX
      setTimeout(() => setIsLoadingRates(false), 800);
    }
  };

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
        g('event', 'begin_checkout', { items, value: cartTotal, currency: 'USD' });
      }
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'begin_checkout', items, value: cartTotal, currency: 'USD' });
    } catch { }
  }, []);

  useEffect(() => {
    if (pmInitRef.current) { pmInitRef.current = false; return; }
    if (!cart || cart.length === 0) return;
    try {
      const g = (window as any).gtag;
      const payload = { payment_type: paymentMethod === 'CC' ? 'card' : paymentMethod === 'PO' ? 'po' : 'bank_transfer' } as any;
      if (typeof g === 'function') {
        g('event', 'add_payment_info', payload);
      }
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'add_payment_info', ...payload });
    } catch { }
  }, [paymentMethod]);
  useEffect(() => {
    const handler = () => {
      try {
        const s = shipRef.current;
        const b = billRef.current;
        const c = cartRef.current;
        const hasData = s.email || s.firstName || s.street || c.length > 0;
        if (!hasData) return;
        const payload = {
          type: 'CHECKOUT',
          source: 'checkout',
          name: `${s.firstName} ${s.lastName}`.trim(),
          email: s.email,
          phone: s.phone,
          company: s.company,
          cart: c,
          shipping: s,
          billing: b,
        };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/quotes/abandon', blob);
      } catch { }
    };

    const visHandler = () => {
      if (document.visibilityState === 'hidden') handler();
    };

    window.addEventListener('beforeunload', handler);
    document.addEventListener('visibilitychange', visHandler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }, []);

  const handleInputChange = (field: keyof AddressData, value: string, isShipping: boolean = true) => {
    let processedValue = value;
    const currentCountry = isShipping ? shippingData.country : billingData.country;

    // Special handling for Phone Numbers
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value, currentCountry);
    }

    if (isShipping) {
      setShippingData(prev => {
        const newState = { ...prev, [field]: processedValue };
        // If country changes, reset state and recalculate phone if needed (though phone is user input mostly)
        if (field === 'country') {
          newState.state = '';
          newState.phone = ''; // Clear phone on country change to avoid format conflicts
        }
        return newState;
      });

      if (processedValue.trim()) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } else {
      setBillingData(prev => {
        const newState = { ...prev, [field]: processedValue };
        if (field === 'country') {
          newState.state = '';
          newState.phone = '';
        }
        return newState;
      });
    }
  };

  const validateShipping = () => {
    const newErrors: Record<string, string> = {};
    const countryConfig = COUNTRY_CONFIG[shippingData.country] || COUNTRY_CONFIG.US;

    if (!shippingData.firstName) newErrors.firstName = "First Name is required";
    if (!shippingData.lastName) newErrors.lastName = "Last Name is required";
    if (!shippingData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingData.email)) newErrors.email = "Enter a valid email";
    if (!shippingData.street) newErrors.street = "Street Address is required";
    if (!shippingData.city) newErrors.city = "City is required";

    // State validation only if the country has defined regions or if it's commonly required
    if (countryConfig.regions.length > 0 && !shippingData.state) {
      newErrors.state = `${countryConfig.labelState} is required`;
    } else if ((shippingData.country === 'US' || shippingData.country === 'CA') && !shippingData.state) {
      newErrors.state = "State / Province is required";
    }

    if (!shippingData.zip) newErrors.zip = "Zip / Postal Code is required";
    if (!shippingData.phone) newErrors.phone = "Phone is required";
    if (!shippingData.country) newErrors.country = "Country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBilling = () => {
    if (billingSameAsShipping) return true;
    const required = ['firstName', 'lastName', 'street', 'city', 'state', 'zip'] as const;
    for (const field of required) {
      if (!billingData[field]) {
        alert("Please complete all billing address fields.");
        setAddressTab('BILLING');
        return false;
      }
    }
    return true;
  };

  const handleShippingNext = () => {
    const run = async () => {
      if (!validateShipping()) {
        window.scrollTo(0, 0);
        return;
      }
      const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
      if (key) {
        const q = [shippingData.street, shippingData.city, shippingData.state, shippingData.zip].filter(Boolean).join(', ');
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&components=country:${shippingData.country}&key=${key}`;
          const resp = await fetch(url);
          const data = await resp.json();
          const ok = data && data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0;
          if (ok) {
            const comps = data.results[0]?.address_components || [];
            const zipShort = String(shippingData.zip).split('-')[0].trim().toLowerCase();
            const zipMatch = comps.some((c: any) => (c.types || []).includes('postal_code') && c.long_name && zipShort && String(c.long_name).toLowerCase() === zipShort);
            if (zipShort && !zipMatch) {
              setErrors(prev => ({ ...prev, zip: 'Zip/Postal Code does not match' }));
              return;
            }
          }
        } catch {

        }
      }
      setAddressTab('BILLING');
      fetchShippingRates(shippingData);
    };
    run();
  };

  const shippingCost = selectedRate ? selectedRate.shipmentCost : 0;
  const finalTotal = cartTotal + shippingCost;

  useEffect(() => {
    if (!selectedRate || !cart || cart.length === 0) return;
    try {
      const items = cart.map((item) => ({
        item_id: item.sku,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }));
      const g = (window as any).gtag;
      const payload = {
        items,
        shipping_tier: selectedRate.serviceCode,
        value: finalTotal,
        currency: 'USD'
      } as any;
      if (typeof g === 'function') {
        g('event', 'add_shipping_info', payload);
      }
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: 'add_shipping_info', ...payload });
    } catch { }
  }, [selectedRate, finalTotal]);

  const handlePoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPoFile(file);
        setStripeError('');
      } else {
        alert("Please select a valid PDF document.");
        e.target.value = "";
      }
    }
  };

  const handlePlaceOrder = async (stripe: any, elements: any) => {
    setStripeError('');

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    if (!validateShipping()) {
      setAddressTab('SHIPPING');
      window.scrollTo(0, 0);
      return;
    }
    if (!selectedRate) {
      alert("Please select a shipping method.");
      return;
    }
    if (!validateBilling()) {
      return;
    }

    if (paymentMethod === 'PO') {
      if (!poNumber) {
        setStripeError("PO Number is required");
        return;
      }
      if (!poFile) {
        setStripeError("PO Document upload is required");
        return;
      }
    }

    setIsProcessing(true);

    let recaptchaToken = '';
    let siteKeyToUse = recaptchaSiteKey || ENV_RECAPTCHA_SITE_KEY;
    if (!siteKeyToUse) {
      try {
        const data = await api.get<{ key: string }>('payments/recaptcha-key');
        if (data?.key) {
          siteKeyToUse = String(data.key);
          setResolvedRecaptchaKey(siteKeyToUse);
        }
      } catch { }
    }
    if (!siteKeyToUse) {
      setStripeError('Security verification unavailable. Proceeding without verification.');
    }
    try {
      await ensureRecaptcha(siteKeyToUse);
      const gr = (window as any).grecaptcha;
      if (gr) {
        const exec = () => gr.execute(siteKeyToUse, { action: 'checkout' });
        try {
          recaptchaToken = await exec();
          if (!recaptchaToken) {
            recaptchaToken = await exec();
          }
        } catch { }
      }
    } catch { }

    if (!recaptchaToken) {
      setStripeError('Security verification failed. Proceeding without verification.');
    }

    try {
      const itemsPayload = cart.map(item => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      let paymentConfirmation: any = null;

      if (paymentMethod === 'CC') {
        if (!stripe || !elements) {
          throw new Error('Payment system unavailable');
        }
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card input unavailable');
        }
        const bill = billingSameAsShipping ? shippingData : billingData;
        const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
        if (key && !billingSameAsShipping) {
          const q = [bill.street, bill.city, bill.state, bill.zip, bill.country].filter(Boolean).join(', ');
          try {
            const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}`);
            const data = await resp.json();
            const ok = data && data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0;
            if (!ok) {
              alert('Billing address could not be verified.');
              setIsProcessing(false);
              return;
            }
          } catch {

          }
        }
        const intentInit = await api.post<any>('/payments/intent', {
          currency: 'usd',
          amount: Math.round(finalTotal * 100),
          items: itemsPayload.map(p => ({ sku: p.sku, quantity: p.quantity })),
          address: {
            postalCode: shippingData.zip,
            country: shippingData.country || 'US',
            city: shippingData.city,
            state: shippingData.state,
          },
          serviceCode: selectedRate?.serviceCode,
          metadata: {
            shippingCost: shippingCost,
            serviceName: selectedRate?.serviceName || '',
          },
          recaptchaToken
        });
        const clientSecret = (intentInit as any)?.clientSecret;
        if (!clientSecret) {
          throw new Error('Failed to initialize payment');
        }
        const conf = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: [bill.firstName, bill.lastName].filter(Boolean).join(' '),
              email: bill.email || shippingData.email || undefined,
              address: {
                line1: bill.street,
                city: bill.city,
                state: bill.state,
                postal_code: bill.zip,
                country: bill.country,
              },
            },
          },
        });
        if ((conf as any)?.error) {
          throw new Error((conf as any).error.message || 'Card authorization failed');
        }
        paymentConfirmation = conf;
      }

      const payload: any = {
        items: itemsPayload,
        total: finalTotal,
        paymentMethod: paymentMethod === 'CC' ? 'STRIPE' : (paymentMethod === 'PO' ? 'PO' : 'BANK_TRANSFER'),
        poNumber: paymentMethod === 'PO' ? poNumber : undefined,
        shippingAddress: { ...shippingData, shippingCost, shipmentService: selectedRate?.serviceName },
        billingAddress: billingSameAsShipping ? shippingData : billingData,
        status: paymentMethod === 'PO' || paymentMethod === 'BANK' ? 'PENDING_APPROVAL' : 'PROCESSING',
        recaptchaToken
      };

      if (paymentConfirmation && (paymentConfirmation as any)?.paymentIntent?.payment_method) {
        payload.paymentMethodId = (paymentConfirmation as any).paymentIntent.payment_method;
      }

      const endpoint = auth.isAuthenticated() ? '/orders' : '/orders/guest';
      let res: any;
      try {
        res = await api.post<{ id: string }>(endpoint, payload);
      } catch (e: any) {
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('unauthorized')) {
          auth.logout();
          res = await api.post<{ id: string }>('/orders/guest', payload);
        } else {
          throw e;
        }
      }
      const orderId = (res as any)?.id || 'ORDER';
      try { sessionStorage.setItem('lastOrderId', orderId); } catch { }
      clearCart();
      navigate(`/thank-you?order=${orderId}`, { state: { orderNumber: orderId } });

    } catch (error: any) {
      console.error("Order Error:", error);
      setStripeError(error.message || 'An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  // Dynamic Labels & Lists based on selected country
  const getCountryMeta = (countryCode: string) => COUNTRY_CONFIG[countryCode] || COUNTRY_CONFIG.US;
  const shippingMeta = getCountryMeta(shippingData.country);
  const billingMeta = getCountryMeta(billingData.country);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-navy-900 mb-8 text-center">Secure Checkout</h1>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Address Information (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 min-h-[500px]">

              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <span className="bg-navy-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Address Information
              </h2>

              {/* Address Tabs */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setAddressTab('SHIPPING')}
                  className={`flex-1 py-3 border rounded-lg bg-white flex items-center justify-center gap-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-navy-500 ${addressTab === 'SHIPPING' ? 'bg-navy-50 border-navy-500 text-navy-900 ring-1 ring-navy-500 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  <Truck className="w-4 h-4" /> Shipping
                </button>
                <button
                  onClick={() => setAddressTab('BILLING')}
                  className={`flex-1 py-3 border rounded-lg bg-white flex items-center justify-center gap-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-navy-500 ${addressTab === 'BILLING' ? 'bg-navy-50 border-navy-500 text-navy-900 ring-1 ring-navy-500 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  <MapPin className="w-4 h-4" /> Billing
                </button>
              </div>

              {/* Shipping Content */}
              <div className={addressTab === 'SHIPPING' ? 'block animate-fadeIn' : 'hidden'}>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex justify-between items-center">
                  Shipping Address
                </h3>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleShippingNext(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={shippingData.firstName}
                        onChange={e => handleInputChange('firstName', e.target.value)}
                        className={`w-full border bg-white rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={shippingData.lastName}
                        onChange={e => handleInputChange('lastName', e.target.value)}
                        className={`w-full border bg-white rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={shippingData.company}
                    onChange={e => handleInputChange('company', e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  />
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={shippingData.email || ''}
                      onChange={e => handleInputChange('email', e.target.value)}
                      className={`w-full border bg-white rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={shippingData.street}
                      onChange={e => handleInputChange('street', e.target.value)}
                      ref={shippingStreetRef}
                      className={`w-full border bg-white rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.street ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      autoComplete="street-address"
                    />
                    <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                    {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="City"
                        value={shippingData.city}
                        onChange={e => handleInputChange('city', e.target.value)}
                        onBlur={() => verifyCityStateZip(true)}
                        className={`w-full border bg-white rounded p-2.5 col-span-1 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      {shippingMeta.regions.length > 0 ? (
                        <select
                          value={shippingData.state}
                          onChange={e => handleInputChange('state', e.target.value)}
                          onBlur={() => verifyCityStateZip(true)}
                          className={`w-full border bg-white rounded p-2.5 col-span-1 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        >
                          <option value="">Select {shippingMeta.labelState}</option>
                          {shippingMeta.regions.map(region => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={shippingMeta.labelState}
                          value={shippingData.state}
                          onChange={e => handleInputChange('state', e.target.value)}
                          onBlur={() => verifyCityStateZip(true)}
                          className={`w-full border bg-white rounded p-2.5 col-span-1 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        />
                      )}
                      {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder={shippingMeta.labelZip}
                        value={shippingData.zip}
                        onChange={e => handleInputChange('zip', e.target.value)}
                        onBlur={() => verifyCityStateZip(true)}
                        className={`w-full border bg-white rounded p-2.5 col-span-1 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.zip ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {errors.zip && <p className="text-xs text-red-500 mt-1">{errors.zip}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <select
                        value={shippingData.country}
                        onChange={e => handleInputChange('country', e.target.value)}
                        className="w-full border bg-white rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none border-gray-300 text-gray-700"
                      >
                        {Object.entries(COUNTRY_CONFIG).map(([code, data]) => (
                          <option key={code} value={code}>{data.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm pointer-events-none">
                        {shippingMeta.code}
                      </span>
                      <input
                        type="tel"
                        placeholder={shippingMeta.mask}
                        value={shippingData.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        className={`w-full border bg-white rounded p-2.5 pl-10 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleShippingNext}
                      className="bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 px-6 rounded transition flex items-center gap-2 text-sm"
                    >
                      Next: Billing Address
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Billing Content */}
              <div className={addressTab === 'BILLING' ? 'block animate-fadeIn' : 'hidden'}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Billing Address</h3>
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${billingSameAsShipping ? 'bg-navy-900 border-navy-900' : 'bg-white border-gray-300 group-hover:border-navy-500'}`}>
                      {billingSameAsShipping && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={billingSameAsShipping}
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700 font-medium">Same as shipping</span>
                  </label>
                </div>

                {!billingSameAsShipping ? (
                  <form className="space-y-4 bg-gray-50 p-4 md:p-6 rounded border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="First Name" value={billingData.firstName} onChange={e => handleInputChange('firstName', e.target.value, false)} className="w-full border bg-white border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                      <input type="text" placeholder="Last Name" value={billingData.lastName} onChange={e => handleInputChange('lastName', e.target.value, false)} className="w-full border bg-white border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                    </div>
                    <input type="text" placeholder="Company Name" value={billingData.company} onChange={e => handleInputChange('company', e.target.value, false)} className="w-full border bg-white border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                    <input type="email" placeholder="Email" value={billingData.email || ''} onChange={e => handleInputChange('email', e.target.value, false)} className="w-full border bg-white border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                    <input type="text" placeholder="Street Address" value={billingData.street} onChange={e => handleInputChange('street', e.target.value, false)} ref={billingStreetRef} className="w-full border bg-white border-gray-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="text" placeholder="City" value={billingData.city} onChange={e => handleInputChange('city', e.target.value, false)} onBlur={() => verifyCityStateZip(false)} className="w-full border bg-white border-gray-300 rounded p-2.5 col-span-1 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none" />

                      {billingMeta.regions.length > 0 ? (
                        <select
                          value={billingData.state}
                          onChange={e => handleInputChange('state', e.target.value, false)}
                          onBlur={() => verifyCityStateZip(false)}
                          className="w-full border bg-white border-gray-300 rounded p-2.5 col-span-1 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none"
                        >
                          <option value="">Select {billingMeta.labelState}</option>
                          {billingMeta.regions.map(region => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" placeholder={billingMeta.labelState} value={billingData.state} onChange={e => handleInputChange('state', e.target.value, false)} onBlur={() => verifyCityStateZip(false)} className="w-full border bg-white border-gray-300 rounded p-2.5 col-span-1 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                      )}

                      <input type="text" placeholder={billingMeta.labelZip} value={billingData.zip} onChange={e => handleInputChange('zip', e.target.value, false)} onBlur={() => verifyCityStateZip(false)} className="w-full border bg-white border-gray-300 rounded p-2.5 col-span-1 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={billingData.country}
                        onChange={e => handleInputChange('country', e.target.value, false)}
                        className="w-full border bg-white rounded p-2.5 text-sm focus:ring-2 focus:ring-navy-900 outline-none border-gray-300 text-gray-700"
                      >
                        {Object.entries(COUNTRY_CONFIG).map(([code, data]) => (
                          <option key={code} value={code}>{data.name}</option>
                        ))}
                      </select>

                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm pointer-events-none">
                          {billingMeta.code}
                        </span>
                        <input
                          type="tel"
                          placeholder={billingMeta.mask}
                          value={billingData.phone}
                          onChange={e => handleInputChange('phone', e.target.value, false)}
                          className="w-full border bg-white rounded p-2.5 pl-10 text-sm focus:ring-2 focus:ring-navy-900 focus:outline-none border-gray-300"
                        />
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                    <Check className="w-8 h-8 text-action-500 mb-2" />
                    <p className="text-sm font-medium">Billing address matches shipping</p>
                    <p className="text-xs mt-1">Uncheck the box above to edit</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Order Summary, Shipping & Payment (5 cols) */}
          <div className="lg:col-span-5 space-y-6 h-fit lg:sticky lg:top-6">

            {/* Step 0: Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="p-3 md:p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => setShowItems(!showItems)}
              >
                <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-navy-700" />
                  Order Summary <span className="text-sm font-normal text-gray-500">({cart.length} items)</span>
                </h2>
                {showItems ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>

              {showItems && (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100 p-3 md:p-4">
                  {cart.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Your cart is empty</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="py-3 flex gap-3">
                        <div className="h-12 w-12 flex-shrink-0 bg-white border border-gray-200 rounded p-1">
                          <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-semibold text-navy-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 font-mono">MPN: {item.sku}</p>
                          <p className="text-[10px] text-gray-400">{item.weight || '1 lb'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-navy-900">${(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping ({selectedRate ? selectedRate.serviceName : 'Pending'})</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    <span>${shippingCost.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold text-navy-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>${finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Method */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                <span className="bg-navy-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Shipping Method
              </h2>

              {isLoadingRates ? (
                <div className="py-8 text-center text-gray-500 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-navy-600 mb-2" />
                  <p className="text-sm">Calculating best rates...</p>
                </div>
              ) : shippingRates.length > 0 ? (
                <div className="space-y-3">
                  {shippingRates.map((rate, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedRate(rate)}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${selectedRate?.serviceCode === rate.serviceCode ? 'border-navy-600 bg-navy-50 ring-1 ring-navy-600' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        {rate.serviceName.toLowerCase().includes('overnight') || rate.serviceName.toLowerCase().includes('express') || rate.serviceName.toLowerCase().includes('priority') ? (
                          <Plane className={`w-5 h-5 ${selectedRate?.serviceCode === rate.serviceCode ? 'text-navy-900' : 'text-gray-400'}`} />
                        ) : (
                          <Truck className={`w-5 h-5 ${selectedRate?.serviceCode === rate.serviceCode ? 'text-navy-900' : 'text-gray-400'}`} />
                        )}
                        <div>
                          <span className="block font-bold text-navy-900 text-sm">{rate.serviceName}</span>
                          {rate.transitDays && <span className="block text-xs text-gray-500">Est. {rate.transitDays} Days</span>}
                        </div>
                      </div>
                      <span className="font-bold text-navy-900 text-sm">
                        {rate.shipmentCost === 0 ? 'Free' : `$${rate.shipmentCost.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-6 text-center text-gray-500 text-sm">
                  {rateError ? (
                    <span className="text-red-500 flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4" /> {rateError}</span>
                  ) : (
                    "Enter your shipping address to see available rates."
                  )}
                </div>
              )}

              {shippingRates.length > 0 && (
                <button onClick={() => fetchShippingRates(shippingData)} className="mt-3 text-xs text-action-600 flex items-center gap-1 hover:underline">
                  <RefreshCw className="w-3 h-3" /> Refresh Rates
                </button>
              )}
            </div>

            {/* Step 3: Payment Method (Wrapped in Stripe Elements) */}
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  total={finalTotal}
                  handlePlaceOrder={handlePlaceOrder}
                  isProcessing={isProcessing}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  poNumber={poNumber}
                  setPoNumber={setPoNumber}
                  poFile={poFile}
                  setPoFile={setPoFile}
                  handlePoUpload={handlePoUpload}
                  stripeError={stripeError}
                  bankInstructions={content.payment?.bankInstructions}
                  enablePO={!!content.payment?.enablePO}
                  enableBankTransfer={!!content.payment?.enableBankTransfer}
                />
              </Elements>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="font-bold text-navy-900">Payment System Unavailable</h3>
                <p className="text-sm text-gray-500 mt-1">Stripe keys are missing. Configure a valid publishable key in Admin &gt; Settings or via VITE_STRIPE_PUBLIC_KEY.</p>
              </div>
            )}

            {/* Vendor Verification Card */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-action-600" />
                Official Vendor Verification
              </h3>

              <div className="bg-navy-50 rounded border border-navy-100 p-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-navy-800">
                  <div>
                    <span className="block text-gray-500 text-[10px] uppercase font-sans mb-0.5">CAGE Code</span>
                    <span className="font-bold tracking-wide">{cageCode}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-[10px] uppercase font-sans mb-0.5">DUNS Number</span>
                    <span className="font-bold tracking-wide">{dunsNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
