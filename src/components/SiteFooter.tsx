import React, {FC} from 'react';
import {Link} from './Link';
import {ERoute} from '../router';
import styles from './SiteFooter.module.scss';

export const SiteFooter: FC = () => (
  <footer className={styles.footer}>
    <Link to={{routeName: ERoute.IMPRESSUM}} className={styles.link}>Impressum</Link>
    <Link to={{routeName: ERoute.AGB}} className={styles.link}>AGB</Link>
    <Link to={{routeName: ERoute.DATENSCHUTZ}} className={styles.link}>Datenschutzerklärung</Link>
  </footer>
);
