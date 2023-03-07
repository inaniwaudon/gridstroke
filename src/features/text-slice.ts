import { Point } from "@/utils/figure";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Locus } from "./loci";
import { Paragraph, RelatedText } from "./text";

export interface TextState {
  texts: { [key in string]: RelatedText };
  textPens: number[];
  loci: Locus[];
}

const initialState: TextState = {
  texts: {},
  textPens: [0],
  loci: [],
};

export const slice = createSlice({
  name: "loci",
  initialState: initialState,
  reducers: {
    // state
    setTextState: (state, action: PayloadAction<TextState>) => {
      state.texts = action.payload.texts;
      state.textPens = action.payload.textPens;
      state.loci = action.payload.loci;
    },

    // text
    removeText: (state, action: PayloadAction<string>) => {
      delete state.texts[action.payload];
    },
    setText: (state, action: PayloadAction<RelatedText>) => {
      state.texts[action.payload.id] = action.payload;
    },
    updateParagraph: (
      state,
      action: PayloadAction<{
        id: string;
        paragraphIndex: number;
        paragraph: Paragraph;
      }>
    ) => {
      state.texts[action.payload.id].paragraphs[action.payload.paragraphIndex] =
        action.payload.paragraph;
    },

    // pen
    addTextPen: (state) => {
      state.textPens.push(state.textPens.length);
    },

    // loci
    addPointToLastTextLocus: (state, action: PayloadAction<Point[]>) => {
      if (state.loci.length > 0) {
        state.loci[state.loci.length - 1].points.push(...action.payload);
      }
    },
    removeTextLoci: (state, action: PayloadAction<number>) => {
      state.loci.splice(action.payload, 1);
    },
    popTextLoci: (state) => {
      state.loci.pop();
    },
    pushTextLoci: (state, action: PayloadAction<Locus[]>) => {
      state.loci.push(...action.payload);
    },
    setTextLoci: (state, action: PayloadAction<Locus[]>) => {
      state.loci = action.payload;
    },
    updateTextLoci: (
      state,
      action: PayloadAction<{ index: number; locus: Locus }>
    ) => {
      state.loci[action.payload.index] = action.payload.locus;
    },
  },
});

export const {
  addTextPen,
  addPointToLastTextLocus,
  popTextLoci,
  pushTextLoci,
  removeText,
  removeTextLoci,
  setText,
  setTextLoci,
  setTextState,
  updateParagraph,
  updateTextLoci,
} = slice.actions;

export default slice.reducer;
