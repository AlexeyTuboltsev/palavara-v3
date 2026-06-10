import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";
import {Link} from "../../components/Link";
import {ERoute} from "../../router";

export const NotFound: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();

  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>{t('routes.notFound.title')}</h1>
      <p>{t('routes.notFound.body')}</p>
      <p>
        <Link to={{routeName: ERoute.HOME}}>{t('routes.notFound.backHome')}</Link>
      </p>
    </div>
  </Section>
}
