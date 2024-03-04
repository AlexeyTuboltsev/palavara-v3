import {EMenuType, TMenuItem} from "../../types";
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
      children: ['classes', 'familySaturday', 'openStudio', 'firingService', 'giftCertificate', 'membership']
    },
    'classes': {
      id: 'classes',
      type: EMenuType.PARENT as const,
      label: 'classes',
      isActive: false,
      children: ['kidsClass', 'wheelThrowing', 'workshops'],
      action: actions.toggleOpen('classes')
    },
    'familySaturday': {
      id: 'familySaturday',
      type: EMenuType.SIMPLE,
      label: 'family saturday',
      isActive: activeMenuId === ERoute.FAMILY_SATURDAY,
      action: actions.requestRouteChange({routeName: ERoute.FAMILY_SATURDAY})
    },
    'openStudio': {
      id: 'openStudio',
      type: EMenuType.SIMPLE,
      label: 'open studio',
      isActive: activeMenuId === ERoute.OPEN_STUDIO,
      action: actions.requestRouteChange({routeName: ERoute.OPEN_STUDIO})
    },
    'firingService': {
      id: 'firingService',
      type: EMenuType.SIMPLE,
      label: 'firing service',
      isActive: activeMenuId === ERoute.FIRING_SERVICE,
      action: actions.requestRouteChange({routeName: ERoute.FIRING_SERVICE})
    },
    'giftCertificate': {
      id: 'giftCertificate',
      type: EMenuType.SIMPLE,
      label: 'gift certificate',
      isActive: activeMenuId === ERoute.GIFT_CERTIFICATE,
      action: actions.requestRouteChange({routeName: ERoute.GIFT_CERTIFICATE})
    },
    'membership': {
      id: "membership",
      type: EMenuType.SIMPLE,
      label: 'membership',
      isActive: activeMenuId === ERoute.MEMBERSHIP,
      action: actions.requestRouteChange({routeName: ERoute.MEMBERSHIP})
    },

    'kidsClass': {
      id: 'kidsClass',
      type: EMenuType.SIMPLE,
      label: 'kids class (sold out)',
      isActive: activeMenuId === ERoute.KIDS_CLASS,
      action: actions.requestRouteChange({
        routeName: ERoute.KIDS_CLASS
      })
    },
    'wheelThrowing': {
      id: 'wheelThrowing',
      type: EMenuType.SIMPLE,
      label: 'wheel-throwing',
      isActive: activeMenuId === ERoute.WHEEL_THROWING,
      action: actions.requestRouteChange({routeName: ERoute.WHEEL_THROWING})
    },
    'workshops': {
      id: 'workshops',
      type: EMenuType.SIMPLE,
      label: 'workshops',
      isActive: activeMenuId === ERoute.WORKSHOPS,
      action: actions.requestRouteChange({routeName: ERoute.WORKSHOPS})
    },
  }

  if (activeMenuId && menuData.classes.type === EMenuType.PARENT && menuData.classes.children.includes(activeMenuId)) {
    menuData.classes.isActive = true;
  }

  return menuData
}