import { Point } from "./figure";

export type Mode = "layout" | "text";

export interface ScalePosition {
  scale: number;
  position: Point;
}

export interface DisplayedElements {
  layout: boolean;
  decoration: boolean;
  text: boolean;
}

export const deepCopy = <T>(root: T) => {
  const search = (obj: unknown): unknown => {
    if (obj === null) {
      return null;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => search(item));
    } else if (typeof obj === "object") {
      return Object.assign(
        Object.create(Object.getPrototypeOf(obj)),
        Object.entries(obj).reduce(
          (previous, [key, value]) => ({ ...previous, [key]: search(value) }),
          {}
        )
      );
    }
    return obj;
  };
  return search(root) as T;
};

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.src = src;
    image.onload = () => {
      resolve(image);
    };
  });

export const pieMenuMs = 200;
