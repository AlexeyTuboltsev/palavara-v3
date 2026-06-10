import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const Membership: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();

  const paragraphs = t('routes.membership.paragraphs', {returnObjects: true}) as string[];
  const fullItems = t('routes.membership.full.items', {returnObjects: true}) as string[];
  const flexibleItems = t('routes.membership.flexible.items', {returnObjects: true}) as string[];

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>{t('routes.membership.title')}</h1>
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}

      <p>{t('routes.membership.contact')}</p>

      <br/>
      <h3>{t('routes.membership.full.heading')}</h3>
      <ul>
        {fullItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>

      <br/>
      <h3>{t('routes.membership.flexible.heading')}</h3>
      <ul>
        {flexibleItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  </Section>
}
