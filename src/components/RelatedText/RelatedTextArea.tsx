import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { TextAlign, Paragraph } from "@/features/text";
import { calculateParagraphHeight } from "@/features/text-flow";

const TextArea = styled.textarea<{
  height: string;
  weight: number;
  lineHeight: number;
  fontSize: number;
  letterSpacing: number;
  textAlign: TextAlign;
}>`
  width: 100%;
  height: ${(props) => props.height};
  line-height: ${(props) => props.lineHeight};
  color: #666;
  text-align: ${(props) => props.textAlign};
  font-size: ${(props) => props.fontSize}px;
  font-family: "ShinGo";
  font-weight: ${(props) => props.weight}};
  letter-spacing: ${(props) => props.letterSpacing}em;
  padding: 0;
  border: none;
  resize: none;
  background: none;
  overflow: hidden;
  overflow-wrap: break-word;

  &:focus {
    outline: none;
  }
`;

interface RelatedTextAreaProps {
  paragraph: Paragraph;
  editing: boolean;
  toFontSize: (value: number) => number;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const RelatedTextArea = ({
  paragraph,
  editing,
  toFontSize,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
}: RelatedTextAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [height, setHeight] = useState("auto");

  const calculateHeight = () => {
    if (textareaRef.current) {
      const calculatedHeight = calculateParagraphHeight(
        paragraph,
        textareaRef.current.offsetWidth,
        false,
        toFontSize
      );
      setHeight(calculatedHeight > 0 ? `${calculatedHeight}px` : "1em");
    }
  };

  useEffect(() => {
    calculateHeight();
  }, [paragraph]);

  return (
    <TextArea
      height={height}
      value={paragraph.content}
      weight={paragraph.weight}
      lineHeight={paragraph.lineHeight}
      fontSize={toFontSize(paragraph.fontSize)}
      letterSpacing={paragraph.letterSpacing}
      textAlign={paragraph.align}
      disabled={!editing}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      ref={textareaRef}
    />
  );
};

export default RelatedTextArea;
