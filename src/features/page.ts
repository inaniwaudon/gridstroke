import { Element } from "xast";
import { x } from "xastscript";
import { toXml } from "xast-util-to-xml";
import { BoxDecoration } from "./decoration";
import {
  createFloatingObject,
  FloatingObject,
  floatingObjectToTwightXml,
} from "./floating-object";
import {
  locusToLine,
  locusToLineIdsByDirection,
  separateLociByPenIndex,
  separateLociByType,
  Locus,
} from "./loci";
import { getObjectWithId, objectsToInfos, ObjectInfo } from "./object";
import { PageState } from "./page-slice";
import {
  createRootRegion,
  getPenIndexToOrderedRegionIds,
  getPenIndexToOrderedRegionIdsPerLocus,
  getRegionInfo,
  regionContainsRegion,
  regionInfoToSvg,
  regionInfoToTwightXml,
  splitPageRegion,
  Region,
  RegionInfo,
} from "./region";
import {
  addTextWrapperToLeaf,
  textsToSvg,
  textsToTwightXml,
  TextInfo,
} from "./text";
import { textAvoidFloatingObjects } from "./text-flow";
import { TextState } from "./text-slice";
import {
  alignLineIds,
  intersectsLineSegments,
  judgeLineDirection,
  Line,
  Size,
} from "@/utils/figure";
import { stylesheetToTwightCss, twightMm, Ruleset } from "@/utils/twight";

export interface Page {
  region: Region;
  floatingObjects: { [key in string]: FloatingObject };
  regionInfos: RegionInfo[];
}

export const determinePage = (
  loci: Locus[],
  boxDecorations: BoxDecoration[],
  pageSize: Size
) => {
  const lociByType = separateLociByType(loci);
  const floatingObjects = createFloatingObject(lociByType.floatingObject);
  const separationLines = locusToLineIdsByDirection(
    lociByType.regionSeparation
  );

  // constraint
  // align at regular intervals
  for (const constraintLocus of lociByType.constraint) {
    const constraintLine = locusToLine(constraintLocus);
    if (!constraintLine) {
      continue;
    }
    const direction = judgeLineDirection(constraintLine);
    const reverseDirection =
      direction === "vertical" ? "horizontal" : "vertical";

    const targetLines = separationLines[reverseDirection].filter((line) =>
      intersectsLineSegments(line.line, constraintLine)
    );
    const leftLines = separationLines[reverseDirection].filter(
      (line) => !intersectsLineSegments(line.line, constraintLine)
    );

    // determine the left and right
    const pageRight = direction === "vertical" ? pageSize[0] : pageSize[0];

    const leftHalfLine: Line = [
      direction === "vertical"
        ? [0, constraintLine[0][1]]
        : [constraintLine[0][0], 0],
      constraintLine[0],
    ];
    const rightHalfLine: Line = [
      constraintLine[1],
      direction === "vertical"
        ? [pageRight, constraintLine[1][1]]
        : [constraintLine[1][0], pageRight],
    ];
    const leftCrossedLines = leftLines.filter((line) =>
      intersectsLineSegments(line.line, leftHalfLine)
    );
    const rightCrossedLines = leftLines.filter((line) =>
      intersectsLineSegments(line.line, rightHalfLine)
    );

    // vertical
    let left = 0;
    let right = pageRight;
    const index = direction === "vertical" ? 0 : 1;
    if (leftCrossedLines.length > 0) {
      left = Math.max(
        ...leftCrossedLines.map(
          (line) => (line.line[0][index] + line.line[1][index]) / 2
        )
      );
    }
    if (rightCrossedLines.length > 0) {
      right = Math.min(
        ...rightCrossedLines.map(
          (line) => (line.line[0][index] + line.line[1][index]) / 2
        )
      );
    }

    const alignedLines = alignLineIds(
      targetLines,
      left,
      right,
      direction === "vertical" ? "horizontal" : "vertical"
    );
    separationLines[reverseDirection] = [...leftLines, ...alignedLines];
  }

  // split page region with all the margins and paddings ignored
  const rootRegion = createRootRegion();
  const regionIdAlignToLociIds = splitPageRegion(
    rootRegion,
    pageSize,
    separationLines
  );
  const noPaddingObjectInfos = objectsToInfos(
    { x: 0, y: 0, width: pageSize[0], height: pageSize[1] },
    rootRegion
  );
  const noPaddingRegionInfos = noPaddingObjectInfos.flatMap((info) =>
    info.type === "region" ? [info] : []
  );
  addTextWrapperToLeaf(rootRegion);

  // decoration
  const regionDecorations: { [key in string]: BoxDecoration } = {};
  {
    const penIndexToLoci = separateLociByPenIndex(lociByType.decoration);
    const penIndexToRegionIdsPerLocus = getPenIndexToOrderedRegionIdsPerLocus(
      noPaddingRegionInfos,
      penIndexToLoci,
      false,
      true
    );

    const penIndexToSmallerRegionIds: { [key in number]: string[] } = {};
    for (const penIndex in penIndexToRegionIdsPerLocus) {
      const newRegionIds: string[] = [];
      const regionIds = penIndexToRegionIdsPerLocus[penIndex];

      // get the smallest region that contains all the points in the locus.
      // It does not contain any other candidate regions.
      for (const idsPerLocus of regionIds) {
        const newRegionIdsPerLocus: string[] = [];
        for (const id of idsPerLocus) {
          const region = getObjectWithId(id, rootRegion);
          if (region?.type !== "region") {
            continue;
          }
          const differentIds = idsPerLocus.filter(
            (comparedId) => id !== comparedId
          );
          const containsAnyOtherRegions =
            differentIds.length > 0
              ? differentIds.some((comparedId) => {
                  const comparedRegion = getObjectWithId(
                    comparedId,
                    rootRegion
                  );
                  if (comparedRegion?.type !== "region") {
                    return false;
                  }
                  return regionContainsRegion(region, comparedRegion);
                })
              : false;
          if (!containsAnyOtherRegions) {
            newRegionIdsPerLocus.push(id);
          }
        }
        newRegionIds.push(...newRegionIdsPerLocus);
      }
      penIndexToSmallerRegionIds[penIndex] = [...new Set(newRegionIds)];
    }

    for (const penIndex in penIndexToSmallerRegionIds) {
      const regionIds = penIndexToSmallerRegionIds[penIndex];
      for (const id of regionIds) {
        const regionInfo = getRegionInfo(id, noPaddingRegionInfos);
        if (regionInfo) {
          regionDecorations[id] = boxDecorations[penIndex];
        }
      }
    }
  }

  // recalculate objectInfos with margins and paddings
  const newObjectInfos = objectsToInfos(
    { x: 0, y: 0, width: pageSize[0], height: pageSize[1] },
    rootRegion,
    regionDecorations
  );
  const regionInfos = newObjectInfos.flatMap((info) =>
    info.type === "region" ? [info] : []
  );
  const tempTextInfos = newObjectInfos.flatMap((info) =>
    info.type === "text" ? [info] : []
  );

  const penIndexToTextLoci = separateLociByPenIndex(lociByType.text);
  const penIndexToOrderedTextRegionIds = getPenIndexToOrderedRegionIds(
    regionInfos,
    penIndexToTextLoci,
    true,
    false
  );

  // avoid floating objects
  // TODO: multiple
  const textInfos: TextInfo[] = [];
  const penIndexToOrderedTextIds: { [key in number]: string[] } = {};

  for (const penIndex in penIndexToOrderedTextRegionIds) {
    penIndexToOrderedTextIds[penIndex] = [];
    for (const regionId of penIndexToOrderedTextRegionIds[penIndex]) {
      const region = getObjectWithId<Region>(regionId, rootRegion);
      if (region && region.children[0]?.type === "text") {
        const textInfo = tempTextInfos.find(
          (info) => info.id === region.children[0].id
        );
        if (textInfo) {
          const avoided = textAvoidFloatingObjects(
            textInfo,
            Object.values(floatingObjects)
          );
          textInfos.push(...avoided);
          penIndexToOrderedTextIds[penIndex].push(
            ...avoided.map((info) => info.id)
          );
        }
      }
    }
  }

  return {
    rootRegion,
    regionInfos,
    textInfos,
    floatingObjects,
    penIndexToOrderedTextIds,
    regionIdAlignToLociIds,
  };
};

// save
export const pageToTwightXml = (
  loci: Locus[],
  pageState: PageState,
  textState: TextState
) => {
  const elements: Element[] = [];
  const stylesheet: Ruleset[] = [];
  const { regionInfos, textInfos, floatingObjects, penIndexToOrderedTextIds } =
    determinePage(loci, pageState.decorations, pageState.size);

  // region
  for (const info of regionInfos) {
    const xml = regionInfoToTwightXml(info);
    elements.push(...xml.elements);
    stylesheet.push(...xml.rulesets);
  }

  // text
  const textXml = textsToTwightXml(
    textState.texts,
    textInfos,
    textState.loci,
    penIndexToOrderedTextIds
  );
  elements.push(...textXml.elements);
  stylesheet.push(...textXml.rulesets);

  // page
  const pageRuleset: Ruleset = {
    selector: "page",
    block: [
      {
        width: twightMm(pageState.size[0]),
        height: twightMm(pageState.size[1]),
      },
    ],
  };
  stylesheet.push(pageRuleset);

  // floating object
  for (const floatingObj of Object.values(floatingObjects)) {
    const { element, ruleset } = floatingObjectToTwightXml(floatingObj);
    elements.push(element);
    stylesheet.push(ruleset);
  }

  // xml
  const page = x("page", elements);
  const head = x("head", [x("style", { src: "./style.css" })]);
  const body = x("body", [page]);
  const tree = x("document", [head, body]);

  // stylesheet
  return { xml: toXml(tree), css: stylesheetToTwightCss(stylesheet) };
};

export const pageToSvg = async (
  loci: Locus[],
  pageState: PageState,
  textState: TextState
) => {
  const elements: Element[] = [];
  const { regionInfos, textInfos, penIndexToOrderedTextIds } = determinePage(
    loci,
    pageState.decorations,
    pageState.size
  );

  // region
  for (const info of regionInfos) {
    elements.push(regionInfoToSvg(info));
  }

  // text
  elements.push(
    ...textsToSvg(
      textState.texts,
      textInfos,
      textState.loci,
      penIndexToOrderedTextIds
    )
  );

  // floating object
  /*for (const floatingObj of Object.values(page.floatingObjects)) {
    /*const element = x("rect", {
      x: floatingObj.rect.x,
      y: floatingObj.rect.y,
      width: floatingObj.rect.width,
      height: floatingObj.rect.height,
      fill: "#999",
    });*/
  /*const img = await loadImage(floatingObj.src);
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(img.width, 1000);
    canvas.height = (img.height / img.width) * canvas.width;
    const context = canvas.getContext("2d");
    if (!context) {
      continue;
    }
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    let base64String = canvas.toDataURL("image/jpeg");
    const element = x("image", {
      x: floatingObj.rect.x,
      y: floatingObj.rect.y,
      width: floatingObj.rect.width,
      height: floatingObj.rect.height,
      href: base64String,
      preserveAspectRatio: "xMidYMid slice",
    });
    objs.push(element);
  }*/

  const svg = x(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: pageState.size[0] + "mm",
      height: pageState.size[1] + "mm",
      viewBox: `0 0 ${pageState.size[0]} ${pageState.size[1]}`,
      preserveAspectRatio: "none",
    },
    [...elements]
  );
  return toXml(svg);
};
