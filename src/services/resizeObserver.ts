import {Dispatch} from "@reduxjs/toolkit";
import {actions} from "../actions";

export type TResizeEventPayload = { height: number, width: number, }

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
  // borderBoxSize is universally supported in modern browsers, but Sentry
  // shows it occasionally undefined (Edge with extensions, polyfills, etc).
  // contentRect is the original-spec property, always present.
  if (element.borderBoxSize?.[0]) {
    return {
      height: element.borderBoxSize[0].blockSize,
      width: element.borderBoxSize[0].inlineSize,
    }
  }
  return {
    height: element.contentRect.height,
    width: element.contentRect.width,
  }
}

