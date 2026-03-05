import React, {FC, ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import styles from "../../components/App.module.scss";
import {TReadyAppState} from "../../types";
import {LogoHome} from "../../components/Logo";
import cn from 'classnames';
import {HomeHeader} from "../../components/SectionHeader";
import {MenuHome} from "../../components/Menu";
import {config} from "../../config";

const MOBILE_BREAKPOINT = 500;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const SlidingAnnouncement: FC<{ children: ReactNode }> = ({children}) => {
  const isMobile = useIsMobile();
  const boxRef = useRef<HTMLDivElement>(null);
  const [offsetY, setOffsetY] = useState(0);
  const touchStart = useRef<{ y: number, offset: number } | null>(null);
  const maxSlide = useRef(0);

  const updateMaxSlide = useCallback(() => {
    if (!boxRef.current) return;
    const box = boxRef.current;
    const viewportH = window.innerHeight;
    const boxRect = box.getBoundingClientRect();
    const overflow = boxRect.height - (viewportH - boxRect.top + Math.abs(offsetY));
    maxSlide.current = Math.max(0, overflow + 20);
  }, [offsetY]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    updateMaxSlide();
    touchStart.current = {y: e.touches[0].clientY, offset: offsetY};
  }, [offsetY, updateMaxSlide]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const delta = touchStart.current.y - e.touches[0].clientY;
    const max = maxSlide.current;
    let newOffset = touchStart.current.offset + delta;
    // Allow overscroll past top with rubber-band resistance
    if (newOffset > max) {
      const over = newOffset - max;
      newOffset = max + over * 0.3;
    } else if (newOffset < 0) {
      newOffset = newOffset * 0.3;
    }
    setOffsetY(newOffset);
  }, []);

  const onTouchEnd = useCallback(() => {
    touchStart.current = null;
    setOffsetY(0);
  }, []);

  if (!isMobile) {
    return <div className={styles.announcement}>{children}</div>;
  }

  const isTouching = touchStart.current !== null;

  return <div
    ref={boxRef}
    className={styles.announcement}
    style={{
      transform: `translateY(-${offsetY}px)`,
      transition: isTouching ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
  >
    {children}
  </div>;
};


const Images: FC<{ imgUrl: string, imgLqipUrl: string }> = ({imgLqipUrl, imgUrl}) => {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, []);

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

  return <>
    {/* <img alt="" src={imgLqipUrl} aria-hidden={true} className={styles.backgroundImgLowRes}/> */}
    <img
      aria-hidden={true}
      loading="lazy"
      className={cn(styles.backgroundImg, {[styles.backgroundImgVisible]: loaded})}
      src={imgUrl}
      alt=""
      ref={imgRef}
      onLoad={() => setLoaded(true)}
    />
  </>
}

const Background: FC<{ children: ReactNode, url: string, lqipUrl: string }> = ({children, url, lqipUrl}) => {

  return <div className={styles.background}>
    <Images imgUrl={url} imgLqipUrl={lqipUrl}/>
    {children}
  </div>
}


export const Home: FC<{ state: TReadyAppState }> = ({state}) => {

  return <Background url={(state as any).url} lqipUrl={(state as any).lqipUrl}>
    <div className={styles.header}>
      <LogoHome/>
      <div className={styles.title}>
        Pottery classes <br/> for kids and adults
      </div>
      <HomeHeader state={state}/>

      <MenuHome state={state} />
    </div>
    <div className={styles.content}>
    <SlidingAnnouncement>
      <h3>March 8 at Palavara Studio — Ceramic Market & More</h3>
      <p>March 8, 12:00–19:00, Steegerstr. 1a, Berlin</p>
      <br />
      <p>We’re celebrating March 8 the way we know best — with ceramics, workshops, lectures, tasty drinks, and special gifts!</p>
      <p>Join us for a day filled with:</p>
      <p><span style={{fontSize: '60%', position: 'relative', top: '-0.2em'}}>◆</span> Ceramic & porcelain market</p>
      <p><span style={{fontSize: '60%', position: 'relative', top: '-0.2em'}}>◆</span> Jewelry by Katja John</p>
      <p><span style={{fontSize: '60%', position: 'relative', top: '-0.2em'}}>◆</span> Candle Corner – handmade candles for sale and a chance to make your own candle using different scents</p>
    </SlidingAnnouncement>
    </div>
    </Background>
}