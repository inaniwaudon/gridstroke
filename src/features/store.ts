import { configureStore } from "@reduxjs/toolkit";
import pageReducer from "./page-slice";
import lociReducer from "./loci-slice";
import settingsReducer from "./settings-slice";
import textReducer from "./text-slice";

export const store = configureStore({
  reducer: {
    page: pageReducer,
    text: textReducer,
    loci: lociReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
