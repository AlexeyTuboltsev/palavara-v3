import React, {FC, MouseEvent, ReactNode} from 'react'
import {useDispatch} from 'react-redux'
import {TRoute} from '../router'
import {actions} from '../actions'
import {getRoutePath} from '../utils/routerUtils'

export const Link: FC<{
  to: TRoute
  className?: string
  children: ReactNode
}> = ({to, className, children}) => {
  const dispatch = useDispatch()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    dispatch(actions.requestRouteChange(to))
  }

  return (
    <a href={getRoutePath(to)} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
