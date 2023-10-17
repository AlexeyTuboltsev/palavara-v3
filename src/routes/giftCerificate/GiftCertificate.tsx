import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const GiftCertificate: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>GIFT CERTIFICATE</h1>
      <h2>certificate for Family Saturday - 25€.</h2>
      <p>The duration of one class is 2 hours.</p>
      <p>Classes are held on Saturdays from 11:00 to 13:00.</p>
      <p>The certificate is for one adult and one child.</p>
      <p>It is possible to visit with several children and adults for an additional fee.</p>
      <p>Firing is not included in the certificate price.</p>
    </div>
    <h2>certificate to attend the "Open Workshop" - 50€.</h2>
    <p>It is for 2 meetings of 3 hours.</p>
    <p>Classes are held on Fridays from 17:00 to 20:00.</p>
    <p>The certificate is for one person.</p>
    <p>Firing is not included in the certificate price.</p>

  </Section>
}
