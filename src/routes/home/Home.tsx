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
        Dear Berliners!
      </p>
      <h3>
        On <b>December 14</b> we're hosting a Christmas Ceramics Sale.</h3>
        <br />
      <p>Address: Steegerstr. 1a, Berlin, from 12:00 to 18:00!</p>
      <p>
        Join us for a cozy day filled with unique creations by our talented studio members: cups, bowls, vases, and jewelry – perfect for one-of-a-kind gifts.
        </p>
      <p>
        Looking forward to seeing you there!
      </p>

    </div>
    </div>
  </Background>
}