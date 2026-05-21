import React, { FC } from 'react'
import { TReadyAppState } from "../../types";
import { Section } from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const GiftCertificate: FC<{
  state: TReadyAppState
}> = ({ state }) => {
  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>GIFT CERTIFICATES</h1>

      <h2>Certificate for Open Studio</h2>
      <p>For 1 session (3 hours) – €30</p>
      <p>Open Studio is held every Friday from 17:00 to 20:00.</p>
      <p>The certificate is for one person.</p>
      <p>Firing costs are €10 per kilo; items are weighed before glazing and firing.</p>
      <p className={styles.italic}>Please note that Open Studio is not a lesson.</p>

      <h2>Certificate for Family Saturday – €30</h2>
      <p>Duration: 2 hours</p>
      <p>Classes are held on Saturdays from 12:00 to 14:00.</p>
      <p>The certificate is for one adult and one child.</p>
      <p>It is possible to attend with additional children and adults for an extra fee.</p>
      <p>Firing costs are €10 per kilo; items are weighed before glazing and firing.</p>

      <h2>Certificate for Pottery Wheel Class</h2>
      <p>You can purchase a gift certificate for any wheel throwing course from the <strong>Classes / Wheel Throwing</strong> section.</p>

      <p><strong>How to purchase:</strong></p>
      <p>Please send me an email with the type of gift certificate you would like to buy and the name of the recipient. I will then send you the payment details.</p>
      <p>After the payment has been received, you will receive the gift certificate as a PDF file.</p>

      <p><strong>email: <a href="mailto:palavarastudio@gmail.com">palavarastudio@gmail.com</a></strong></p>

    </div>
  </Section>
}
