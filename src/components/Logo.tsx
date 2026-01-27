import styles from "./Logo.module.scss";
import {ERoute} from "../router";
import React, {FC} from "react";
import {ReactComponent as PalavaraLogo} from "../assets/logo.svg";
import cn from 'classnames'
import {Link} from "./Link";

export const Logo: FC<{
  className: string
}> = ({className}) => {
  return <Link
    to={{routeName: ERoute.HOME}}
    className={cn(styles.logo, className)}
  >
    <PalavaraLogo/>
  </Link>
}

export const LogoHome = () => <Logo className={styles.logoYellow}/>

export const LogoSection = () => <Logo className={styles.logoBlue}/>
