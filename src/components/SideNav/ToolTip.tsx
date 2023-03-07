import React from "react";
import styled from "styled-components";
import { activeColor, boxShadow1 } from "@/const/style";
import { Point } from "@/utils/figure";

const Wrapper = styled.div<{ x: number; y: number }>`
  color: #fff;
  line-height: 1;
  font-size: 12px;
  padding: 6px 7px 8px 7px;
  border-radius: 3px;
  box-shadow: ${boxShadow1};
  background: ${activeColor};
  position: fixed;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
`;

interface ToolTipProps {
  position: Point;
  children: string;
}

const ToolTip = ({ position, children }: ToolTipProps) => {
  return (
    <Wrapper x={position[0]} y={position[1]}>
      {children}
    </Wrapper>
  );
};

export default ToolTip;
