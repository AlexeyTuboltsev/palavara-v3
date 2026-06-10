import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const RentASpace: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>{t('routes.rentASpace.title')}</h1>
      <p>{t('routes.rentASpace.body')}</p>
    </div>
  </Section>
}
