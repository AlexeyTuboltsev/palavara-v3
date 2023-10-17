import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const Membership: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>MEMBERSHIP</h1>
      <p>We welcome ceramists to our studio.</p>
      <p>We have a wonderful space, tools and materials so you can work independently on your own projects.</p>
      <p>If you have the knowledge, skills and ability to work with clay, but don't have your own equipped pottery
        studio, we offer membership to our ceramic co-working space!</p>
      <p>You will have your own shelf to store your personal materials, access to the pottery wheels and kilns. You may
        also bring and work with your own masses and glazes, as long as they match the characteristics of our firing
        regimes.</p>

      <p>Contact us and we'll send you the details: palavarastudio@gmail.com</p>
    </div>
  </Section>
}
