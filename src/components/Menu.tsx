import styles from "./Menu.module.scss";
import secondaryMenuStyles from "./SectionMenu.module.scss";
import React, { FC } from "react";
import { EMenuType, TChildMenuItem, TMenuItem, TReadyAppState, TRootMenuItem, TSimpleMenuItem } from "../types";
import { useDispatch } from "react-redux";
import cn from 'classnames'
import { EScreenSize } from "../routes/common/screenSize";
import { SectionMenuSecondary } from "./SectionMenu";
import { EActionType, TAction } from "../actions";
import { Link } from "./Link";
import { ERoute, TRoute } from "../router";

const MenuItemWrapper: FC<{
  action: TAction
  className?: string
  children: React.ReactNode
}> = ({ action, className, children }) => {
  const dispatch = useDispatch()

  // Check if this is a route navigation action
  if (action.type === EActionType.REQUEST_ROUTE_CHANGE) {
    return (
      <Link to={action.payload as TRoute} className={className}>
        {children}
      </Link>
    )
  }

  // For other actions (like toggleOpen), use div with onClick
  return (
    <div className={className} onClick={() => dispatch(action)}>
      {children}
    </div>
  )
}

const MenuButton: FC<{ className?: string }> = ({ className }) => {
  return <Link to={{ routeName: ERoute.HOME }} className={cn(styles.menuButton, className)}>
    <span /><span /><span />
  </Link>
}

const MenuItem: FC<{
  menu: {
    [key: string]: TMenuItem
  },
  menuItemId: string,
  type: 'blue' | 'yellow',
  className?: string
}> = ({
  menu,
  menuItemId,
  type,
  className
}) => {
    const menuItem = menu[menuItemId]

    switch (menuItem.type) {
      case EMenuType.PARENT:
        return (
        <div
          className={cn(styles.parentMenuItemWrapper, { [styles.parentMenuItemWrapperActive]: menuItem.isActive })}>
          <MenuItemWrapper
            action={menuItem.action}
            className={cn(menuItem.isActive ? styles.parentMenuItem : styles.menuItem, className, type === 'blue' ? styles.menuBlue : styles.menuYellow)}
          >
            {menuItem.label}{menuItem.isActive ? ":" : ''}
          </MenuItemWrapper>
          {menuItem.isActive && menuItem.children.map((menuItemId: string) =>
            <ChildMenuItem key={menuItemId} menuItem={menu[menuItemId] as TChildMenuItem} type={type} className={className}/>
          )}
        </div>
        )
      case EMenuType.SIMPLE:
        return <SimpleMenuItem menuItem={menu[menuItemId] as TSimpleMenuItem} className={className} type={type} />
      default:
        return null
    }
  }

const SimpleMenuItem: FC<{
  menuItem: TSimpleMenuItem,
  type: 'blue' | 'yellow',
  className?: string
}> = ({ menuItem, type, className }) => {
  return <MenuItemWrapper
    action={menuItem.action}
    className={cn(styles.menuItem, { [styles.menuItemActive]: menuItem.isActive }, className, type === 'blue' ? styles.menuBlue : styles.menuYellow)}
  >
    {menuItem.label}
  </MenuItemWrapper>
}

const ChildMenuItem: FC<{
  menuItem: TChildMenuItem,
  type: 'blue' | 'yellow',
  className?:string
}> = ({ menuItem, type, className }) => {
  return <MenuItemWrapper
    action={menuItem.action}
    className={cn(styles.childMenuItem, { [styles.childMenuItemActive]: menuItem.isActive }, type === 'blue' ? styles.menuBlue : styles.menuYellow, className)}
  >
    {menuItem.label}
  </MenuItemWrapper>
}


export const MenuSec: FC<{ state: TReadyAppState }> = ({ state }) =>
  <div
    className={cn(styles.menu, styles.menuBlue, { [styles.menuHidden]: !(state as any).menuIsOpen })}>
    {(state.menu.root as TRootMenuItem).children.map((menuItemId: string) =>
      <MenuItem key={menuItemId} menu={state.menu} menuItemId={menuItemId} type={'blue'} />)
    }
    {state.screenSize === EScreenSize.MOBILE && state.menuIsCollapsible &&
      <MenuButton />
    }
    {(state as any).screenSize === EScreenSize.MOBILE &&
      <SectionMenuSecondary sectionMenu={state.sectionMenu} type={'blue'} />
    }
  </div>

export const MenuHome: FC<{ state: TReadyAppState }> = ({ state }) => <div
  className={cn(styles.menu, styles.menuHome, { [styles.menuHidden]: !(state as any).menuIsOpen })}>
  {(state.menu.root as TRootMenuItem).children.map((menuItemId: string) =>
    <MenuItem key={menuItemId} menu={state.menu} menuItemId={menuItemId} type={'yellow'} />)
  }
  {state.screenSize === EScreenSize.MOBILE && state.menuIsCollapsible &&
    <MenuButton />
  }
  {(state as any).screenSize === EScreenSize.MOBILE &&
    <SectionMenuSecondary sectionMenu={state.sectionMenu} type={'yellow'} />
  }
</div>


export const MenuAbout: FC<{ state: TReadyAppState }> = ({ state }) => <div
  className={cn(styles.menu, styles.menuYellow, { [styles.menuHidden]: !(state as any).menuIsOpen })}>
  {(state.menu.root as TRootMenuItem).children.map((menuItemId: string) =>
    <MenuItem key={menuItemId} menu={state.menu} menuItemId={menuItemId} className={styles.menuAbout} type={'blue'} />)
  }
  {state.screenSize === EScreenSize.MOBILE && state.menuIsCollapsible &&
    <MenuButton className={styles.menuButtonBlue} />
  }
  {(state as any).screenSize === EScreenSize.MOBILE &&
    <SectionMenuSecondary sectionMenu={state.sectionMenu} className={secondaryMenuStyles.menuAbout} type={'blue'} />
  }
</div>
