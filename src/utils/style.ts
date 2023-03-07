import { psNames } from "@/const/style";

export type Cursor =
  | "auto"
  | "default"
  | "n-resize"
  | "e-resize"
  | "s-resize"
  | "w-resize"
  | "ne-resize"
  | "nw-resize"
  | "se-resize"
  | "sw-resize"
  | "ew-resize"
  | "ns-resize"
  | "nesw-resize"
  | "nwse-resize";

export interface Cmyk {
  colorSpace: "cmyk";
  cmyk: [number, number, number, number];
}

export interface Rgb {
  colorSpace: "rgb";
  rgb: [number, number, number];
}

interface Hsl {
  colorSpace: "hsl";
  hsl: [number, number, number];
}

export type Color = Cmyk | Rgb | Hsl;

export const cmyk = (c: number, m: number, y: number, k: number): Cmyk => ({
  colorSpace: "cmyk",
  cmyk: [c, m, y, k],
});

export const rgb = (r: number, g: number, b: number): Rgb => ({
  colorSpace: "rgb",
  rgb: [r, g, b],
});

export const cmykToRgb = (cmyk: Cmyk): Rgb => {
  const [c, m, y, k] = cmyk.cmyk;
  const c0 = (255 * c) / 100;
  const m0 = (255 * m) / 100;
  const y0 = (255 * y) / 100;
  const k0 = (255 * k) / 100;
  return {
    colorSpace: "rgb",
    rgb: [
      Math.round(((255 - c0) * (255 - k0)) / 255),
      Math.round(((255 - m0) * (255 - k0)) / 255),
      Math.round(((255 - y0) * (255 - k0)) / 255),
    ],
  };
};

export const rgbToCmyk = (rgb: Rgb): Cmyk => {
  const [r, g, b] = rgb.rgb;
  const k = 1.0 - Math.max(r / 255, g / 255, b / 255);
  const c = (1.0 - r - k) / (1.0 - k);
  const m = (1.0 - g - k) / (1.0 - k);
  const y = (1.0 - b - k) / (1.0 - k);
  return {
    colorSpace: "cmyk",
    cmyk: [c * 100, m * 100, y * 100, k * 100],
  };
};

export const hslToRgb = (hsl: Hsl): Rgb => {
  const [h, s, l] = hsl.hsl;
  const h0 = (h + 360) % 360;
  let r = 0;
  let g = 0;
  let b = 0;
  let max, min;
  if (l <= 49) {
    max = 2.55 * (l + l * (s / 100));
    min = 2.55 * (l - l * (s / 100));
  } else {
    max = 2.55 * (l + (100 - l) * (s / 100));
    min = 2.55 * (l - (100 - l) * (s / 100));
  }

  if (h0 < 60) {
    r = max;
    g = min + (max - min) * (h0 / 60);
    b = min;
  } else if (h0 >= 60 && h0 < 120) {
    r = min + (max - min) * ((120 - h0) / 60);
    g = max;
    b = min;
  } else if (h0 >= 120 && h0 < 180) {
    r = min;
    g = max;
    b = min + (max - min) * ((h0 - 120) / 60);
  } else if (h0 >= 180 && h0 < 240) {
    r = min;
    g = min + (max - min) * ((240 - h0) / 60);
    b = max;
  } else if (h0 >= 240 && h0 < 300) {
    r = min + (max - min) * ((h0 - 240) / 60);
    g = min;
    b = max;
  } else if (h0 >= 300 && h0 < 360) {
    r = max;
    g = min;
    b = min + (max - min) * ((360 - h0) / 60);
  }
  return {
    colorSpace: "rgb",
    rgb: [Math.round(r), Math.round(g), Math.round(b)],
  };
};

export const colorToRgb = (color: Color): Rgb => {
  return color.colorSpace === "cmyk"
    ? cmykToRgb(color)
    : color.colorSpace === "hsl"
    ? hslToRgb(color)
    : color;
};

export const getColorValues = (color: Color) => {
  switch (color.colorSpace) {
    case "cmyk":
      return color.cmyk;
    case "rgb":
      return color.rgb;
    case "hsl":
      return color.hsl;
  }
};

export const colorToString = (color: Color) => {
  const values = getColorValues(color);
  return `${color.colorSpace.toUpperCase()}(${values.join(", ")})`;
};

export const colorToCss = (color?: Color) =>
  color ? `rgb(${colorToRgb(color).rgb.join(", ")})` : "transparent";

export const truncateColor = (color: Color) => {
  const values = getColorValues(color);
  if (["cmyk", "rgb"].includes(color.colorSpace)) {
    for (let i = 0; i < values.length; i++) {
      values[i] = Math.round(values[i]);
    }
  }
};

export const generateFontFaces = () => {
  const fontFamily = "ShinGo";
  return Object.entries(psNames)
    .map(
      ([weight, psName]) =>
        `@font-face {
  font-family: ${fontFamily};
  font-weight: ${weight};
  src: local("${psName}");
}`
    )
    .join("\n\n");
};

export const getPsName = (weight: number) => {
  const definedWeights = Object.keys(psNames).map((key) => parseInt(key));
  let minDiff = 1000;
  let minWeight: keyof typeof psNames = 100;

  for (const inWeight of definedWeights) {
    const diff = Math.abs(inWeight - weight);
    if (diff <= minDiff) {
      minDiff = diff;
      minWeight = inWeight as keyof typeof psNames;
    }
  }
  console.log(weight, minWeight);
  return psNames[minWeight];
};
