import React, {FC, ReactNode, useEffect, useRef, useState} from 'react'
import styles from "../../components/App.module.scss";
import {TReadyAppState} from "../../types";
import {MenuYellow} from "../../components/Menu";
import {LogoYellow} from "../../components/Logo";
import {SectionMenuYellow} from "../../components/SectionMenu";
import {HeaderLinksYellow} from "../../components/HeaderLinks";
import cn from 'classnames';


const Images: FC<{ imgUrl: string, imgLqipUrl: string }> = ({imgLqipUrl, imgUrl}) => {
  console.log(imgLqipUrl)
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

const Background: FC<{ children: ReactNode, url: string,lqipUrl:string }> = ({children, url,lqipUrl}) => {

  return <div className={styles.background}>
    <Images imgUrl={url} imgLqipUrl={lqipUrl}/>
    {children}
  </div>
}


export const Home: FC<{ state: TReadyAppState }> = ({state}) => {

  return <Background url={(state as any).url} lqipUrl={(state as any).lqipUrl}>
    <div className={styles.header}>
      <LogoYellow/>
      <div className={styles.title}>
        Pottery classes <br/> for kids and adults
      </div>
      <div className={styles.sectionHeader}>
        <HeaderLinksYellow/>
        <SectionMenuYellow sectionMenu={state.sectionMenu}/>
      </div>


    </div>
    <div className={styles.content}>
      <MenuYellow {...state.menu}/>
    </div>
  </Background>
}