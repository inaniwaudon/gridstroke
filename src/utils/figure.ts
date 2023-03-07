export type Point = [number, number];

export type Size = [number, number];

export type Line = [Point, Point];

export interface LineId {
  line: Line;
  id: string;
  index: number;
}

export type LineIdDirection = LineId & {
  direction: SplitDirection;
};

export interface LineIdsByDirection {
  vertical: LineId[];
  horizontal: LineId[];
}

export type Bounding<T> = {
  top: T;
  right: T;
  bottom: T;
  left: T;
};

export const Direction = {
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
} as const;

export type Direction = keyof typeof Direction;

export type SplitDirection = "vertical" | "horizontal";

// point
export const scalePoint = (point: Point, scale: number): Point => [
  point[0] * scale,
  point[1] * scale,
];

export const translatePoint = (
  point: Point,
  translated: Point,
  isNegative?: boolean
): Point => [
  point[0] + translated[0] * (isNegative ? -1 : 1),
  point[1] + translated[1] * (isNegative ? -1 : 1),
];

export const circleContains = (point: Point, origin: Point, size: number) => {
  const x = origin[0] + size / 2;
  const y = origin[1] + size / 2;
  return (x - point[0]) ** 2 + (y - point[1]) ** 2 <= (size / 2) ** 2;
};

export const getClientPoint = (
  e: React.MouseEvent | React.TouchEvent
): Point => {
  return "touches" in e
    ? [e.touches[0].clientX, e.touches[0].clientY]
    : [e.clientX, e.clientY];
};

export const getPoint = (
  e: React.MouseEvent | React.TouchEvent,
  element: HTMLElement
): Point => {
  const bounding = element.getBoundingClientRect();
  const clientPoint = getClientPoint(e);
  return [clientPoint[0] - bounding.left, clientPoint[1] - bounding.top];
};

// line
// judge whether two line segments intersect using outer products
export const intersectsLineSegments = (a: Line, b: Line) => {
  const vab = [a[1][0] - a[0][0], a[1][1] - a[0][1]];
  const vac = [b[0][0] - a[0][0], b[0][1] - a[0][1]];
  const vad = [b[1][0] - a[0][0], b[1][1] - a[0][1]];
  const vcd = [b[1][0] - b[0][0], b[1][1] - b[0][1]];
  const vca = [a[0][0] - b[0][0], a[0][1] - b[0][1]];
  const vcb = [a[1][0] - b[0][0], a[1][1] - b[0][1]];
  const s0 = vab[0] * vac[1] - vac[0] * vab[1];
  const t0 = vab[0] * vad[1] - vad[0] * vab[1];
  const s1 = vcd[0] * vca[1] - vca[0] * vcd[1];
  const t1 = vcd[0] * vcb[1] - vcb[0] * vcd[1];
  return s0 * t0 < 0 && s1 * t1 < 0;
};

// judge whether a polyline circulates
export const circulatesLine = (line: Point[]) => {
  for (let i = 0; i < line.length - 1; i++) {
    for (let j = i + 1; j < line.length - 1; j++) {
      if (
        intersectsLineSegments([line[i], line[i + 1]], [line[j], line[j + 1]])
      ) {
        return true;
      }
    }
  }
  return false;
};

export const getDistanceLineAndPoint = (line: Line, point: Point) => {
  return (
    Math.abs(
      (point[0] - line[0][0]) * (line[0][1] - line[1][1]) -
        (point[1] - line[0][1]) * (line[0][0] - line[1][0])
    ) /
    Math.sqrt((line[0][0] - line[1][0]) ** 2 + (line[0][1] - line[1][1]) ** 2)
  );
};

export const getLineDistance = (line: Line) =>
  Math.sqrt((line[1][0] - line[0][0]) ** 2 + (line[1][1] - line[0][1]) ** 2);

export const judgeLineDirection = (line: Line): SplitDirection => {
  const radian = Math.atan(
    (line[1][1] - line[0][1]) / (line[1][0] - line[0][0])
  );
  return (-1 / 4) * Math.PI < radian && radian < (1 / 4) * Math.PI
    ? "vertical"
    : "horizontal";
};

export const alignLineIds = (
  lineIds: LineId[],
  left: number,
  right: number,
  splitDirection: SplitDirection
): LineId[] => {
  const sortedLineIds = [...lineIds].sort((a, b) => {
    const index = splitDirection === "vertical" ? 1 : 0;
    return (
      (a.line[0][index] + a.line[1][index]) / 2 -
      (b.line[0][index] + b.line[1][index]) / 2
    );
  });
  return sortedLineIds.map((lineId, index) => {
    const newPos = left + ((right - left) / (lineIds.length + 1)) * (index + 1);
    const line: Line =
      splitDirection === "vertical"
        ? [
            [lineId.line[0][0], newPos],
            [lineId.line[1][0], newPos],
          ]
        : [
            [newPos, lineId.line[0][1]],
            [newPos, lineId.line[1][1]],
          ];
    return { ...lineId, line };
  });
};

export const alignLineSegment = (
  line: Line,
  splitDirection: SplitDirection
): Line => {
  let newLine: Line;
  if (splitDirection === "horizontal") {
    const x = (line[0][0] + line[1][0]) / 2;
    newLine = [
      [x, line[0][1]],
      [x, line[1][1]],
    ];
  } else {
    const y = (line[0][1] + line[1][1]) / 2;
    newLine = [
      [line[0][0], y],
      [line[1][0], y],
    ];
  }
  return newLine;
};

// unit
export const mmToPxWithHeight =
  (height: number, canvasHeight: number) => (mm: number) =>
    (canvasHeight / height) * mm;

export const pxToMmWithHeight =
  (height: number, canvasHeight: number) => (px: number) =>
    (px / canvasHeight) * height;

export const pxToMmBounding =
  (pxToMm: (px: number) => number) =>
  (bounding: Bounding<number>): Bounding<number> => ({
    top: pxToMm(bounding.top),
    left: pxToMm(bounding.left),
    bottom: pxToMm(bounding.bottom),
    right: pxToMm(bounding.right),
  });

export const mmToPxPoint =
  (mmToPx: (mm: number) => number) =>
  (point: Point): Point =>
    [mmToPx(point[0]), mmToPx(point[1])];

export const pxToMmPoint =
  (pxToMm: (px: number) => number) =>
  (point: Point): Point =>
    [pxToMm(point[0]), pxToMm(point[1])];

export const mmToPxLine = (mmToPx: (mm: number) => number) => (line: Line) =>
  [mmToPxPoint(mmToPx)(line[0]), mmToPxPoint(mmToPx)(line[1])];

export const mmToQ = (mm: number) => mm * 4;

export const QToMm = (Q: number) => Q / 4;

// bounding
export const allBounding = <T>(value: T): Bounding<T> => ({
  top: value,
  right: value,
  bottom: value,
  left: value,
});

export const boundingToCss = <T>(bounding: Bounding<T>, unit: string) =>
  [bounding.top, bounding.right, bounding.bottom, bounding.left]
    .map((align) => `${align}${unit}`)
    .join(" ");
