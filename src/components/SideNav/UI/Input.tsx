import React from "react";
import styled from "styled-components";
import { boxShadow1 } from "@/const/style";

const Wrapper = styled.div`
  padding-right: 8px;
  border-radius: 3px;
  flex-shrink: 1;
  flex-grow: 1;
  box-shadow: ${boxShadow1};
  display: flex;
`;

const InputComponent = styled.input`
  width: 100%;
  height: 16px;
  line-height: 16px;
  font-size: 13px;
  padding: 3px 0 3px 8px;
  border: none;
  flex-grow: 1;
  display: block;
`;

const Unit = styled.div`
  color: #666;
  margin-left: 6px;
`;

interface InputProps {
  value?: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  setValue: (value: number) => void;
}

const Input = ({ value, step, unit, defaultValue, setValue }: InputProps) => (
  <Wrapper>
    <InputComponent
      value={value}
      step={step}
      type="number"
      onChange={(e) =>
        setValue(
          (value === undefined && defaultValue !== undefined
            ? defaultValue
            : 0) + parseFloat(e.currentTarget.value)
        )
      }
    />
    <Unit>{unit}</Unit>
  </Wrapper>
);

export default Input;
