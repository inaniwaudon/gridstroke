import { boxShadow, boxShadow1 } from "@/const/style";
import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 600px;
  height: 100vh;
  background: #fff;
  box-shadow: ${boxShadow};
  position: absolute;
  right: 0;
`;

const Line = styled.div`
  &:nth-child(2n) {
    background: #f9f9f9;
  }
  display: flex;
`;

const LineIndex = styled.div`
  width: 30px;
  text-align: right;
`;

const RelatedEditorView = () => {
  return (
    <Wrapper>
      {[...Array(19)].map((_, index) => (
        <Line key={index}>
          <LineIndex>{index}</LineIndex>
        </Line>
      ))}
    </Wrapper>
  );
};

export default RelatedEditorView;
