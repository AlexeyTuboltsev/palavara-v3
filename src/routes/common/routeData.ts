import {ERoute, TRoute} from "../../router";
import {home} from "../home/home";
import {kidsClass} from "../kidsClass/kidsClass";
import {wheelThrowing} from "../wheelThrowing/wheelThrowing";
import {familySaturday} from "../familySaturday/familySaturday";
import {firingService} from "../firingService/firingService";
import {giftCertificate} from "../giftCerificate/giftCertificate";
import {membership} from "../membership/membership";
import {openStudio} from "../openStudio/openStudio";
import {about} from "../about/about";
import {rentASpace} from "../rentASpace/rentASpace";
import {contact} from "../contact/contact";
import {impressum} from "../impressum/impressum";
import { teamEvents } from "../teamEvents/teamEvents";
import { birthdayParties } from "../birthdayParties/birthdayParties";
import { agb } from "../agb/agb";
import { datenschutzerklaerung } from "../datenschutzerklaerung/datenschutzerklaerung";
import { notFound } from "../notFound/notFound";

export function findRouteGenerator(route: TRoute): any {
  switch (route.routeName) {
    case ERoute.HOME:
      return home;
    case ERoute.KIDS_CLASS:
      return kidsClass;
    case ERoute.WHEEL_THROWING:
      return wheelThrowing;
    case ERoute.FAMILY_SATURDAY:
      return familySaturday;
    case ERoute.FIRING_SERVICE:
      return firingService;
    case ERoute.GIFT_CERTIFICATE:
      return giftCertificate;
    case ERoute.TEAM_EVENTS:
      return teamEvents;
    case ERoute.BIRTHDAY_PARTIES:
      return birthdayParties;
    case ERoute.MEMBERSHIP:
      return membership;
    case ERoute.OPEN_STUDIO:
      return openStudio;
    case ERoute.ABOUT:
      return about;
    case ERoute.RENT_A_SPACE:
      return rentASpace;
    case ERoute.CONTACT:
      return contact;
    case ERoute.IMPRESSUM:
      return impressum;
    case ERoute.AGB:
      return agb;
    case ERoute.DATENSCHUTZ:
      return datenschutzerklaerung;
    case ERoute.NOT_FOUND:
      return notFound;
  }
}
