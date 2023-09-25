import styles from "./SectionMenu.module.scss";
import React, {FC} from "react";
import {TSectionMenuItem} from "../reducer";
import cn from 'classnames';
import {useDispatch} from "react-redux";

const SectionMenuItem: FC< TSectionMenuItem  & {className:string}> = ({className,...menuItem}) => {
  const dispatch = useDispatch()

  return <div
    className={cn(styles.sectionMenuItem, className)}
    onClick={() => dispatch((menuItem.action))}
  >
    {menuItem.label}
  </div>
}

const SectionMenu:FC<{sectionMenu:TSectionMenuItem[], className:string}> = ({sectionMenu, className}) => {
  return <div className={cn(styles.sectionMenu, className)}>
    {sectionMenu.map(menuItem =>
      <SectionMenuItem key={menuItem.id} {...menuItem} className={className} />
    )}
  </div>
}

export const SectionMenuBlue:FC<{sectionMenu:TSectionMenuItem[]}> = ({sectionMenu}) => {
  return <SectionMenu sectionMenu={sectionMenu} className={styles.sectionMenuBlue}/>
}

export const SectionMenuYellow:FC<{sectionMenu:TSectionMenuItem[]}> = ({sectionMenu}) => {
  return <SectionMenu sectionMenu={sectionMenu} className={styles.sectionMenuYellow}/>
}