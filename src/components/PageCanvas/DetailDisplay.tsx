import React from "react";
import styled from "styled-components";

const Wrapper = styled.div<{ x: number; y: number }>`
  color: #fff;
  padding: 6px 10px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.6);
  position: absolute;
  top: ${(props) => props.x}px;
  left: ${(props) => props.y}px;
  z-index: 1;
`;

const List = styled.ul`
  font-size: 12px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;

    * {
      flex-grow: 0;
    }
  }

  h3 {
    width: 30px;
    font-size: 1em;
    font-weight: bold;
    margin: 0;
  }

  p {
    width: 80px;
    margin: 0;
  }
`;

interface DetailDisplayProp {
  values: { key: string; value: string }[];
}

const DetailDisplay = ({ values }: DetailDisplayProp) => (
  <Wrapper x={0} y={0}>
    <List>
      {values.map((value) => (
        <li key={value.key}>
          <h3>{value.key}</h3>
          <p>{value.value}</p>
        </li>
      ))}
    </List>
  </Wrapper>
);

export default DetailDisplay;
