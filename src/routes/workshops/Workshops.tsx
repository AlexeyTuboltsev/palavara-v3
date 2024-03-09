import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from '../../components/Section.module.scss'

export const Workshops: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>MINI VASE: Textures & Colors</h1>
      <p>Join us for a vase-making workshop. This 2.5-hour session is designed for a small group of up to 6 participants, ensuring personalized attention and a cozy atmosphere. </p>
        <p>During this workshop, you'll immerse yourself in the art of clay work, enjoy the company of fellow creative spirits, and craft a vase that's not just a piece of decor but a reflection of your personality.
        Whether it's your first time handling clay or you've dabbled in pottery before, our specially designed process guarantees you'll create a beautiful, unique vase by the end of the session. </p>
        <p>The workshop will be conducted by Polina Grinberg, a ceramic artist and graduate of the Institute for Artistic Ceramics and Glass, Koblenz. You can see her works here: <a href="https://www.instagram.com/bulipukisemomomo">www.instagram.com/bulipukisemomomo</a>
        </p>
    </div>
    <br/>
    <h2>Where?</h2>
    <p>13359, Steegerstr. 1A, Berlin</p>
    <h2>When?</h2>
    <p>16 March 2024</p>
    <p>15:00 — 17:30</p>
    <h2>Cost</h2>
    <p>€58 + €10 (Materials & Firing)</p>
    <p>Only limited places are available, so make sure to secure your spot by making your payment.</p>
    <br />
    
    <h2 style={{color: "#0054cf"}}><a href="https://1caece-69.myshopify.com/products/make-a-vase-with-me?utm_source=copyToPasteBoard&utm_medium=product-links&utm_content=web">Book the workshop here</a></h2>
    <br />
    <br />
    <h2>FAQ</h2>
    <br />
    <h2>Who is this course intended for?</h2>
    <p>This workshop is intended for everyone, who wants to explore the process of creating ceramics. No previous experience is necessary.</p>
    <h2>What if I've paid but can't attend?</h2>
    <p>If you've paid but can't attend, please let us know as soon as you can. Unfortunately refunds are not possible but we'll try to fit you into a future workshop, ensuring you get a chance to join us later.</p>
    <h2>When can I pick up the pieces?</h2>
    <p>After the piece is finished, we let it dry, then glaze it with a transparent glaze and fire. It will be ready for pick up in about two weeks.</p>
    <h2>What language will the workshop be in?</h2>
    <p>The workshop will be taught in English, but Polina also speaks German and Russian.</p>
    <br />
    <p><strong>Please don’t hesitate to email <a href="mailto:palavarastudio@gmail.com">palavarastudio@gmail.com</a> with any enquiries.</strong></p>
  </Section>
}