import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const RentASpace: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>RENT A SPACE</h1>
      <p>Contact us if you would like to rent our studio for your event, be it a workshop or a birthday party.</p>
    </div>
  </Section>
}
