import { FC } from 'react'
import { TReadyAppState } from "../../types";
import { Images } from "../../components/Section";
import styles from "./About.module.scss";
import { LogoSection } from "../../components/Logo";
import { MenuAbout } from "../../components/Menu";
import { SectionHeaderAbout } from "../../components/SectionHeader";
import { EScreenSize } from "../common/screenSize";


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
}> = ({ state }) =>
    <>
      {((state as any).imageUrl || (state as any).imageLqipUrl) &&
        <div className={styles.visual}>
          <Images imageData={(state as any).imageData} imageLqipData={(state as any).imageLqipData} />
          <div className={styles.colorBlock} />
        </div>
      }
      <div className={styles.text}>
        <h1>ABOUT ME</h1>
        <p>My name is Varvara Polyakova,</p>
        <p>I am a diverse visual artist working across the fields of graphic design, illustration and ceramics.</p>
        <p>I graduated from the Moscow State University of Printing Arts. After graduation, I worked successfully for a
          long time in the field of magazine and book illustration and design.</p>

        <p>In 2012 I moved from Moscow to Berlin and I also started creating ceramics under the brand name Palavara.</p>
        <h2>See my work on Instagram: <a href="https://www.instagram.com/palavara_ceramics/">palavara_ceramics</a> </h2>
        <p>A few years ago I opened a Palavara-studio in Wedding, where I produce my ceramics and run workshops for
          children and adults.</p>
        <h2>You can buy my ceramics in my Etsy shop: <a href="www.etsy.com/shop/PALAVARA">www.etsy.com/shop/PALAVARA</a></h2>
        <p>I'd be more than happy to discuss any potential projects or collaborations.</p>

        <p>Please contact me via e-mail: <a href="mailto:varya@palavara.com">varya@palavara.com</a></p>
      </div>
    </>