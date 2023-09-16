import styles from "./App/App.module.scss";
import React, {FC} from "react";
import {TMenuItem} from "../reducer";
import {useDispatch} from "react-redux";

export const MenuItem: FC<{ menuItem: TMenuItem }> = ({menuItem}) => {
  const dispatch = useDispatch()

  return <div
    className={styles.menuItem}
    onClick={dispatch()}
  >
    {menuItem.label}
  </div>
}