import {ERoute} from "../router";
import {EAppState, TReadyAppState} from "../reducer";
import {generateRandomString} from "../utils/utils";
import {actions} from "../actions";
import {menu} from "./menu";

export function wheelThrowing(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.WHEEL_THROWING},
    sectionMenu:
      [
        {id: generateRandomString(3), label: 'about', isActive: false, action: actions.noop()},
        {id: generateRandomString(3), label: 'shop', isActive: false, action: actions.noop()},
        {id: generateRandomString(3), label: 'rent a space', isActive: false, action: actions.noop()},
        {id: generateRandomString(3), label: 'contact', isActive: false, action: actions.noop()},
      ],
    menu:menu( ERoute.WHEEL_THROWING)
  }
}