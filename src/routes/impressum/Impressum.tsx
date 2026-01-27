import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const Impressum: FC<{
  state: TReadyAppState
}> = ({state}) => {
  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>Impressum</h1>
    </div>
  </Section>
}
