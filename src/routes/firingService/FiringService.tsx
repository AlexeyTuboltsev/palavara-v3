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

      <h2>FIRING SERVICE</h2>

      <p>Entire Kiln Cost:</p>
      <p>€80 Large Kiln / €60 Small Kiln (bisque firing)</p>
      <p>€95 Large Kiln /€75 Small Kiln (glaze firing 1130°)</p>

      <p>8€ / kg bisque firing</p>
      <p>10€/kg glaze firing</p>
    </div>
  </Section>
}
