const settingKeys = ["enablesTextBoxColor"] as const;
export type SettingKey = typeof settingKeys[number];
export type Settings = { [key in SettingKey]: boolean };

const getLocalStorageKey = (key: string) => `gridstroke.settings.${key}`;

export const initializeSettings = () => {
  const settings: Settings = {
    enablesTextBoxColor: true,
  };
  for (const key of settingKeys) {
    const value = localStorage.getItem(getLocalStorageKey(key));
    settings[key] = value === "true";
  }
  return settings;
};

export const setSettingToLocalStorage = (key: SettingKey, value: boolean) => {
  localStorage.setItem(getLocalStorageKey(key), value ? "true" : "false");
};
