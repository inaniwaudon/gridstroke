import * as uuid from "uuid";
import { cmyk, getColorValues, hslToRgb, rgb, Cmyk, Color, Rgb } from "./style";

export type Stylesheet = Ruleset[];

export type Ruleset = {
  selector: string;
  block: Block;
};

type Block = Layer[];

export type Layer = {
  [key in string]: string | number | TwightColor | TwightUnit;
};

export type TwightColor = {
  type: "color";
} & (Cmyk | Rgb);

export interface TwightUnit {
  type: "unit";
  value: number;
  unit: "m" | "mm" | "cm" | "Q" | "H" | "pt" | "in";
}

// id
export const createTwightId = () => `obj-${uuid.v4()}`;

export const getTwightIdSelector = (id: string) => `#${id}`;

export const getTwightThreadSelector = (id: string) => `$${id}`;

// color
export const colorToTwightColor = (color: Color): TwightColor => {
  const inColor =
    color.colorSpace === "cmyk"
      ? cmyk(...color.cmyk)
      : color.colorSpace === "hsl"
      ? rgb(...hslToRgb(color).rgb)
      : rgb(...color.rgb);
  return {
    type: "color",
    ...inColor,
  };
};

export const twightColorToString = (color: TwightColor) => {
  return `${color.colorSpace}(${getColorValues(color)})`;
};

// string
export const twightString = (str: string) => {
  return `"${str}"`;
};

export const stylesheetToTwightCss = (sheet: Stylesheet) => {
  const tabSize = 2;
  const indent = " ".repeat(tabSize);
  let css = "";
  for (const { selector, block } of sheet) {
    css += selector + " {\n";
    block.forEach((layer, index) => {
      for (const [property, value] of Object.entries(layer)) {
        let valueStr: string = "";
        if (typeof value === "object") {
          if (value.type === "color") {
            valueStr = twightColorToString(value);
          }
          if (value.type === "unit") {
            valueStr = value.value + value.unit;
          }
        } else {
          valueStr =
            typeof value === "string" ? twightString(value) : value.toString();
        }
        css += `${indent}${property}: ${valueStr};\n`;
      }
      if (index < block.length - 1) {
        css += indent + "/\n";
      }
    });
    css += "}\n";
  }
  return css;
};

export const twightMm = (mm: number): TwightUnit => ({
  type: "unit",
  value: mm,
  unit: "mm",
});

export const twightTextEscape = (text: string) =>
  text.replaceAll(":", "\\:").replaceAll("{", "\\{").replaceAll("}", "\\}");
