import React, {FC} from 'react'
import styles from "../components/App/App.module.scss";
import {TReadyAppState} from "../reducer";
import {MenuBlue} from "../components/Menu";
import {LogoBlue} from "../components/Logo";
import {SectionMenuBlue} from "../components/SectionMenu";
import {HeaderLinksBlue} from "../components/HeaderLinks";

export const KidsClass: FC<{
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
      <div className={styles.visual} />
      <div className={styles.text}>
        <h1>FOR CHILDREN AGED 6 TO 12</h1>
        <p>During the 14 lessons of this course we’ll get to know all sorts of clay, be it white, black or red. We will try out different techniques, experimenting with kneading, rolling, stamping, and carving. We will create dishes, build cities, make toys, tiles and many other things!</p>
        <p>Only limited places are available!</p>
        <br />
        <h2>Where?</h2>
        <p>13359, Steegerstr. 1A, Berlin</p>
        <h2>When?</h2>
        <p>On Wednesdays 16:30—18:00</p>
        <h2>Cost:</h2>
        <p>4 lessons once a week – 75 €</p>
        <p>Trial class – 20 €</p>
        <p>If you for any reason miss a class, unfortunately we will not be able to reimburse you.</p>
        <h2>How to pay:</h2>
        <p>Paypal varya@palavara.com</p>
        <p>Please add a comment with the name of the child and the name of this course</p>
        <h2>How to book</h2>
        <p>palavarastudio+kp@gmail.com</p>
        <p>We can reserve a place for you only after we receive proof of payment. This way we can better predict how many people are going to attend and ensure that those who are interested get a place.</p>
        <p>Please send us the proof of booking to palavarastudio+kp@gmail.com</p>

        <p>Teacher — Varvara Polyakova</p>
        <p>The class is taught in Russian</p>
      </div>
    </div>
  </div>
}