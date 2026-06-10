import React, {FC} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from './Link';
import {ERoute} from '../router';
import styles from './SiteFooter.module.scss';

export const SiteFooter: FC = () => {
  const {t} = useTranslation();
  return (
    <footer className={styles.footer}>
      <Link to={{routeName: ERoute.IMPRESSUM}} className={styles.link}>{t('footer.impressum')}</Link>
      <Link to={{routeName: ERoute.AGB}} className={styles.link}>{t('footer.agb')}</Link>
      <Link to={{routeName: ERoute.DATENSCHUTZ}} className={styles.link}>{t('footer.datenschutz')}</Link>
    </footer>
  );
};
