
import React, { useState } from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
}

const Image: React.FC<ImageProps> = ({ src, alt, width, height, priority, className, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc('/favicon.png');
    }
  };

  return (
    <img
      src={imgSrc || '/favicon.png'}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      onError={handleError}
      className={`transition-opacity duration-300 ${className}`}
      {...props}
    />
  );
};

export default Image;
