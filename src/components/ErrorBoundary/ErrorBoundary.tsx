import React, {FC, ReactNode} from 'react'
import {ErrorBoundary as SentryErrorBoundary} from '@sentry/react'
import styles from './ErrorBoundary.module.scss'

export const ErrorBoundary: FC<{ children?: ReactNode }> = ({children}) =>
  <SentryErrorBoundary
    fallback={<Fallback/>}
  >
    {children}
  </SentryErrorBoundary>

const Fallback = () => <div className={styles.errorFallback}>an error occurred</div>