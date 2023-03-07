import React, { useMemo } from "react";
import styled from "styled-components";
import Character from "./Character";
import { textColor } from "@/const/style";
import {
  isCollapsedSelection,
  sliceParagraph,
  Paragraph,
  TextSelection,
} from "@/features/text";
import { colorToCss } from "@/utils/style";

const Wrapper = styled.div`
  height: fit-content;
  position: relative;
`;

const Content = styled.div<{
  paragraph: Paragraph;
  fontSize: number;
  enablesColor: boolean;
}>`
  width: 100%;
  height: 100%;
  min-height: ${(props) => props.paragraph.lineHeight}em;
  line-height: ${(props) => props.paragraph.lineHeight}em;
  color: ${(props) =>
    props.enablesColor ? colorToCss(props.paragraph.color) : textColor};
  text-align: ${(props) => props.paragraph.align};
  font-size: ${(props) => props.fontSize}px;
  font-family: "ShinGo";
  font-weight: ${(props) => props.paragraph.weight};
  user-select: text;
  letter-spacing: ${(props) => props.paragraph.letterSpacing}em;
  overflow-wrap: break-word;
  white-space: pre-wrap;

  *::selection {
    visibility: hidden;
  }
`;

const MainContent = styled(Content)`
  position: relative;
  z-index: 1;
`;

const SelectionContent = styled(Content)`
  color: rgba(0, 0, 0, 0);
  pointer-events: none;
  position: absolute;
  top: 0;
`;

const Selection = styled.span`
  background: #9cf;
`;

const Cursor = styled.div`
  width: 1px;
  height: 1em;
  display: inline-block;
  background: #9cf;
`;

interface ParagraphDisplayProps {
  paragraph: Paragraph;
  paragraphIndex: number;
  selectable: boolean;
  textSelection?: TextSelection;
  id?: string;
  enablesColor?: boolean;
  toFontSize: (value: number) => number;
}

const ParagraphDisplay = ({
  paragraph,
  paragraphIndex,
  selectable,
  textSelection,
  id,
  enablesColor = true,
  toFontSize,
}: ParagraphDisplayProps) => {
  let selectionFrom = -1;
  let selectionTo = -1;
  if (textSelection && textSelection.id === id) {
    if (textSelection.from.paragraph === paragraphIndex) {
      selectionFrom = textSelection.from.row;
    }
    if (textSelection.to.paragraph === paragraphIndex) {
      selectionTo = textSelection.to.row;
    }
  }

  const processText = (paragraph: Paragraph) => {
    const items: React.ReactNode[] = [];
    for (let i = 0; i < paragraph.content.length; i++) {
      const char = paragraph.content[i];
      items.push(
        char === "\n" ? (
          <br key={i} />
        ) : (
          <Character charStyle={paragraph.charStyles[i]} key={i}>
            {char}
          </Character>
        )
      );
    }
    return <>{items.flatMap((item) => item)}</>;
  };

  const allProcessedText = useMemo(() => {
    return processText(paragraph);
  }, [paragraph]);

  return (
    <Wrapper>
      <MainContent
        paragraph={paragraph}
        fontSize={toFontSize(paragraph.fontSize)}
        enablesColor={enablesColor}
        data-text-id={id}
        data-text-line-index={paragraphIndex}
      >
        {allProcessedText}
      </MainContent>
      {selectable && (
        <SelectionContent
          paragraph={paragraph}
          fontSize={toFontSize(paragraph.fontSize)}
          enablesColor={enablesColor}
          data-text-id={id}
          data-text-line-index={paragraphIndex}
        >
          {selectionFrom > -1 && selectionTo > -1 ? (
            <>
              {processText(sliceParagraph(paragraph, 0, selectionFrom))}
              {textSelection && isCollapsedSelection(textSelection) ? (
                <Cursor />
              ) : (
                <Selection>
                  {processText(
                    sliceParagraph(paragraph, selectionFrom, selectionTo)
                  )}
                </Selection>
              )}
              {processText(sliceParagraph(paragraph, selectionTo))}
            </>
          ) : (
            processText(paragraph)
          )}
        </SelectionContent>
      )}
    </Wrapper>
  );
};

export default ParagraphDisplay;
