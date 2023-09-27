import styles from "./Menu.module.scss";
import React, {FC} from "react";
import {EMenuType, TChildMenuItem, TMenuItem, TRootMenuItem, TSimpleMenuItem} from "../types";
import {useDispatch} from "react-redux";
import cn from 'classnames'

const MenuItem: FC<{
  menu: {
    [key: string]: TMenuItem
  },
  menuItemId: string,
  type: 'blue' | 'yellow'
}> = ({
  menu,
  menuItemId,
  type
}) => {
  const dispatch = useDispatch()
  const menuItem = menu[menuItemId]

  switch (menuItem.type) {
    case EMenuType.PARENT:
      return <div
        className={cn(styles.parentMenuItemWrapper, {[styles.parentMenuItemWrapperActive]: menuItem.isActive})}>
        <div
          className={cn(menuItem.isActive ? styles.parentMenuItem : styles.menuItem, type === 'blue' ? styles.menuBlue : styles.menuYellow)}
          onClick={() => dispatch(menuItem.action)}
        >
          {menuItem.label}{menuItem.isActive ? ":" : ''}
        </div>
        {menuItem.isActive && menuItem.children.map((menuItemId: string) =>
          <ChildMenuItem key={menuItemId} menuItem={menu[menuItemId] as TChildMenuItem} type={type}/>
        )}
      </div>
    case EMenuType.SIMPLE:
      return <SimpleMenuItem menuItem={menu[menuItemId] as TSimpleMenuItem} type={type}/>
    default:
      return null
  }
}

const SimpleMenuItem: FC<{
  menuItem: TSimpleMenuItem,
  type: 'blue' | 'yellow'
}> = ({menuItem, type}) => {
  const dispatch = useDispatch()

  return <div
    className={cn(styles.menuItem, {[styles.menuItemActive]: menuItem.isActive}, type === 'blue' ? styles.menuBlue :styles.menuYellow )}
    onClick={() => dispatch(menuItem.action)}
  >
    {menuItem.label}
  </div>
}

const ChildMenuItem: FC<{
  menuItem: TChildMenuItem,
  type: 'blue' | 'yellow'
}> = ({menuItem, type}) => {
  const dispatch = useDispatch()

  return <div
    className={cn(styles.childMenuItem, {[styles.childMenuItemActive]: menuItem.isActive},  type === 'blue' ? styles.menuBlue :styles.menuYellow)}
    onClick={() => dispatch(menuItem.action)}
  >
    {menuItem.label}
  </div>
}

export const MenuYellow: FC<{
  [key: string]: TMenuItem
}> = (menu) =>
  <div className={cn(styles.menu, styles.menuYellow)}>
    {(menu.root as TRootMenuItem).children.map((menuItemId: string) =>
      <MenuItem key={menuItemId} menu={menu} menuItemId={menuItemId} type="yellow"/>)
    }
  </div>

export const MenuBlue: FC<{
  [key: string]: TMenuItem
}> = (menu) =>
  <div className={cn(styles.menu, styles.menuBlue)}>
    {(menu.root as TRootMenuItem).children.map((menuItemId: string) =>
      <MenuItem key={menuItemId} menu={menu} menuItemId={menuItemId} type='blue'/>)
    }
  </div>