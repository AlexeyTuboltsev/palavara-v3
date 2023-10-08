import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";

export const Contact: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <h1>ABOUT ME</h1>
    <p>My name is Varvara Polyakova,</p>
    <p>I’m a diverse visual artist working across the fields of graphic design, illustration and ceramics.</p>
    <p>I graduated from the Moscow State University of Printing Arts. After graduation, I worked successfully for a long time in the field of magazine and book illustration and design.</p>

    <p>In 2012 I moved from Moscow to Berlin and I also started creating ceramics under the brand name Palavara.</p>
    <p>A few years ago I opened a Palavara-studio in Wedding, where I produce my ceramics and run workshops for children and adults.</p>
    <p>You can find my ceramic works in my Etsy shop: www.etsy.com/shop/PALAVARA</p>
    <p>I'd be more than happy to discuss any potential projects or collaborations.</p>

    <p>Please contact me via e-mail: <a href="mailto:varya@palavara.com">varya@palavara.com</a></p>
  </Section>
}
