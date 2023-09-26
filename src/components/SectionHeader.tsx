import styles from "./App.module.scss";
import {HeaderLinksBlue} from "./HeaderLinks";
import {SectionMenuBlue} from "./SectionMenu";
import React, {FC} from "react";
import {TReadyAppState} from "../reducer";

export const SectionHeader:FC<{state: TReadyAppState}> = ({state}) =>
  <div className={styles.sectionHeader}>
    <HeaderLinksBlue/>
    <SectionMenuBlue sectionMenu={state.sectionMenu}/>
  </div>