import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Locus } from "./loci";
import { LayoutGrid } from "@/features/text";
import { Point, Size } from "@/utils/figure";
import { createDefaultBoxDecoration, BoxDecoration } from "./decoration";

export interface PageState {
  size: Size;
  layoutGrid: LayoutGrid;
  decorations: BoxDecoration[];
  decorationPens: number[];
}

const initialState: PageState = {
  size: [210, 297],
  layoutGrid: {
    align: "vertical",
    fontSize: 3,
    proportion: 1.0,
    lineHeight: 5,
    charsPerLine: 30,
    lines: 55,
    columns: 2,
    columnSpace: 10,
    padding: { top: 12, right: 10, bottom: 12, left: 10 },
  },
  decorations: [createDefaultBoxDecoration()],
  decorationPens: [0],
};

export const slice = createSlice({
  name: "page",
  initialState: initialState,
  reducers: {
    // state
    setPageStateWithoutLoci: (state, action: PayloadAction<PageState>) => {
      state.layoutGrid = action.payload.layoutGrid;
      state.size = action.payload.size;
      state.decorations = action.payload.decorations;
      state.decorationPens = action.payload.decorationPens;
    },

    // layout grid
    setLayoutGrid: (state, action: PayloadAction<LayoutGrid>) => {
      state.layoutGrid = action.payload;
    },

    // decoration
    removeDecoration: (state, action: PayloadAction<number>) => {
      delete state.decorations[action.payload];
    },
    updateDecoration: (
      state,
      action: PayloadAction<{
        index: number;
        decoration: BoxDecoration;
      }>
    ) => {
      state.decorations[action.payload.index] = action.payload.decoration;
    },

    // decoration pen
    addDecorationPen: (state) => {
      state.decorationPens.push(state.decorationPens.length);
      state.decorations.push(createDefaultBoxDecoration());
    },
  },
});

export const {
  addDecorationPen,
  removeDecoration,
  setLayoutGrid,
  setPageStateWithoutLoci,
  updateDecoration,
} = slice.actions;
export default slice.reducer;
