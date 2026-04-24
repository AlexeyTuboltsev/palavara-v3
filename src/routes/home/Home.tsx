import {FC, ReactNode, useEffect, useRef, useState} from 'react'
import styles from "../../components/App.module.scss";
import {TReadyAppState} from "../../types";
import {LogoHome} from "../../components/Logo";
import cn from 'classnames';
import {HomeHeader} from "../../components/SectionHeader";
import {MenuHome} from "../../components/Menu";
import {config} from "../../config";
import {getImageManifest} from "../../sagas/imageManifestLoader";
import {getImageSources} from "../../services/imageService";

const HERO_ALT = 'Palavara Pottery Studio Berlin — handmade ceramics';

const Images: FC<{filename: string, legacyUrl: string}> = ({filename, legacyUrl}) => {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [filename]);

  // In visual test mode, show gray placeholder instead of actual images
  if (config.visualTestMode) {
    return <div
      className={styles.backgroundImg}
      style={{
        backgroundColor: '#e0e0e0',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
      aria-hidden={true}
    />;
  }

  const sources = getImageSources(filename, getImageManifest());

  if (!sources) {
    // Manifest unavailable — fall back to legacy JPEG URL
    return <img
      loading="eager"
      {...({fetchpriority: 'high'} as any)}
      className={cn(styles.backgroundImg, {[styles.backgroundImgVisible]: loaded})}
      src={legacyUrl}
      alt={HERO_ALT}
      ref={imgRef}
      onLoad={() => setLoaded(true)}
    />;
  }

  return (
    <picture>
      <source srcSet={sources.avif} type="image/avif" />
      <source srcSet={sources.webp} type="image/webp" />
      <img
        loading="eager"
        {...({fetchpriority: 'high'} as any)}
        className={cn(styles.backgroundImg, {[styles.backgroundImgVisible]: loaded})}
        src={sources.jpeg}
        alt={HERO_ALT}
        ref={imgRef}
        onLoad={() => setLoaded(true)}
      />
    </picture>
  );
}

const Background: FC<{children: ReactNode, filename: string, legacyUrl: string}> = ({children, filename, legacyUrl}) => {
  return <div className={styles.background}>
    <Images filename={filename} legacyUrl={legacyUrl}/>
    {children}
  </div>
}


export const Home: FC<{ state: TReadyAppState }> = ({state}) => {
  const filename = (state as any).currentImage as string;
  const legacyUrl = (state as any).url as string;

  return <Background filename={filename} legacyUrl={legacyUrl}>
    <div className={styles.header}>
      <LogoHome/>
      <div className={styles.title}>
        Pottery classes <br/> for kids and adults
      </div>
      <HomeHeader state={state}/>

      <MenuHome state={state} />
    </div>
    <div className={styles.content}>
      <div className={styles.announcement}>
        <a href="/membership">Pottery studio membership<br/><span className={styles.announcementHighlight}>available!</span>{' '}→</a>
      </div>
    </div>
    </Background>
}
