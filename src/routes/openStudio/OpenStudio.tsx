import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const OpenStudio: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();
  const paragraphs = t('routes.openStudio.paragraphs', {returnObjects: true}) as string[];

  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>{t('routes.openStudio.title')}</h1>
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
    <h2>{t('routes.openStudio.where.label')}</h2>
    <p>{t('routes.openStudio.where.value')}</p>
    <h2>{t('routes.openStudio.cost.label')}</h2>
    <p>{t('routes.openStudio.cost.base')}</p>

    <p>{t('routes.openStudio.cost.firingFee')}</p>
    <p>{t('routes.openStudio.cost.firingNote')}</p>

    <h2>{t('routes.openStudio.when.label')}</h2>
    <p>{t('routes.openStudio.when.fridays')}</p>
    <p>{t('routes.openStudio.when.saturdays')}</p>

    <h2>{t('routes.openStudio.howToBook.label')}</h2>
    <p>{t('routes.openStudio.howToBook.email')}</p>

    <p>{t('routes.openStudio.howToBook.note')}</p>
  </Section>
}
