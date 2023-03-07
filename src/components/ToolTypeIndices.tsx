import React from "react";
import styled from "styled-components";
import { List, Item, Circle, PlusCircle } from "./ToolTypeItems";
import {
  getPenTypeColor,
  toolIndices,
  IndexedPenType,
  PenType,
} from "@/features/tool-type";

const Wrapper = styled(List)<{ index: number }>`
  flex-direction: column;
  gap: 2px;
  position: absolute;
  left: ${(props) => props.index * (24 + 4)}px;
  bottom: ${20 + 2}px;
`;

interface ToolTypeIndicesProps {
  pens: number[];
  currentIndex: { tool: number; pen: number };
  targetTool: IndexedPenType;
  addPen?: () => void;
  selectPen: (penIndex: number) => void;
}

const ToolTypeIndices = ({
  pens,
  currentIndex,
  targetTool,
  addPen,
  selectPen,
}: ToolTypeIndicesProps) => {
  return (
    <Wrapper index={toolIndices[targetTool]}>
      {addPen && (
        <Item selected={false}>
          <PlusCircle color="#eee" onClick={addPen}>
            ＋
          </PlusCircle>
        </Item>
      )}
      {[...pens]
        .slice(1)
        .reverse()
        .map((penIndex, index) => {
          const type: PenType = { type: targetTool, index: penIndex };
          return (
            <Item
              selected={
                currentIndex.tool === toolIndices[targetTool] &&
                currentIndex.pen === penIndex
              }
              key={index}
              onClick={() => selectPen(penIndex)}
            >
              <Circle color={getPenTypeColor(type)}>{penIndex}</Circle>
            </Item>
          );
        })}
    </Wrapper>
  );
};

export default ToolTypeIndices;
