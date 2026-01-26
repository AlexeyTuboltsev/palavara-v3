import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const KidsClass: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>Kids Class</h1>
      <p>For children aged 6 to 12</p>
      
      <p>During the lessons we’ll get to know all sorts of clay, be it white, black or red.</p>
      <p>We will try out different techniques, experimenting with kneading, rolling, stamping, and carving.</p>
      <p>We will create dishes, build cities, make toys, tiles and many other things!</p>

      <p>Only limited places are available!</p>
    </div>
    <h2>Where?</h2>
    <p>13359, Steegerstr. 1A, Berlin</p>
    <h2>When?</h2>
    <p>On Wednesdays 16:30—18:00</p>
    <h2>Cost</h2>
    <p>4 lessons – 80 €</p>
    <p>Trial class – 20 €</p>
    <p>If you for any reason miss a class, unfortunately, we will not be able to reimburse you.</p>
    <p>There are no classes during school holidays.</p>

    <h2>How to book</h2>
    <p><a href="mailto:palavarastudio+kp@gmail.com">palavarastudio+kp@gmail.com</a></p>

    <p>The class is taught in Russian</p>
  </Section>
}
