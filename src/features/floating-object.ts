import Rect from "../utils/rect";
import * as uuid from "uuid";
import { x } from "xastscript";
import { locusToRect, Locus } from "@/features/loci";
import {
  colorToTwightColor,
  createTwightId,
  getTwightIdSelector,
  Ruleset,
  twightMm,
} from "@/utils/twight";
import { cmyk } from "@/utils/style";

export interface FloatingObject {
  id: string;
  rect: Rect;
  src: string;
}

const createFloatingObjectId = () => uuid.v4();

export const createFloatingObject = (loci: Locus[]) => {
  const objects: { [key in string]: FloatingObject } = {};
  for (const locus of loci) {
    const bounding = locusToRect(locus);
    const id = createFloatingObjectId();
    objects[id] = {
      id,
      rect: {
        x: bounding.left,
        y: bounding.top,
        width: bounding.right - bounding.left,
        height: bounding.bottom - bounding.top,
      },
      src: "cherry.jpg",
    };
  }
  return objects;
};

export const floatingObjectToTwightXml = (floatingObj: FloatingObject) => {
  const id = createTwightId();
  const element = x("twipo:rect", { id });
  const ruleset: Ruleset = {
    selector: getTwightIdSelector(id),
    block: [
      {
        x: twightMm(floatingObj.rect.x),
        y: twightMm(floatingObj.rect.y),
        width: twightMm(floatingObj.rect.width),
        height: twightMm(floatingObj.rect.height),
      },
      {
        fill: colorToTwightColor(cmyk(0, 0, 0, 50)),
      },
    ],
  };
  return { element, ruleset };
};
