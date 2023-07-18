import React from 'react';
import logo from './logo.svg';
import styles from './App.module.scss';
import {myAction} from "./reducer";
import { useDispatch } from 'react-redux'

function App() {
    const dispatch = useDispatch()
    return (
        <div className={styles.app}>
            <header className={styles.appHeader}>
                <img src={logo} className={styles.appLogo} alt="logo"/>
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <a
                    className={styles.appLink}
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
                <button style={{width: '100px', height: '100px'}} onClick={() => dispatch(myAction())}/>
            </header>
        </div>
    );
}

export default App;
