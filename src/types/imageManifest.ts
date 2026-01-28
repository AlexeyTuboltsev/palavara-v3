/**
 * Image manifest types for optimized image system
 *
 * Flat structure: all image variants in same directory with different extensions
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
  width: number;
  height: number;
  jpeg: TImageFormat;
  webp: TImageFormat;
  avif: TImageFormat;
}

export interface TLqipInfo {
  width: number;
  height: number;
  base64: string;
  path: string;
}

export interface TOptimizedImageResult {
  original: TOriginalImageInfo;
  optimized: TOptimizedFormats;
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
  maxWidth?: number;
}
