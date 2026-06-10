import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const TeamEvents: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();
  const option1Paragraphs = t('routes.teamEvents.option1.paragraphs', {returnObjects: true}) as string[];
  const option1IncludedItems = t('routes.teamEvents.option1.included.items', {returnObjects: true}) as string[];
  const option2Paragraphs = t('routes.teamEvents.option2.paragraphs', {returnObjects: true}) as string[];
  const option2IncludedItems = t('routes.teamEvents.option2.included.items', {returnObjects: true}) as string[];

  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>{t('routes.teamEvents.title')}</h1>
      <p>{t('routes.teamEvents.intro')}</p>
    <br/>
    <h2>{t('routes.teamEvents.option1.heading')}</h2>
      {option1Paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      <br/>
      <h3>{t('routes.teamEvents.option1.included.label')}</h3>
      <ul>
        {option1IncludedItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
      <p className={styles.small}>{t('routes.teamEvents.option1.included.footnoteExtraPiece')}</p>
      <p className={styles.small}>{t('routes.teamEvents.option1.included.footnotePickup')}</p>
      <br/>
      <h3>{t('routes.teamEvents.option1.price.label')}</h3>
      <p>{t('routes.teamEvents.option1.price.value')}</p>
      <p className={styles.small}>{t('routes.teamEvents.option1.price.vatNote')}</p>
      <br/>
    <h2>{t('routes.teamEvents.option2.heading')}</h2>
      {option2Paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      <br/>
      <h3>{t('routes.teamEvents.option2.included.label')}</h3>
      <ul>
        {option2IncludedItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
      <p className={styles.small}>{t('routes.teamEvents.option2.included.footnoteExtraPiece')}</p>
      <p className={styles.small}>{t('routes.teamEvents.option2.included.footnotePickup')}</p>
      <br/>
      <h3>{t('routes.teamEvents.option2.price.label')}</h3>
      <p>{t('routes.teamEvents.option2.price.value')}</p>
      <p className={styles.small}>{t('routes.teamEvents.option2.price.vatNote')}</p>
    </div>

    </Section>
}
