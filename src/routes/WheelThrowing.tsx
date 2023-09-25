import React, {FC} from 'react'
import styles from "../components/App/App.module.scss";
import {TReadyAppState} from "../reducer";
import {MenuBlue} from "../components/Menu";
import {LogoBlue} from "../components/Logo";
import {SectionMenuBlue} from "../components/SectionMenu";
import {HeaderLinksBlue} from "../components/HeaderLinks";

export const WheelThrowing: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <div className={styles.appContainer}>
    <div className={styles.headerGrey}>
      <LogoBlue/>
      <MenuBlue {...state.menu}/>

      <div className={styles.sectionHeader}>
        <HeaderLinksBlue />
        <SectionMenuBlue sectionMenu={state.sectionMenu} />
      </div>


    </div>
    <div className={styles.sectionContent}>
      <div className={styles.visual}>

      </div>
    </div>
  </div>
}