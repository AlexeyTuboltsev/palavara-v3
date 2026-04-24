import {FC, lazy, Suspense, useEffect} from 'react';
import {useSelector} from 'react-redux'
import {EAppState, TReadyAppState} from "../types";
import {TStore} from "../store";
import {ERoute} from "../router";
import { StartScreen } from './StartScreen';
import { BlurOverlay } from './BlurOverlay';
import { useRouteHead } from '../hooks/useRouteHead';

const Home = lazy(() => import("../routes/home/Home").then(m => ({default: m.Home})));
const TeamEvents = lazy(() => import("../routes/teamEvents/TeamEvents").then(m => ({default: m.TeamEvents})));
const BirthdayParties = lazy(() => import("../routes/birthdayParties/BirthdayParties").then(m => ({default: m.BirthdayParties})));
const WheelThrowing = lazy(() => import("../routes/wheelThrowing/WheelThrowing").then(m => ({default: m.WheelThrowing})));
const FamilySaturday = lazy(() => import("../routes/familySaturday/FamilySaturday").then(m => ({default: m.FamilySaturday})));
const FiringService = lazy(() => import("../routes/firingService/FiringService").then(m => ({default: m.FiringService})));
const GiftCertificate = lazy(() => import("../routes/giftCerificate/GiftCertificate").then(m => ({default: m.GiftCertificate})));
const Membership = lazy(() => import("../routes/membership/Membership").then(m => ({default: m.Membership})));
const OpenStudio = lazy(() => import("../routes/openStudio/OpenStudio").then(m => ({default: m.OpenStudio})));
const About = lazy(() => import("../routes/about/About").then(m => ({default: m.About})));
const RentASpace = lazy(() => import("../routes/rentASpace/RentASpace").then(m => ({default: m.RentASpace})));
const Contact = lazy(() => import("../routes/contact/Contact").then(m => ({default: m.Contact})));
const Impressum = lazy(() => import("../routes/impressum/Impressum").then(m => ({default: m.Impressum})));
const Agb = lazy(() => import("../routes/agb/Agb").then(m => ({default: m.Agb})));
const Datenschutzerklaerung = lazy(() => import("../routes/datenschutzerklaerung/Datenschutzerklaerung").then(m => ({default: m.Datenschutzerklaerung})));
const KidsClass = lazy(() => import("../routes/kidsClass/KidsClass").then(m => ({default: m.KidsClass})));
const NotFound = lazy(() => import("../routes/notFound/NotFound").then(m => ({default: m.NotFound})));

function preloadOtherRoutes() {
  // Fire-and-forget; if a chunk is already loaded the import is a no-op.
  import("../routes/kidsClass/KidsClass");
  import("../routes/wheelThrowing/WheelThrowing");
  import("../routes/familySaturday/FamilySaturday");
  import("../routes/openStudio/OpenStudio");
  import("../routes/firingService/FiringService");
  import("../routes/giftCerificate/GiftCertificate");
  import("../routes/teamEvents/TeamEvents");
  import("../routes/birthdayParties/BirthdayParties");
  import("../routes/membership/Membership");
  import("../routes/about/About");
  import("../routes/rentASpace/RentASpace");
  import("../routes/contact/Contact");
  import("../routes/impressum/Impressum");
  import("../routes/agb/Agb");
  import("../routes/datenschutzerklaerung/Datenschutzerklaerung");
  import("../routes/notFound/NotFound");
}

export const App = () => {
  const state = useSelector((store: TStore) => store.ui)
  const isNavigating = useSelector((store: TStore) => store.navigation.isNavigating)

  useEffect(() => {
    // Wait for the initial route to settle, then warm all other chunks so
    // subsequent navigations don't suspend.
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: {timeout: number}) => number);
    if (ric) {
      ric(preloadOtherRoutes, {timeout: 4000});
    } else {
      const id = window.setTimeout(preloadOtherRoutes, 2000);
      return () => window.clearTimeout(id);
    }
  }, []);

  let content: JSX.Element;
  switch (state.appState) {
    case EAppState.NOT_STARTED:
    case EAppState.IN_PROGRESS:
      content = <StartScreen />;
      break;
    case EAppState.READY:
      content = <AppReady {...state} />;
      break;
    case EAppState.ERROR:
      content = <AppError/>;
      break;
  }

  return <>
    {content}
    <BlurOverlay visible={isNavigating} />
  </>
}

export const AppError = () => <div>error</div>

export const AppReady: FC<TReadyAppState> = (state) => {
  useRouteHead(state.route);
  return (
    <Suspense fallback={null}>
      <AppRouteView state={state} />
    </Suspense>
  );
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
