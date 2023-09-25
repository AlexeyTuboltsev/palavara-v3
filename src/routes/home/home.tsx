import React, {FC} from 'react'
import styles from "../../components/App/App.module.scss";
import {ReactComponent as Logo} from "../../assets/logo.svg";
import {TReadyAppState} from "../../reducer";
import {SectionMenuItem} from "../../components/SectionMenuItem";
import {Menu} from "../../components/Menu";
import {ReactComponent as InstagramLogo} from "../../assets/instagram-logo.svg";

export const Home: FC<{ state: TReadyAppState }> = ({state}) => {
  // const dispatch = useDispatch()
  // const {t} = useTranslation();

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
      <Menu {...state.menu}/>
    </div>
  </div>
}