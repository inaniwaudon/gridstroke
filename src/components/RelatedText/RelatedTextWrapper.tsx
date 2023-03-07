import React, { createRef, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import RelatedTextArea from "./RelatedTextArea";
import ParagraphDisplay from "../Typesetting/ParagraphDisplay";
import { RootState } from "@/features/store";
import {
  getLineAfter,
  getLineBefore,
  relatedTextMmToPx,
  sliceParagraph,
  Paragraph,
  RelatedText,
  TextSelection,
} from "@/features/text";
import { removeText } from "@/features/text-slice";
import { getPenTypeColor } from "@/features/tool-type";
import { setText } from "@/features/text-slice";
import { Direction } from "@/utils/figure";

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 10));

const Wrapper = styled.div<{ x: number; y: number }>`
  display: flex;
  flex-direction: column;
  position: absolute;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
`;

const Box = styled.div<{
  width: number;
  height: number;
  borderColor: string;
  direction: Direction | null;
}>`
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  border-top: ${(props) => (props.direction === "top" ? "solid" : "dashed")} 1px
    ${(props) => props.borderColor};
  border-right: ${(props) => (props.direction === "right" ? "solid" : "dashed")}
    1px ${(props) => props.borderColor};
  border-bottom: ${(props) =>
      props.direction === "bottom" ? "solid" : "dashed"}
    1px ${(props) => props.borderColor};
  border-left: ${(props) => (props.direction === "left" ? "solid" : "dashed")}
    1px ${(props) => props.borderColor};
  border-radius: 2px;
  overflow-x: hidden;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div``;

const ParagraphWrapper = styled.div<{
  lineBefore: number;
  lineAfter: number;
}>`
  margin-top: ${(props) => props.lineBefore}px;
  margin-bottom: ${(props) => props.lineAfter}px;
  position: relative;
`;

const TextAreaOrDisplayWrapper = styled.div<{ displays: boolean }>`
  height: ${(props) => (props.displays ? "auto" : 0)};
  overflow: hidden;
`;

const Navigation = styled.div`
  line-height: 14px;
  margin-top: 4px;
  display: flex;
  justify-content: end;
  gap: 10px;
`;

const ClearSelection = styled.a<{ displays: boolean }>`
  color: #666;
  font-size: 12px;
  cursor: pointer;
  display: ${(props) => (props.displays ? "block" : "none")}
  }
`;

const Delete = styled.a`
  color: #c00;
  align-self: end;
  cursor: pointer;
`;

interface RelatedTextWrapperProps {
  relatedText: RelatedText;
  penIndex?: number;
  crossRef: React.RefObject<HTMLAnchorElement>;
  direction: Direction | null;
  editing: boolean;
  textSelection?: TextSelection;
  setEditing: (value: boolean) => void;
}

const RelatedTextWrapper = ({
  relatedText,
  penIndex,
  crossRef,
  direction,
  editing,
  textSelection,
  setEditing,
}: RelatedTextWrapperProps) => {
  const dispatch = useDispatch();
  const enablesColor = useSelector(
    (state: RootState) => state.settings.settings.enablesTextBoxColor
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  const paragraphWrapperRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  relatedText.paragraphs.forEach((_, index) => {
    paragraphWrapperRefs.current[index] = createRef<HTMLDivElement>();
  });

  const onDoubleClick = () => {
    setEditing(true);
  };

  const updateParagraphs = (paragraphs: Paragraph[]) => {
    dispatch(
      setText({
        ...relatedText,
        paragraphs,
      })
    );
  };

  const focus = (lineIndex: number, row: number) => {
    const lines = paragraphWrapperRefs.current.flatMap((line) =>
      line.current ? line.current : []
    );
    if (0 <= lineIndex && lineIndex < lines.length) {
      const line = lines[lineIndex].childNodes[0].childNodes[0];
      if (line instanceof HTMLTextAreaElement) {
        line.focus();
        line.setSelectionRange(row, row, "forward");
      }
    }
  };

  // textarea
  const onKeyDown = async (e: React.KeyboardEvent) => {
    if (!editing || !(e.target instanceof HTMLTextAreaElement)) {
      return;
    }
    const parentParagraph = e.target.parentElement?.parentElement;
    if (!(parentParagraph instanceof HTMLDivElement)) {
      return;
    }
    const lines = paragraphWrapperRefs.current.flatMap((line) =>
      line.current ? line.current : []
    );
    const focusedLineIndex = lines.indexOf(parentParagraph);
    const focusedRow = e.target.selectionStart;
    if (focusedLineIndex === -1 || focusedRow === null) {
      return;
    }

    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      // kerning
      if (e.altKey) {
        e.preventDefault();
        return;
      }
      // move to before line
      if (focusedLineIndex > 0 && focusedRow === 0) {
        focus(
          focusedLineIndex - 1,
          relatedText.paragraphs[focusedLineIndex - 1].content.length
        );
        e.preventDefault();
      }
    }

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      // kerning
      if (e.altKey) {
        e.preventDefault();
        return;
      }
      // move to after line
      if (
        focusedRow ===
          relatedText.paragraphs[focusedLineIndex].content.length &&
        focusedLineIndex < relatedText.paragraphs.length - 1
      ) {
        focus(focusedLineIndex + 1, 0);
        e.preventDefault();
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      // break a line
      e.preventDefault();
      const formerParagraph = sliceParagraph(
        relatedText.paragraphs[focusedLineIndex],
        0,
        focusedRow
      );
      const latterParagraph = sliceParagraph(
        relatedText.paragraphs[focusedLineIndex],
        focusedRow
      );
      updateParagraphs([
        ...relatedText.paragraphs.slice(0, focusedLineIndex),
        formerParagraph,
        latterParagraph,
        ...relatedText.paragraphs.slice(focusedLineIndex + 1),
      ]);
      await delay();
      focus(focusedLineIndex + 1, 0);
      e.preventDefault();
    }

    // remove a line break
    if (e.key === "Backspace" && focusedRow === 0 && focusedLineIndex > 0) {
      e.preventDefault();
      const beforeLineContent =
        relatedText.paragraphs[focusedLineIndex - 1].content;
      const newParagraph = {
        ...relatedText.paragraphs[focusedLineIndex - 1],
        content:
          beforeLineContent + relatedText.paragraphs[focusedLineIndex].content,
      };
      updateParagraphs([
        ...relatedText.paragraphs.slice(0, focusedLineIndex - 1),
        newParagraph,
        ...relatedText.paragraphs.slice(focusedLineIndex + 1),
      ]);
      await delay();
      focus(focusedLineIndex - 1, beforeLineContent.length);
      e.preventDefault();
    }

    // unfocus
    if (e.key === "Escape") {
      setEditing(false);
    }
  };

  const onChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const formerParagraph = relatedText.paragraphs[index];
    const newCharStyles = [...formerParagraph.charStyles];
    const lengthDiff = e.target.value.length - formerParagraph.content.length;
    if (lengthDiff > 0) {
      newCharStyles.splice(
        e.currentTarget.selectionStart,
        0,
        ...[...Array(lengthDiff)].map(() => ({}))
      );
    }
    if (lengthDiff < 0) {
      newCharStyles.splice(e.currentTarget.selectionStart, -lengthDiff);
    }
    const paragraphs: Paragraph[] = [
      ...relatedText.paragraphs.slice(0, index),
      {
        ...formerParagraph,
        charStyles: newCharStyles,
        content: e.target.value,
      },
      ...relatedText.paragraphs.slice(index + 1),
    ];
    updateParagraphs(paragraphs);
  };

  return (
    <Wrapper x={relatedText.rect.x} y={relatedText.rect.y}>
      <Box
        width={relatedText.rect.width}
        height={relatedText.rect.height}
        borderColor={
          penIndex !== undefined
            ? getPenTypeColor({ type: "text", index: penIndex })
            : "#ccc"
        }
        direction={direction}
        onDoubleClick={onDoubleClick}
        ref={wrapperRef}
      >
        <Content>
          {relatedText.paragraphs.map((paragraph, index) => {
            return (
              <ParagraphWrapper
                lineBefore={relatedTextMmToPx(getLineBefore(paragraph))}
                lineAfter={relatedTextMmToPx(getLineAfter(paragraph))}
                ref={paragraphWrapperRefs.current[index]}
                key={index}
              >
                <TextAreaOrDisplayWrapper displays={editing}>
                  <RelatedTextArea
                    paragraph={paragraph}
                    editing={editing}
                    toFontSize={relatedTextMmToPx}
                    onChange={(e) => onChange(e, index)}
                    onKeyDown={(e) => onKeyDown(e)}
                  />
                </TextAreaOrDisplayWrapper>
                <TextAreaOrDisplayWrapper displays={!editing}>
                  <ParagraphDisplay
                    paragraph={paragraph}
                    paragraphIndex={index}
                    textSelection={textSelection}
                    id={relatedText.id}
                    selectable={true}
                    enablesColor={enablesColor}
                    toFontSize={relatedTextMmToPx}
                  />
                </TextAreaOrDisplayWrapper>
              </ParagraphWrapper>
            );
          })}
        </Content>
      </Box>
      <Navigation>
        <ClearSelection displays={editing} onClick={() => setEditing(false)}>
          選択を解除
        </ClearSelection>
        <Delete
          onClick={() => dispatch(removeText(relatedText.id))}
          ref={crossRef}
        >
          ×
        </Delete>
      </Navigation>
    </Wrapper>
  );
};

export default RelatedTextWrapper;
