import styles from "./App/App.module.scss";
import React, {FC} from "react";
import {TSectionMenuItem} from "../reducer";
import {useDispatch} from "react-redux";

export const SectionMenuItem: FC< TSectionMenuItem > = (menuItem) => {
  const dispatch = useDispatch()

  return <div
    className={styles.sectionMenuItem}
    onClick={() => dispatch((menuItem.action))}
  >
    {menuItem.label}
  </div>
}