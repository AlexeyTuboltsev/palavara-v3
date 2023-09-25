import styles from "../../components/App/App.module.scss";
import logo from "../../logo.svg";
import { useDispatch } from 'react-redux'
import {setRoute} from "../../reducer";
import {ERoute} from "../../router";

export const OtherRoute = ( ) => {
    const dispatch = useDispatch()
    return <div className={styles.app}>
        <header className={styles.appHeader}>
            <img src={logo} className={styles.appLogo} alt="logo"/>
            <p>
                ROUTE 2
            </p>
            <a
                className={styles.appLink}
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
            >
                Learn React
            </a>
            {/*<button style={{width: '100px', height: '100px'}} onClick={() => dispatch(setRoute({routeName:ERoute.ROUTE_TREE, params: {id:"23rw"}}))}/>*/}
        </header>
    </div>
}