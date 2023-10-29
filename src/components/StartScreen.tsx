import { Logo } from "./Logo";
import styles from "./StartScreen.module.scss"

export const StartScreen = () => 
    <div className={styles.startScreenWrapper}>
        <Logo className={styles.logo} />
    </div>