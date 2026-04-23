import {FC} from 'react';
import {Helmet} from 'react-helmet-async';
import {TRoute} from '../router';
import {getCanonicalUrl, getOgImage, pageMeta} from '../services/seo';

export const RouteHelmet: FC<{route: TRoute}> = ({route}) => {
  const meta = pageMeta[route.routeName];
  if (!meta) return null;
  const canonical = getCanonicalUrl(route.routeName);
  const image = getOgImage();

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.noindex
        ? <meta name="robots" content="noindex, follow" />
        : <link rel="canonical" href={canonical} />
      }

      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};
