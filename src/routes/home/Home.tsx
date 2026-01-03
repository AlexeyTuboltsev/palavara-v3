import React, {FC, ReactNode, useEffect, useRef, useState} from 'react'
import styles from "../../components/App.module.scss";
import {TReadyAppState} from "../../types";
import {LogoHome} from "../../components/Logo";
import cn from 'classnames';
import {HomeHeader} from "../../components/SectionHeader";
import {MenuHome} from "../../components/Menu";


const Images: FC<{ imgUrl: string, imgLqipUrl: string }> = ({imgLqipUrl, imgUrl}) => {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, []);

  return <>
    <img alt="" src={imgLqipUrl} aria-hidden={true} className={styles.backgroundImgLowRes}/>
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
    <div className={styles.announcement}>
      <p>One Spot Available:</p>
      <h3>4-Session Wheel-Throwing Class</h3>
        <br />
      <p>There is one place available in our 4-session wheel-throwing course</p>
        <br />
      <p>Schedule:</p>
      <p>22nd January, 18:30–21:00 — Throwing (2.5 h)</p>
      <p>29th January, 18:30–21:00 — Throwing (2.5 h)</p>
      <p>31st January, 10:00–12:30 — Trimming (2.5 h)</p>
      <p>8th February, 10:00–12:30 — Glazing (2.5 h)</p>
        <br />
      <p><a href="wheel-throwing#4-session-wheel-throwing-class">Full course description and booking</a></p>
    </div>
    </div>
  </Background>
}