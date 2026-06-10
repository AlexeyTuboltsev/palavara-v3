import React, { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next';
import { TReadyAppState } from "../../types";
import { Section } from "../../components/Section";
import styles from "../../components/Section.module.scss";

export const GiftCertificate: FC<{
  state: TReadyAppState
}> = ({ state }) => {
  const { t } = useTranslation();
  const openStudioItems = t('routes.giftCertificate.openStudio.items', { returnObjects: true }) as string[];
  const familySaturdayItems = t('routes.giftCertificate.familySaturday.items', { returnObjects: true }) as string[];
  const howToPurchaseParagraphs = t('routes.giftCertificate.howToPurchase.paragraphs', { returnObjects: true }) as string[];

  return <Section state={state}>
    <div className={styles.mainText}>

      <h1>{t('routes.giftCertificate.title')}</h1>

      <h2>{t('routes.giftCertificate.openStudio.heading')}</h2>
      {openStudioItems.map((item, i) => <p key={i}>{item}</p>)}
      <p className={styles.italic}>{t('routes.giftCertificate.openStudio.note')}</p>

      <h2>{t('routes.giftCertificate.familySaturday.heading')}</h2>
      {familySaturdayItems.map((item, i) => <p key={i}>{item}</p>)}

      <h2>{t('routes.giftCertificate.wheel.heading')}</h2>
      <p>
        <Trans i18nKey="routes.giftCertificate.wheel.body">
          You can purchase a gift certificate for any wheel throwing course from the <strong>Classes / Wheel Throwing</strong> section.
        </Trans>
      </p>

      <p><strong>{t('routes.giftCertificate.howToPurchase.label')}</strong></p>
      {howToPurchaseParagraphs.map((p, i) => <p key={i}>{p}</p>)}

      <p><strong>
        <Trans i18nKey="routes.giftCertificate.howToPurchase.emailLine">
          email: <a href="mailto:palavarastudio@gmail.com">palavarastudio@gmail.com</a>
        </Trans>
      </strong></p>

    </div>
  </Section>
}
