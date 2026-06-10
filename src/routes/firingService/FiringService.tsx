import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const FiringService: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>{t('routes.firingService.title')}</h1>
      <p>{t('routes.firingService.bisquePricePerKg')}</p>
      <p>{t('routes.firingService.glazePricePerKg')}</p>
      <br />
      <h2>{t('routes.firingService.kilnCost.label')}</h2>
      <p>{t('routes.firingService.kilnCost.bisqueNote')}</p>
      <p>{t('routes.firingService.kilnCost.bisquePrice')}</p>
      <br/>
      <p>{t('routes.firingService.kilnCost.glazeNote')}</p>
      <p>{t('routes.firingService.kilnCost.glazePrice')}</p>
    </div>
  </Section>
}
