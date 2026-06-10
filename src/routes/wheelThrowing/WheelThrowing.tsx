import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from '../../components/Section.module.scss'

const BOOK_URL = 'https://book.palavara.com/'

export const WheelThrowing: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();

  const fourSessionWhoForParagraphs = t('routes.wheelThrowing.fourSession.whoFor.paragraphs', {returnObjects: true}) as string[];
  const fourSessionCostItems = t('routes.wheelThrowing.fourSession.cost.items', {returnObjects: true}) as string[];
  const fourSessionFaqItems = t('routes.wheelThrowing.fourSession.faq.items', {returnObjects: true}) as Array<{q: string; a: string}>;

  const oneSessionWhoForParagraphs = t('routes.wheelThrowing.oneSession.whoFor.paragraphs', {returnObjects: true}) as string[];
  const oneSessionCostItems = t('routes.wheelThrowing.oneSession.cost.items', {returnObjects: true}) as string[];
  const oneSessionFaqItems = t('routes.wheelThrowing.oneSession.faq.items', {returnObjects: true}) as Array<{q: string; a: string}>;

  return <Section state={state} anchorMenu={
    <div className={styles.anchorMenu}>
      <a href="#four-session-wheel-throwing" className={styles.anchorMenuItem}>{t('routes.wheelThrowing.anchorMenu.fourSession')}</a>
      <a href="#one-session-wheel-intensive" className={styles.anchorMenuItem}>{t('routes.wheelThrowing.anchorMenu.oneSession')}</a>
    </div>
  }>

    <h1 className={styles.h1Highlighted}>{t('routes.wheelThrowing.title')}</h1>

    {/* ── 4-session course ────────────────────────────────────────────────── */}
    <div className={styles.mainText}>
      <h2 id="four-session-wheel-throwing">{t('routes.wheelThrowing.fourSession.heading')}</h2>

      <h3>{t('routes.wheelThrowing.fourSession.whoFor.label')}</h3>
      {fourSessionWhoForParagraphs.map((p, i) => <p key={i}>{p}</p>)}

      <h3>{t('routes.wheelThrowing.fourSession.where.label')}</h3>
      <p>{t('routes.wheelThrowing.fourSession.where.value')}</p>

      <h3>{t('routes.wheelThrowing.fourSession.when.label')}</h3>
      <p>{t('routes.wheelThrowing.fourSession.when.value')}</p>

      <h3>{t('routes.wheelThrowing.fourSession.duration.label')}</h3>
      <p>{t('routes.wheelThrowing.fourSession.duration.value')}</p>

      <h3>{t('routes.wheelThrowing.fourSession.cost.label')}</h3>
      <ul>
        {fourSessionCostItems.map((c, i) => <li key={i}>{c}</li>)}
      </ul>

      <p><a href={BOOK_URL} className={styles.bookNow}>{t('routes.wheelThrowing.fourSession.bookNow')}</a></p>

      <h3 className={styles.faqHeading}>{t('routes.wheelThrowing.fourSession.faq.label')}</h3>
      {fourSessionFaqItems.map((item, i) => (
        <React.Fragment key={i}>
          <p><strong>{item.q}</strong></p>
          <p>{item.a}</p>
        </React.Fragment>
      ))}

      <p><em>{t('routes.wheelThrowing.fourSession.languageNote')}</em></p>
    </div>

    <br/>

    {/* ── 1-session intensive ──────────────────────────────────────────────── */}
    <div className={styles.mainText}>
      <h2 id="one-session-wheel-intensive">{t('routes.wheelThrowing.oneSession.heading')}</h2>

      <h3>{t('routes.wheelThrowing.oneSession.whoFor.label')}</h3>
      {oneSessionWhoForParagraphs.map((p, i) => <p key={i}>{p}</p>)}

      <h3>{t('routes.wheelThrowing.oneSession.where.label')}</h3>
      <p>{t('routes.wheelThrowing.oneSession.where.value')}</p>

      <h3>{t('routes.wheelThrowing.oneSession.when.label')}</h3>
      <p>{t('routes.wheelThrowing.oneSession.when.value')}</p>

      <h3>{t('routes.wheelThrowing.oneSession.duration.label')}</h3>
      <p>{t('routes.wheelThrowing.oneSession.duration.value')}</p>

      <h3>{t('routes.wheelThrowing.oneSession.cost.label')}</h3>
      <ul>
        {oneSessionCostItems.map((c, i) => <li key={i}>{c}</li>)}
      </ul>

      <p><a href={BOOK_URL} className={styles.bookNow}>{t('routes.wheelThrowing.oneSession.bookNow')}</a></p>

      <h3 className={styles.faqHeading}>{t('routes.wheelThrowing.oneSession.faq.label')}</h3>
      {oneSessionFaqItems.map((item, i) => (
        <React.Fragment key={i}>
          <p><strong>{item.q}</strong></p>
          <p>{item.a}</p>
        </React.Fragment>
      ))}

      <p><em>{t('routes.wheelThrowing.oneSession.languageNote')}</em></p>
    </div>

  </Section>
}
