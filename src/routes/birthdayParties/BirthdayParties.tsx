import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const BirthdayParties: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();
  const intro = t('routes.birthdayParties.intro', {returnObjects: true}) as string[];
  const childrenItems = t('routes.birthdayParties.children.items', {returnObjects: true}) as string[];
  const adultItems = t('routes.birthdayParties.adult.items', {returnObjects: true}) as string[];

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>{t('routes.birthdayParties.title')}</h1>
      {intro.map((p, i) => <p key={i}>{p}</p>)}
      <br/>
      <h3>{t('routes.birthdayParties.children.heading')}</h3>
      <ul>
        {childrenItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>

      <br/>
      <h3>{t('routes.birthdayParties.adult.heading')}</h3>
      <ul>
        {adultItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  </Section>
}
