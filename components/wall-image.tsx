"use client";

import Image from "next/image";

interface WallImageProps {
  filename: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function WallImage({
  filename,
  alt = "Wall image",
  width = 260,
  height = 260,
}: WallImageProps) {
  return (
    <Image
      src={`/images/landing/hero/${filename}`}
      alt={alt}
      width={width}
      height={height}
      className="rounded-lg object-cover"
    />
  );
}
