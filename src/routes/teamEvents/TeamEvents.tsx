import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const TeamEvents: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>Team Events</h1>
      <p>Bring your team together for a creative and relaxing experience.</p>
    <br/>
    <h2>OPTION 1. POTTERY WORKSHOP</h2>
      <p>Our Ceramic Masterclass is designed for groups of 5–10 participants and lasts approximately 2.5 hours.</p>
      <p>You’ll learn basic pottery handbuilding techniques and create your own ceramic piece — perfect as a personal keepsake or for your office desk.</p>
      <br/>
      <h3>What’s Included:</h3>
      <ul>
      <li><p>All materials for creating one ceramic piece*</p></li>
      <li><p>Step-by-step instruction and creative support throughout the process</p></li>
      <li><p>Transparent glazing and firing of your finished piece**</p></li>
      </ul>
      <p><small>* Each additional piece is charged at €5 per item.</small></p>
      <p><small>** Finished pieces will be ready for pickup approximately two weeks after the workshop.</small></p>
      <br/>
      <h3>Price*:</h3>
      <p>€75 per person (minimum 5 participants)</p>
      <p><small>*Please note that 19% VAT will be added to the total amount.</small></p>
      <br/>
    <h2>OPTION 2. TEA AND POTTERY WORKSHOP</h2>
      <p>Our Ceramic Masterclass is designed for groups of 5–10 participants and lasts approximately 2.5 hours.</p>
      <p>Enjoy a calming blend of tea and creativity with our Tea & Pottery Workshop.</p>
      <p>We’ll begin with a guided tea tasting — featuring a curated selection of delicious teas — followed by a hands-on pottery session where you’ll craft your own unique tea cup or bowl.</p>
      <br/>
      <h3>What’s Included:</h3>
      <ul>
      <li><p>A guided tea tasting experience</p></li>
      <li><p>All materials for creating one ceramic piece*</p></li>
      <li><p>Step-by-step instruction and creative support throughout the process</p></li>
      <li><p>Transparent glazing and firing of your finished piece**</p></li>
      </ul>
      <br/>
      <p><small>* Each additional piece is charged at €5 per item.</small></p>
      <p><small>** Finished pieces will be ready for pickup approximately two weeks after the workshop.</small></p>
      <br/>
      <h3>Price*:</h3>
      <p>€95 per person (minimum 5 participants)</p>
      <p><small>*Please note that 19% VAT will be added to the total amount.</small></p>
    </div>
    
    </Section>
}
