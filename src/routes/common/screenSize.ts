import {config} from "../../config";

export enum EScreenSize {
  MOBILE = "mobile",
  DESKTOP = "desktop",
}

export function screenSize(screenDimensions: {width:number, height: number}){
  return screenDimensions.width <= config.mobileBreakpoint ? EScreenSize.MOBILE : EScreenSize.DESKTOP
}