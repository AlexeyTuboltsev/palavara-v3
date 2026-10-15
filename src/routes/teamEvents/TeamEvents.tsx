import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const TeamEvents: FC<{
  state: TReadyAppState
}> = ({state}) => {
  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>Team Events</h1>
      <p>Bring your team together for a creative and relaxing experience.</p>

      <h2>POTTERY WORKSHOP</h2>
      <p>Our pottery workshop is designed for groups of 4–10 participants and lasts approximately 2.5 hours.</p>
      <p>You'll learn basic hand-building techniques and create your own ceramic piece — a perfect personal keepsake or decoration for your office desk.</p>
      <p>The theme of the workshop can also be discussed individually and tailored to your team's preferences.</p>

      <h3>What's Included</h3>
      <ul>
        <li>All materials needed to create one ceramic piece</li>
        <li>Step-by-step instruction and creative support throughout the workshop</li>
        <li>Glazing and firing of your finished piece*</li>
      </ul>
      <p className={styles.small}>* Each additional piece costs €10.</p>
      <p className={styles.small}>Finished pieces will be ready for pickup approximately two weeks after the workshop.</p>

      <h3>Price</h3>
      <p>€300 for a group of up to 4 participants</p>
      <p>€75 for each additional participant</p>
    </div>
  </Section>
}
