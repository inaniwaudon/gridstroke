import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RegionInfo } from "./region";
import { TextInfo } from "./text";

export interface InfoState {
  regionInfos: RegionInfo[];
  textInfos: TextInfo[];
}

const initialState: InfoState = {
  regionInfos: [],
  textInfos: [],
};

export const slice = createSlice({
  name: "info",
  initialState: initialState,
  reducers: {
    setRegionInfos(state, payload: PayloadAction<RegionInfo[]>) {
      state.regionInfos = payload.payload;
    },
    setTextInfos(state, payload: PayloadAction<TextInfo[]>) {
      state.textInfos = payload.payload;
    },
  },
});

export const { setRegionInfos, setTextInfos } = slice.actions;
export default slice.reducer;
