import React, { useState } from "react";
import styled from "styled-components";
import { boxShadow1 } from "@/const/style";

export const colorPickerSize = 80;

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
`;

const Component = styled.div`
  height: 12px;
  padding: 2px;
  box-shadow: ${boxShadow1};
  border-radius: 8px;
  background: #ccc;
`;

const Circle = styled.div<{ ratio: number }>`
  width: 12px;
  height: 12px;
  margin-left: calc((100% - 12px) * ${(props) => props.ratio});
  border-radius: 6px;
  box-shadow: ${boxShadow1};
  background: #fff;
`;

const Number = styled.div`
  line-height: 1;
  color: #666;
  font-size: 12px;
`;

const Input = styled.input`
  width: 50px;
  font-size: 13px;
  margin-right: 4px;
  font-family: "Noto Sans JP", sans-serif;
  appearance: none;
  border-top: none;
  border-right: none;
  border-bottom: solid 1px #ccc;
  border-left: none;
`;

interface NumberPickerProps {
  value: number;
  min: number;
  max: number;
  unit?: string;
  setValue: (value: number) => void;
}

const NumberPicker = ({
  value,
  min,
  max,
  unit,
  setValue,
}: NumberPickerProps) => {
  const [selected, setSeleted] = useState(false);

  const setValueInternally = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max(0, (e.clientX - rect.x) / rect.width), 1);
    setValue(ratio * (max - min) + min);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setSeleted(true);
    setValueInternally(e);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (selected) {
      setValueInternally(e);
    }
  };

  const onMouseUp = () => {
    setSeleted(false);
  };

  return (
    <Wrapper
      onMouseMove={(e) => onMouseMove(e)}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <Component onMouseDown={(e) => onMouseDown(e)}>
        <Circle ratio={(value - min) / (max - min)} />
      </Component>
      <Number>
        <Input
          value={value.toFixed(1)}
          onChange={(e) => setValue(parseFloat(e.currentTarget.value))}
        />
        {unit ?? ""}
      </Number>
    </Wrapper>
  );
};

export default NumberPicker;
