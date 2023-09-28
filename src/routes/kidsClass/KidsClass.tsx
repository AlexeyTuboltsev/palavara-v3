import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";

export const KidsClass: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <h1>Children's Class</h1>
    <p>For children aged 6 to 12</p>

    <p>During the lessons we’ll get to know all sorts of clay, be it white, black or red.</p>
    <p>We will try out different techniques, experimenting with kneading, rolling, stamping, and carving.</p>
    <p>We will create dishes, build cities, make toys, tiles and many other things!</p>

    <p>Only limited places are available!</p>

    <p>Where? 13359, Steegerstr. 1A, Berlin</p>
    <p>When? On Wednesdays 16:30—18:00</p>
    <h2>Cost</h2>
    <p>4 lessons – 75 €</p>
    <p>Trial class – 20 €</p>
    <p>If you for any reason miss a class, unfortunately, we will not be able to reimburse you.</p>
    <p>There are no classes during school holidays.</p>

    <h2>How to book</h2>
    <p>palavarastudio+kp@gmail.com</p>

  <p>The class is taught in Russian</p>
  </Section>
}
