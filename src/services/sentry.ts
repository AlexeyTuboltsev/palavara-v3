import * as Sentry from "@sentry/react";
import {config} from "../config";

export function initSentry(){
  Sentry.init({
    enabled: process.env.NODE_ENV !== 'development',
    dsn: config.sentry,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.BrowserTracing({
        // See docs for support of different versions of variation of react router
        // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    tracesSampleRate: 1.0,

    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  });
}

