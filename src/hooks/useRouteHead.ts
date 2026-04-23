import {useEffect} from 'react';
import {TRoute} from '../router';
import {getCanonicalUrl, getOgImage, pageMeta} from '../services/seo';

export function useRouteHead(route: TRoute) {
  useEffect(() => {
    const meta = pageMeta[route.routeName];
    if (!meta) return;

    const canonical = getCanonicalUrl(route.routeName);
    const image = getOgImage();

    document.title = meta.title;

    setMeta({name: 'description'}, meta.description);

    setMeta({property: 'og:title'}, meta.title);
    setMeta({property: 'og:description'}, meta.description);
    setMeta({property: 'og:url'}, canonical);
    setMeta({property: 'og:image'}, image);

    setMeta({name: 'twitter:title'}, meta.title);
    setMeta({name: 'twitter:description'}, meta.description);
    setMeta({name: 'twitter:image'}, image);

    if (meta.noindex) {
      setMeta({name: 'robots'}, 'noindex, follow');
      removeLink({rel: 'canonical'});
    } else {
      removeMeta({name: 'robots'});
      setLink({rel: 'canonical'}, canonical);
    }
  }, [route.routeName]);
}

type TMetaSelector = {name: string} | {property: string};

function metaSelector(sel: TMetaSelector): string {
  return 'name' in sel
    ? `meta[name="${sel.name}"]`
    : `meta[property="${sel.property}"]`;
}

function setMeta(sel: TMetaSelector, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(metaSelector(sel));
  if (!tag) {
    tag = document.createElement('meta');
    if ('name' in sel) tag.setAttribute('name', sel.name);
    else tag.setAttribute('property', sel.property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function removeMeta(sel: TMetaSelector) {
  document.head.querySelector(metaSelector(sel))?.remove();
}

function setLink(attrs: {rel: string}, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${attrs.rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', attrs.rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function removeLink(attrs: {rel: string}) {
  document.head.querySelector(`link[rel="${attrs.rel}"]`)?.remove();
}
