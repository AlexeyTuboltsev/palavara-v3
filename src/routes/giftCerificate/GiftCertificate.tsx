import React, { FC } from 'react'
import { TReadyAppState } from "../../types";
import { Section } from "../../components/Section";
import styles from "../../components/Section.module.scss";

const GIFT_BUY_URL = 'https://book.palavara.com/gift.html'

export const GiftCertificate: FC<{
  state: TReadyAppState
}> = ({ state }) => {
  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>GIFT CERTIFICATES</h1>

      <h2>Certificate for Open Studio</h2>
      <p>1 session (3 hours) — €30 per person / per session</p>
      <p>
        This gift certificate is sold without a specific date. To book a specific date,
        the gift recipient simply needs to contact us by email 2–3 days before their
        planned visit and let us know which Friday they would like to come.
      </p>
      <p>Open Studio takes place every Friday from 17:00 to 20:00.</p>
      <p>
        Please note that the material fee is not included in the certificate price.
        The gift recipient will need to pay for the clay separately at the studio,
        at a rate of €10 per kilogram. The pieces will be weighed before glazing and firing.
      </p>
      <p className={styles.italic}>Please note that Open Studio is not a guided class. It is a self-directed session.</p>
      <p>
        More information about Open Studio:{' '}
        <a href="/open-studio">studio.palavara.com/open-studio</a>
      </p>

      <h2>Certificate for Wheel Throwing Classes</h2>
      <p>
        You can purchase a gift certificate for any wheel-throwing class listed in the
        Classes / Wheel Throwing section.
      </p>
      <p>
        More information about wheel-throwing classes:{' '}
        <a href="/wheel-throwing">studio.palavara.com/wheel-throwing</a>
      </p>

      <p><strong>All gift certificates are valid for one year from the date of purchase.</strong></p>

      <p><a href={GIFT_BUY_URL} className={styles.bookNow}>Buy a Gift Certificate</a></p>

    </div>
  </Section>
}
