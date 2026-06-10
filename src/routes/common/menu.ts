import {EMenuType, TChildMenuItem, TMenuItem, TParentMenuItem} from "../../types";
import {actions} from "../../actions";
import {ERoute} from "../../router";

export function menu(activeMenuId?: string): {
  root: TMenuItem
} & {
  [id: string]: TMenuItem
} {

  const menuData: {
    root: TMenuItem
  } & {
    [id: string]: TMenuItem
  } = {
    root: {
      id: 'root',
      type: EMenuType.ROOT as const,
      children: ['classes', 'familySaturday', 'openStudio', 'firingService', 'giftCertificate', 'membership','eventWorkshops']
    },
    'classes': {
      id: 'classes',
      type: EMenuType.PARENT as const,
      label: 'menu.classes',
      isActive: false,
      children: ['kidsClass', 'wheelThrowing'],
      action: actions.toggleOpen('classes')
    },
    'familySaturday': {
      id: 'familySaturday',
      type: EMenuType.SIMPLE,
      label: 'menu.familySaturday',
      isActive: activeMenuId === ERoute.FAMILY_SATURDAY,
      action: actions.requestRouteChange({routeName: ERoute.FAMILY_SATURDAY})
    },
    'openStudio': {
      id: 'openStudio',
      type: EMenuType.SIMPLE,
      label: 'menu.openStudio',
      isActive: activeMenuId === ERoute.OPEN_STUDIO,
      action: actions.requestRouteChange({routeName: ERoute.OPEN_STUDIO})
    },
    'firingService': {
      id: 'firingService',
      type: EMenuType.SIMPLE,
      label: 'menu.firingService',
      isActive: activeMenuId === ERoute.FIRING_SERVICE,
      action: actions.requestRouteChange({routeName: ERoute.FIRING_SERVICE})
    },
    'giftCertificate': {
      id: 'giftCertificate',
      type: EMenuType.SIMPLE,
      label: 'menu.giftCertificate',
      isActive: activeMenuId === ERoute.GIFT_CERTIFICATE,
      action: actions.requestRouteChange({routeName: ERoute.GIFT_CERTIFICATE})
    },
    'membership': {
      id: "membership",
      type: EMenuType.SIMPLE,
      label: 'menu.membership',
      isActive: activeMenuId === ERoute.MEMBERSHIP,
      action: actions.requestRouteChange({routeName: ERoute.MEMBERSHIP})
    },
    'kidsClass': {
      id: 'kidsClass',
      type: EMenuType.CHILD,
      parentId: 'classes',
      label: 'menu.kidsClass',
      isActive: activeMenuId === ERoute.KIDS_CLASS,
      action: actions.requestRouteChange({
        routeName: ERoute.KIDS_CLASS
      })
    },
    'wheelThrowing': {
      id: 'wheelThrowing',
      type: EMenuType.CHILD,
      parentId: 'classes',
      label: 'menu.wheelThrowing',
      isActive: activeMenuId === ERoute.WHEEL_THROWING,
      action: actions.requestRouteChange({routeName: ERoute.WHEEL_THROWING})
    },
    'eventWorkshops': {
      id: 'eventWorkshops',
      type: EMenuType.PARENT as const,
      label: 'menu.eventWorkshops',
      isActive: false,
      children: ['teamEvents', 'birthdayParties'],
      action: actions.toggleOpen('eventWorkshops')
    },
    'teamEvents': {
      id: 'teamEvents',
      type: EMenuType.CHILD,
      parentId: 'eventWorkshops',
      label: 'menu.teamEvents',
      isActive: activeMenuId === ERoute.TEAM_EVENTS,
      action: actions.requestRouteChange({routeName: ERoute.TEAM_EVENTS})
    },
    'birthdayParties': {
      id: 'birthdayParties',
      type: EMenuType.CHILD,
      parentId: 'eventWorkshops',
      label: 'menu.birthdayParties',
      isActive: activeMenuId === ERoute.BIRTHDAY_PARTIES,
      action: actions.requestRouteChange({routeName: ERoute.BIRTHDAY_PARTIES})
    },
  }

  if (activeMenuId && menuData[activeMenuId] && menuData[activeMenuId].type === EMenuType.CHILD) {
    const childMenuItem = menuData[activeMenuId] as TChildMenuItem
    const parentMenuItem = menuData[childMenuItem.parentId] as TParentMenuItem
    parentMenuItem.isActive = true;
  }

  return menuData
}