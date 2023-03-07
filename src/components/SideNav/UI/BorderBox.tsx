import React from "react";
import styled from "styled-components";
import { activeColor, boxShadow1 } from "@/const/style";
import { Border } from "@/features/decoration";
import { Direction } from "@/utils/figure";

const padding = 8;

const Wrapper = styled.div`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  position: relative;
`;

const Box = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: ${padding}px auto ${padding}px;
  grid-template-rows: ${padding}px auto ${padding}px;
`;

const Border = styled.div<{ selected: boolean }>`
  background: ${(props) => (props.selected ? activeColor : "#ccc")};
`;

const Content = styled.div`
  width: calc(100% - ${padding * 2}px);
  height: calc(100% - ${padding * 2}px);
  box-shadow: ${boxShadow1};
  position: absolute;
  top: ${padding}px;
  left: ${padding}px;
`;

interface BorderBoxProps {
  direction: Direction | "all";
  setDirection: (align: Direction | "all") => void;
}

const BorderBox = ({ direction, setDirection }: BorderBoxProps) => {
  return (
    <Wrapper>
      <Box>
        <Border selected={["all", "left", "top"].includes(direction)} />
        <Border
          selected={["all", "top"].includes(direction)}
          onClick={() => setDirection("top")}
        />
        <Border selected={["all", "top", "right"].includes(direction)} />
        <Border
          selected={["all", "left"].includes(direction)}
          onClick={() => setDirection("left")}
        />
        <div />
        <Border
          selected={["all", "right"].includes(direction)}
          onClick={() => setDirection("right")}
        />
        <Border selected={["all", "left", "bottom"].includes(direction)} />
        <Border
          selected={["all", "bottom"].includes(direction)}
          onClick={() => setDirection("bottom")}
        />
        <Border selected={["all", "bottom", "right"].includes(direction)} />
      </Box>
      <Content onClick={() => setDirection("all")} />
    </Wrapper>
  );
};

export default BorderBox;
