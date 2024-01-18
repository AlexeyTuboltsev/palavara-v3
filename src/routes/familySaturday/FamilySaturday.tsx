import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const FamilySaturday: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>FAMILY SATURDAYS</h1>

      <p>We find that a ceramic workshop is a great Saturday entertainment for the whole family!</p>

      <p>Here you get a chance to work independently on your own project together with your kids, and we supply all the
        necessary tools and materials, as well as of course help you bring your ideas to life.</p>

      <p>Please book in advance.</p>
      <p>Only limited places are available!</p>
    </div>
    <h2>When</h2>
    <p>On Saturdays, the studio is open from 12:00 till 14:00.</p>

    <h2>Where</h2>
    <p>Steegerstr. 1a, 13359, Berlin</p>

    <h2>Cost</h2>
    <p>Family Ticket:</p>
    <p>1 adult + 1 child (under 12): 25 €</p>
    <p>• +1 child: + 10 €</p>
    <p>• +1 adult (over 13): + 20 €</p>
    <p>You can also come without children or invite some friends</p>
    <p>The price for 1 adult is 25 €</p>

    <p>• Firing costs (10 € per kilo) are subject to an extra charge</p>
    <p>(The items are weighed before glazing and firing)</p>

    <h2>How to book</h2>
    <p>palavarastudio@gmail.com</p>

    <h2>FAQ</h2>
    <p>What to bring and what to wear in the studio?</p>
    <p>We provide aprons, but you can also bring clothes which you wouldn't regret getting soiled.</p>
    <br />
    <p>Are there any additional fees?</p>
    <p>Firing costs (10 € per kilo) are subject to extra charge</p>
    <br />
    <p>When can I pick up the pieces?</p>
    <p>You can pick up the pieces within approximately two weeks after the class.</p>
  </Section>
}
