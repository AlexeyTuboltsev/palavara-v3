import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from '../../components/Section.module.scss'

const BOOK_URL = 'https://book.palavara.com/'

export const WheelThrowing: FC<{
  state: TReadyAppState
}> = ({state}) => {
  return <Section state={state} anchorMenu={
    <div className={styles.anchorMenu}>
      <a href="#four-session-wheel-throwing" className={styles.anchorMenuItem}>✦ 4-session Wheel Throwing Classes</a>
      <a href="#one-session-wheel-intensive" className={styles.anchorMenuItem}>✦ 1-session Wheel Throwing Workshop – Wheel Intensive</a>
    </div>
  }>

    <h1 className={styles.h1Highlighted}>Wheel Throwing Classes in Berlin</h1>

    {/* ── 4-session course ────────────────────────────────────────────────── */}
    <div className={styles.mainText}>
      <h2 id="four-session-wheel-throwing">✦ 4-session Wheel Throwing Classes</h2>

      <h3>Who is this course intended for?</h3>
      <p>This course is designed both for complete beginners and for those who already have some experience with wheel throwing but would like to strengthen their skills and gain more confidence.</p>
      <p>Over the course of 4 sessions, you will go through all the essential stages of creating ceramic pieces on the pottery wheel. The course covers clay preparation, centering, pulling walls, shaping forms, trimming, surface decoration, bisque firing, glazing, and glaze firing.</p>
      <p>By the end of the course, you will be able to take home your own unique and functional ceramic pieces.</p>
      <p>If you choose individual four-session classes, the course can also be adapted to your personal needs and interests, with a stronger focus on the stages of the process where you feel less confident and would like more practice.</p>
      <p>And if, after this introductory course, you find yourself unable to stop making pottery, you will always be welcome to continue your ceramic journey in our studio.</p>

      <h3>Where?</h3>
      <p>13359 Berlin, Steegerstr. 1A</p>

      <h3>When?</h3>
      <p>Various scheduling options are available.</p>

      <h3>Duration</h3>
      <p>4 sessions × 2 hours (total: 8 hours)</p>

      <h3>Cost</h3>
      <ul>
        <li>4-session Wheel Throwing class (1 person) — €365</li>
        <li>4-session Wheel Throwing class (2 persons) — €480</li>
        <li>4-session Wheel Throwing class (3 persons) — €700</li>
      </ul>

      <p><a href={BOOK_URL}>Book now</a></p>

      <h3>FAQ</h3>
      <p><strong>Are there any additional fees?</strong></p>
      <p>No. The course fee includes all materials, glazing, and firing.</p>
      <p><strong>When can I pick up the pieces?</strong></p>
      <p>The finished pieces will be ready for pickup approximately two weeks after the course ends.</p>

      <h3>Cancellation policy</h3>
      <p>Full refund for cancellations made at least 7 days before the workshop (the first session, for multi-session lessons).</p>

      <p><em>The class can be taught in Russian or English.</em></p>
    </div>

    <br/>

    {/* ── 1-session intensive ──────────────────────────────────────────────── */}
    <div className={styles.mainText}>
      <h2 id="one-session-wheel-intensive">✦ 1-session Wheel Throwing Workshop – Wheel Intensive</h2>

      <h3>Who is this course intended for?</h3>
      <p>A personalised 2-hour pottery wheel session tailored to your individual needs and skill level.</p>
      <p>This workshop is perfect both for complete beginners who want to try the pottery wheel for the first time and for those who already have some experience but would like to refine their technique and gain more confidence.</p>
      <p>The individual workshop is especially suitable for anyone who feels stuck at a certain stage of wheel throwing. Struggling with centering? Finding bowls more difficult than cylinders? Managing to center the clay but losing control while shaping? This intensive session is designed exactly for these situations. We focus on your specific questions and difficulties, helping you understand the key stages of wheel throwing more clearly, correct common mistakes, and gain better control over the process.</p>

      <h3>Where?</h3>
      <p>13359 Berlin, Steegerstr. 1A</p>

      <h3>When?</h3>
      <p>Various scheduling options are available.</p>

      <h3>Duration</h3>
      <p>2 hours</p>

      <h3>Cost</h3>
      <ul>
        <li>1-session Wheel Throwing class (1 person) — €95</li>
        <li>1-session Wheel Throwing class (2 persons) — €170</li>
        <li>1-session Wheel Throwing class (3 persons) — €230</li>
      </ul>

      <p><a href={BOOK_URL}>Book now</a></p>

      <h3>FAQ</h3>
      <p><strong>Are there any additional fees?</strong></p>
      <p>The course fee includes clay, glaze, and firing of two pieces. Each additional piece is charged separately at €5 per piece. Finished pieces will be coated with a transparent glaze. You’re also welcome to glaze them yourself during an open studio session.</p>
      <p><strong>When can I pick up the pieces?</strong></p>
      <p>The finished pieces will be ready for pickup approximately two weeks after the workshop ends.</p>

      <h3>Cancellation policy</h3>
      <p>Full refund for cancellations made at least 7 days before the workshop.</p>

      <p><em>The class can be taught in Russian or English.</em></p>
    </div>

  </Section>
}
