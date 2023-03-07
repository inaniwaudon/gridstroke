import React from "react";
import { MdCheck } from "react-icons/md";
import { RxEraser, RxMove } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { useKey } from "react-use";
import styled from "styled-components";
import ToolTypeIndices from "./ToolTypeIndices";
import { List, Item, Circle } from "./ToolTypeItems";
import penIcon from "@/assets/pen.svg";
import penStyleIcon from "@/assets/pen-style.svg";
import penTextIcon from "@/assets/pen-text.svg";
import { activeColor } from "@/const/style";
import {
  getToolColor,
  getToolTypes,
  IndexedPenType,
  indexedPenTypes,
  toolIndices,
} from "@/features/tool-type";
import { addDecorationPen } from "@/features/page-slice";
import { RootState } from "@/features/store";
import { addTextPen } from "@/features/text-slice";
import { DisplayedElements } from "@/utils/utils";

const Wrapper = styled.nav`
  height: 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: absolute;
  left: 30px;
  bottom: 34px;
  z-index: 2;
`;

const ViewItem = styled.li<{ selected: boolean }>`
  width: 24px;
  height: 16px;
  color: ${(props) => (props.selected ? activeColor : "#ccc")};
  font-size: 16px;
  cursor: pointer;
  display: flex;
  justify-content: center;
`;

const IconWrapper = styled.div`
  height: 22px;
  line-height: 22px;
  font-size: 22px;
  padding: 1px;
`;

interface ToolTypesDisplayProp {
  toolIndex: number;
  toolSubIndices: { [key in IndexedPenType]: number };
  displayedElements: DisplayedElements;
  isEditing: boolean;
  setToolIndex: (index: number) => void;
  setToolSubIndices: (value: { [key in IndexedPenType]: number }) => void;
  setDisplayedElements: (value: DisplayedElements) => void;
}

const ToolTypesDisplay = ({
  toolIndex,
  toolSubIndices,
  displayedElements,
  isEditing,
  setToolIndex,
  setToolSubIndices,
  setDisplayedElements,
}: ToolTypesDisplayProp) => {
  const dispatch = useDispatch();
  const pens = {
    region: [0, 1, 2],
    text: useSelector((state: RootState) => state.text.textPens),
    decoration: useSelector((state: RootState) => state.page.decorationPens),
  };

  const toolTypes = getToolTypes(toolSubIndices);

  const switchDisplayedElements = (key: keyof DisplayedElements) => {
    const newElements = { ...displayedElements };
    newElements[key] = !newElements[key];
    setDisplayedElements(newElements);
  };

  const setPenIndex = (key: IndexedPenType, index: number) => {
    setToolSubIndices({ ...toolSubIndices, [key]: index });
  };

  // left
  useKey(
    "a",
    (e) => {
      if (!isEditing && !(e.ctrlKey || e.metaKey)) {
        setToolIndex((toolIndex - 1 + toolTypes.length) % toolTypes.length);
      }
    },
    {},
    [toolIndex, toolTypes]
  );

  // right
  useKey(
    "s",
    (e) => {
      if (!isEditing && !(e.ctrlKey || e.metaKey)) {
        setToolIndex((toolIndex + 1) % toolTypes.length);
      }
    },
    {},
    [toolIndex, toolTypes]
  );

  // top
  useKey(
    "w",
    (e) => {
      if (!isEditing && !(e.ctrlKey || e.metaKey)) {
        for (const type of indexedPenTypes) {
          if (toolIndices[type] === toolIndex) {
            setPenIndex(type, (toolSubIndices[type] + 1) % pens[type].length);
          }
        }
      }
    },
    {},
    [toolIndex, toolSubIndices, pens, setPenIndex]
  );

  // bottom
  useKey(
    "x",
    (e) => {
      if (!isEditing && !(e.ctrlKey || e.metaKey)) {
        for (const type of indexedPenTypes) {
          if (toolIndices[type] === toolIndex) {
            setPenIndex(
              type,
              (toolSubIndices.region - 1 + pens[type].length) %
                pens[type].length
            );
          }
        }
      }
    },
    {},
    [toolIndex, toolSubIndices, pens, setPenIndex]
  );

  const onClick = (index: number) => {
    setToolIndex(index);
    for (const type of indexedPenTypes) {
      if (index === toolIndices[type]) {
        setPenIndex(type, 0);
      }
    }
  };

  const toolTypesNode: React.ReactNode[] = [
    <img src={penIcon} />,
    <img src={penTextIcon} />,
    <img src={penStyleIcon} />,
    undefined,
    undefined,
    <IconWrapper>
      <RxMove color={"#333"} />
    </IconWrapper>,
    <IconWrapper>
      <RxEraser color={"#666"} />
    </IconWrapper>,
  ];

  return (
    <Wrapper>
      <List>
        {toolTypes.map((type, index) => (
          <Item
            selected={
              index === toolIndex &&
              (![
                toolIndices.region,
                toolIndices.text,
                toolIndices.decoration,
              ].includes(index) ||
                (toolIndices.region === index && toolSubIndices.region === 0) ||
                (toolIndices.text === index && toolSubIndices.text === 0) ||
                (toolIndices.decoration === index &&
                  toolSubIndices.decoration === 0))
            }
            key={index}
            onClick={() => onClick(index)}
          >
            {toolTypesNode[index] ? (
              toolTypesNode[index]
            ) : (
              <Circle color={getToolColor(type)} />
            )}
          </Item>
        ))}
      </List>
      <List>
        {(["layout", "text", "decoration"] as (keyof DisplayedElements)[]).map(
          (key, index) => (
            <ViewItem
              selected={displayedElements[key]}
              onClick={() => switchDisplayedElements(key)}
              key={index}
            >
              <MdCheck />
            </ViewItem>
          )
        )}
      </List>
      <ToolTypeIndices
        pens={pens.region}
        currentIndex={{ tool: toolIndex, pen: toolSubIndices.region }}
        targetTool="region"
        selectPen={(penIndex: number) => {
          setToolIndex(toolIndices.region);
          setPenIndex("region", penIndex);
        }}
      />
      <ToolTypeIndices
        pens={pens.text}
        currentIndex={{ tool: toolIndex, pen: toolSubIndices.text }}
        targetTool="text"
        addPen={() => {
          dispatch(addTextPen());
          setToolIndex(toolIndices.text);
          setPenIndex("text", pens.text.length);
        }}
        selectPen={(penIndex: number) => {
          setToolIndex(toolIndices.text);
          setPenIndex("text", penIndex);
        }}
      />
      <ToolTypeIndices
        pens={pens.decoration}
        currentIndex={{ tool: toolIndex, pen: toolSubIndices.decoration }}
        targetTool="decoration"
        addPen={() => {
          dispatch(addDecorationPen());
          setToolIndex(toolIndices.decoration);
          setPenIndex("decoration", pens.decoration.length);
        }}
        selectPen={(penIndex: number) => {
          setToolIndex(toolIndices.decoration);
          setPenIndex("decoration", penIndex);
        }}
      />
    </Wrapper>
  );
};

export default ToolTypesDisplay;
