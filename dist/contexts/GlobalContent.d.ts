import React from 'react';
import { Category, BlogPost } from '../types';
export interface ContentState {
    general: {
        phone: string;
        email: string;
        address: string;
        announcement: string;
        cageCode: string;
        dunsNumber: string;
    };
    home: {
        heroTitle: string;
        heroSubtitle: string;
        heroCta: string;
        heroImage: string;
        partnerLogos?: Array<{
            image: string;
            alt?: string;
            url?: string;
        }>;
        trustTitle?: string;
        whyTitle?: string;
        whyDescription?: string;
        whyCards?: Array<{
            title: string;
            description: string;
        }>;
        featuredTitle?: string;
        featuredSubtitle?: string;
        featuredViewAllText?: string;
        exploreTitle?: string;
        exploreSubtitle?: string;
        verticalsHeaderTagline?: string;
        publicSectorTitle?: string;
        publicSectorParagraphs?: string[];
        verticalCards?: Array<{
            title: string;
            description: string;
        }>;
    };
    categoryPage: {
        title: string;
        description: string;
        h1: string;
        introText: string;
    };
    privacyPolicy: {
        content: string;
    };
    termsOfSale: {
        content: string;
    };
    termsAndConditions?: {
        content: string;
    };
    returnPolicy?: {
        content: string;
    };
    sitemapSettings: {
        introText: string;
    };
    footer: {
        aboutText: string;
        social?: {
            facebook?: string;
            linkedin?: string;
            twitter?: string;
            instagram?: string;
        };
    };
    aboutPage?: {
        content: string;
    };
    contactPage?: {
        content: string;
    };
    warrantyPage?: {
        content: string;
    };
    settings: {
        favicon: string;
        faviconDarkUrl?: string;
        siteTitle: string;
        logoUrl: string;
        logoText: string;
        activeTheme?: 'none' | 'christmas' | 'new_year';
    };
    payment: {
        stripePublicKey: string;
        enablePO?: boolean;
        enableBankTransfer?: boolean;
        bankInstructions?: string;
    };
    security?: {
        allowPkIp?: string;
        allowedIps?: string[];
    };
    categories: Category[];
    blogPosts: BlogPost[];
    landingCollections?: Array<{
        slug: string;
        title: string;
        heroTitle: string;
        heroSubtitle: string;
        bannerImage: string;
        description: string;
        productIds: string[];
        testimonials?: Array<{
            quote: string;
            author: string;
            role?: string;
            company?: string;
        }>;
        logos?: Array<{
            name: string;
            imageUrl: string;
        }>;
        faqs?: Array<{
            question: string;
            answer: string;
        }>;
    }>;
    redirects?: Array<{
        from: string;
        to: string;
        permanent?: boolean;
    }>;
}
interface GlobalContentContextType {
    content: ContentState;
    updateContent: (updates: Partial<ContentState>) => Promise<void>;
    isLoading: boolean;
}
export declare const GlobalContentProvider: ({ children }: React.PropsWithChildren<{}>) => import("react/jsx-runtime").JSX.Element;
export declare const useGlobalContent: () => GlobalContentContextType;
export {};
