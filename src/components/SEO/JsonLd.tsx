
import React from 'react';
import { Product } from '../../types';
import { useGlobalContent } from '../../contexts/GlobalContent';

interface JsonLdProps {
  data: Product;
}

const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  const { content } = useGlobalContent();
  const siteName = (content?.settings?.siteTitle || 'Server Tech Central');

  const specs: any = data?.specs || {};
  const schema: any = (data as any)?.schema || {};
  const mpn = schema.mpn || specs.__schema_mpn || data.sku;
  const gtin13 = schema.gtin13 || specs.__schema_gtin13;
  const gtin14 = schema.gtin14 || specs.__schema_gtin14;
  const priceValidUntil = schema.priceValidUntil || specs.__schema_priceValidUntil;
  const sellerName = schema.seller || specs.__schema_seller || siteName;
  const itemConditionKey = String(schema.itemCondition || specs.__schema_itemCondition || 'NewCondition');
  const itemConditionUrl = `https://schema.org/${itemConditionKey}`;
  const ratingValue = schema.ratingValue !== undefined ? Number(schema.ratingValue) : (specs.__schema_ratingValue ? Number(specs.__schema_ratingValue) : undefined);
  const reviewCount = schema.reviewCount !== undefined ? Number(schema.reviewCount) : (specs.__schema_reviewCount ? Number(specs.__schema_reviewCount) : undefined);
  let reviews: any[] = [];
  try {
    const source = schema.reviews ?? specs.__schema_reviews;
    if (typeof source === 'string') {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) reviews = parsed;
    } else if (Array.isArray(source)) {
      reviews = source;
    }
  } catch { /* ignore */ }

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": data.name,
    "image": [data.image].filter(Boolean),
    "description": data.description,
    "sku": data.sku,
    "mpn": mpn,
    "brand": { "@type": "Brand", "name": data.brand },
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "priceCurrency": "USD",
      "price": Number(data.price ?? 0),
      "itemCondition": itemConditionUrl,
      "availability": data.stockStatus === 'IN_STOCK' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  if (gtin13) structuredData.gtin13 = String(gtin13);
  if (gtin14) structuredData.gtin14 = String(gtin14);
  if (priceValidUntil) structuredData.offers.priceValidUntil = String(priceValidUntil);

  if (ratingValue && reviewCount !== undefined) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": String(ratingValue),
      "reviewCount": String(reviewCount)
    };
  }

  structuredData.offers.seller = { "@type": "Organization", "name": sellerName };

  const shippingDetails = {
    "@type": "OfferShippingDetails",
    "shippingRate": { "@type": "MonetaryAmount", "value": 0, "currency": "USD" },
    "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "US" },
    "deliveryTime": {
      "@type": "ShippingDeliveryTime",
      "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
      "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 5, "unitCode": "DAY" }
    }
  } as any;
  structuredData.offers.shippingDetails = shippingDetails;

  const hasMerchantReturnPolicy = {
    "@type": "MerchantReturnPolicy",
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
    "merchantReturnDays": 30,
    "applicableCountry": "US",
    "returnLabelSource": "https://schema.org/MerchantReturnLabelSourceCustomerService",
    "returnMethod": "https://schema.org/ReturnByMail",
    "returnFees": "https://schema.org/FreeReturn"
  } as any;
  structuredData.offers.hasMerchantReturnPolicy = hasMerchantReturnPolicy;

  if (reviews && reviews.length > 0) {
    structuredData.review = reviews.slice(0, 10).map((r: any) => ({
      "@type": "Review",
      "author": r.author ? { "@type": "Person", "name": String(r.author) } : undefined,
      "datePublished": r.datePublished ? String(r.datePublished) : undefined,
      "reviewBody": r.reviewBody ? String(r.reviewBody) : undefined,
      "reviewRating": r.ratingValue ? { "@type": "Rating", "ratingValue": String(r.ratingValue) } : undefined
    })).filter(Boolean);
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export default JsonLd;
