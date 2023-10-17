import styles from "./SectionHeader.module.scss";
import linkStyles from './HeaderLinks.module.scss'
import {HeaderLinks} from "./HeaderLinks";
import {SectionMenuBlue, SectionMenuWhite} from "./SectionMenu";
import React, {FC} from "react";
import {TReadyAppState} from "../types";
import cn from 'classnames';

const Header:FC<{state: TReadyAppState, className:string}> = ({state, className}) =>
  <div className={styles.sectionHeader}>
    <HeaderLinks className={className} />
    <SectionMenuBlue sectionMenu={state.sectionMenu} screenSize={(state as any).screenSize}/>
  </div>

export const SectionHeader:FC<{state: TReadyAppState}> = ({state}) =>
  <Header state={state}  className={linkStyles.linksSection}  />

export const HomeHeader:FC<{state: TReadyAppState}> = ({state}) =>
  <Header state={state}  className={linkStyles.linksHome}  />

export const SectionHeaderAbout:FC<{state: TReadyAppState}> = ({state}) =>
  <div className={styles.sectionHeader}>
    <HeaderLinks className={cn(linkStyles.linksHome, styles.aboutHeader)} />
    <SectionMenuWhite sectionMenu={state.sectionMenu} screenSize={(state as any).screenSize}/>
  </div>

  //
  // <Header state={state}  className={cn(linkStyles.linksHome, styles.aboutHeader)}  />