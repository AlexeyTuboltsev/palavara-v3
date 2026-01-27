import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const Contact: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>Contact</h1>
      <h2>e-mail:</h2>
      <p><a href="mailto:palavarastudio@gmail.com">palavarastudio@gmail.com</a></p>
      <h2>address: </h2>
      <p>Steegerstr. 1 a, 13359 Berlin</p>

      <h2>instagram:</h2>
      <p><a href="https://www.instagram.com/palavara_potterystudio">instagram.com/palavara_potterystudio/</a></p>
      <p><a href="https://www.instagram.com/palavara_ceramics">instagram.com/palavara_ceramics</a></p>

      <h2>telegram:</h2>
      <p><a href="https://t.me/comeandclay">t.me/comeandclay</a></p>

      <h1 className={styles.impressum}><a href="/impressum">Impressum</a></h1>
    </div>
  </Section>
}
