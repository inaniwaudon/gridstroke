import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 160px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;

  .top {
    grid-area: 1 / 2 / 2 / 3;
  }

  .bottom {
    grid-area: 3 / 2 / 4 / 3;
  }

  .left {
    grid-area: 2 / 1 / 3 / 2;
  }

  .right {
    grid-area: 2 / 3 / 3 / 4;
  }
`;

const CentralLabel = styled.div`
  width: ${(160 - 4 * 2) / 3}px;
  color: #666;
  text-align: center;
  font-size: 12px;
  grid-area: 2 / 2 / 3 / 3;
`;

const Input = styled.input`
  width: ${(160 - 4 * 2) / 3 - 8 - 2}px;
  height: 22px;
  padding: 0 4px;
  border: solid 1px #ccc;
  border-radius: 4px;
  display: block;
`;

const Padding = () => (
  <Wrapper>
    <CentralLabel>Padding</CentralLabel>
    <Input type="number" className="top" />
    <Input type="number" className="left" />
    <Input type="number" className="right" />
    <Input type="number" className="bottom" />
  </Wrapper>
);

export default Padding;
