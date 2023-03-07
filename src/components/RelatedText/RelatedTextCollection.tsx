import React, { createRef, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import * as uuid from "uuid";
import RelatedTextWrapper from "./RelatedTextWrapper";
import LociSvg from "../LociSvg";
import { activeColor } from "@/const/style";
import {
  maxFontSize,
  maxLineHeight,
  minFontSize,
  minLineHeight,
} from "@/const/text";
import { Locus } from "@/features/loci";
import { RootState } from "@/features/store";
import {
  changeCharacterStyles,
  createDefaultParagraph,
  createdRelatedTextId,
  getCharacterStyle,
  getSelectedFromParagraph,
  getPenIndexFromTextIds,
  isCollapsedSelection,
  relatedTextMmToPx,
  sliceParagraph,
  TextSelection,
} from "@/features/text";
import {
  addPointToLastTextLocus,
  pushTextLoci,
  removeTextLoci,
  setText,
  updateParagraph,
  updateTextLoci,
} from "@/features/text-slice";
import { getToolTypes } from "@/features/tool-type";
import {
  getDistanceLineAndPoint,
  getPoint,
  translatePoint,
  Direction,
  Line,
  Point,
} from "@/utils/figure";
import {
  isAltKey,
  isCtrlKey,
  useKey,
  usePressedKeyCodes,
} from "@/utils/keyboard";
import { rectContainsPoint, rectStrokeContainsPoint, Rect } from "@/utils/rect";
import { Cursor } from "@/utils/style";
import { deepCopy, pieMenuMs } from "@/utils/utils";

const Wrapper = styled.div<{ cursor: string }>`
  width: 100%;
  height: 100%;
  //cursor: ${(props) => props.cursor};
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
`;

const Content = styled.div<{ x: number; y: number }>`
  width: 100%;
  height: 100%;
  position: absolute;
  top: ${(props) => props.y}px;
  left: ${(props) => props.x}px;
  z-index: 1;
`;

const DetailedDisplay = styled.div<{ x: number; y: number }>`
  color: ${activeColor};
  font-size: 12px;
  pointer-events: none;
  position: absolute;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
  z-index: 2;
`;

const textboxEdgeWidth = 4;
const locusErrorRange = 2;

type TextOption =
  | {
      type: "paragraph";
      size: number;
      lineHeight: number;
    }
  | {
      type: "characterRatio";
      ratio: number;
    }
  | {
      type: "characterMove";
      kerning: number;
    };

interface RelatedTextCollectionProps {
  toolIndex: number;
  textPenIndex: number;
  penIndexToOrderedRelatedTextIds: { [x: number]: string[] };
  textSelection?: TextSelection;
  editingTextId: string | undefined;
  setTextSelection: (value: TextSelection) => void;
  setEditingTextId: (value: string | undefined) => void;
}

const RelatedTextCollection = ({
  toolIndex,
  textPenIndex,
  penIndexToOrderedRelatedTextIds,
  textSelection,
  editingTextId,
  setTextSelection,
  setEditingTextId,
}: RelatedTextCollectionProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch();
  const allTexts = useSelector((state: RootState) => state.text.texts);
  const selectedToolType = getToolTypes({ text: textPenIndex })[toolIndex];
  const pressedKeyCodes = usePressedKeyCodes();

  // view
  const [viewPosition, setViewPosition] = useState<Point>([0, 0]);
  const [downViewPosition, setDownViewPosition] = useState<Point>([0, 0]);

  // mouse
  const [cursor, setCursor] = useState<Cursor>("auto");
  const [mouseEventType, setMouseEventType] = useState<
    "moveView" | "moveTextBox" | "createTextBox" | "editTextStyle" | "locus"
  >();
  const [downTime, setDownTime] = useState<number>();
  const [downPoint, setDownPoint] = useState<Point>();
  const [mousePoint, setMousePoint] = useState<Point>();

  // text box
  const [createdTextId, setCreatedTextId] = useState<string>();
  const [mouseDownedTextRect, setMouseDownedTextRect] = useState<Rect>();
  const [mouseOveredTextIdDirection, setMouseOveredTextIdDrection] = useState<{
    id: string;
    direction: Direction;
  }>();
  const [movedTextIdDirection, setMovedTextIdDirection] = useState<{
    id: string;
    direction: Direction;
  }>();

  const crossRefs = useRef<{
    [key in string]: React.RefObject<HTMLAnchorElement>;
  }>({});
  useEffect(() => {
    for (const text in allTexts) {
      crossRefs.current[text] = createRef<HTMLAnchorElement>();
    }
  }, [allTexts]);

  // locus
  const allLoci = useSelector((state: RootState) => state.text.loci);
  const [mouseOveredLociIndex, setMouseOveredLociIndex] = useState<number>();
  const [originalLocus, setOriginalLocus] = useState<Locus>();
  const [selectedLociIndices, setSelectedLociIndices] = useState([]);

  // text option
  const optionWidth = 100;
  const [originalSize, setOriginalSize] = useState<number>();
  const [originalLineHeight, setOriginalLineHeight] = useState<number>();
  const [originalRatios, setOriginalRatios] = useState<number[]>();
  const [originalKerning, setOriginalKerning] = useState<number>();
  const [textOption, setTextOption] = useState<TextOption>();

  const onMouseDown = (e: React.MouseEvent) => {
    if (!wrapperRef.current) {
      return;
    }
    const relativePoint = getPoint(e, wrapperRef.current);
    const absolutePoint = translatePoint(relativePoint, viewPosition);
    setMousePoint(relativePoint);
    setDownPoint(relativePoint);
    setDownTime(Date.now());

    /*
    - shift key: move a view
    - uneditable:
      - on a cross button: delete a text box
      - on the edge of a text box: move a text box
      - in a text box: edit styles
      - out a text box:
        - others: draw a locus
    - editable
      - in a text box: edit sentences
    */

    // move a view
    if (e.shiftKey) {
      setDownViewPosition(viewPosition);
      setMouseEventType("moveView");
      return;
    }

    // layout
    if (editingTextId) {
      return;
    }

    // on the close buttons
    const filteredCrosses = Object.values(crossRefs.current).filter(
      (crossRef) => crossRef.current
    );
    const crossContains =
      filteredCrosses.length > 0
        ? filteredCrosses.every((crossRef) => {
            const bounding = crossRef.current!.getBoundingClientRect();
            const rect = {
              x: bounding.x,
              y: bounding.y,
              width: bounding.width,
              height: bounding.height,
            };
            return rectContainsPoint(rect, [e.pageX, e.pageY]);
          })
        : false;
    if (crossContains) {
      return;
    }

    // move a text box
    let edgeIdDirection: { id: string; direction: Direction } | null = null;
    for (const id in allTexts) {
      const tempContains = rectStrokeContainsPoint(
        allTexts[id].rect,
        absolutePoint,
        textboxEdgeWidth
      );
      if (tempContains) {
        edgeIdDirection = { id, direction: tempContains };
      }
    }
    if (edgeIdDirection) {
      setMovedTextIdDirection(edgeIdDirection);
      setMouseDownedTextRect(allTexts[edgeIdDirection.id].rect);
      setMouseEventType("moveTextBox");
      return;
    }

    // in the text boxes
    const textBoxContains =
      Object.values(allTexts).length > 0
        ? Object.values(allTexts).some((text) =>
            rectContainsPoint(text.rect, absolutePoint)
          )
        : false;

    if (textBoxContains) {
      if (
        pressedKeyCodes.some((code) => isCtrlKey(code) || isAltKey(code)) &&
        textSelection
      ) {
        const { paragraph } = getSelectedFromParagraph(allTexts, textSelection);
        if (!paragraph) {
          return;
        }
        const ratios = sliceParagraph(
          paragraph,
          textSelection.from.row,
          textSelection.to.row
        ).charStyles.map((charStyle) => charStyle.ratio ?? 100);
        const kerning = getCharacterStyle(
          textSelection.from.row,
          "kerning",
          paragraph.charStyles
        );
        setOriginalSize(paragraph.fontSize);
        setOriginalLineHeight(paragraph.lineHeight);
        setOriginalRatios(ratios);
        setOriginalKerning(kerning ?? 0);
        setMouseEventType("editTextStyle");
      }
      return;
    }

    // create a text box
    if (e.ctrlKey || e.metaKey) {
      const id = createdRelatedTextId();
      setCreatedTextId(id);
      setMouseEventType("createTextBox");
      return;
    }

    // draw a locus
    if (selectedToolType.type === "pen") {
      dispatch(
        pushTextLoci([
          {
            type: { type: "text", index: textPenIndex },
            id: uuid.v4(),
            points: [absolutePoint],
          },
        ])
      );
    }
    if (mouseOveredLociIndex !== undefined) {
      if (selectedToolType.type === "eraser") {
        dispatch(removeTextLoci(mouseOveredLociIndex));
      }
      if (selectedToolType.type === "move") {
        setOriginalLocus(allLoci[mouseOveredLociIndex]);
      }
    }
    setMouseEventType("locus");
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!wrapperRef.current) {
      return;
    }
    const relativePoint = getPoint(e, wrapperRef.current);
    const absolutePoint: Point = translatePoint(relativePoint, viewPosition);
    setMousePoint(relativePoint);

    // edge of text box
    let edgeIdDirection: { id: string; direction: Direction } | undefined =
      undefined;
    for (const id in allTexts) {
      const tempContains = rectStrokeContainsPoint(
        allTexts[id].rect,
        absolutePoint,
        textboxEdgeWidth
      );
      if (tempContains) {
        edgeIdDirection = { id, direction: tempContains };
      }
    }
    setMouseOveredTextIdDrection(edgeIdDirection);

    if (!downPoint) {
      let minLocus:
        | {
            error: number;
            index: number;
          }
        | undefined;
      for (let locusi = 0; locusi < allLoci.length; locusi++) {
        const locus = allLoci[locusi];
        for (let pointi = 0; pointi < locus.points.length - 1; pointi++) {
          const line: Line = [locus.points[pointi], locus.points[pointi + 1]];
          const error = getDistanceLineAndPoint(line, absolutePoint);
          if ((!minLocus || error < minLocus.error) && !Number.isNaN(error)) {
            minLocus = {
              error,
              index: locusi,
            };
          }
        }
      }
      setMouseOveredLociIndex(
        minLocus && minLocus.error < locusErrorRange
          ? minLocus.index
          : undefined
      );
      return;
    }

    const differentX = relativePoint[0] - downPoint[0];
    const differentY = relativePoint[1] - downPoint[1];

    // move a view
    if (mouseEventType === "moveView") {
      setViewPosition([
        downViewPosition[0] - differentX,
        downViewPosition[1] - differentY,
      ]);
      return;
    }

    // move a text box
    if (
      mouseEventType === "moveTextBox" &&
      movedTextIdDirection &&
      mouseDownedTextRect
    ) {
      let rect = { ...allTexts[movedTextIdDirection.id].rect };
      if (movedTextIdDirection.direction === "top") {
        rect.y = mouseDownedTextRect.y + differentY;
        rect.height = mouseDownedTextRect.height - differentY;
      }
      if (movedTextIdDirection.direction === "bottom") {
        rect.height = mouseDownedTextRect.height + differentY;
      }
      if (movedTextIdDirection.direction === "left") {
        rect.x = mouseDownedTextRect.x + differentX;
        rect.width = mouseDownedTextRect.width - differentX;
      }
      if (movedTextIdDirection.direction === "right") {
        rect.width = mouseDownedTextRect.width + differentX;
      }
      dispatch(
        setText({
          ...allTexts[movedTextIdDirection.id],
          rect,
        })
      );
      return;
    }

    // create or update the text box
    if (mouseEventType === "createTextBox") {
      if (
        downTime === undefined ||
        Date.now() - downTime < pieMenuMs ||
        !createdTextId
      ) {
        return;
      }
      if (createdTextId in allTexts) {
        dispatch(
          setText({
            ...allTexts[createdTextId],
            rect: {
              x: Math.min(absolutePoint[0], downPoint[0] + viewPosition[0]),
              y: Math.min(absolutePoint[1], downPoint[1] + viewPosition[1]),
              width: Math.abs(differentX),
              height: Math.abs(differentY),
            },
          })
        );
      } else {
        dispatch(
          setText({
            id: createdTextId,
            paragraphs: [createDefaultParagraph()],
            rect: {
              x: absolutePoint[0],
              y: absolutePoint[1],
              width: 0,
              height: 0,
            },
          })
        );
      }
      return;
    }

    // loci
    if (mouseEventType === "locus") {
      if (selectedToolType.type === "pen") {
        dispatch(addPointToLastTextLocus([absolutePoint]));
      }
      if (
        selectedToolType.type === "move" &&
        mouseOveredLociIndex !== undefined &&
        originalLocus
      ) {
        const locus = allLoci[mouseOveredLociIndex];
        dispatch(
          updateTextLoci({
            index: mouseOveredLociIndex,
            locus: {
              ...locus,
              points: originalLocus.points.map((point) => [
                point[0] + differentX,
                point[1] + differentY,
              ]),
            },
          })
        );
      }
      return;
    }

    if (mouseEventType === "editTextStyle") {
      if (!textSelection) {
        return;
      }
      const { text, paragraph } = getSelectedFromParagraph(
        allTexts,
        textSelection
      );
      if (!text) {
        return;
      }
      const fromRow = textSelection.from.row;

      // text option
      if (
        (e.ctrlKey || e.metaKey) &&
        originalSize !== undefined &&
        originalLineHeight !== undefined &&
        originalRatios !== undefined
      ) {
        // change a paragraph style
        if (isCollapsedSelection(textSelection)) {
          const tempFontSize =
            originalSize +
            (differentX / optionWidth) * (maxFontSize - minFontSize);
          const tempLineHeight =
            originalLineHeight +
            (differentY / optionWidth) * (maxLineHeight - minLineHeight);

          const fontSize =
            Math.round(
              Math.min(Math.max(tempFontSize, minFontSize), maxFontSize) * 4
            ) / 4;
          const lineHeight =
            Math.round(
              Math.min(Math.max(tempLineHeight, minLineHeight), maxLineHeight) *
                10
            ) / 10;

          const paragraphs = [
            ...text.paragraphs.slice(0, textSelection.from.paragraph),
            {
              ...paragraph,
              fontSize,
              lineHeight,
            },
            ...text.paragraphs.slice(textSelection.from.paragraph + 1),
          ];
          dispatch(
            setText({
              ...text,
              paragraphs,
            })
          );
          setTextOption({ type: "paragraph", size: fontSize, lineHeight });
        }
        // character ratio
        else {
          const ratios = [...Array(textSelection.to.row - fromRow)].map(
            (_, index) =>
              (originalRatios[index] ?? 100) +
              (differentX / optionWidth) * (200 - 0)
          );
          shiftRatio(ratios, true);
          setTextOption({ type: "characterRatio", ratio: ratios[0] });
        }
        return;
      }

      // kerning
      if (pressedKeyCodes.some((code) => isAltKey(code))) {
        if (originalKerning === undefined) {
          return;
        }
        const kerning =
          originalKerning +
          (differentX / relatedTextMmToPx(1.0) / paragraph.fontSize) * 1000;
        shiftKerning(kerning, true);
        setTextOption({ type: "characterMove", kerning });
      }
    }
  };

  const onMouseUp = () => {
    setMousePoint(undefined);
    setDownPoint(undefined);
    setDownTime(undefined);
    setMouseDownedTextRect(undefined);
    setMovedTextIdDirection(undefined);
    setCursor("auto");
    setMouseEventType(undefined);
    setTextOption(undefined);
  };

  // focus, selection
  const onInputFocused = (id: string, paragraphIndex: number) => {
    setTextSelection({
      id,
      from: { paragraph: paragraphIndex, row: 0 },
      to: { paragraph: paragraphIndex, row: 0 },
    });
  };

  const getTextIdAndParagraphIndex = (
    nodes: (Node | null)[],
    offset: number
  ) => {
    for (let i = 0; i < 4; i++) {
      const parentElement = nodes.at(-1)?.parentElement;
      if (!parentElement) {
        return null;
      }
      if (
        parentElement.hasAttribute("data-text-id") &&
        parentElement.hasAttribute("data-text-line-index")
      ) {
        const paragraphIndex = parseInt(
          parentElement.getAttribute("data-text-line-index")!
        );
        let rowIndex = 0;
        for (let i = 0; i < parentElement.childNodes.length; i++) {
          const child = parentElement.childNodes[i];
          if (nodes.includes(child)) {
            break;
          }
          if (child instanceof HTMLBRElement) {
            rowIndex++;
          }
          rowIndex += (child.textContent ?? "").length;
        }
        rowIndex += offset;

        return {
          id: parentElement.getAttribute("data-text-id")!,
          index: {
            paragraph: paragraphIndex,
            row: rowIndex,
          },
        };
      }
      nodes.push(parentElement);
    }
    return null;
  };

  useEffect(() => {
    const handler = () => {
      if (pressedKeyCodes.some((code) => isCtrlKey(code) || isAltKey(code))) {
        return;
      }
      const selection = document.getSelection();
      if (!selection || textOption) {
        return;
      }
      const from = getTextIdAndParagraphIndex(
        [selection.anchorNode],
        selection.anchorOffset
      );
      const to = getTextIdAndParagraphIndex(
        [selection.focusNode],
        selection.focusOffset
      );
      if (from && to && from.id === to.id) {
        let fromIndex = from.index;
        let toIndex = to.index;
        if (fromIndex.row > toIndex.row) {
          [fromIndex, toIndex] = [toIndex, fromIndex];
        }
        if (fromIndex.paragraph > toIndex.paragraph) {
          [fromIndex, toIndex] = [toIndex, fromIndex];
        }
        setTextSelection({
          id: from.id,
          from: fromIndex,
          to: toIndex,
        });
      }
    };
    document.addEventListener("selectionchange", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
    };
  }, [textOption, setTextSelection, pressedKeyCodes]);

  const shiftKerning = (value: number, overwrites: boolean) => {
    if (!textSelection) {
      return;
    }
    const { text, paragraph } = getSelectedFromParagraph(
      allTexts,
      textSelection
    );
    if (!text) {
      return;
    }
    const newParagraph = deepCopy(paragraph);
    const fromIndex = textSelection.from.row;
    const kerning =
      value +
      (overwrites
        ? 0
        : getCharacterStyle(fromIndex, "kerning", newParagraph.charStyles) ??
          0);
    newParagraph.charStyles = changeCharacterStyles(
      fromIndex,
      "kerning",
      [kerning],
      newParagraph.charStyles
    );
    dispatch(
      updateParagraph({
        id: textSelection.id,
        paragraphIndex: textSelection.from.paragraph,
        paragraph: newParagraph,
      })
    );
  };

  const shiftBaseline = (delta: number) => {
    if (!textSelection) {
      return;
    }
    const { text, paragraph } = getSelectedFromParagraph(
      allTexts,
      textSelection
    );
    if (!text) {
      return;
    }
    const newParagraph = deepCopy(paragraph);
    const fromIndex = textSelection.from.row;
    const shifts = [...Array(textSelection.to.row - fromIndex)].map(
      (_, index) =>
        (getCharacterStyle(
          fromIndex + index,
          "shift",
          newParagraph.charStyles
        ) ?? 0) + delta
    );
    newParagraph.charStyles = changeCharacterStyles(
      fromIndex,
      "shift",
      shifts,
      newParagraph.charStyles
    );
    dispatch(
      updateParagraph({
        id: textSelection.id,
        paragraphIndex: textSelection.from.paragraph,
        paragraph: newParagraph,
      })
    );
  };

  const shiftRatio = (values: number[], overwrites: boolean) => {
    if (!textSelection) {
      return;
    }
    const { text, paragraph } = getSelectedFromParagraph(
      allTexts,
      textSelection
    );
    if (!text) {
      return;
    }
    const newParagraph = deepCopy(paragraph);
    const fromIndex = textSelection.from.row;
    const ratios = overwrites
      ? values
      : [...Array(textSelection.to.row - fromIndex)].map(
          (_, index) =>
            (getCharacterStyle(
              fromIndex + index,
              "ratio",
              newParagraph.charStyles
            ) ?? 100) + values[0]
        );
    newParagraph.charStyles = changeCharacterStyles(
      fromIndex,
      "ratio",
      ratios,
      newParagraph.charStyles
    );
    dispatch(
      updateParagraph({
        id: textSelection.id,
        paragraphIndex: textSelection.from.paragraph,
        paragraph: newParagraph,
      })
    );
  };

  const moveCursor = (forward: boolean, shiftKey: boolean) => {
    if (!textSelection) {
      return;
    }
    const newSelection = deepCopy(textSelection);
    // forward
    if (forward) {
      const { paragraph } = getSelectedFromParagraph(allTexts, textSelection);
      if (!paragraph) {
        return;
      }
      if (
        textSelection.to.row < paragraph.content.length &&
        (isCollapsedSelection(textSelection) || shiftKey)
      ) {
        newSelection.to.row++;
      }
      if (!shiftKey) {
        newSelection.from = { ...newSelection.to };
      }
      setTextSelection(newSelection);
    }
    // backward
    else {
      if (
        textSelection.from.row > 0 &&
        (isCollapsedSelection(textSelection) || shiftKey)
      ) {
        newSelection.from.row--;
      }
      if (!shiftKey) {
        newSelection.to = { ...newSelection.from };
      }
      setTextSelection(newSelection);
    }
  };

  // keyboard
  useKey(
    "ArrowLeft",
    (e, withCodes) => {
      if (withCodes.some((code) => isAltKey(code))) {
        shiftKerning(-20, false);
      } else {
        moveCursor(false, e.shiftKey);
      }
    },
    undefined,
    [textSelection, allTexts]
  );

  useKey(
    "ArrowRight",
    (e, withCodes) => {
      if (withCodes.some((code) => isAltKey(code))) {
        shiftKerning(20, false);
      } else {
        moveCursor(true, e.shiftKey);
      }
    },
    undefined,
    [textSelection, allTexts]
  );

  useKey(
    "ArrowUp",
    (_, withCodes) => {
      if (withCodes.some((code) => isAltKey(code))) {
        if (withCodes.includes("KeyX")) {
          shiftRatio([2], false);
        } else {
          shiftBaseline(2);
        }
      }
    },
    undefined,
    [textSelection, allTexts]
  );

  useKey(
    "ArrowDown",
    (_, withCodes) => {
      if (withCodes.some((code) => isAltKey(code))) {
        if (withCodes.includes("KeyX")) {
          shiftRatio([-2], false);
        } else {
          shiftBaseline(-2);
        }
      }
    },
    undefined,
    [textSelection, allTexts]
  );

  // rect
  let width: number | undefined = undefined;
  let height: number | undefined = undefined;
  if (wrapperRef.current) {
    const rect = wrapperRef.current.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
  }

  return (
    <Wrapper
      cursor={cursor}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      ref={wrapperRef}
    >
      <Content x={-viewPosition[0]} y={-viewPosition[1]}>
        {Object.values(allTexts).map((text, index) => {
          const penIndex = getPenIndexFromTextIds(
            text.id,
            penIndexToOrderedRelatedTextIds
          );
          return (
            <RelatedTextWrapper
              relatedText={text}
              penIndex={penIndex}
              crossRef={crossRefs.current[text.id]}
              direction={
                mouseOveredTextIdDirection?.id === text.id
                  ? mouseOveredTextIdDirection.direction
                  : null
              }
              editing={text.id === editingTextId}
              textSelection={textSelection}
              setEditing={(value) =>
                setEditingTextId(value ? text.id : undefined)
              }
              key={index}
            />
          );
        })}
      </Content>
      <LociSvg
        allLoci={allLoci}
        selectedLociIndices={selectedLociIndices}
        mouseOveredLociIndex={mouseOveredLociIndex}
        position={viewPosition}
        width={width ?? 0}
        height={height ?? 0}
        strokeWidth={1}
      />
      {mousePoint && textOption && (
        <DetailedDisplay x={mousePoint[0]} y={mousePoint[1] + 10}>
          {" "}
          {textOption.type === "paragraph"
            ? `${textOption.size * 4} Q ／ 行送り ${textOption.lineHeight}`
            : textOption.type === "characterRatio"
            ? `${textOption.ratio}%`
            : `カーニング ${textOption.kerning.toFixed(0)}`}
        </DetailedDisplay>
      )}
    </Wrapper>
  );
};

export default RelatedTextCollection;
