import {createSlice,createReducer, PayloadAction} from '@reduxjs/toolkit'

export const ui = createSlice({
  name: 'ui',
  initialState: {
    click: false
  },
  reducers: {
    myAction: (state) => {
      state.click = true
    },
  }
})

export const uiReducer = ui.reducer
export const {myAction} = ui.actions