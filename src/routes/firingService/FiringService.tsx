import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const FiringService: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>FIRING SERVICE</h1>
      <p>8€ / kg bisque firing</p>
      <p>10€/kg glaze firing</p>
      <br />
      <h2>Entire Kiln Cost:</h2>
      <p>(bisque firing)</p>
      <p>€80 Large Kiln (100l) / €60 Small Kiln (66l) </p>
      <br/>
      <p>(glaze firing 1130° or 1235°)</p>
      <p>€95 Large Kiln (100l) /€75 Small Kiln (66l) </p>
    </div>
  </Section>
}
