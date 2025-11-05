'use client';

import Image from 'next/image';

interface WallImageProps {
  filename: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function WallImage({ 
  filename, 
  alt = 'Wall image', 
  width = 200, 
  height = 200 
}: WallImageProps) {
  return (
    <Image 
      src={`/images/hero/${filename}`}
      alt={alt}
      width={width}
      height={height}
      className="rounded-lg object-cover"
    />
  );
}

