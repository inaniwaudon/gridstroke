import { allBounding, Bounding, Direction } from "@/utils/figure";
import { Color, cmyk } from "@/utils/style";
import { deepCopy } from "@/utils/utils";

export interface Decoration {
  fill?: Color;
  border: Bounding<Border>;
}

export type BoxDecoration = Decoration & {
  margin: Bounding<number>;
  padding: Bounding<number>;
  borderRadius: number;
};

export interface Border {
  width: number;
  color: Color;
}

export const createDefaultBorder = () => ({
  width: 0,
  color: cmyk(0, 0, 0, 0),
});

export const createDefaultBoxDecoration = (): BoxDecoration => ({
  border: allBounding(createDefaultBorder()),
  margin: allBounding(10),
  padding: allBounding(10),
  borderRadius: 0,
});

export const setBounding = <T>(
  direction: Direction | "all",
  bounding: Bounding<T>,
  value: T,
  setBounding: (bounding: Bounding<T>) => void
) => {
  const newBounding = deepCopy(bounding);
  if (direction === "all") {
    if (direction === "all") {
      newBounding.top = value;
      newBounding.right = value;
      newBounding.bottom = value;
      newBounding.left = value;
    }
  }
  if (direction === "top") {
    newBounding.top = value;
  }
  if (direction === "right") {
    newBounding.right = value;
  }
  if (direction === "bottom") {
    newBounding.bottom = value;
  }
  if (direction === "left") {
    newBounding.left = value;
  }
  setBounding(newBounding);
};
