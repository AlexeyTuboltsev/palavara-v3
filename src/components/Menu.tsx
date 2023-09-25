import styles from "./App/App.module.scss";
import React, {FC} from "react";
import {EMenuType, TMenuItem, TRootMenuItem} from "../reducer";
import {useDispatch} from "react-redux";
import cn from 'classnames'

const MenuItem: FC<{ menu: { [key: string]: TMenuItem }, menuItemId: string, className?: string }> = ({
  menu,
  menuItemId,
  className
}) => {
  const dispatch = useDispatch()
  const menuItem = menu[menuItemId]
  switch (menuItem.type) {
    case EMenuType.PARENT:
      return <div
        className={cn(styles.parentMenuItemWrapper, menuItem.isActive ? styles.parentMenuItemWrapperActive : "")}>
        <div
          className={menuItem.isActive ? styles.parentMenuItem : styles.menuItem}
          onClick={() => dispatch(menuItem.action)}
        >
          {menuItem.label}{menuItem.isActive ? ":" : ''}
        </div>
        {menuItem.isActive && menuItem.children.map((menuItemId: string) =>
          <MenuItem key={menuItemId} menu={menu} menuItemId={menuItemId} className={styles.childMenuItem}/>
        )}
      </div>
    case EMenuType.SIMPLE:
      return <div
        className={className ?? styles.menuItem}
        onClick={() => dispatch(menuItem.action)}
      >
        {menuItem.label}
      </div>
    default:
      return null
  }
}


export const Menu: FC<{ [key: string]: TMenuItem }> = (menu) =>
  <div className={styles.menu}>
    {(menu.root as TRootMenuItem).children.map((menuItemId: string) =>
      <MenuItem key={menuItemId} menu={menu} menuItemId={menuItemId}/>)
    }
  </div>