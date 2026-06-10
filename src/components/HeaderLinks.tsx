import styles from "./HeaderLinks.module.scss";
import React, {FC} from "react";
import {useTranslation} from "react-i18next";
import {ReactComponent as InstagramLogo} from "../assets/instagram-logo.svg";
import cn from 'classnames';
import {ELang} from "../services/i18n";
import {applyLangToPath, parseLangFromPath} from "../utils/routerUtils";

/**
 * EN | DE switcher. The active language is rendered as a static span;
 * the other side is an anchor to the same route under the other
 * language's URL prefix. A full-page navigation is intentional here —
 * cheapest way to reset i18n + Redux + URL atomically without
 * threading a dedicated "switch language" action through every saga.
 * One-time cost on click; no functional downside.
 */
const LanguageSwitcher: FC = () => {
  const {i18n} = useTranslation();
  const currentLang = i18n.language === ELang.DE ? ELang.DE : ELang.EN;

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const {pathname} = parseLangFromPath(currentPath);

  return (
    <div className={styles.langSwitcher}>
      {currentLang === ELang.EN
        ? <span className={styles.activeLang}>EN</span>
        : <a href={applyLangToPath(pathname, ELang.EN)} hrefLang="en">EN</a>}
      <span className={styles.langSep}>|</span>
      {currentLang === ELang.DE
        ? <span className={styles.activeLang}>DE</span>
        : <a href={applyLangToPath(pathname, ELang.DE)} hrefLang="de">DE</a>}
    </div>
  );
};

export const HeaderLinks:FC<{className:string}> = ({className}) => {
  return <div className={cn(styles.links, className)}>
    <a href="https://www.instagram.com/palavara_potterystudio/" target="_blank" rel="noopener noreferrer">palavara_potterystudio</a>
    <div className={cn(styles.instagramLogo,className)}><InstagramLogo/></div>
    <a className={styles.hiddenOnMobile} href="https://www.instagram.com/palavara_ceramics/" target="_blank" rel="noopener noreferrer">palavara_ceramics</a>
    <LanguageSwitcher />
  </div>
}

export const HeaderLinksYellow = () =>
  <HeaderLinks className={styles.linksYellow} />

export const HeaderLinksBlue = () =>
  <HeaderLinks className={styles.linksBlue} />