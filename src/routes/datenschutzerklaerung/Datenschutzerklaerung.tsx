import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import {DatenschutzContent} from "../../generated/DatenschutzContent";

export const Datenschutzerklaerung: FC<{
  state: TReadyAppState
}> = ({state}) => {
  return <Section state={state}>
    <DatenschutzContent />
  </Section>
}
