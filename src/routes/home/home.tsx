import styles from "../../App.module.scss";
import logo from "../../logo.svg";
import { useDispatch } from 'react-redux'
import {setRoute} from "../../reducer";
import {ERoute} from "../../router";

export const Home = ( ) => {
    const dispatch = useDispatch()
    return <div className={styles.app}>
        <header className={styles.appHeader}>
            <img src={logo} className={styles.appLogo} alt="logo"/>
            <p>
                HOME
            </p>
            <a
                className={styles.appLink}
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
            >
                Learn React
            </a>
            <button style={{width: '100px', height: '100px'}} onClick={() => dispatch(setRoute({routeName:ERoute.ROUTE_TREE, params: {id: '2dgfjf'}}))}/>
        </header>
    </div>
}