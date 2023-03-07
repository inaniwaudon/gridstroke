import React, { useState } from "react";
import styled from "styled-components";
import BorderBox from "./BorderBox";
import NumberPicker from "./NumberPicker";
import { setBounding } from "@/features/decoration";
import { Bounding, Direction } from "@/utils/figure";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NumberPickerWrapper = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
`;

interface MarginPaddingPickerProps {
  value: Bounding<number>;
  setValue: (value: Bounding<number>) => void;
}

const MarginPaddingPicker = ({ value, setValue }: MarginPaddingPickerProps) => {
  const [direction, setDirection] = useState<Direction | "all">("all");
  const displayedValue = direction === "all" ? value.top : value[direction];

  return (
    <Wrapper>
      <BorderBox direction={direction} setDirection={setDirection} />
      <NumberPickerWrapper>
        <NumberPicker
          value={displayedValue}
          min={0}
          max={40}
          unit="mm"
          setValue={(number) => setBounding(direction, value, number, setValue)}
        />
      </NumberPickerWrapper>
    </Wrapper>
  );
};

export default MarginPaddingPicker;
