import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdFileOpen,
  MdImage,
  MdLayers,
  MdOutlineDelete,
  MdOutlineSettingsBackupRestore,
  MdSave,
  MdDownload,
  MdSettings,
  MdStyle,
  MdTextFormat,
} from "react-icons/md";
import styled from "styled-components";
import Images from "./Images";
import Layers from "./Layers";
import Save from "./Save";
import Settings from "./Settings";
import Styles from "./Styles";
import TabMenu from "./TabMenu";
import Texts from "./Texts";
import {
  activeColor,
  boxShadow,
  boxShadow1,
  textColor,
  white100,
} from "@/const/style";
import { Locus } from "@/features/loci";
import { setInitialLoci } from "@/features/loci-slice";
import { Page } from "@/features/page";
import { RootState } from "@/features/store";
import { TextSelection } from "@/features/text";
import {
  restoreFromJsonString,
  restoreFromLocalStorage,
  saveToLocalStorage,
} from "@/utils/save";
import { setPageStateWithoutLoci, PageState } from "@/features/page-slice";
import { setTextState, TextState } from "@/features/text-slice";
import { ToolType } from "@/features/tool-type";

const Wrapper = styled.nav`
  width: 240px;
  height: calc(100vh - 20px);
  color: ${textColor};
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
`;

// toolbar
const ToolBar = styled.div`
  margin: 0 15px -4px 0;
  display: flex;
  justify-content: end;
  gap: 10px;
`;

const AnchorButton = styled.a<{ active: boolean }>`
  color: ${(props) => (props.active ? activeColor : textColor)};
  font-size: 20px;
  padding: 0 4px;
  cursor: pointer;

  &:hover {
    color: ${activeColor};
  }
`;

const Panel = styled.div<{ displays?: boolean }>`
  padding: 12px 14px;
  border-radius: 4px;
  box-shadow: ${boxShadow};
  background: ${white100};
  overflow: hidden;
  display: ${(props) => (props.displays === false ? "none" : "block")};
`;

const FixedPanel = styled(Panel)`
  flex-grow: 0;
  flex-shrink: 0;
`;

const BodyPanel = styled(Panel)``;

const TabMenuWrapper = styled.div`
  margin-bottom: 4px;
  margin: -12px -14px 0 -14px;
  padding-top: 8px;
  box-shadow: ${boxShadow1};
`;

const H2 = styled.h2`
  line-height: 1;
  font-size: 16px;
  margin-top: 0;
`;

const TabScrollWrapper = styled.div`
  height: calc(100% - 36px + 12px * 2);
  overflow-y: scroll;
`;

const TabContent = styled.div`
  margin: 0 -14px;
  padding: 12px 14px;
  overflow-y: scroll;
`;

export type TabType = "layer" | "text" | "style" | "image";

export interface TabItem {
  key: TabType;
  icon: React.ReactNode;
  display: string;
}

const tabs: TabItem[] = [
  { key: "layer", icon: <MdLayers />, display: "レイヤー" },
  { key: "text", icon: <MdTextFormat />, display: "テキスト" },
  { key: "style", icon: <MdStyle />, display: "スタイル" },
  { key: "image", icon: <MdImage />, display: "画像" },
];

interface SideNavProps {
  page: Page;
  toolType: ToolType;
  selectedFloatingObjectKey?: string;
  textSelection?: TextSelection;
}

const SideNav = ({
  page,
  toolType,
  selectedFloatingObjectKey,
  textSelection,
}: SideNavProps) => {
  const dispatch = useDispatch();
  const pageState = useSelector((state: RootState) => state.page);
  const textState = useSelector((state: RootState) => state.text);
  const lociState = useSelector((state: RootState) => state.loci);

  const [displayedTab, setDisplayedTab] = useState<TabType>("style");
  const [displayedOption, setDisplayedOption] = useState<"settings" | "save">();

  const setState = (
    pageState: PageState,
    loci: Locus[],
    textState: TextState
  ) => {
    dispatch(setPageStateWithoutLoci(pageState));
    dispatch(setInitialLoci(loci));
    dispatch(setTextState(textState));
  };

  const openJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "text/json";
    input.click();
    input.onchange = () => {
      if (input.files !== null && input.files.length > 0) {
        const reader = new FileReader();
        reader.readAsText(input.files[0]);
        reader.onload = () => {
          if (typeof reader.result === "string") {
            restoreFromJsonString(reader.result, setState);
          }
        };
      }
    };
  };

  const buttons: {
    value: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
  }[] = [
    {
      value: "保存",
      icon: <MdSave />,
      active: false,
      onClick: () => saveToLocalStorage(pageState, lociState, textState),
    },
    {
      value: "復帰",
      icon: <MdOutlineSettingsBackupRestore />,
      active: false,
      onClick: () => restoreFromLocalStorage(setState),
    },
    {
      value: "リセット",
      icon: <MdOutlineDelete />,
      active: false,
      onClick: () => {},
    },
    {
      value: "開く",
      icon: <MdFileOpen />,
      active: false,
      onClick: () => openJson(),
    },
    {
      value: "出力",
      icon: <MdDownload />,
      active: displayedOption === "save",
      onClick: () =>
        setDisplayedOption(displayedOption === "save" ? undefined : "save"),
    },
    {
      value: "設定",
      icon: <MdSettings />,
      active: displayedOption === "settings",
      onClick: () =>
        setDisplayedOption(
          displayedOption === "settings" ? undefined : "settings"
        ),
    },
  ];

  const tabContents: { [key in TabType]: React.ReactNode } = {
    layer: <Layers page={page} />,
    text: <Texts textSelection={textSelection} />,
    style: <Styles />,
    image: (
      <Images
        page={page}
        selectedFloatingObjectKey={selectedFloatingObjectKey}
      />
    ),
  };

  useEffect(() => {
    if (toolType.type === "pen") {
      if (toolType.pen.type === "text") {
        setDisplayedTab("text");
      }
      if (toolType.pen.type === "decoration") {
        setDisplayedTab("style");
      }
    }
  }, [toolType]);

  return (
    <Wrapper>
      <ToolBar>
        {buttons.map((button) => (
          <AnchorButton
            active={button.active}
            onClick={button.onClick}
            key={button.value}
          >
            {button.icon && button.icon}
          </AnchorButton>
        ))}
      </ToolBar>
      <FixedPanel displays={displayedOption === "settings"}>
        <H2>設定</H2>
        <Settings />
      </FixedPanel>
      <FixedPanel displays={displayedOption === "save"}>
        <H2>保存</H2>
        <Save />
      </FixedPanel>
      <BodyPanel>
        <TabMenuWrapper>
          <TabMenu
            tabs={tabs}
            state={displayedTab}
            setState={setDisplayedTab}
          />
        </TabMenuWrapper>
        <TabScrollWrapper>
          <TabContent>
            <H2>{tabs.find((tab) => tab.key === displayedTab)?.display}</H2>
            {tabContents[displayedTab]}
          </TabContent>
        </TabScrollWrapper>
      </BodyPanel>
    </Wrapper>
  );
};

export default SideNav;
