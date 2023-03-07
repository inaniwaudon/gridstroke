import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setSettingToLocalStorage, SettingKey, Settings } from "./settings";

export interface SettingsState {
  settings: Settings;
}

const settingsState: SettingsState = {
  settings: {
    enablesTextBoxColor: false,
  },
};

export const slice = createSlice({
  name: "settings",
  initialState: settingsState,
  reducers: {
    setAllSettings: (state, action: PayloadAction<Settings>) => {
      state.settings = action.payload;
    },
    setSetting: (
      state,
      action: PayloadAction<{ key: SettingKey; value: boolean }>
    ) => {
      state.settings[action.payload.key] = action.payload.value;
      setSettingToLocalStorage(action.payload.key, action.payload.value);
    },
  },
});

export const { setAllSettings, setSetting } = slice.actions;

export default slice.reducer;
