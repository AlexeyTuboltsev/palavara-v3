import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";
import {ImpressumContent} from "../../generated/ImpressumContent";

export const Impressum: FC<{
  state: TReadyAppState
}> = ({state}) => {
  return <Section state={state}>
    <ImpressumContent />
  </Section>
}
