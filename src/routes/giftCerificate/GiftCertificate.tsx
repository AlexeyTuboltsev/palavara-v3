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
      <h2>Certificate for open studio</h2>
      <p>For 1 session (3 hours) - 25€</p>
      <p>Open studio is held every Friday from 17:00 to 20:00.</p>
      <p>The certificate is for one person.</p>
      <p>Firing costs (10 € per kilo) are subject to an extra charge.<br/>
        The items are weighed before glazing and firing)</p>
      <p>(Please be aware that Open Studio is not a lesson!)</p>
      <br />
      <h2>Certificate for Family Saturday - 25€.</h2>
      <p>The duration of one class is 2 hours.</p>
      <p>Classes are held on Saturdays from 11:00 to 13:00.</p>
      <p>The certificate is for one adult and one child.</p>
      <p>It is possible to visit with several children and adults for an additional fee.</p>
      <p>Firing costs (10 € per kilo) are subject to an extra charge.<br/>
        The items are weighed before glazing and firing</p>
      <br />
      <h2>Certificate for Pottery Wheel Class</h2>
      <p>You can purchase a gift certificate for a Private 4-Session Workshop or a Private One-Time Workshop</p>
      <br />
      <p><strong>The Private 4-Session Workshop </strong>(9.5 hours total) covers the full pottery-making process — from preparing clay and centering on the wheel to trimming, glazing, and firing.</p>
      <br />
      <h3>Cost </h3>
      <p>1 Course (4 sessions, 9.5 hours in total) — 365€</p>
      <p>(The cost of classes includes firing and all the materials.)</p>
      <br/>
      <h3>Schedule:</h3>
      <p>Time is arranged individually</p>
      <br />
      <p><strong>The Private One-Time Workshop </strong>(2.5 hours) offers a personalized introduction to wheel-throwing, perfect for beginners or anyone wishing to refresh their skills.</p>
      <br/>
      <h3>Cost </h3>
      <p>€140</p>
      <p>(The cost of classes includes firing and all the materials.)</p>
      <br/>
      <h3>Duration:</h3>
      <p>2.5 hours</p>
      <br/>
      <h3>Schedule:</h3>
      <p>Time is arranged individually</p>
      <p>The finished pieces will be ready for pickup approximately two weeks after the course ends.</p>
      <br/>
      <h3>Location: </h3>
      <p>Steegerstr. 1A, 13359 Berlin</p>
      <br/>
      <h3> Language:</h3> 
      <p>English or Russian</p>
      <br/>
      <h3>Booking: </h3>
    <p>varya@palavara.com</p>
  </div>
  </Section>
}