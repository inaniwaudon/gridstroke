import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { SettingKey } from "@/features/settings";
import { setSetting } from "@/features/settings-slice";
import { RootState } from "@/features/store";

const InputLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Checkbox = styled.input`
  width: 13px;
  flex-grow: 0;
`;

const settingItems: { key: SettingKey; node: React.ReactNode }[] = [
  {
    key: "enablesTextBoxColor",
    node: (
      <>
        テキストボックス内の
        <br />
        テキストの色付けを有効にする
      </>
    ),
  },
];

const Settings = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings.settings);

  return (
    <>
      {settingItems.map(({ key, node }) => (
        <InputLabel key={key}>
          <Checkbox
            type="checkbox"
            checked={settings[key]}
            onChange={() =>
              dispatch(setSetting({ key, value: !settings[key] }))
            }
          />
          {node}
        </InputLabel>
      ))}
    </>
  );
};

export default Settings;
