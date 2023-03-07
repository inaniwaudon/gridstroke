import React from "react";
import styled from "styled-components";
import { activeColor, boxShadow1, textColor, white100 } from "@/const/style";

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: inline-flex;
  border-radius: 3px;
  box-shadow: ${boxShadow1};
  overflow: hidden;
`;

const Button = styled.li<{ selected: boolean }>`
  width: 16px;
  line-height: 16px;
  color: ${(props) => (props.selected ? "#fff" : textColor)};
  text-align: center;
  font-size: 16px;
  padding: 3px 4px;
  cursor: pointer;
  box-shadow: ${boxShadow1};
  background: ${(props) => (props.selected ? activeColor : white100)};
  display: block;
`;

export interface RadioButtonItem<T> {
  value: T;
  node: React.ReactNode;
}

interface RadioButtonProps<T> {
  value: T;
  items: RadioButtonItem<T>[];
  onChange: (value: T) => void;
}

const RadioButton = <T extends React.Key>({
  value,
  items,
  onChange,
}: RadioButtonProps<T>) => (
  <List>
    {items.map(({ value: inValue, node }) => (
      <Button
        selected={inValue === value}
        onClick={() => onChange(inValue)}
        key={inValue}
      >
        {node}
      </Button>
    ))}
  </List>
);
export default RadioButton;
