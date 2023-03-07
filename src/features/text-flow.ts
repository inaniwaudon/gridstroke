import { FloatingObject } from "./floating-object";
import {
  createTextId,
  sliceParagraph,
  CharacterStyle,
  Paragraph,
  RelatedText,
  TextInfo,
} from "./text";
import { getRectBottom, getRectRight, overlapsRect } from "@/utils/rect";

const measuringElement = document.createElement("div");

const createCharItem = (content: string, charStyle?: CharacterStyle) => {
  if (content === "\n") {
    return document.createElement("br");
  }
  const span = document.createElement("span");
  span.textContent = content;
  span.style.fontSize = (charStyle?.ratio ?? 100) / 100 + "em";
  span.style.fontWeight = charStyle?.weight
    ? charStyle.weight.toString()
    : "inherit";
  span.style.marginLeft = (charStyle?.kerning ?? 0) / 1000 + "em";
  span.style.display = "inline-block";
  return span;
};

export const calculateParagraphHeight = (
  paragraph: Paragraph,
  width: number,
  isVertical: boolean,
  toFontSize: (value: number) => number
) => {
  const scale = 10;

  // initialize the element for the test
  if (!document.body.contains(measuringElement)) {
    document.body.appendChild(measuringElement);
  }
  measuringElement.innerHTML = "";
  measuringElement.style.display = "inline-block";
  measuringElement.style.height = isVertical ? `${width * scale}px` : "initial";
  measuringElement.style.width = isVertical ? "initial" : `${width * scale}px`;
  measuringElement.style.fontSize = `${
    toFontSize(paragraph.fontSize) * scale
  }px`;
  measuringElement.style.fontFamily = "ShinGo";
  measuringElement.style.lineHeight = `${paragraph.lineHeight}em`;
  measuringElement.style.writingMode = `${
    isVertical ? "vertical-rl" : "lr-tb"
  }`;
  measuringElement.style.overflowWrap = "break-word";
  measuringElement.style.whiteSpace = "pre-wrap";
  measuringElement.style.visibility = "hidden";

  for (let i = 0; i < paragraph.content.length; i++) {
    measuringElement.appendChild(
      createCharItem(paragraph.content[i], paragraph.charStyles[i])
    );
  }
  const rect = measuringElement.getBoundingClientRect();
  return (isVertical ? rect.width : rect.height) / scale;
};

const searchFlowableRight = (
  paragraph: Paragraph,
  width: number,
  leftHeight: number,
  isVertical: boolean
) => {
  // biary search
  let [left, right] = [0, paragraph.content.length];
  let measuredHeight = 0;
  while (right - left > 0) {
    const mid = Math.ceil((left + right) / 2);
    measuredHeight = calculateParagraphHeight(
      sliceParagraph(paragraph, 0, mid),
      width,
      isVertical,
      (value: number) => value
    );
    if (measuredHeight > leftHeight) {
      right = mid - 1;
    } else {
      left = mid;
    }
  }
  return [right, measuredHeight];
};

const flowText = (
  paragraphs: Paragraph[],
  infos: TextInfo[]
): Paragraph[][] => {
  const processedParagraphs: Paragraph[] = [
    ...paragraphs.map((paragraph) => ({ ...paragraph })),
  ];
  const resultParagraphs: Paragraph[][] = [];

  infos.forEach((info, index) => {
    resultParagraphs.push([]);
    let leftHeight = info.isVertical ? info.rect.width : info.rect.height;

    while (processedParagraphs.length > 0) {
      const paragraph = processedParagraphs[0];
      const [right, measuredHeight] = searchFlowableRight(
        paragraph,
        info.isVertical ? info.rect.height : info.rect.width,
        leftHeight,
        info.isVertical
      );
      // The text box is full with the paragraph
      if (right < paragraph.content.length) {
        resultParagraphs[index].push(sliceParagraph(paragraph, 0, right));
        processedParagraphs[0] = sliceParagraph(processedParagraphs[0], right);
        break;
      }
      // There is room for the text box to flow the subsequent paragraph
      else {
        resultParagraphs[index].push({ ...paragraph });
        processedParagraphs.shift();
        leftHeight -= measuredHeight;
      }
    }
  });

  return resultParagraphs;
};

export const textAvoidFloatingObjects = (
  info: TextInfo,
  floatingObjects: FloatingObject[]
): TextInfo[] => {
  const overlapped = floatingObjects
    .filter((obj) => overlapsRect(info.rect, obj.rect))
    .sort((a, b) =>
      info.isVertical ? a.rect.x - b.rect.x : a.rect.y - b.rect.y
    );
  const infos: TextInfo[] = [info];

  // FloatingObjects aligned horizontally with respect to the writing direction cannot be processed.
  for (const floatingObject of overlapped) {
    const popedInfo = infos.pop()!;

    // horizontal
    if (info.isVertical) {
      // before
      if (getRectRight(floatingObject.rect) < getRectRight(info.rect)) {
        const rect = { ...info.rect };
        rect.x = getRectRight(floatingObject.rect);
        rect.width =
          getRectRight(info.rect) - getRectRight(floatingObject.rect);
        infos.push({ ...info, rect: rect, id: createTextId() });
      }

      // floating
      // split horizontally before spliting vertically
      const floatingRect = { ...info.rect };
      let right = Math.min(
        getRectRight(info.rect),
        getRectRight(floatingObject.rect)
      );
      let left = Math.max(info.rect.x, floatingObject.rect.x);
      floatingRect.x = left;
      floatingRect.width = right - left;
      if (info.rect.y < floatingObject.rect.y) {
        const rect = { ...floatingRect };
        rect.height = floatingObject.rect.y - info.rect.y;
        infos.push({ ...info, rect: rect, id: createTextId() });
      }
      if (getRectBottom(floatingObject.rect) < getRectBottom(info.rect)) {
        const rect = { ...floatingRect };
        rect.y = getRectBottom(floatingObject.rect);
        rect.height =
          getRectBottom(info.rect) - getRectBottom(floatingObject.rect);
        infos.push({ ...info, rect: rect, id: createTextId() });
      }

      // after
      if (info.rect.x < floatingObject.rect.x) {
        const rect = { ...info.rect };
        rect.width = floatingObject.rect.x - info.rect.x;
        infos.push({ ...info, rect: rect, id: createTextId() });
      }
    }
    // vertical
    else {
      // before
      if (popedInfo.rect.y < floatingObject.rect.y) {
        const rect = { ...popedInfo.rect };
        rect.height = floatingObject.rect.y - popedInfo.rect.y;
        infos.push({ ...popedInfo, rect: rect, id: createTextId() });
      }

      // floating
      // split vertically before spliting horizontally
      const floatingRect = { ...popedInfo.rect };
      let top = Math.max(popedInfo.rect.y, floatingObject.rect.y);
      let bottom = Math.min(
        getRectBottom(popedInfo.rect),
        getRectBottom(floatingObject.rect)
      );
      floatingRect.y = top;
      floatingRect.height = bottom - top;
      if (popedInfo.rect.x < floatingObject.rect.x) {
        const rect = { ...floatingRect };
        rect.width = floatingObject.rect.x - popedInfo.rect.x;
        infos.push({ ...info, rect: rect, id: createTextId() });
      }
      if (getRectRight(floatingObject.rect) < getRectRight(popedInfo.rect)) {
        const rect = { ...floatingRect };
        rect.x = getRectRight(floatingObject.rect);
        rect.width =
          getRectRight(popedInfo.rect) - getRectRight(floatingObject.rect);
        infos.push({ ...info, rect: rect, id: createTextId() });
      }

      // after
      if (getRectBottom(floatingObject.rect) < getRectBottom(popedInfo.rect)) {
        const rect = { ...popedInfo.rect };
        rect.y = getRectBottom(floatingObject.rect);
        rect.height =
          getRectBottom(popedInfo.rect) - getRectBottom(floatingObject.rect);
        infos.push({ ...info, rect: rect, id: createTextId() });
      }
    }
  }
  return infos;
};

export const getPenIndexToSplitedParagraphs = (
  relatedTexts: { [key in string]: RelatedText },
  textInfos: TextInfo[],
  penIndexToOrderedTextIds: {
    [key in number]: string[];
  },
  penIndexToOrderedRelatedTextIds: { [key in number]: string[] }
) => {
  const map: { [key in number]: Paragraph[][] } = {};
  for (const penIndex in penIndexToOrderedTextIds) {
    // paragraph
    const relatedTextIds = penIndexToOrderedRelatedTextIds[penIndex] ?? [];
    const paragraphs = relatedTextIds.flatMap(
      (id) => relatedTexts[id].paragraphs
    );

    // text info
    const textIds = penIndexToOrderedTextIds[penIndex] ?? [];
    const sortedTextInfos = textInfos
      .filter((info) => textIds.includes(info.id))
      .sort((a, b) => textIds.indexOf(a.id) - textIds.indexOf(b.id));

    map[penIndex] = flowText(paragraphs, sortedTextInfos);
  }
  return map;
};
