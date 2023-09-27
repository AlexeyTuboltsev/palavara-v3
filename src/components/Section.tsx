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

export const Section: FC<{ state: TReadyAppState, children: ReactNode }> = ({state, children}) => {
  const dispatch = useDispatch();

  return <div className={styles.sectionContainer}>
    <div className={styles.headerGrey}>
      <LogoBlue/>
      <MenuBlue {...state.menu}/>
      <SectionHeader state={state}/>
    </div>
    <div className={styles.buttons}>
      <Minus className={styles.minus} onClick={() => dispatch(actions.previousImage())}/>
      <Plus className={styles.plus} onClick={() => dispatch(actions.nextImage())}/>
    </div>
    <div className={styles.sectionContent}>
      <div className={styles.visual}/>
      <div className={styles.text}>
        {children}
      </div>
    </div>
  </div>
}