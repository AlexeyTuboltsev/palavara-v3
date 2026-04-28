import {ERoute} from "../router";

// Alt text describes what's actually visible in the image. Image SEO
// favours genuine description over keyword-stuffing — Google's image
// understanding now recognises ceramics, wheels, kilns etc. directly.
// Each alt names the activity and the studio so screen-reader users
// also get useful context.
export const routeImageAlts: Record<ERoute, string> = {
  [ERoute.HOME]: 'Handmade ceramics on display at Palavara Pottery Studio in Berlin',
  [ERoute.KIDS_CLASS]: 'Children working with clay at a kids pottery class in Palavara Studio, Berlin',
  [ERoute.WHEEL_THROWING]: 'Hands shaping clay on a pottery wheel during a wheel throwing class at Palavara Studio, Berlin',
  [ERoute.FAMILY_SATURDAY]: 'Family making pottery together on a Saturday workshop at Palavara Studio, Berlin',
  [ERoute.OPEN_STUDIO]: 'Pottery wheel and tools set up for an open studio session at Palavara, Berlin',
  [ERoute.FIRING_SERVICE]: 'Ceramic pieces on kiln shelves at Palavara Studio, Berlin — bisque and glaze firing service',
  [ERoute.GIFT_CERTIFICATE]: 'Palavara pottery class gift certificate, Berlin',
  [ERoute.TEAM_EVENTS]: 'Group of colleagues at a team-building pottery workshop at Palavara Studio, Berlin',
  [ERoute.BIRTHDAY_PARTIES]: 'Pottery birthday party in progress at Palavara Studio, Berlin',
  [ERoute.MEMBERSHIP]: 'Studio workspace and shelves at Palavara — pottery membership in Berlin',
  [ERoute.ABOUT]: 'Varvara Polyakova, founder of Palavara Pottery Studio, working with clay in Berlin',
  [ERoute.RENT_A_SPACE]: 'Pottery studio workspace available to rent at Palavara, Berlin',
  [ERoute.CONTACT]: 'Palavara Pottery Studio entrance at Steegerstr. 1A, Berlin Pankow',
  [ERoute.IMPRESSUM]: 'Palavara Pottery Studio Berlin',
  [ERoute.AGB]: 'Palavara Pottery Studio Berlin',
  [ERoute.DATENSCHUTZ]: 'Palavara Pottery Studio Berlin',
  [ERoute.NOT_FOUND]: 'Palavara Pottery Studio Berlin',
};
