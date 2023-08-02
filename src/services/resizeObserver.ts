import {Dispatch} from "@reduxjs/toolkit";
import {actions} from "../actions";

export type TResizeEventPayload = {
  borderBoxSize: { height: number, width: number, },
  contentBoxSize: { height: number, width: number, },
  devicePixelContentBoxSize: { height: number, width: number, },
}

export function setupResizeObserver(element: HTMLElement, dispatch: Dispatch) {
  let timeout: number | null = null;
  let resizeEventPayload: TResizeEventPayload | null = null

  function setResizeTimeout() {
    return window.setTimeout(() => {
      if (resizeEventPayload) {
        dispatch(actions.screenResize(resizeEventPayload))
        resizeEventPayload = null
        timeout = setResizeTimeout();
      } else {
        timeout = null
      }
    }, 300)
  }

  const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        resizeEventPayload = getResizeDimensions(entries[0])

        if (timeout === null) {
          dispatch(actions.screenResize(resizeEventPayload))
          timeout = setResizeTimeout()
        }
      }
    }
  )
  resizeObserver.observe(element)
  return resizeObserver.disconnect
}

function getResizeDimensions(element: ResizeObserverEntry): TResizeEventPayload {
  const {
    borderBoxSize,
    contentBoxSize,
    devicePixelContentBoxSize,
  } = element

  return {
    borderBoxSize: {height: borderBoxSize[0].blockSize, width: borderBoxSize[0].inlineSize,},
    contentBoxSize: {height: contentBoxSize[0].blockSize, width: contentBoxSize[0].inlineSize,},
    devicePixelContentBoxSize: {
      height: devicePixelContentBoxSize[0].blockSize,
      width: devicePixelContentBoxSize[0].inlineSize,
    },
  }
}

