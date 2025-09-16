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
      <p>
      Dear Berliners and friends of PALAVARA Studio!
      </p>
      <h3>
        On <b>October 12</b>, from 12:20 till 20:00, our studio turns into a cozy autumn ceramics market</h3>
        <br />
      <p>You’ll find handmade tableware, vases, and jewelry from our studio’s ceramic artists.</p>
      <p>To keep you warm, we’ll be serving aromatic mulled wine!</p>
      <p>And as a little extra — everyone who takes home a piece of ceramics will get a small gift from the studio.</p>
      <br />
      <p>Celebrate autumn with warmth and beauty!</p>
    </div>
    </div>  </Background>
}