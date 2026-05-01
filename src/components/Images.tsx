import React, {FC} from "react";
import cn from "classnames";
import {config} from "../config";
import styles from "./Section.module.scss";
import {getImageSources} from "../services/imageService";
import {EScreenSize} from "../routes/common/screenSize";
import {TImageManifest} from "../types/imageManifest";
import {useDispatch} from "react-redux";
import {actions} from "../actions";

export const Images: FC<{
  filename: string;
  screenSize: EScreenSize;
  manifest: TImageManifest | null;
  imageLoaded: boolean;
  alt: string;
  eager?: boolean;
  /**
   * Set when this image is the LCP candidate for the route. Adds
   * `fetchpriority="high"` so the browser starts the request ahead of
   * non-critical resources, and shaves the LCP "resource load delay"
   * gap (Lighthouse measured ~2 s on /firing-service before this).
   * Passing it for non-LCP images defeats the purpose — only use on
   * the hero/visible-on-load picture for the route.
   */
  isLcp?: boolean;
}> = ({filename, screenSize, manifest, imageLoaded, alt, eager, isLcp}) => {
  const dispatch = useDispatch();

  // In visual test mode, show gray placeholder instead of actual images
  if (config.visualTestMode) {
    return <div
      className={styles.img}
      style={{
        backgroundColor: '#e0e0e0',
        width: '100%',
        height: '100%'
      }}
      aria-hidden={true}
    />;
  }

  const src = getImageSources(filename, manifest);

  if (!src) {
    return null;
  }

  // Section visual occupies ~50vw on desktop, the full width on mobile.
  // Use sizes accordingly so the browser picks the right responsive variant.
  const sizes = '(max-width: 500px) 100vw, 50vw';

  return <>
    {/* Main image with format fallback (AVIF > WebP > JPEG) */}
    <picture>
      <source srcSet={src.avifSrcSet || src.avif} sizes={src.avifSrcSet ? sizes : undefined} type="image/avif" />
      <source srcSet={src.webpSrcSet || src.webp} sizes={src.webpSrcSet ? sizes : undefined} type="image/webp" />
      <img
        src={src.jpeg}
        srcSet={src.jpegSrcSet}
        sizes={src.jpegSrcSet ? sizes : undefined}
        loading={eager ? "eager" : "lazy"}
        className={styles.img}
        alt={alt}
        onLoad={() => dispatch(actions.imageLoaded())}
        // React 18.2 doesn't ship `fetchPriority` as a typed prop yet
        // (added in 18.3). Spread the lowercase HTML attribute through.
        {...(isLcp ? ({fetchpriority: 'high'} as any) : {})}
      />
    </picture>

    {/* LQIP - instant display from base64 */}
    <img
      src={src.lqip}
      alt=""
      aria-hidden={true}
      className={cn(styles.imgLowRes, {[styles.lqipVisible]: imageLoaded})}
    />
  </>;
}
