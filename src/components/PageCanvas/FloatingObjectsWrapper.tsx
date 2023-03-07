import React, {
  createRef,
  useContext,
  useRef,
  useState,
  RefObject,
} from "react";
import styled from "styled-components";
import { MmToPxContext } from "./PageCanvas";
import { FloatingObject } from "@/features/floating-object";
import { Page } from "@/features/page";
import { getPoint, Point } from "@/utils/figure";
import Rect, { mmToPxRect } from "@/utils/rect";
import { deepCopy } from "@/utils/utils";

const padding = 10;

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
`;

const ObjectWrapper = styled.div<{
  x: number;
  y: number;
  width: number;
  height: number;
}>`
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  padding: ${padding}px;
  position: absolute;
  left: ${(props) => props.x - padding}px;
  top: ${(props) => props.y - padding}px;
`;

const ObjectElement = styled.div<{
  src: string;
  cursor: string;
  selected: boolean;
}>`
  height: 100%;
  margin: ${(props) => (props.selected ? -1 : 0)}px;
  border: solid ${(props) => (props.selected ? 1 : 0)}px #f09;
  background: url("${(props) => props.src}");
  background-size: cover;
  cursor: ${(props) => props.cursor};
`;

type Operation = "top" | "right" | "bottom" | "left" | "move";

interface FloatingObjectsWrapperProps {
  floatingObjects: { [key in string]: FloatingObject };
  downPoint: Point | undefined;
  selectedFloatingObjectKey: string | undefined;
  setDownPoint: React.Dispatch<React.SetStateAction<Point | undefined>>;
  setPage: (page: Page) => void;
  setSelectedFloatingObjectKey: React.Dispatch<string | undefined>;
  pxToMm: (px: number) => number;
}

const FloatingObjectsWrapper = ({
  floatingObjects,
  downPoint,
  selectedFloatingObjectKey,
  setDownPoint,
  setPage,
  setSelectedFloatingObjectKey,
  pxToMm,
}: FloatingObjectsWrapperProps) => {
  const mmToPx = useContext(MmToPxContext);
  const [originalRect, setOriginalRect] = useState<Rect>();
  const [currentOperation, setCurrentOperation] = useState<Operation>();
  const [cursor, setCursor] = useState("pointer");

  const objectRefs = useRef<{ [key in string]: RefObject<HTMLDivElement> }>({});
  Object.keys(floatingObjects).map((key) => {
    objectRefs.current[key] = createRef<HTMLDivElement>();
  });

  const cursorPadding = 6 + padding;

  const getOperation = (point: Point, rect: DOMRect): Operation => {
    if (point[1] < cursorPadding) {
      return "top";
    }
    if (point[1] >= rect.height - cursorPadding) {
      return "bottom";
    }
    if (point[0] <= cursorPadding) {
      return "left";
    }
    if (point[0] >= rect.width - cursorPadding) {
      return "right";
    }
    return "move";
  };

  /*const moveOnPage = (e: React.MouseEvent, id: string) => {
    const newPage = deepCopy(page);
    if (downPoint && originalRect && currentOperation) {
      const diffPoint = {
        x: e.pageX - downPoint[0],
        y: e.pageY - downPoint[1],
      };
      if (currentOperation === "move") {
        newPage.floatingObjects[id].rect.x =
          originalRect.x + pxToMm(diffPoint.x);
        newPage.floatingObjects[id].rect.y =
          originalRect.y + pxToMm(diffPoint.y);
      }
      if (currentOperation === "bottom") {
        newPage.floatingObjects[id].rect.height =
          originalRect.height + pxToMm(diffPoint.y);
      }
      if (currentOperation === "right") {
        newPage.floatingObjects[id].rect.width =
          originalRect.width + pxToMm(diffPoint.x);
      }
      if (currentOperation === "top") {
        newPage.floatingObjects[id].rect.y =
          originalRect.y + pxToMm(diffPoint.y);
        newPage.floatingObjects[id].rect.height =
          originalRect.height - pxToMm(diffPoint.y);
      }
      if (currentOperation === "left") {
        newPage.floatingObjects[id].rect.x =
          originalRect.x + pxToMm(diffPoint.x);
        newPage.floatingObjects[id].rect.width =
          originalRect.width - pxToMm(diffPoint.x);
      }
    }
    return newPage;
  };*/

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    // cursor
    const element = objectRefs.current[id].current;
    if (element) {
      const point = getPoint(e, element);
      const rect = element.getBoundingClientRect();
      setCurrentOperation(getOperation(point, rect));
      setDownPoint([e.pageX, e.pageY]);
      setOriginalRect({ ...floatingObjects[id].rect });
      setSelectedFloatingObjectKey(id);
    }
  };

  const onMouseMove = (e: React.MouseEvent, id: string) => {
    // TODO: PageCanvas の要素にすべてを載せる
    if (downPoint && originalRect) {
      //setPage(moveOnPage(e, id));
    }

    // cursor
    const element = objectRefs.current[id].current;
    if (element) {
      const point = getPoint(e, element);
      const rect = element.getBoundingClientRect();
      const operation = getOperation(point, rect);
      setCursor(
        ["top", "bottom"].includes(operation)
          ? "ns-resize"
          : ["left", "right"].includes(operation)
          ? "ew-resize"
          : "default"
      );
    }
  };

  const onMouseUp = (e: React.MouseEvent, id: string) => {
    if (downPoint && originalRect) {
      //setPage(moveOnPage(e, id));
      setCurrentOperation(undefined);
      setDownPoint(undefined);
      setOriginalRect(undefined);
    }
  };

  return (
    <Wrapper>
      {Object.entries(floatingObjects).map(([key, obj]) => {
        const rectPx = mmToPxRect(obj.rect, mmToPx);
        return (
          <ObjectWrapper
            x={rectPx.x}
            y={rectPx.y}
            width={rectPx.width}
            height={rectPx.height}
            onMouseDown={(e) => onMouseDown(e, obj.id)}
            onMouseMove={(e) => onMouseMove(e, obj.id)}
            onMouseUp={(e) => onMouseUp(e, obj.id)}
            ref={objectRefs.current[key]}
            key={key}
          >
            <ObjectElement
              src={obj.src}
              cursor={cursor}
              selected={obj.id === selectedFloatingObjectKey}
            ></ObjectElement>
          </ObjectWrapper>
        );
      })}
    </Wrapper>
  );
};

// TODO: 天地左右の padding

export default FloatingObjectsWrapper;
