import React, { useContext } from "react";
import styled from "styled-components";
import { MmToPxContext } from "./PageCanvas";
import LineDisplay from "../Typesetting/ParagraphDisplay";
import { getLineAfter, getLineBefore, Paragraph } from "@/features/text";
import Rect, { mmToPxRect } from "@/utils/rect";

const Wrapper = styled.div<{ rect: Rect }>`
  width: ${(props) => `${props.rect.width}px`};
  height: ${(props) => `${props.rect.height}px`};
  top: ${(props) => `${props.rect.y}px`};
  left: ${(props) => `${props.rect.x}px`};
  position: absolute;
`;

const Container = styled.div<{ isVertical: boolean }>`
  width: 1000%;
  height: 1000%;
  transform: scale(0.1);
  transform-origin: top left;
  display: flex;
  flex-direction: column;
  position: absolute;
  writing-mode: ${(props) =>
    props.isVertical ? "vertical-rl" : "horizontal-tb"};
`;

const ParagraphElement = styled.div<{
  lineBefore: number;
  lineAfter: number;
}>`
  margin-top: ${(props) => props.lineBefore}px;
  padding-bottom: ${(props) => props.lineAfter}px;
`;

const Index = styled.div`
  color: #999;
  line-height: 1em;
  font-size: 2em;
  font-family: "Helvetica";
  position: absolute;
  top: 16px;
  left: 16px;
`;

interface TextProps {
  rect: Rect;
  index?: number;
  isVertical: boolean;
  allParagraphs: Paragraph[][];
}

const Text = ({ rect, index, isVertical, allParagraphs }: TextProps) => {
  const mmToPx = useContext(MmToPxContext);
  const paragraphs =
    index !== undefined && index < allParagraphs.length
      ? allParagraphs[index]
      : [];

  return (
    <Wrapper rect={mmToPxRect(rect, mmToPx)}>
      <Container isVertical={isVertical}>
        {paragraphs.map((paragraph, index) => (
          <ParagraphElement
            lineBefore={mmToPx(getLineBefore(paragraph)) * 10}
            lineAfter={mmToPx(getLineAfter(paragraph)) * 10}
            key={index}
          >
            <LineDisplay
              paragraph={paragraph}
              paragraphIndex={index}
              selectable={false}
              toFontSize={(value: number) => mmToPx(value) * 10}
            />
          </ParagraphElement>
        ))}
      </Container>
      {index !== undefined && <Index>{index + 1}</Index>}
    </Wrapper>
  );
};

export default Text;
