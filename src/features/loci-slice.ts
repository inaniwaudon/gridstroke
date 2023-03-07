import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getCurrentLoci, Locus } from "./loci";
import { Point } from "@/utils/figure";

export interface LociState {
  loci: Locus[][];
  lociIndex: number;
}

const initialState: LociState = {
  loci: [[]],
  lociIndex: 0,
};

export const slice = createSlice({
  name: "loci",
  initialState: initialState,
  reducers: {
    // loci
    addPointToLocus: (
      state,
      action: PayloadAction<{ index: number; points: Point[] }>
    ) => {
      if (getCurrentLoci(state).length > 0) {
        getCurrentLoci(state)[action.payload.index].points.push(
          ...action.payload.points
        );
      }
    },
    backLociIndex: (state) => {
      state.lociIndex = Math.max(0, state.lociIndex - 1);
    },
    forwardLociIndex: (state) => {
      state.lociIndex = Math.min(state.loci.length - 1, state.lociIndex + 1);
    },
    removeLoci: (state, action: PayloadAction<number>) => {
      const loci = [...getCurrentLoci(state)];
      loci.splice(action.payload, 1);
      state.loci = [...state.loci.slice(0, state.lociIndex + 1), loci];
      state.lociIndex++;
    },
    pushLoci: (state, action: PayloadAction<Locus[]>) => {
      const loci = [...getCurrentLoci(state), ...action.payload];
      state.loci = [...state.loci.slice(0, state.lociIndex + 1), loci];
      state.lociIndex++;
    },
    branchLocus: (state) => {
      const loci = [...getCurrentLoci(state)];
      state.loci = [...state.loci.slice(0, state.lociIndex + 1), loci];
      state.lociIndex++;
    },
    updateLocus: (
      state,
      action: PayloadAction<{ index: number; locus: Locus }>
    ) => {
      if (action.payload.index < getCurrentLoci(state).length) {
        getCurrentLoci(state)[action.payload.index] = action.payload.locus;
      }
    },
    setInitialLoci: (state, action: PayloadAction<Locus[]>) => {
      state.loci = [action.payload];
      state.lociIndex = 0;
    },
  },
});

export const {
  addPointToLocus,
  backLociIndex,
  branchLocus,
  forwardLociIndex,
  pushLoci,
  removeLoci,
  setInitialLoci,
  updateLocus,
} = slice.actions;
export default slice.reducer;
