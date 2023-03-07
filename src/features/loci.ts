import { LociState } from "./loci-slice";
import { PenType } from "./tool-type";
import {
  circulatesLine,
  judgeLineDirection,
  Bounding,
  Line,
  LineId,
  LineIdsByDirection,
  Point,
} from "../utils/figure";
import { rectContainsLineSegment } from "../utils/rect";

export interface Locus {
  type: PenType;
  id: string;
  points: Point[];
}

interface LociByType {
  regionSeparation: Locus[];
  floatingObject: Locus[];
  text: Locus[];
  constraint: Locus[];
  decoration: Locus[];
}

export type penIndexToLoci = { [key in number]: Locus[] };

export const locusToRect = (locus: Locus): Bounding<number> => ({
  top: Math.min(...locus.points.map((point) => point[1])),
  right: Math.max(...locus.points.map((point) => point[0])),
  bottom: Math.max(...locus.points.map((point) => point[1])),
  left: Math.min(...locus.points.map((point) => point[0])),
});

const locusToLineId = (locus: Locus): LineId | null => {
  const index = locus.type.type === "region" ? locus.type.index : 0;
  return locus.points.length > 2
    ? { line: [locus.points[0], locus.points.at(-1)!], id: locus.id, index }
    : null;
};

export const locusToLine = (locus: Locus): Line | null =>
  locus.points.length > 2 ? [locus.points[0], locus.points.at(-1)!] : null;

export const separateLociByType = (loci: Locus[]): LociByType => {
  const textLoci = loci.filter((locus) => locus.type.type === "text");
  const constraintLoci = loci.filter(
    (locus) => locus.type.type === "constraint"
  );
  const decorationLoci = loci.filter(
    (locus) => locus.type.type === "decoration"
  );
  const lociByType: LociByType = {
    regionSeparation: [],
    floatingObject: [],
    text: textLoci,
    constraint: constraintLoci,
    decoration: decorationLoci,
  };

  // region, floating object, padding
  const regionLocus = loci.filter((locus) => locus.type.type === "region");
  const circulatingLocus = regionLocus.filter((locus) =>
    circulatesLine(locus.points)
  );
  const notCirculatingLocus = regionLocus.filter(
    (locus) => !circulatesLine(locus.points)
  );

  const processedNotCirculatingIndices: number[] = [];

  for (let i = 0; i < circulatingLocus.length; i++) {
    let isFloatingObj = false;

    // floating object
    for (let j = 0; j < notCirculatingLocus.length; j++) {
      const boxLocus = circulatingLocus[i];
      const lineLocus = notCirculatingLocus[j];
      if (processedNotCirculatingIndices.includes(j)) {
        continue;
      }

      const boxBounding = locusToRect(boxLocus);
      const rect = {
        x: boxBounding.left,
        y: boxBounding.top,
        width: boxBounding.right - boxBounding.left,
        height: boxBounding.bottom - boxBounding.top,
      };

      const startPoint = lineLocus.points[0];
      const endPoint = lineLocus.points.at(-1)!;
      const line: Line = [startPoint, endPoint];
      const radian =
        Math.atan2(line[1][1] - line[0][1], line[1][0] - line[0][0]) /
        (2 * Math.PI);
      const angle = ((radian * 360 + 180) % 180) - 90;

      if (rectContainsLineSegment(rect, line) && 30 < angle && angle < 70) {
        lociByType.floatingObject.push(circulatingLocus[i]);
        processedNotCirculatingIndices.push(j);
        isFloatingObj = true;
        break;
      }
    }
  }

  // region separation line
  for (let i = 0; i < notCirculatingLocus.length; i++) {
    if (processedNotCirculatingIndices.includes(i)) {
      continue;
    }
    lociByType.regionSeparation.push(notCirculatingLocus[i]);
  }
  return lociByType;
};

export const locusToLineIdsByDirection = (
  loci: Locus[]
): LineIdsByDirection => {
  const lines = loci
    .map((locus) => locusToLineId(locus))
    .flatMap((line) => (line ? [line] : []));
  return {
    vertical: lines.filter(
      (line) => judgeLineDirection(line.line) === "vertical"
    ),
    horizontal: lines.filter(
      (line) => judgeLineDirection(line.line) === "horizontal"
    ),
  };
};

export const separateLociByPenIndex = (loci: Locus[]) => {
  const penIndexToLoci: penIndexToLoci = {};
  for (const locus of loci) {
    if ("index" in locus.type) {
      if (!(locus.type.index in penIndexToLoci)) {
        penIndexToLoci[locus.type.index] = [];
      }
      penIndexToLoci[locus.type.index].push(locus);
    }
  }
  return penIndexToLoci;
};

export const getCurrentLoci = (state: LociState) => state.loci[state.lociIndex];
