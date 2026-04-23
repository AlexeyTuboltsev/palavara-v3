import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import styles from "../../components/Section.module.scss";
import {Link} from "../../components/Link";
import {ERoute} from "../../router";

export const NotFound: FC<{
  state: TReadyAppState
}> = ({state}) => {
  return <Section state={state}>
    <div className={styles.mainText}>
      <h1>Page not found</h1>
      <p>Sorry, this page doesn't exist.</p>
      <p>
        <Link to={{routeName: ERoute.HOME}}>Back to home</Link>
      </p>
    </div>
  </Section>
}
