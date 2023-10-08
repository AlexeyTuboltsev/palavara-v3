import React, {FC} from 'react'
import {TReadyAppState} from "../../types";
import {Section} from "../../components/Section";

export const RentASpace: FC<{
  state: TReadyAppState
}> = ({state}) => {
  // const {t} = useTranslation();

  return <Section state={state}>
    <h1>RENT A SPACE</h1>
    <p>Contact us if you would like to rent our studio for your event, be it a workshop or a birthday party.</p>

  </Section>
}
