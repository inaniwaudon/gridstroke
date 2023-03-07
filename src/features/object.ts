import { createDefaultBorder, BoxDecoration } from "./decoration";
import { isRegionDeepest, Region, RegionInfo } from "./region";
import { TextInfo, TextWrapper } from "./text";
import Rect, { getRectExceptPadding } from "@/utils/rect";
import { allBounding } from "@/utils/figure";

export type ElementObject = Region | TextWrapper;

export type ObjectInfo = RegionInfo | TextInfo;

const defaultDecoration: BoxDecoration = {
  border: allBounding(createDefaultBorder()),
  margin: allBounding(0),
  padding: allBounding(0),
  borderRadius: 0,
};

export const getObjectWithId = <T extends ElementObject>(
  id: string,
  region: Region
): T | undefined => {
  const stack: ElementObject[] = [];
  stack.push(region);
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.id === id) {
      return current as T;
    }
    if (current.type === "region") {
      for (const child of current.children) {
        stack.push(child);
      }
    }
    stack.push();
  }
};

export const objectsToInfos = (
  rect: Rect,
  region: ElementObject,
  regionDecorations?: { [key in string]: BoxDecoration }
): ObjectInfo[] => {
  const decoration =
    (regionDecorations && regionDecorations[region.id]) ?? defaultDecoration;
  const currentRect = getRectExceptPadding(rect, decoration.margin);

  // text
  if (region.type === "text") {
    return [
      {
        type: "text",
        rect: currentRect,
        isVertical: region.isVertical,
        id: region.id,
        border: allBounding(createDefaultBorder()),
      },
    ];
  }

  // region
  const infos: ObjectInfo[] = [];
  infos.push({
    type: "region",
    rect: currentRect,
    id: region.id,
    margin: decoration.margin,
    padding: decoration.padding,
    fill: decoration.fill,
    border: decoration.border,
    borderRadius: decoration.borderRadius,
    bottom: isRegionDeepest(region),
  });

  // region which has its children
  let total = 0;
  infos.push(
    ...region.children
      .map((child) => {
        // TODO: gap
        const newRect = getRectExceptPadding(currentRect, decoration.padding);
        if (child.type === "region") {
          if (region.splitDirection === "horizontal") {
            newRect.x += total;
            newRect.width *= child.ratio;
            total += newRect.width;
          } else {
            newRect.y += total;
            newRect.height *= child.ratio;
            total += newRect.height;
          }
        }
        return objectsToInfos(newRect, child, regionDecorations);
      })
      .flat()
  );
  return infos;
};
