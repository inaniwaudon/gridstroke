import * as uuid from "uuid";
import { Element } from "xast";
import { x } from "xastscript";
import { BoxDecoration } from "./decoration";
import { objectsToInfos, ElementObject, ObjectInfo } from "./object";
import { penIndexToLoci } from "@/features/loci";
import { getObjectWithId } from "@/features/object";
import {
  alignLineSegment,
  intersectsLineSegments,
  Direction,
  Line,
  LineIdDirection,
  LineIdsByDirection,
  Point,
  Size,
  SplitDirection,
} from "@/utils/figure";
import Rect, {
  rectContainsLineSegment,
  rectContainsPoint,
  rectStrokeContainsPoint,
} from "@/utils/rect";
import { colorToCss, Color } from "@/utils/style";
import {
  colorToTwightColor,
  createTwightId,
  getTwightIdSelector,
  twightMm,
  Ruleset,
} from "@/utils/twight";

export type Region = {
  type: "region";
  splitDirection: SplitDirection;
  ratio: number;
  gap: number;
  children: ElementObject[];
  id: string;
};

export type RegionInfo = {
  type: "region";
  rect: Rect;
  id: string;
  bottom: boolean;
} & BoxDecoration;

export type RegionPart = "surface" | "stroke";

export type RegionIdAlignToLociIds = {
  [key in string]: {
    [key in Direction]?: string;
  };
};

export const createRegionId = () => "r" + uuid.v4();

export const invertSplitDirection = (
  direction: SplitDirection
): SplitDirection => (direction === "horizontal" ? "vertical" : "horizontal");

export const isRegionDeepest = (region: Region) =>
  region.children.length === 0 || region.children[0].type === "text";

export const getRegionParent = (
  targetRegion: Region,
  region: Region
): Region | undefined => {
  if (Object.values(region.children).includes(targetRegion)) {
    return region;
  }
  for (const child of region.children) {
    if (child.type === "region") {
      const result = getRegionParent(targetRegion, child);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};

export const getRegionSurfaceInfo = (points: Point[], infos: RegionInfo[]) => {
  return infos.find((info) =>
    points.every((point) => rectContainsPoint(info.rect, point))
  );
};

export const getRegionBorderInfo = (
  point: Point,
  rootRegion: Region,
  infos: RegionInfo[]
): [RegionInfo, Direction] | null => {
  for (const info of infos) {
    const region = getObjectWithId<Region>(info.id, rootRegion)!;
    const parent = getRegionParent(region, rootRegion);
    const direction = rectStrokeContainsPoint(info.rect, point, 8);
    if (
      direction &&
      !(
        parent &&
        ((parent.splitDirection === "horizontal" &&
          ["top", "bottom"].includes(direction)) ||
          (parent.splitDirection === "vertical" &&
            ["left", "right"].includes(direction)) ||
          (parent.children.indexOf(region) === 0 &&
            ["top", "left"].includes(direction)) ||
          (parent.children.indexOf(region) === parent.children.length - 1 &&
            ["bottom", "right"].includes(direction)))
      )
    ) {
      return [info, direction];
    }
  }
  return null;
};

// split regions
const splitRegion = (
  region: Region,
  splitDirection: SplitDirection,
  ratio: number[]
) => {
  region.splitDirection = splitDirection;
  region.children = [...Array(ratio.length + 1)].map((_, index) => {
    return {
      type: "region",
      splitDirection: "vertical",
      ratio:
        (index < ratio.length ? ratio[index] : 1.0) -
        (0 < index ? ratio[index - 1] : 0),
      gap: 0,
      children: [],
      id: createRegionId(),
    };
  });
  return region.children.map((child) => child.id);
};

const calculateRatio = (
  line: Line,
  splitDirection: SplitDirection,
  rect: Rect
) => {
  return splitDirection === "horizontal"
    ? (line[1][0] - rect.x) / rect.width
    : (line[1][1] - rect.y) / rect.height;
};

const getJudgedLines = (
  line: Line,
  rect: Rect,
  splitDirection: SplitDirection
): Line[] => {
  if (splitDirection === "horizontal") {
    const min = Math.min(line[0][1], line[1][1]);
    const max = Math.max(line[0][1], line[1][1]);
    return [
      [
        [line[0][0], rect.y],
        [line[0][0], min],
      ],
      [
        [line[1][0], max],
        [line[1][0], rect.y + rect.height],
      ],
    ];
  } else {
    const min = Math.min(line[0][0], line[1][0]);
    const max = Math.max(line[0][0], line[1][0]);
    return [
      [
        [rect.x, line[0][1]],
        [min, line[0][1]],
      ],
      [
        [max, line[1][1]],
        [rect.x + rect.width, line[1][1]],
      ],
    ];
  }
};

const splitRegionWithLineSegments = (
  region: Region,
  regionInfo: RegionInfo,
  lineIdsByDirection: LineIdsByDirection,
  parentSplitDirection: SplitDirection
): RegionIdAlignToLociIds => {
  const regionIdAlignToLociIds: RegionIdAlignToLociIds = {};

  /**
   * @return {string[]} - the divided region at the deepest level
   */
  const splitRecursively = (
    lineIdDirections: LineIdDirection[],
    region: Region,
    rect: Rect,
    parentDirection: SplitDirection
  ): string[] => {
    /*
      It judges whether the line of `lineIdDirection` is divisible.
      If an judgedLines, line segments extended `lineIdDirection` to both ends of the rect,
      collides with other lines, it is not processed this time.
      Otherwise, line divides the region.
    */
    const divisibleLineIds: LineIdDirection[] = [];
    for (const lineIdDirection of lineIdDirections) {
      const judgedLines: Line[] = getJudgedLines(
        lineIdDirection.line,
        rect,
        lineIdDirection.direction
      );
      if (
        lineIdDirections
          .filter((item) => item != lineIdDirection)
          .every((item) =>
            judgedLines.every(
              (judgedLine) => !intersectsLineSegments(judgedLine, item.line)
            )
          )
      ) {
        divisibleLineIds.push(lineIdDirection);
      }
    }

    const infos: (LineIdDirection & {
      ratio: number;
    })[] = [];
    const maxPriority = Math.min(
      ...divisibleLineIds.map((lineId) => lineId.index)
    );
    for (const lineIdDirection of divisibleLineIds) {
      if (lineIdDirection.index === maxPriority) {
        infos.push({
          ratio: calculateRatio(
            lineIdDirection.line,
            lineIdDirection.direction,
            rect
          ),
          ...lineIdDirection,
        });
      }
    }

    const newRegionIds: string[] = [];

    if (infos.length > 0) {
      // If splitDirections consist of two directions,
      // the vertical split to the parent direction is preferred.
      const unidirectionalInfos = !infos.every(
        (info) => info.direction === infos[0].direction
      )
        ? infos.filter(
            (info) => info.direction === invertSplitDirection(parentDirection)
          )
        : infos;
      const sortedInfos = unidirectionalInfos.sort((a, b) => a.ratio - b.ratio);
      const result = splitRegion(
        region,
        unidirectionalInfos[0].direction,
        sortedInfos.map((info) => info.ratio)
      );
      newRegionIds.push(...result);

      // map region edges to locus
      for (let i = 0; i < region.children.length; i++) {
        const child = region.children[i];
        if (child.type === "region") {
          const isVertical = region.splitDirection === "vertical";
          regionIdAlignToLociIds[child.id] = {};
          if (i > 0) {
            if (isVertical) {
              regionIdAlignToLociIds[child.id].top = sortedInfos[i - 1].id;
            } else {
              regionIdAlignToLociIds[child.id].left = sortedInfos[i - 1].id;
            }
          }
          if (i < region.children.length - 1) {
            if (isVertical) {
              regionIdAlignToLociIds[child.id].bottom = sortedInfos[i].id;
            } else {
              regionIdAlignToLociIds[child.id].right = sortedInfos[i].id;
            }
          }
        }
      }

      // search recursively for splited regions.
      const newInfos = objectsToInfos(rect, region);
      for (const child of region.children) {
        const newInfo = newInfos.find((info) => info.id === child.id);
        if (child.type !== "region" || !newInfo) {
          continue;
        }
        const result = splitRecursively(
          lineIdDirections.filter(
            (lineIdDirection) =>
              !unidirectionalInfos
                .map((info) => info.id)
                .includes(lineIdDirection.id) &&
              rectContainsLineSegment(newInfo.rect, lineIdDirection.line)
          ),
          child,
          newInfo.rect,
          unidirectionalInfos[0].direction
        );
        newRegionIds.push(...result);
      }
    }
    return newRegionIds;
  };

  const verticalPairs = lineIdsByDirection.vertical.map<LineIdDirection>(
    (lineId) => ({
      ...lineId,
      line: alignLineSegment(lineId.line, "vertical"),
      direction: "vertical",
    })
  );
  const horizontalPairs = lineIdsByDirection.horizontal.map<LineIdDirection>(
    (lineId) => ({
      ...lineId,
      line: alignLineSegment(lineId.line, "horizontal"),
      direction: "horizontal",
    })
  );

  splitRecursively(
    [...verticalPairs, ...horizontalPairs],
    region,
    regionInfo.rect,
    parentSplitDirection
  );
  return regionIdAlignToLociIds;
};

// split a region
export const splitPageRegion = (
  rootRegion: Region,
  pageSize: Size,
  lineIdsByDirection: LineIdsByDirection
) => {
  rootRegion.children = [];
  const newRegionInfos = objectsToInfos(
    { x: 0, y: 0, width: pageSize[0], height: pageSize[1] },
    rootRegion
  );
  const info = getRegionInfo(rootRegion.id, newRegionInfos);
  return info
    ? splitRegionWithLineSegments(
        rootRegion,
        info,
        lineIdsByDirection,
        "horizontal"
      )
    : {};
};

export const getPenIndexToOrderedRegionIdsPerLocus = (
  regionInfos: RegionInfo[],
  penIndexToLoci: penIndexToLoci,
  isOnlyBottom: boolean,
  containsAllPoints: boolean
) => {
  const map: { [key in number]: string[][] } = {};

  for (const penIndex in penIndexToLoci) {
    const idsPerLocus: string[][] = [];
    for (const locus of penIndexToLoci[penIndex]) {
      const ids: string[] = [];

      for (const info of regionInfos) {
        const condition = (point: Point) => rectContainsPoint(info.rect, point);
        const containsPoint =
          (containsAllPoints &&
            locus.points.every((point) => condition(point))) ||
          (!containsAllPoints &&
            locus.points.some((point) => condition(point)));

        if (
          (!isOnlyBottom || info.bottom) &&
          !ids.includes(info.id) &&
          containsPoint
        ) {
          ids.push(info.id);
        }
      }
      idsPerLocus.push(ids);
    }
    map[penIndex] = idsPerLocus;
  }
  return map;
};

// get the ids of the regions in which the specified loci overlap
export const getPenIndexToOrderedRegionIds = (
  regionInfos: RegionInfo[],
  penIndexToLoci: penIndexToLoci,
  isOnlyBottom: boolean,
  containsAllPoints: boolean
) => {
  const map = getPenIndexToOrderedRegionIdsPerLocus(
    regionInfos,
    penIndexToLoci,
    isOnlyBottom,
    containsAllPoints
  );
  const flattenMap: { [key in number]: string[] } = {};
  for (const index in map) {
    flattenMap[index] = map[index].flatMap((item) => item);
  }
  return flattenMap;
};

export const regionContainsRegion = (parent: Region, child: Region) => {
  const stack: Region[] = [parent];
  while (stack.length > 0) {
    const item = stack.pop()!;
    for (const childItem of item.children) {
      if (childItem === child) {
        return true;
      }
      if (childItem.type === "region") {
        stack.push(childItem);
      }
    }
  }
  return false;
};

export const getRegionInfo = (id: string, regionInfos: ObjectInfo[]) => {
  const info = regionInfos.find((info) => info.id === id);
  return info?.type === "region" ? (info as RegionInfo) : undefined;
};

export const createRootRegion = (): Region => ({
  type: "region",
  splitDirection: "vertical",
  ratio: 1.0,
  gap: 0,
  id: createRegionId(),
  children: [],
});

// output
const sideBorderHeight = (info: RegionInfo) =>
  info.rect.height + info.border.top.width + info.border.bottom.width;

const getBorderRects = (info: RegionInfo) => {
  const rects: (Rect & { fill: Color })[] = [];
  // top
  rects.push({
    x: 0,
    y: -info.border.top.width,
    width: info.rect.width,
    height: info.border.top.width,
    fill: info.border.top.color,
  });
  // right
  rects.push({
    x: info.rect.width,
    y: -info.border.top.width,
    width: info.border.right.width,
    height: sideBorderHeight(info),
    fill: info.border.right.color,
  });
  // bottom
  rects.push({
    x: 0,
    y: info.rect.height,
    width: info.rect.width,
    height: info.border.bottom.width,
    fill: info.border.bottom.color,
  });
  // left
  rects.push({
    x: -info.border.left.width,
    y: -info.border.top.width,
    width: info.border.left.width,
    height: sideBorderHeight(info),
    fill: info.border.left.color,
  });
  return rects;
};

export const regionInfoToTwightXml = (info: RegionInfo) => {
  // fill
  const fillId = createTwightId();
  const fillRuleset: Ruleset = {
    selector: getTwightIdSelector(fillId),
    block: [
      {
        x: twightMm(info.rect.x),
        y: twightMm(info.rect.y),
        width: twightMm(info.rect.width),
        height: twightMm(info.rect.height),
        "twipo.border-radius": twightMm(info.borderRadius),
      },
    ],
  };
  if (info.fill) {
    fillRuleset.block.push({
      fill: colorToTwightColor(info.fill),
    });
  }
  const fill = x("twipo:rect", { id: fillId });

  // border
  const borderRects = getBorderRects(info);
  const borderElements: Element[] = [];
  const borderRulesets: Ruleset[] = [];

  for (const rect of borderRects) {
    const id = createTwightId();
    const ruleset: Ruleset = {
      selector: getTwightIdSelector(id),
      block: [
        {
          x: twightMm(rect.x + info.rect.x),
          y: twightMm(rect.y + info.rect.y),
          width: twightMm(rect.width),
          height: twightMm(rect.height),
        },
        {
          fill: colorToTwightColor(rect.fill),
        },
      ],
    };
    borderElements.push(x("twipo:rect", { id }));
    borderRulesets.push(ruleset);
  }

  return {
    elements: [fill, ...borderElements],
    rulesets: [fillRuleset, ...borderRulesets],
  };
};

export const regionInfoToSvg = (info: RegionInfo) => {
  const fillAttrs: { [key in string]: any } = {
    width: info.rect.width,
    height: info.rect.height,
    rx: info.borderRadius,
    ry: info.borderRadius,
  };
  fillAttrs.fill = info.fill ? colorToCss(info.fill) : "none";
  const fill = x("rect", fillAttrs);

  const borders = getBorderRects(info).map((rect) =>
    x("rect", { ...rect, fill: colorToCss(rect.fill) })
  );

  return x(
    "g",
    {
      transform: `translate(${info.rect.x}, ${info.rect.y})`,
    },
    [fill, ...borders]
  );
};
