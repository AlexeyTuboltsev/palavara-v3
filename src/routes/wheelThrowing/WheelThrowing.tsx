import React, {FC} from 'react'
import {TReadyAppState} from "../../reducer";
import {Section} from "../../components/Section";

export const WheelThrowing: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    bla

  </Section>
}