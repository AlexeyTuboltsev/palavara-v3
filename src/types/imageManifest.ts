/**
 * Image manifest types for optimized image system
 */

export interface TImageFormat {
  path: string;
  size: number;
}

export interface TOriginalImageInfo {
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface TOptimizedFormats {
  jpeg: TImageFormat;
  webp: TImageFormat;
  avif: TImageFormat;
}

export interface TResponsiveVariant {
  jpeg: TImageFormat;
  webp: TImageFormat;
  avif: TImageFormat;
}

export interface TResponsiveVariants {
  '1920w': TResponsiveVariant;
  '1024w': TResponsiveVariant;
  '640w': TResponsiveVariant;
}

export interface TLqipInfo {
  width: number;
  height: number;
  base64: string;
}

export interface TOptimizedImageResult {
  original: TOriginalImageInfo;
  optimized: TOptimizedFormats;
  responsive: TResponsiveVariants;
  lqip: TLqipInfo;
}

export interface TImageManifest {
  version: string;
  generated: string | null;
  images: {
    [filename: string]: TOptimizedImageResult;
  };
}

export interface TOptimizeOptions {
  jpegQuality?: number;
  webpQuality?: number;
  avifQuality?: number;
  lqipQuality?: number;
  lqipWidth?: number;
  responsiveSizes?: number[];
}
