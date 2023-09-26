import React, {FC} from 'react'
import styles from "../../components/App.module.scss";
import {TReadyAppState} from "../../reducer";
import {MenuYellow} from "../../components/Menu";
import {LogoYellow} from "../../components/Logo";
import {SectionMenuYellow} from "../../components/SectionMenu";
import {HeaderLinksYellow} from "../../components/HeaderLinks";

export const Home: FC<{ state: TReadyAppState }> = ({state}) => {
  // const dispatch = useDispatch()
  // const {t} = useTranslation();

  return <div className={styles.background}>
    <div className={styles.header}>
      <LogoYellow />
      <div className={styles.title}>
        Pottery classes <br/> for kids and adults
      </div>
      <div className={styles.sectionHeader}>
        <HeaderLinksYellow />
        <SectionMenuYellow sectionMenu={state.sectionMenu} />
      </div>


    </div>
    <div className={styles.content}>
      <MenuYellow {...state.menu}/>
    </div>
  </div>
}