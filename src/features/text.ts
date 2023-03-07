import * as uuid from "uuid";
import { Element } from "xast";
import { x } from "xastscript";
import { Region } from "./region";
import { ElementObject } from "./object";
import {
  getInitialTextColor,
  initialFontSize,
  initialFontWeight,
  initialLetterSpacing,
  initialLineAfter,
  initialLineBefore,
  initialLineHeight,
  initialText,
  initialTextAlign,
} from "@/const/text";
import { createDefaultBorder, Decoration } from "@/features/decoration";
import { penIndexToLoci, separateLociByPenIndex, Locus } from "@/features/loci";
import { getPenIndexToSplitedParagraphs } from "@/features/text-flow";
import { allBounding, Bounding } from "@/utils/figure";
import Rect, { rectContainsPoint } from "@/utils/rect";
import { getPsName, Color } from "@/utils/style";
import { deepCopy } from "@/utils/utils";
import {
  colorToTwightColor,
  createTwightId,
  getTwightThreadSelector,
  twightMm,
  twightTextEscape,
  Ruleset,
} from "@/utils/twight";

export type TextAlign = "left" | "center" | "right";

export type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface RelatedText {
  id: string;
  paragraphs: Paragraph[];
  rect: Rect;
}

export interface Paragraph {
  fontSize: number;
  lineHeight: number;
  lineBefore: number;
  lineAfter: number;
  letterSpacing: number;
  weight: Weight;
  align: TextAlign;
  color: Color;
  content: string;
  charStyles: CharacterStyle[];
}

export type TextWrapper = {
  type: "text";
  isVertical: boolean;
  id: string;
} & Decoration;

export type TextInfo = {
  type: "text";
  rect: Rect;
  id: string;
  isVertical: boolean;
} & Decoration;

interface TextPosition {
  paragraph: number;
  row: number;
}

export interface LayoutGrid {
  align: "horizontal" | "vertical";
  fontSize: number;
  proportion: number;
  lineHeight: number;
  charsPerLine: number;
  lines: number;
  columns: number;
  columnSpace: number;
  padding: Bounding<number>;
}

export interface CharacterStyle {
  ratio?: number;
  kerning?: number;
  shift?: number;
  weight?: Weight;
}

// number key
export type ParagraphNumberKey =
  | "fontSize"
  | "lineHeight"
  | "lineBefore"
  | "lineAfter"
  | "letterSpacing";

export type LayoutGridNumberKey =
  | "fontSize"
  | "proportion"
  | "lineHeight"
  | "charsPerLine"
  | "lines"
  | "columns"
  | "columnSpace";

export type CharacterStyleNumberKey = "ratio" | "kerning" | "shift";

// id
export const createParagraphId = () => "p" + uuid.v4();

export const createTextId = () => "t" + uuid.v4();

export const createdRelatedTextId = () => uuid.v4();

// text wrapper
const createDefaultTextWrapper = (): TextWrapper => ({
  type: "text",
  id: createTextId(),
  isVertical: false,
  border: allBounding(createDefaultBorder()),
});

export const addTextWrapperToLeaf = (region: Region) => {
  const stack: ElementObject[] = [region];
  while (stack.length > 0) {
    const item = stack.pop()!;
    if (item.type !== "region") {
      continue;
    }
    for (const child of item.children) {
      stack.push(child);
    }
    if (item.children.length === 0) {
      item.children = [createDefaultTextWrapper()];
    }
  }
};

// character style
export const getCharacterStyle = (
  index: number,
  key: keyof CharacterStyle,
  charStyles: CharacterStyle[]
) => (index < charStyles.length ? charStyles[index][key] : undefined);

export const changeCharacterStyles = (
  index: number,
  key: keyof CharacterStyle,
  values: any[],
  charStyles: CharacterStyle[]
) => {
  const newCharStyles = [...charStyles];
  for (let i = newCharStyles.length; i < index + values.length; i++) {
    newCharStyles.push({});
  }
  for (let i = 0; i < values.length; i++) {
    newCharStyles[index + i][key] = values[i];
  }
  return newCharStyles;
};

export const getLineBefore = (paragraph: Paragraph) =>
  paragraph.lineBefore - ((paragraph.lineHeight - 1) * paragraph.fontSize) / 2;

export const getLineAfter = (paragraph: Paragraph) =>
  paragraph.lineAfter + ((paragraph.lineHeight - 1) * paragraph.fontSize) / 2;

export const isEmptyCharacterStyle = (charStyle: CharacterStyle) =>
  charStyle.ratio === undefined &&
  charStyle.kerning === undefined &&
  charStyle.shift === undefined &&
  charStyle.weight === undefined;

// focus
export interface TextSelection {
  id: string;
  from: TextPosition;
  to: TextPosition;
}

export const isCollapsedSelection = (selection: TextSelection) =>
  selection.from.paragraph === selection.to.paragraph &&
  selection.from.row === selection.to.row;

// related text
export const getPenIndexToOrderedRelatedTextIds = (
  relatedTexts: RelatedText[],
  penIndexToLoci: penIndexToLoci
) => {
  const map: { [key in number]: string[] } = {};
  for (const index in penIndexToLoci) {
    const ids: string[] = [];
    for (const locus of penIndexToLoci[index]) {
      for (const point of locus.points) {
        const relatedText = relatedTexts.find((text) =>
          rectContainsPoint(text.rect, point)
        );
        if (relatedText && !ids.includes(relatedText.id)) {
          ids.push(relatedText.id);
        }
      }
    }
    map[index] = ids;
  }
  return map;
};

export const getPenIndexFromTextIds = (
  id: string,
  penIndexToOrderedTextIds: { [key in number]: string[] }
) => {
  let penIndex: number | undefined = undefined;
  for (const index in penIndexToOrderedTextIds) {
    if (penIndexToOrderedTextIds[index].includes(id)) {
      penIndex = parseInt(index);
    }
  }
  return penIndex;
};

const fontScale = 3.0;
export const relatedTextMmToPx = (fontSize: number) => fontSize * fontScale;

// paragraph
export const createDefaultParagraph = (): Paragraph => ({
  fontSize: initialFontSize,
  lineHeight: initialLineHeight,
  lineBefore: initialLineBefore,
  lineAfter: initialLineAfter,
  letterSpacing: initialLetterSpacing,
  weight: initialFontWeight,
  align: initialTextAlign,
  color: getInitialTextColor(),
  content: initialText,
  charStyles: [],
});

export const sliceParagraph = (
  paragraph: Paragraph,
  start?: number,
  end?: number
) => {
  const newParagraph = deepCopy(paragraph);
  newParagraph.content = paragraph.content.slice(start, end);
  newParagraph.charStyles = paragraph.charStyles.slice(start, end);
  return newParagraph;
};

export const getSelectedFromParagraph = (
  texts: { [key in string]: RelatedText },
  selection: TextSelection
) => {
  const text = texts[selection.id];
  if (!text) {
    return { text: undefined, paragraph: undefined };
  }
  return { text, paragraph: text.paragraphs[selection.from.paragraph] };
};

export const textsToTwightXml = (
  relatedTexts: { [key in string]: RelatedText },
  textInfos: TextInfo[],
  textLoci: Locus[],
  penIndexToOrderedTextIds: { [key in string]: string[] }
) => {
  const penIndexToLoci = separateLociByPenIndex(
    textLoci.filter((locus) => locus.type.type === "text")
  );
  const penIndexToOrderedRelatedTextIds = getPenIndexToOrderedRelatedTextIds(
    Object.values(relatedTexts),
    penIndexToLoci
  );
  const penIndexToSplitedParagraphs = getPenIndexToSplitedParagraphs(
    relatedTexts,
    textInfos,
    penIndexToOrderedTextIds,
    penIndexToOrderedRelatedTextIds
  );
  const elements: Element[] = [];
  const rulesets: Ruleset[] = [];

  for (const info of textInfos) {
    const penIndex = getPenIndexFromTextIds(info.id, penIndexToOrderedTextIds);
    if (penIndex === undefined) {
      continue;
    }
    const paragraphIndex = penIndexToOrderedTextIds[penIndex].indexOf(info.id);
    const paragraphs = penIndexToSplitedParagraphs[penIndex][paragraphIndex];
    const threadId = createTwightId();

    // paragraphs
    const lines: string[] = [];
    let charCommandIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const paragraphCommandName = "p" + i;

      const paragraphRuleset: Ruleset = {
        selector: `${getTwightThreadSelector(
          threadId
        )}@${paragraphCommandName}`,
        block: [
          {
            "font-size": twightMm(paragraph.fontSize),
            "line-height": twightMm(paragraph.fontSize * paragraph.lineHeight),
            "font-name": getPsName(paragraph.weight),
            "letter-spacing": twightMm(
              paragraph.fontSize * paragraph.letterSpacing
            ),
            "vertical-align": "baseline",
            "twipo.align": paragraph.align,
            "line-before": twightMm(paragraph.lineBefore),
            "line-after": twightMm(paragraph.lineAfter),
          },
          {
            fill: colorToTwightColor(paragraph.color),
          },
        ],
      };
      rulesets.push(paragraphRuleset);

      const enabledCharStyles: { [key in number]: CharacterStyle } = {};
      for (let i = 0; i < paragraph.charStyles.length; i++) {
        const charStyle = paragraph.charStyles[i];
        if (!isEmptyCharacterStyle(charStyle)) {
          enabledCharStyles[i] = charStyle;
        }
      }

      const chars: string[] = [];
      for (let i = 0; i < paragraph.content.length; i++) {
        const escaped =
          paragraph.content[i] === "\n"
            ? "{br}"
            : twightTextEscape(paragraph.content[i]);

        if (i in enabledCharStyles) {
          const charStyle = enabledCharStyles[i];
          const charCommandName = "c" + charCommandIndex;
          chars.push(`{${charCommandName}:${escaped}:${charCommandName}}`);

          const charRuleset: Ruleset = {
            selector: `${getTwightThreadSelector(threadId)}@${charCommandName}`,
            block: [{}],
          };
          if (charStyle.ratio !== undefined) {
            charRuleset.block[0]["text-condensed"] = charStyle.ratio;
            charRuleset.block[0]["text-extended"] = charStyle.ratio;
          }
          const actualSize =
            paragraph.fontSize * ((charStyle.ratio ?? 100) / 100);
          if (charStyle.kerning !== undefined) {
            charRuleset.block[0]["kern-left"] = charStyle.kerning;
          }
          if (charStyle.shift !== undefined) {
            charRuleset.block[0]["text-shift"] = twightMm(
              actualSize * (charStyle.shift / 100)
            );
          }
          if (charStyle.weight !== undefined) {
            charRuleset.block[0]["font-name"] = getPsName(charStyle.weight);
          }
          rulesets.push(charRuleset);
          charCommandIndex++;
        } else {
          chars.push(escaped);
        }
      }
      lines.push(
        `{${paragraphCommandName}:${chars.join("")}:${paragraphCommandName}}`
      );
    }

    const content = lines.join("{br}\n");
    const text = x(
      "text",
      {
        thread: threadId,
      },
      content
    );
    elements.push(text);

    const elementRuleset: Ruleset = {
      selector: getTwightThreadSelector(threadId),
      block: [
        {
          x: twightMm(info.rect.x),
          y: twightMm(info.rect.y),
          width: twightMm(info.rect.width),
          height: twightMm(info.rect.height),
          "font-size": twightMm(4),
          "line-height": twightMm(4),
          "font-name": "A-OTF リュウミン Pr6N R-KL",
          "writing-mode": "horizontal",
          "twipo.lang": "ja",
        },
      ],
    };
    rulesets.push(elementRuleset);
  }
  return { elements, rulesets };
};

export const textsToSvg = (
  relatedTexts: { [key in string]: RelatedText },
  textInfos: TextInfo[],
  textLoci: Locus[],
  penIndexToOrderedTextIds: { [key in string]: string[] }
) => {
  const penIndexToLoci = separateLociByPenIndex(
    textLoci.filter((locus) => locus.type.type === "text")
  );
  const penIndexToOrderedRelatedTextIds = getPenIndexToOrderedRelatedTextIds(
    Object.values(relatedTexts),
    penIndexToLoci
  );
  const penIndexToSplitedParagraphs = getPenIndexToSplitedParagraphs(
    relatedTexts,
    textInfos,
    penIndexToOrderedTextIds,
    penIndexToOrderedRelatedTextIds
  );
  const texts: Element[] = [];

  for (const info of textInfos) {
    const penIndex = getPenIndexFromTextIds(info.id, penIndexToOrderedTextIds);
    if (penIndex === undefined) {
      continue;
    }
    const index = penIndexToOrderedTextIds[penIndex].indexOf(info.id);
    const paragraphs = penIndexToSplitedParagraphs[penIndex][index];

    // paragraphs
    const children: any[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      children.push(paragraphs[i].content);
      if (i < paragraphs.length - 1) {
        children.push(x("tbreak"));
      }
    }

    // TODO:
    const text = x(
      "textArea",
      {
        x: info.rect.x,
        y: info.rect.y,
        width: info.rect.width,
        height: info.rect.height,
      },
      children
    );
    texts.push(text);
  }
  return texts;
};
