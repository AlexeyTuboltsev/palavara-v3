import React, {FC} from 'react'
import styles from "../components/App/App.module.scss";
import {TReadyAppState} from "../reducer";
import {SectionMenuItem} from "../components/SectionMenuItem";
import {MenuBlue} from "../components/Menu";
import {ReactComponent as InstagramLogo} from "../assets/instagram-logo.svg";
import {useDispatch} from "react-redux";
import {Logo, LogoBlue} from "../components/Logo";

export const KidsClass: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const dispatch = useDispatch()
  // const {t} = useTranslation();

  return <div className={styles.appContainer}>
    <div className={styles.headerGrey}>
      <LogoBlue/>
      <MenuBlue {...state.menu}/>

      <div className={styles.sectionHeader}>
        <div className={styles.links}>
          <a href="saf">palavara_studio</a>
          <div className={styles.instagramLogo}><InstagramLogo/></div>
          <a href="asdewg">palavara_ceramics</a>
        </div>
        <div className={styles.sectionMenu}>
          {state.sectionMenu.map(menuItem =>
            <SectionMenuItem key={menuItem.id} {...menuItem} />
          )}
        </div>
      </div>


    </div>
    <div className={styles.content}>
    </div>
  </div>
}