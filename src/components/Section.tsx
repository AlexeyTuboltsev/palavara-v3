import styles from "./Section.module.scss";
import {LogoBlue} from "./Logo";
import {MenuBlue} from "./Menu";
import React, {FC, ReactNode} from "react";
import {TReadyAppState} from "../types";
import {SectionHeader} from "./SectionHeader";
import {ReactComponent as Plus} from "../assets/plus.svg";
import {ReactComponent as Minus} from "../assets/minus.svg";
import {useDispatch} from "react-redux";
import {actions} from "../actions";
import cn from "classnames";

const Images: FC<{ imageData: string, imageLqipData: string }> = ({imageLqipData, imageData}) => {
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
        className={cn(styles.imgLowRes, {[styles.lqipVisible]:imageData})}
    />}
  </>

}

export const SectionVisual: FC<{ imageData: string, imageLqipData: string }> = ({imageData, imageLqipData}) => {
  return <div className={styles.visual}>
    <Images imageData={imageData} imageLqipData={imageLqipData}/>
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
      {((state as any).imageUrl || (state as any).imageLqipUrl) && <>
          <Minus className={styles.minus} onClick={() => dispatch(actions.previousImage())}/>
          <Plus className={styles.plus} onClick={() => dispatch(actions.nextImage())}/>
      </>
      }
    </div>
    <div className={styles.sectionContent}>
      {((state as any).imageUrl || (state as any).imageLqipUrl) &&
          <SectionVisual imageData={(state as any).imageData} imageLqipData={(state as any).imageLqipData}/>}
      <div className={styles.text}>
        {children}
      </div>
    </div>
  </div>
}