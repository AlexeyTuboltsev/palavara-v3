import React, {FC} from 'react'
import {Trans, useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const KidsClass: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();
  const paragraphs = t('routes.kidsClass.paragraphs', {returnObjects: true}) as string[];
  const costItems = t('routes.kidsClass.cost.items', {returnObjects: true}) as string[];

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>{t('routes.kidsClass.title')}</h1>
      <p>{t('routes.kidsClass.subtitle')}</p>

      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
    <h2>{t('routes.kidsClass.where.label')}</h2>
    <p>{t('routes.kidsClass.where.value')}</p>
    <h2>{t('routes.kidsClass.when.label')}</h2>
    <p>{t('routes.kidsClass.when.value')}</p>
    <h2>{t('routes.kidsClass.cost.label')}</h2>
    {costItems.map((c, i) => <p key={i}>{c}</p>)}
    <p>{t('routes.kidsClass.cost.missedClassNote')}</p>
    <p>{t('routes.kidsClass.cost.holidaysNote')}</p>

    <h2>{t('routes.kidsClass.howToBook.label')}</h2>
    <p>
      <Trans i18nKey="routes.kidsClass.howToBook.emailLine">
        <a href="mailto:palavarastudio+kp@gmail.com">palavarastudio+kp@gmail.com</a>
      </Trans>
    </p>
  </Section>
}
