import React, {FC} from 'react'
import styles from "../../components/App/App.module.scss";
import {ReactComponent as Logo} from "../../assets/logo.svg";
import {useDispatch} from 'react-redux'
import {TReadyAppState} from "../../reducer";
import {useTranslation} from 'react-i18next';

export const Home: FC<{ state: TReadyAppState }> = ({state}) => {
  const dispatch = useDispatch()
  const {t} = useTranslation();

  return <div className={styles.appContainer}>
    <div className={styles.header}>
      <div className={styles.logo}>
        <Logo/>
      </div>
      <div className={styles.title}>
        Pottery classes <br/> for kids and adults
      </div>
      <div className={styles.sectionHeader}>
        <div className={styles.links}>
          <a href="saf">palavara_studio</a>
          <a href="asdewg">palavara_ceramics</a>
        </div>
        <div className={styles.sectionMenu}>
          {state.sectionMenu.map(menuItem =>
            <div className={styles.sectionMenuItem}>{menuItem.label}</div>
          )}
        </div>
      </div>


    </div>
    <div className={styles.content}>
      <div className={styles.menu}>{
        state.menu.map(menuItem =>
          <div className={styles.menuItem}>{menuItem.label}</div>)
      }</div>
    </div>
  </div>
}