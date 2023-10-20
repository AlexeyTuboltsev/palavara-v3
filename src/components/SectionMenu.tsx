import styles from "./SectionMenu.module.scss";
import React, {FC} from "react";
import {ESectionMenuDisplayType, TSectionMenuItem} from "../types";
import cn from 'classnames';
import {useDispatch} from "react-redux";
import {EScreenSize} from "../routes/common/screenSize";

const SectionMenuItem: FC<TSectionMenuItem & { className: string }> = ({className, ...menuItem}) => {
  const dispatch = useDispatch()

  return <div
    className={cn(styles.sectionMenuItem, {[styles.active]:menuItem.isActive}, className, )}
    onClick={() => dispatch((menuItem.action))}
  >
    {menuItem.label}
  </div>
}

const SectionMenuSecondaryItem: FC<TSectionMenuItem & { className?: string }> = ({className, ...menuItem}) => {
  const dispatch = useDispatch()

  return <div
    className={cn(styles.sectionMenuItemSecondary, {[styles.active]:menuItem.isActive}, className, )}
    onClick={() => dispatch((menuItem.action))}
  >
    {menuItem.label}
  </div>
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
