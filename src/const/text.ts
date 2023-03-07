import { cmyk } from "@/utils/style";

export const initialText = "テキストを入力";

// font size
export const initialFontSize = 3;
export const minFontSize = 2;
export const maxFontSize = 30;

// line height
export const initialLineHeight = 1.5;
export const minLineHeight = 0.8;
export const maxLineHeight = 4;

export const initialLineAfter = 0;
export const initialLineBefore = 0;
export const initialLetterSpacing = 0;
export const initialFontWeight = 300;
export const initialTextAlign = "left";
export const getInitialTextColor = () => cmyk(0, 0, 0, 100);
