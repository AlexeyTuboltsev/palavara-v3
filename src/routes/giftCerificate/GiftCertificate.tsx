import React, { FC } from 'react'
import { TReadyAppState } from "../../types";
import { Section } from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const GiftCertificate: FC<{
  state: TReadyAppState
}> = ({ state }) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>GIFT CERTIFICATES</h1>
      <br/>
      <h2>Certificate for Open Studio</h2>
      <p>For 1 session (3 hours) – €30</p>
      <p>Open Studio is held every Friday from 17:00 to 20:00.</p>
      <p>The certificate is for one person.</p>
      <p>Firing costs are €10 per kilo; items are weighed before glazing and firing.</p>
      <p>Please note that Open Studio is not a lesson.</p>
      <br />
      <h2>Certificate for Family Saturday – €30</h2>
      <p>Duration: 2 hours</p>
      <p>Classes are held on Saturdays from 12:00 to 14:00.</p>
      <p>The certificate is for one adult and one child.</p>
      <p>It is possible to attend with additional children and adults for an extra fee.</p>
      <p>Firing costs are €10 per kilo; items are weighed before glazing and firing.</p>
      <br />
      <h2>Certificate for Pottery Wheel Class</h2>
      <p>You can purchase a gift certificate for a Private 4-Session Workshop or a Private One-Time Workshop.</p>
      <br />
      <p><strong>Private 4-Session Workshop</strong> (9.5 hours total) covers the full pottery-making process — from preparing clay and centering on the wheel to trimming, glazing, and firing.</p>
      <br />
      <h3>Cost:</h3>
      <p>1 course (4 sessions, 9.5 hours total) for one person — €365</p>
      <p>1 course (4 sessions, 9.5 hours total) for two people — €500</p>
      <p>(The cost includes firing and all materials.)</p>
      <br/>
      <h3>Schedule:</h3>
      <p>Time is arranged individually.</p>
      <br />
      <p><strong>Private One-Time Workshop</strong> (2.5 hours) offers a personalized introduction to wheel-throwing, perfect for beginners or anyone wishing to refresh their skills.</p>
      <br/>
      <h3>Cost:</h3>
      <p>For one person — €140</p>
      <p>For two people — €170</p>
      <p>(The cost includes firing and all materials.)</p>
      <br/>
      <h3>Duration:</h3>
      <p>2.5 hours</p>
      <br/>
      <h3>Schedule:</h3>
      <p>Time is arranged individually.</p>
      <br/>
      <h3>Pickup:</h3>
      <p>Finished pieces will be ready approximately two weeks after the course ends.</p>
      <br/>
      <h3>Location:</h3>
      <p>Steegerstr. 1A, 13359 Berlin</p>
      <br/>
      <h3>Language:</h3>
      <p>English or Russian</p>
      <br/>
      <h3>Booking:</h3>
      <p>varya@palavara.com</p>
  </div>
  </Section>
}
