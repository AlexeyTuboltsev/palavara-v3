import React, {FC} from 'react';
import {useSelector} from 'react-redux'
import {EAppState, TReadyAppState} from "../types";
import {TStore} from "../store";
import {ERoute} from "../router";
import {Home} from "../routes/home/Home";
import {TeamEvents} from "../routes/teamEvents/TeamEvents";
import {BirthdayParties} from "../routes/birthdayParties/BirthdayParties";
import {WheelThrowing} from "../routes/wheelThrowing/WheelThrowing";
import {FamilySaturday} from "../routes/familySaturday/FamilySaturday";
import {FiringService} from "../routes/firingService/FiringService";
import {GiftCertificate} from "../routes/giftCerificate/GiftCertificate";
import {Membership} from "../routes/membership/Membership";
import {OpenStudio} from "../routes/openStudio/OpenStudio";
import {About} from "../routes/about/About";
import {RentASpace} from "../routes/rentASpace/RentASpace";
import {Contact} from "../routes/contact/Contact";
import {Impressum} from "../routes/impressum/Impressum";
import {Agb} from "../routes/agb/Agb";
import {Datenschutzerklaerung} from "../routes/datenschutzerklaerung/Datenschutzerklaerung";
import { StartScreen } from './StartScreen';
import { KidsClass } from '../routes/kidsClass/KidsClass';
import { NotFound } from '../routes/notFound/NotFound';
import { useRouteHead } from '../hooks/useRouteHead';

export const App = () => {
  const state = useSelector((store: TStore) => store.ui)
  switch (state.appState) {
    case EAppState.NOT_STARTED:
      return <AppNotStarted/>
    case EAppState.IN_PROGRESS:
      return <AppInProgress/>
    case EAppState.READY:
      return <AppReady {...state} />
    case EAppState.ERROR:
      return <AppError/>
  }
}

export const AppNotStarted = () => <StartScreen />
export const AppInProgress = () => <StartScreen />
export const AppError = () => <div>error</div>

export const AppReady: FC<TReadyAppState> = (state) => {
  useRouteHead(state.route);
  return <AppRouteView state={state} />
}

const AppRouteView: FC<{state: TReadyAppState}> = ({state}) => {
  switch (state.route.routeName) {
    case ERoute.HOME:
      return <Home state={state}/>;
    case ERoute.KIDS_CLASS:
      return <KidsClass state={state}/>
    case ERoute.WHEEL_THROWING:
      return <WheelThrowing state={state}/>
    case ERoute.FAMILY_SATURDAY:
      return <FamilySaturday state={state}/>
    case ERoute.FIRING_SERVICE:
      return <FiringService state={state}/>
    case ERoute.GIFT_CERTIFICATE:
      return <GiftCertificate state={state}/>
    case ERoute.MEMBERSHIP:
      return <Membership state={state}/>
    // case ERoute.EVENT_WORKSHOPS:
    //   return <Membership state={state}/>
    case ERoute.TEAM_EVENTS:
      return <TeamEvents state={state}/>
    case ERoute.BIRTHDAY_PARTIES:
      return <BirthdayParties state={state}/>
    case ERoute.OPEN_STUDIO:
      return <OpenStudio state={state}/>
    case ERoute.ABOUT:
      return <About state={state} />
    case ERoute.RENT_A_SPACE:
      return <RentASpace state={state} />
    case ERoute.CONTACT:
      return <Contact state={state} />
    case ERoute.IMPRESSUM:
      return <Impressum state={state} />
    case ERoute.AGB:
      return <Agb state={state} />
    case ERoute.DATENSCHUTZ:
      return <Datenschutzerklaerung state={state} />
    case ERoute.NOT_FOUND:
      return <NotFound state={state} />
  }
}
