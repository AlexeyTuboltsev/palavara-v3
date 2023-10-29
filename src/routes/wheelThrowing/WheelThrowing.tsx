import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from '../../components/Section.module.scss'

export const WheelThrowing: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>Wheel-Throwing class</h1>
      <p>A 4 weeks small group course (up to 3 participants in a group).</p>
      <p>The course covers preparing pottery clay, wedging and centring, pulling of walls, trimming, bisque firing,
        glazing and glaze firing. In 4 weeks you will go through all these basic steps of pottery making and afterwards
        will be able to take home a unique and at the same time functional ceramic objects.</p>
      <p>If after this introductory course you will find yourself unable to stop and will want to learn more, you will
        be
        able to continue taking classes in our studio.</p>
      <p>Only limited places are available!</p>
    </div>
    <br/>
    <h2>Where?</h2>
    <p>13359, Steegerstr. 1A, Berlin</p>
    <h2>When?</h2>
    <p>On Mondays 18:00—20:00</p>
    <p>Wednesday 18:30 — 20:30</p>
    <p>(other options possible)</p>
    <h2>Cost</h2>
    <p>1 Course (4 weeks, once weekly) - 160 €</p>
    <p>(If you for any reason miss a class, unfortunately we will not be able to reimburse you. Classes also cannot
      be rescheduled)</p>

    <p>Usually there are no classes during school holidays.</p>

    <h2>Who is this course intended for?</h2>
    <p>This course is intended for everyone, who wants to learn the basics of pottery wheel throwing and explore the
      process of creating ceramics. No previous experience is necessary.</p>

    <h2>How to book</h2>
    <p><a href="mailto:varya@palavara.com">varya@palavara.com</a></p>

    <p>You can join the class on any given Monday/Wednesday if there are places available.</p>


    <h2>FAQ</h2>

    <p>Are there any additional fees?</p>
    <p>No. The cost of classes includes firing and all the materials.</p>
      <br />
    <p>When can I pick up the pieces?</p>
    <p>After the piece is finished, it will be fired, and you will be able to pick it up as the course progresses.</p>
    <h2>The class can be taught in Russian, German</h2>

  </Section>
}