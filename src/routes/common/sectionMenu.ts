import {generateRandomString} from "../../utils/utils";
import {actions} from "../../actions";

export function sectionMenu(){
  return [
    {id: generateRandomString(3), label: 'about', isActive: false, action: actions.noop()},
    {id: generateRandomString(3), label: 'shop', isActive: false, action: actions.noop()},
    {id: generateRandomString(3), label: 'rent a space', isActive: false, action: actions.noop()},
    {id: generateRandomString(3), label: 'contact', isActive: false, action: actions.noop()},
  ]
}