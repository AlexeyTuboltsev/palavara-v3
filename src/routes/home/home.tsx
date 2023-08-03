import React from 'react'
import styles from "../../components/App/App.module.scss";
import logo from "../../logo.svg";
import {useDispatch} from 'react-redux'
import {setRoute} from "../../reducer";
import {ERoute} from "../../router";
import {useTranslation} from 'react-i18next';
import {actions} from "../../actions";
import {ELang} from "../../services/i18n";

export const Home = () => {
  const dispatch = useDispatch()
  const {t} = useTranslation();

  return <div className={styles.app}>
    <header className={styles.appHeader}>
      <img src={logo} className={styles.appLogo} alt="logo"/>
      <p>
        {t('home')}
      </p>
      <a
        className={styles.appLink}
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn React
      </a>
      <button style={{width: '100px', height: '100px'}}
              onClick={() => dispatch(setRoute({routeName: ERoute.ROUTE_TREE, params: {id: '2dgfjf'}}))}/>
      <button style={{width: '100px', height: '100px'}} onClick={() => dispatch(actions.changeLanguage(ELang.RU))}>ru
      </button>
      <button style={{width: '100px', height: '100px'}} onClick={() => dispatch(actions.changeLanguage(ELang.EN))}>en
      </button>
    </header>
  </div>
}