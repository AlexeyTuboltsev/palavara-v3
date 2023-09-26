import styles from "./Section.module.scss";
import {LogoBlue} from "./Logo";
import {MenuBlue} from "./Menu";
import React, {FC, ReactNode} from "react";
import {TReadyAppState} from "../reducer";
import {SectionHeader} from "./SectionHeader";

export const Section: FC<{ state: TReadyAppState, children: ReactNode }> = ({state, children}) =>
  <div className={styles.sectionContainer}>
    <div className={styles.headerGrey}>
      <LogoBlue/>
      <MenuBlue {...state.menu}/>
      <SectionHeader state={state} />
    </div>
    <div className={styles.sectionContent}>
      <div className={styles.visual}/>
      <div className={styles.text}>
        {children}
      </div>
    </div>
  </div>