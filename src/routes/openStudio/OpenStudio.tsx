import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const OpenStudio: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>Open studio</h1>
      <p>Our open-studio is intended for those who want to work independently on their projects/ ideas, including throwing on the pottery wheel. Previous experience in ceramics is welcome but not required.</p>
      <p>There are three pottery wheels available in the studio. If you have prior experience with wheel-throwing, you are welcome to use them. Unfortunately it is not possible to reserve a wheel in advance – they are used on a first-come, first-served basis.</p>
      <p>Visitors of the “Open-studio” get full access to all of our materials and tools as well as to firing.</p>
      <p>On your first visit we will give you an introduction to the studio and our equipment and explain to you the studio rules. Moreover, there will always be an experienced ceramist present in the studio to answer all your questions and to  support you in case you have no experience in ceramics.</p>
      <p>Only limited places are available!</p>
    </div>
    <h2>Where?</h2>
    <p>13359, Steegerstr. 1A, Berlin</p>
    <h2>Cost</h2>
    <p>30 € regardless of how much time you spent in the studio</p>

    <p>Firing costs (10 € per kilo) are subject to an extra charge</p>
    <p>(The items are weighed before glazing and firing)</p>

    <h2>When?</h2>
    <p>On Fridays 17:00 - 20:00 (adults and children 13+)</p>
    <p>On Saturdays 12:00 - 14:00 (all ages)</p>

    <h2>How to book</h2>
    <p>palavarastudio@gmail.com</p>

    <p>Remember to register by email at least 12 hours in advance!</p>
  </Section>
}
