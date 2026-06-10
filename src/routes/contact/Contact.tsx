import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const Contact: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>{t('routes.contact.title')}</h1>
      <h2>{t('routes.contact.email.label')}</h2>
      <p><a href="mailto:palavarastudio@gmail.com">{t('routes.contact.email.value')}</a></p>
      <h2>{t('routes.contact.address.label')} </h2>
      <p>{t('routes.contact.address.value')}</p>

      <h2>{t('routes.contact.instagram.label')}</h2>
      <p><a href="https://www.instagram.com/palavara_potterystudio">{t('routes.contact.instagram.studio')}</a></p>
      <p><a href="https://www.instagram.com/palavara_ceramics">{t('routes.contact.instagram.ceramics')}</a></p>
    </div>
  </Section>
}
