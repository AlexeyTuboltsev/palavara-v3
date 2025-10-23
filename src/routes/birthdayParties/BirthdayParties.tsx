import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const BirthdayParties: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>Birthday Parties</h1>
      <p>We invite you to celebrate a birthday (or any other special occasion) in our studio with a ceramic workshop!</p>
      <p>It doesn’t matter if it’s a children’s party or an adult celebration—we can offer a clay modeling theme suitable for any age. Workshops can be conducted in English, German, or Russian. Write to us at palavarastudio@gmail.com</p>
      <br/>
      <h3>Children’s party, general information:</h3>
      <ul>
        <li><p>Duration of the workshop: 1.5 hours (depending on the age of the participants, the time can be discussed individually)</p></li>
        <li><p>Cost for a group of up to 6 children: €250</p></li>
        <li><p>Each additional participant: +€35</p></li>
        <li><p>Price includes materials for one piece per participant, transparent or white glaze, and firing. Finished pieces can be picked up in 2 weeks.</p></li>
        <li><p>The workshop theme is flexible and can be tailored to the participants’ wishes.</p></li>
        <li><p>The price also includes one extra hour after the workshop, where you can enjoy tea and any snacks or cake you bring with you.</p></li>
      </ul>

      <br/>
      <h3>Adult party, general information:</h3>
      <ul>
        <li><p>Duration of the workshop: 2.5 hours</p></li>
        <li><p>Cost for a group of up to 4 people: €300</p></li>
        <li><p>Each additional participant: +€50</p></li>
        <li><p>Price includes materials for one piece per participant, transparent or white glaze, and firing. Finished pieces can be picked up in 2 weeks.</p></li>
        <li><p>The workshop theme is flexible and can be tailored to the participants’ wishes.</p></li>
        <li><p>The price also includes one extra hour after the workshop, where you can enjoy tea and any snacks or cake you bring with you.</p></li>
      </ul>
    </div>
  </Section>
}
