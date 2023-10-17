import styles from "./Logo.module.scss";
import {actions} from "../actions";
import {ERoute} from "../router";
import React, {FC} from "react";
import {useDispatch} from "react-redux";
import {ReactComponent as PalavaraLogo} from "../assets/logo.svg";
import cn from 'classnames'

export const Logo: FC<{
  className: string
}> = ({className}) => {
  const dispatch = useDispatch()

  return <div
    className={cn(styles.logo, className)}
    onClick={() => dispatch(actions.requestRouteChange({routeName: ERoute.HOME}))}
  >
    <PalavaraLogo/>
  </div>
}

export const LogoHome = () => <Logo className={styles.logoYellow}/>

export const LogoSection = () => <Logo className={styles.logoBlue}/>
