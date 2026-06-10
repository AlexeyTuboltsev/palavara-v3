import React, {FC} from 'react'
import {useTranslation} from 'react-i18next';
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const FamilySaturday: FC<{
  state: TReadyAppState
}> = ({state}) => {
  const {t} = useTranslation();
  const paragraphs = t('routes.familySaturday.paragraphs', {returnObjects: true}) as string[];
  const faqItems = t('routes.familySaturday.faq.items', {returnObjects: true}) as Array<{q: string; a: string}>;

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>{t('routes.familySaturday.title')}</h1>

      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
    <h2>{t('routes.familySaturday.when.label')}</h2>
    <p>{t('routes.familySaturday.when.value')}</p>

    <h2>{t('routes.familySaturday.where.label')}</h2>
    <p>{t('routes.familySaturday.where.value')}</p>

    <h2>{t('routes.familySaturday.cost.label')}</h2>
    <p>{t('routes.familySaturday.cost.familyTicket')}</p>
    <p>{t('routes.familySaturday.cost.base')}</p>
    <p>{t('routes.familySaturday.cost.addChild')}</p>
    <p>{t('routes.familySaturday.cost.addAdult')}</p>
    <p>{t('routes.familySaturday.cost.alternative')}</p>
    <p>{t('routes.familySaturday.cost.soloPrice')}</p>

    <p>{t('routes.familySaturday.cost.firingFee')}</p>
    <p>{t('routes.familySaturday.cost.firingNote')}</p>

    <h2>{t('routes.familySaturday.howToBook.label')}</h2>
    <p>{t('routes.familySaturday.howToBook.email')}</p>

    <h2>{t('routes.familySaturday.faq.label')}</h2>
    {faqItems.map((item, i) => (
      <React.Fragment key={i}>
        <p>{item.q}</p>
        <p>{item.a}</p>
        {i < faqItems.length - 1 && <br/>}
      </React.Fragment>
    ))}
  </Section>
}
