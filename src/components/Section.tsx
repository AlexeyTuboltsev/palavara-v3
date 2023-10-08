import styles from "./Section.module.scss";
import {LogoBlue} from "./Logo";
import {MenuBlue} from "./Menu";
import React, {FC, ReactNode, useEffect, useRef, useState} from "react";
import {TReadyAppState} from "../types";
import {SectionHeader} from "./SectionHeader";
import {ReactComponent as Plus} from "../assets/plus.svg";
import {ReactComponent as Minus} from "../assets/minus.svg";
import {useDispatch} from "react-redux";
import {actions} from "../actions";
import cn from "classnames";

const Images: FC<{ imgUrl: string, imgLqipUrl: string }> = ({imgLqipUrl, imgUrl}) => {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    setLoaded(false);
  }, [imgUrl]);

  return imgUrl && imgLqipUrl
    ? <>
      <img alt="" src={imgLqipUrl} aria-hidden={true}
           className={styles.imgLowRes}
      />
      <img
        aria-hidden={true}
        loading="lazy"
        className={cn(styles.img, {[styles.imgVisible]: loaded})}
        src={imgUrl}
        alt=""
        ref={imgRef}
        onLoad={() => setLoaded(true)}
      />
    </>
    : null
}

export const SectionVisual: FC<{ url: string, lqipUrl: string }> = ({url, lqipUrl}) => {
  return <div className={styles.visual}>
    <Images imgUrl={url} imgLqipUrl={lqipUrl}/>
  </div>
}

export const Section: FC<{ state: TReadyAppState, children: ReactNode }> = ({state, children}) => {
  const dispatch = useDispatch();

  return <div className={styles.sectionContainer}>
    <div className={styles.headerGrey}>
      <LogoBlue/>
      <MenuBlue {...state.menu}/>
      <SectionHeader state={state}/>
    </div>
    <div className={styles.buttons}>
      {(state as any).imageUrl && <>
        <Minus className={styles.minus} onClick={() => dispatch(actions.previousImage())}/>
      <Plus className={styles.plus} onClick={() => dispatch(actions.nextImage())}/>
      </>
      }
    </div>
    <div className={styles.sectionContent}>
      {(state as any).imageUrl && <SectionVisual url={(state as any).imageUrl} lqipUrl={(state as any).imageLqipUrl}/>}
      <div className={styles.text}>
        {children}
      </div>
    </div>
  </div>
}