import styles from "./HeaderLinks.module.scss";
import React, {FC} from "react";
import {ReactComponent as InstagramLogo} from "../assets/instagram-logo.svg";
import cn from 'classnames';

const HeaderLinks:FC<{className:string}> = ({className}) => {
  return <div className={cn(styles.links, className)}>
    <a href="https://www.instagram.com/palavara_ceramics/">palavara_studio</a>
    <div className={cn(styles.instagramLogo,className)}><InstagramLogo/></div>
    <a href="https://www.instagram.com/palavara_studio/">palavara_ceramics</a>
  </div>
}

export const HeaderLinksYellow = () =>
  <HeaderLinks className={styles.linksYellow} />

export const HeaderLinksBlue = () =>
  <HeaderLinks className={styles.linksBlue} />