import React from 'react';

/**
 * Teraformix brand mark: two interlocking rounded-square loops on a navy tile.
 * The exact same geometry is used for the favicon (public/favicon.svg), so the
 * header, browser tab, and app icon all read as one brand.
 */
export const TeraformixMark = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <rect x="0" y="0" width="100" height="100" rx="24" fill="#0F172A" />
    <g transform="rotate(45 50 50)" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinejoin="round">
      <rect x="14" y="14" width="48" height="48" rx="15" />
      <rect x="38" y="38" width="48" height="48" rx="15" />
    </g>
  </svg>
);

/**
 * Full header lockup: mark tile + "teraformix" wordmark. Renders cleanly on a
 * white header (no baked-in dark rectangle around the whole logo).
 */
const Logo = ({ className = '', showWordmark = true }: { className?: string; showWordmark?: boolean }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <TeraformixMark className="h-9 w-9 shrink-0 rounded-[9px]" />
    {showWordmark ? (
      <span className="text-[22px] font-extrabold lowercase leading-none tracking-tight text-slate-900">
        teraformix
      </span>
    ) : null}
  </span>
);

export default Logo;
