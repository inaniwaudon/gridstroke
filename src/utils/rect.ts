import {
  intersectsLineSegments,
  Bounding,
  Direction,
  Line,
  Point,
} from "./figure";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const getRectRight = (rect: Rect) => {
  return rect.x + rect.width;
};

export const getRectBottom = (rect: Rect) => {
  return rect.y + rect.height;
};

export const rectContainsPoint = (rect: Rect, point: Point) => {
  return (
    rect.x <= point[0] &&
    rect.y <= point[1] &&
    point[0] <= getRectRight(rect) &&
    point[1] <= getRectBottom(rect)
  );
};

export const rectStrokeContainsPoint = (
  rect: Rect,
  point: Point,
  strokeWidth: number
): Direction | null => {
  return rectContainsPoint(
    {
      x: rect.x - strokeWidth / 2,
      y: rect.y,
      width: strokeWidth,
      height: rect.height,
    },
    point
  )
    ? "left"
    : rectContainsPoint(
        {
          x: getRectRight(rect) - strokeWidth / 2,
          y: rect.y,
          width: strokeWidth,
          height: rect.height,
        },
        point
      )
    ? "right"
    : rectContainsPoint(
        {
          x: rect.x,
          y: rect.y - strokeWidth / 2,
          width: rect.width,
          height: strokeWidth,
        },
        point
      )
    ? "top"
    : rectContainsPoint(
        {
          x: rect.x,
          y: getRectBottom(rect) - strokeWidth / 2,
          width: rect.width,
          height: strokeWidth,
        },
        point
      )
    ? "bottom"
    : null;
};

export const rectContainsLineSegment = (rect: Rect, line: Line) => {
  return (
    intersectsLineSegments(line, [
      [rect.x, rect.y],
      [getRectRight(rect), rect.y],
    ]) ||
    intersectsLineSegments(line, [
      [rect.x, getRectBottom(rect)],
      [getRectRight(rect), getRectBottom(rect)],
    ]) ||
    intersectsLineSegments(line, [
      [rect.x, rect.y],
      [rect.x, getRectBottom(rect)],
    ]) ||
    intersectsLineSegments(line, [
      [getRectRight(rect), rect.y],
      [getRectRight(rect), getRectBottom(rect)],
    ]) ||
    rectContainsPoint(rect, line[0]) ||
    rectContainsPoint(rect, line[1])
  );
};

export const overlapsRect = (rect0: Rect, rect1: Rect) => {
  return (
    Math.max(rect0.x, rect1.x) <
      Math.min(getRectRight(rect0), getRectRight(rect1)) &&
    Math.max(rect0.y, rect1.y) <
      Math.min(getRectBottom(rect0), getRectBottom(rect1))
  );
};

export const mmToPxRect = (rect: Rect, mmToPx: (mm: number) => number) => {
  return {
    x: mmToPx(rect.x),
    y: mmToPx(rect.y),
    width: mmToPx(rect.width),
    height: mmToPx(rect.height),
  };
};

export const getRectExceptPadding = (rect: Rect, padding: Bounding<number>) => {
  return {
    x: rect.x + padding.left,
    y: rect.y + padding.top,
    width: rect.width - (padding.left + padding.right),
    height: rect.height - (padding.top + padding.bottom),
  };
};

export default Rect;
