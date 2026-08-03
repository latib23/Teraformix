
import React, { useEffect, useState } from 'react';
import { Server } from 'lucide-react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
}

const Image: React.FC<ImageProps> = ({ src, alt, fallbackSrc, width, height, priority, className, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const priorityProps = priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {};

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      return;
    }
    setHasError(true);
  };

  if (hasError || !imgSrc) {
    return (
      <span
        role="img"
        aria-label={`${alt} image unavailable`}
        className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className || ''}`}
      >
        <Server className="h-1/3 w-1/3 max-h-16 max-w-16" strokeWidth={1.25} />
      </span>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...priorityProps}
      onError={handleError}
      className={`transition-opacity duration-300 ${className}`}
      {...props}
    />
  );
};

export default Image;
