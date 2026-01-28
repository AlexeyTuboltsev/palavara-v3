import React, {FC} from "react";
import cn from "classnames";
import {config} from "../config";
import styles from "./Section.module.scss";
import {selectImageSource} from "../services/imageService";
import {EScreenSize} from "../routes/common/screenSize";
import {TImageManifest} from "../types/imageManifest";
import {useDispatch} from "react-redux";
import {actions} from "../actions";

export const Images: FC<{
  imageData?: string;
  imageLqipData?: string;
  filename?: string;
  screenSize?: EScreenSize;
  manifest?: TImageManifest | null;
  imageLoaded?: boolean;
}> = ({imageLqipData, imageData, filename, screenSize, manifest, imageLoaded}) => {
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

  // New optimized image path
  if (config.useOptimizedImages && filename && screenSize !== undefined && manifest) {
    const src = selectImageSource(filename, screenSize, manifest);

    if (!src) {
      // Fallback if image not found in manifest
      return null;
    }

    return <>
      {/* Main image with format fallback (AVIF > WebP > JPEG) */}
      <picture>
        <source srcSet={src.responsiveAvif} type="image/avif" />
        <source srcSet={src.responsiveWebp} type="image/webp" />
        <img
          src={src.responsiveJpeg}
          loading="lazy"
          className={styles.img}
          alt=""
          aria-hidden={true}
          onLoad={() => dispatch(actions.imageLoaded())}
        />
      </picture>

      {/* LQIP - instant display from base64 */}
      <img
        src={src.lqipBase64}
        alt=""
        aria-hidden={true}
        className={cn(styles.imgLowRes, {[styles.lqipVisible]: imageLoaded})}
      />
    </>;
  }

  // Legacy path (old blob-based loading)
  return <>
    {imageData && <img
        aria-hidden={true}
        loading="lazy"
        className={styles.img}
        src={imageData}
        alt=""
    />}

    {imageLqipData && <img
        alt=""
        src={imageLqipData}
        aria-hidden={true}
        className={cn(styles.imgLowRes, {[styles.lqipVisible]: imageData})}
    />}
  </>
}
