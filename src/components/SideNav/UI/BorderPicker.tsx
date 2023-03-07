import React, { useState } from "react";
import styled from "styled-components";
import BorderBox from "./BorderBox";
import ColorPicker from "./ColorPicker";
import NumberPicker from "./NumberPicker";
import { Border, setBounding } from "@/features/decoration";
import { Bounding, Direction } from "@/utils/figure";
import { Color } from "@/utils/style";
import { deepCopy } from "@/utils/utils";

export const colorPickerSize = 80;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FirstColumn = styled.div`
  display: flex;
  gap: 10px;
`;

const NumberPickerWrapper = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
`;

interface BorderPickerProps {
  border: Bounding<Border>;
  setBorder: (bounding: Bounding<Border>) => void;
}

const BorderPicker = ({ border, setBorder }: BorderPickerProps) => {
  const [direction, setDirection] = useState<Direction | "all">("all");

  const displayedWidth =
    direction === "all" ? border.top.width : border[direction].width;

  const displayedColor =
    direction === "all" ? border.top.color : border[direction].color;

  const setWidth = (width: number) => {
    if (direction === "all") {
      const newValue = deepCopy(border);
      newValue.top.width = width;
      newValue.right.width = width;
      newValue.bottom.width = width;
      newValue.left.width = width;
      setBorder(newValue);
    } else {
      const newValue = deepCopy(border[direction]);
      newValue.width = width;
      setBounding(direction, border, newValue, setBorder);
    }
  };

  const setColor = (color: Color) => {
    if (direction === "all") {
      const newValue = deepCopy(border);
      newValue.top.color = color;
      newValue.right.color = color;
      newValue.bottom.color = color;
      newValue.left.color = color;
      setBorder(newValue);
    } else {
      const newValue = deepCopy(border[direction]);
      newValue.color = color;
      setBounding(direction, border, newValue, setBorder);
    }
  };

  return (
    <Wrapper>
      <FirstColumn>
        <BorderBox direction={direction} setDirection={setDirection} />
        <NumberPickerWrapper>
          <NumberPicker
            value={displayedWidth}
            min={0}
            max={40}
            unit="mm"
            setValue={setWidth}
          />
        </NumberPickerWrapper>
      </FirstColumn>
      <ColorPicker color={displayedColor} setColor={setColor} />
    </Wrapper>
  );
};

export default BorderPicker;
