import styles from "./SectionMenu.module.scss";
import React, {FC} from "react";
import {ESectionMenuDisplayType, TSectionMenuItem} from "../types";
import cn from 'classnames';
import {useDispatch} from "react-redux";
import {EScreenSize} from "../routes/common/screenSize";
import {EActionType, TAction} from "../actions";
import {Link} from "./Link";
import {TRoute} from "../router";

const SectionMenuItemWrapper: FC<{
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

  // Check if this is an external link action
  if (action.type === EActionType.EXTERNAL_LINK) {
    return (
      <a href={action.payload as string} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  // For other actions, use div with onClick
  return (
    <div className={className} onClick={() => dispatch(action)}>
      {children}
    </div>
  )
}

const SectionMenuItem: FC<TSectionMenuItem & { className: string }> = ({className, ...menuItem}) => {
  return <SectionMenuItemWrapper
    action={menuItem.action}
    className={cn(styles.sectionMenuItem, {[styles.active]:menuItem.isActive}, className, )}
  >
    {menuItem.label}
  </SectionMenuItemWrapper>
}

const SectionMenuSecondaryItem: FC<TSectionMenuItem & { className?: string }> = ({className, ...menuItem}) => {
  return <SectionMenuItemWrapper
    action={menuItem.action}
    className={cn(styles.sectionMenuItemSecondary, {[styles.active]:menuItem.isActive}, className, )}
  >
    {menuItem.label}
  </SectionMenuItemWrapper>
}

const SectionMenu: FC<{ sectionMenu: TSectionMenuItem[], className: string, screenSize: EScreenSize}> = ({screenSize, sectionMenu, className}) => {
  if(screenSize === EScreenSize.MOBILE){
    return <div className={cn(styles.sectionMenu, className)}>
      {sectionMenu.map(menuItem => {
          switch (menuItem.mobileDisplayType) {
            case ESectionMenuDisplayType.MAIN:
              return <SectionMenuItem key={menuItem.id} {...menuItem} className={className}/>
            case ESectionMenuDisplayType.SECONDARY:
            default:
              return null
          }
        }
      )}
    </div>
  } else {
    return <div className={cn(styles.sectionMenu, className)}>
      {sectionMenu.map(menuItem => {
          switch (menuItem.mobileDisplayType) {
            case ESectionMenuDisplayType.MAIN:
              return <SectionMenuItem key={menuItem.id} {...menuItem} className={className}/>
            case ESectionMenuDisplayType.SECONDARY:
            default:
              return <SectionMenuItem key={menuItem.id} {...menuItem} className={className}/>
          }
        }
      )}
    </div>
  }
}

export const SectionMenuBlue: FC<{ sectionMenu: TSectionMenuItem[], screenSize: EScreenSize }> = ({sectionMenu,screenSize}) => {
  return <SectionMenu sectionMenu={sectionMenu} className={styles.sectionMenuBlue} screenSize={screenSize}/>
}

export const SectionMenuWhite: FC<{ sectionMenu: TSectionMenuItem[], screenSize: EScreenSize }> = ({sectionMenu,screenSize}) => {
  return <SectionMenu sectionMenu={sectionMenu} className={styles.sectionMenuWhite} screenSize={screenSize}/>
}

export const SectionMenuYellow: FC<{ sectionMenu: TSectionMenuItem[],screenSize:EScreenSize  }> = ({sectionMenu,screenSize}) => {
  return <SectionMenu sectionMenu={sectionMenu} className={styles.sectionMenuYellow} screenSize={screenSize} />
}

export const SectionMenuSecondary: FC<{ sectionMenu: TSectionMenuItem[], type:"blue"|"yellow", className?:string}> =({sectionMenu, type, className}) =>
  <div className={styles.mobileSecondaryMenu}>
    {sectionMenu.map(menuItem => {
        switch (menuItem.mobileDisplayType) {
          case ESectionMenuDisplayType.MAIN:
            return null
          case ESectionMenuDisplayType.SECONDARY:
          default:
            return <SectionMenuSecondaryItem key={menuItem.id} {...menuItem} className={cn(styles.sectionMenuItemSecondary, styles.sectionMenuBlue, className)}/>
        }
      }
    )}
  </div>
