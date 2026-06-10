import { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next';
import { TReadyAppState } from "../../types";
import { Images } from "../../components/Images";
import styles from "./About.module.scss";
import { LogoSection } from "../../components/Logo";
import { MenuAbout } from "../../components/Menu";
import { SectionHeaderAbout } from "../../components/SectionHeader";
import { EScreenSize } from "../common/screenSize";
import { getImageManifest } from "../../sagas/imageManifestLoader";
import { routeImageAlts } from "../../services/imageAlts";


export const About: FC<{
  state: TReadyAppState
}> = ({ state }) => {

  return <div className={styles.sectionContainer}>
    <div className={styles.headerWrapper}>
      <div className={styles.headerBackground}></div>
      <div className={styles.header}>
        <LogoSection />
        <MenuAbout state={state} />
        <SectionHeaderAbout state={state} />
      </div>

    </div>
    {state.screenSize === EScreenSize.MOBILE
      ? <div className={styles.contentWrapper}>
          <Content state={state} />
        </div>
      : <Content state={state} />
    }
  </div>
}


const Content: FC<{
  state: TReadyAppState
}> = ({ state }) => {
  const { t } = useTranslation();
  const hasImages = (state as any).currentImage;
  const manifest = getImageManifest();
  const intro = t('routes.about.intro', { returnObjects: true }) as string[];

  return <>
    {hasImages &&
      <div className={styles.visual}>
        <Images
          filename={(state as any).currentImage}
          screenSize={(state as any).screenSize}
          manifest={manifest}
          imageLoaded={(state as any).imageLoaded}
          alt={routeImageAlts[state.route.routeName]}
          eager
          isLcp
        />
        <div className={styles.colorBlock} />
      </div>
    }
    <div className={styles.text}>
        <h1>{t('routes.about.title')}</h1>
        {intro.map((p, i) => <p key={i}>{p}</p>)}
        <h2>
          <Trans i18nKey="routes.about.instagramLine">
            See my ceramics on Instagram: <a href="https://www.instagram.com/palavara_ceramics/" target="_blank" rel="noopener noreferrer">palavara_ceramics</a>
          </Trans>
        </h2>
        <h2>
          <Trans i18nKey="routes.about.websiteLine">
            See my other work on <a href="https://palavara.com/" target="_blank" rel="noopener noreferrer">palavara.com</a>
          </Trans>
        </h2>
        <p>{t('routes.about.studioBlurb')}</p>
        <h2>
          <Trans i18nKey="routes.about.etsyLine">
            You can buy my ceramics in my Etsy shop: <a href="https://www.etsy.com/shop/PALAVARA" target="_blank" rel="noopener noreferrer">www.etsy.com/shop/PALAVARA</a>
          </Trans>
        </h2>
        <p>{t('routes.about.collabBlurb')}</p>

        <p>
          <Trans i18nKey="routes.about.emailLine">
            Please contact me via e-mail: <a href="mailto:varya@palavara.com">varya@palavara.com</a>
          </Trans>
        </p>
      </div>
    </>
}
