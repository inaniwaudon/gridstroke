import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import Text from "./Text";
import { RootState } from "@/features/store";
import { getPenIndexFromTextIds, TextInfo } from "@/features/text";
import { getPenIndexToSplitedParagraphs } from "@/features/text-flow";

const Wrapper = styled.div<{ displays: boolean }>`
  pointer-events: none;
  user-select: none;
  display: ${(props) => (props.displays ? "block" : "none")};
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
`;

interface TextWrapperProps {
  textInfos: TextInfo[];
  penIndexToOrderedTextIds: { [key in number]: string[] };
  penIndexToOrderedRelatedTextIds: { [key in number]: string[] };
  displays: boolean;
}

const TextWrapper = ({
  textInfos,
  penIndexToOrderedTextIds,
  penIndexToOrderedRelatedTextIds,
  displays,
}: TextWrapperProps) => {
  const relatedTexts = useSelector((state: RootState) => state.text.texts);
  const penIndexToSplitedParagraphs = useMemo(
    () =>
      getPenIndexToSplitedParagraphs(
        relatedTexts,
        textInfos,
        penIndexToOrderedTextIds,
        penIndexToOrderedRelatedTextIds
      ),
    [
      relatedTexts,
      textInfos,
      penIndexToOrderedTextIds,
      penIndexToOrderedRelatedTextIds,
    ]
  );

  return (
    <Wrapper displays={displays}>
      {textInfos.map((info) => {
        const penIndex = getPenIndexFromTextIds(
          info.id,
          penIndexToOrderedTextIds
        );
        return (
          <Text
            rect={info.rect}
            index={
              penIndex !== undefined
                ? penIndexToOrderedTextIds[penIndex].indexOf(info.id)
                : undefined
            }
            isVertical={info.isVertical}
            allParagraphs={
              penIndex !== undefined
                ? penIndexToSplitedParagraphs[penIndex]
                : []
            }
            key={info.id}
          />
        );
      })}
    </Wrapper>
  );
};

export default TextWrapper;
