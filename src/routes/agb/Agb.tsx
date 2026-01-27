import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import {AgbContent} from "../../generated/AgbContent";

export const Agb: FC<{
  state: TReadyAppState
}> = ({state}) => {
  return <Section state={state}>
    <AgbContent />
  </Section>
}
