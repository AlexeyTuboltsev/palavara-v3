import { call } from "redux-saga/effects";
import { config } from "../config";
import { TImageManifest } from "../types/imageManifest";

// Store manifest at module level (loaded once at startup)
let imageManifest: TImageManifest | null = null;

/**
 * Get the loaded image manifest
 */
export function getImageManifest(): TImageManifest | null {
  return imageManifest;
}

/**
 * Load image manifest from CDN (once at startup)
 */
export function* loadImageManifest() {
  if (!config.useOptimizedImages) {
    return;
  }

  try {
    const response: Response = yield call(fetch, config.manifestUrl);
    if (!response.ok) {
      console.error(`Failed to load image manifest: ${response.statusText}`);
      return;
    }
    const manifest: TImageManifest = yield call([response, 'json']);
    imageManifest = manifest;
  } catch (error) {
    console.error('Error loading image manifest:', error);
  }
}
