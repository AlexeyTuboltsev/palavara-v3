import styles from "./Section.module.scss";
import {LogoSection} from "./Logo";
import {MenuSec} from "./Menu";
import React, {FC, ReactNode} from "react";
import {TReadyAppState} from "../types";
import {SectionHeader} from "./SectionHeader";
import {ReactComponent as Plus} from "../assets/plus.svg";
import {ReactComponent as Minus} from "../assets/minus.svg";
import {useDispatch} from "react-redux";
import {actions} from "../actions";
import cn from "classnames";
import {EScreenSize} from "../routes/common/screenSize";

export const Images: FC<{ imageData: string, imageLqipData: string }> = ({imageLqipData, imageData}) => {
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

export const SectionVisual: FC<{ imageData: string, imageLqipData: string }> = ({imageData, imageLqipData}) => {
  const dispatch = useDispatch();

  return <div className={styles.visual} onClick={() => dispatch(actions.nextImage())}>
    <Images imageData={imageData} imageLqipData={imageLqipData}/>
  </div>
}

export const Section: FC<{ state: TReadyAppState, anchorMenu?: ReactNode, children: ReactNode }> = ({state, children, anchorMenu}) => {
  const dispatch = useDispatch();

  return <div className={styles.sectionContainer}>
    <div className={styles.header}>
      <LogoSection />
      <MenuSec state={state}/>
      <SectionHeader state={state}/>
    </div>
    {(state as any).screenSize === EScreenSize.DESKTOP && <div className={styles.buttons}>
      {((state as any).imageUrl || (state as any).imageLqipUrl) && <>
          <Minus className={styles.minus} onClick={() => dispatch(actions.previousImage())}/>
          <Plus className={styles.plus} onClick={() => dispatch(actions.nextImage())}/>
      </>
      }
    </div>
    }
    
    <div className={cn(styles.sectionContent, {[styles.divider]:state.menuIsOpen})}>
      {((state as any).imageUrl || (state as any).imageLqipUrl) &&
          <SectionVisual imageData={(state as any).imageData} imageLqipData={(state as any).imageLqipData}/>}
     <div className={styles.textWrapper}>
      {anchorMenu && <div>
      {anchorMenu}
    </div>}

      <div className={styles.text}>
        {children}
      </div>
     </div>
    </div>
  </div>
}