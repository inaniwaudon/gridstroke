import React, { createContext, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import * as uuid from "uuid";

import ConstraintCollection from "./ConstraintCollection";
import DecorationWrapper from "./DecorationWrapper";
import FloatingObjectsWrapper from "./FloatingObjectsWrapper";
import RegionComponent from "./Region";
import TextWrapper from "./TextWrapper";
import LociSvg from "../LociSvg";

import { getCurrentLoci, Locus } from "@/features/loci";
import {
  addPointToLocus,
  branchLocus,
  pushLoci,
  removeLoci,
  updateLocus,
} from "@/features/loci-slice";
import { getObjectWithId } from "@/features/object";
import { Page } from "@/features/page";
import {
  getRegionBorderInfo,
  getRegionInfo,
  getRegionParent,
  getRegionSurfaceInfo,
  Region,
  RegionIdAlignToLociIds,
  RegionInfo,
  RegionPart,
} from "@/features/region";
import { RootState } from "@/features/store";
import { TextInfo } from "@/features/text";
import { getToolTypes, IndexedPenType } from "@/features/tool-type";
import { rectContainsPoint } from "@/utils/rect";
import {
  getClientPoint,
  getDistanceLineAndPoint,
  getPoint,
  judgeLineDirection,
  pxToMmPoint,
  scalePoint,
  Direction,
  Line,
  Point,
} from "@/utils/figure";
import { DisplayedElements, ScalePosition } from "@/utils/utils";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const RegionWrapper = styled.div<{ displays: boolean }>`
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  display: ${(props) => (props.displays ? "block" : "none")};
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
`;

const FloatingObject = styled.div<{ position: [number, number] }>`
  position: absolute;
  left: ${(props) => `${props.position[0]}px`};
  top: ${(props) => `${props.position[1]}px`};
`;

export const MmToPxContext = createContext<(mm: number) => number>(() => 0);

export interface MouseRegionInfo {
  id: string;
  part: RegionPart;
  direction?: Direction;
}

interface PageProps {
  page: Page;
  regionInfos: RegionInfo[];
  textInfos: TextInfo[];
  penIndexToOrderedTextIds: { [key in string]: string[] };
  penIndexToOrderedRelatedTextIds: { [key in number]: string[] };
  selectedFloatingObjectKey: string | undefined;
  showsLoci: boolean;
  toolIndex: number;
  toolSubIndices: { [key in IndexedPenType]: number };
  regionIdAlignToLociIds: RegionIdAlignToLociIds;
  scalePosition: ScalePosition;
  displayedElements: DisplayedElements;
  mmToPx: (mm: number) => number;
  pxToMm: (px: number) => number;
  setSelectedFloatingObjectKey: React.Dispatch<string | undefined>;
  setScalePosition: (value: ScalePosition) => void;
}

const PageCanvas = ({
  page,
  regionInfos,
  textInfos,
  penIndexToOrderedTextIds,
  penIndexToOrderedRelatedTextIds,
  selectedFloatingObjectKey,
  showsLoci,
  toolIndex,
  toolSubIndices,
  regionIdAlignToLociIds,
  scalePosition,
  displayedElements,
  mmToPx,
  pxToMm,
  setSelectedFloatingObjectKey,
  setScalePosition,
}: PageProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const pageSize = useSelector((state: RootState) => state.page.size);
  const inPxToMmPoint = pxToMmPoint(pxToMm);

  // tool
  const selectedToolType = getToolTypes(toolSubIndices)[toolIndex];

  // view
  const [downScalePosition, setDownScalePosition] = useState<ScalePosition>();

  // loci
  const allLoci = useSelector((state: RootState) => getCurrentLoci(state.loci));
  const [mouseOveredLociIndex, setMouseOveredLociIndex] = useState<number>();
  const [selectedLociIndices, setSelectedLociIndices] = useState<number[]>([]);
  const [originalLoci, setOriginalLoci] = useState<Locus[]>([]);
  const [downedLociIndex, setDownedLociIndex] = useState<number>();

  // selected or pointer
  const [pointerDownRegionRatio, setPointerDownRegionRatio] =
    useState<[number, number]>();
  const [pointerDownRegionGap, setPointerDownRegionGap] = useState<number>();

  const [mouseOveredRegionInfo, setMouseOveredRegionInfo] =
    useState<MouseRegionInfo>();
  const [draggedRegionInfo, setDraggedRegionInfo] = useState<MouseRegionInfo>();

  // mouse event
  const [downPoint, setDownPoint] = useState<Point>();
  const [downClientPoint, setDownClientPoint] = useState<Point>();
  const [mousePoint, setMousePoint] = useState<Point>();
  const [downPointForFloatingObject, setDownPointForFloatingObject] =
    useState<Point>();

  const floatingObjectsContainsPoint = (point: Point) =>
    Object.values(page.floatingObjects).every(
      (object) => !rectContainsPoint(object.rect, inPxToMmPoint(point))
    );

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const eventMousePoint = scalePoint(
      getPoint(e, wrapperRef.current!),
      1.0 / scalePosition.scale
    );
    setMousePoint(eventMousePoint);
    setDownClientPoint(getClientPoint(e));
    setDownPoint(eventMousePoint);

    // pie menu
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // move the view
    if (e.shiftKey) {
      setDownScalePosition(scalePosition);
      return;
    }

    // loci
    if (showsLoci) {
      if (selectedToolType.type === "pen") {
        setDownedLociIndex(allLoci.length);
        dispatch(
          pushLoci([
            {
              type: selectedToolType.pen,
              id: uuid.v4(),
              points: [inPxToMmPoint(eventMousePoint)],
            },
          ])
        );
      }
      if (
        selectedToolType.type === "eraser" &&
        mouseOveredLociIndex !== undefined
      ) {
        dispatch(removeLoci(mouseOveredLociIndex));
      }
      if (
        selectedToolType.type === "move" &&
        mouseOveredLociIndex !== undefined
      ) {
        const indices = e.shiftKey
          ? [...selectedLociIndices, mouseOveredLociIndex]
          : [mouseOveredLociIndex];
        setSelectedLociIndices(indices);
        setOriginalLoci(indices.map((index) => allLoci[index]));
        dispatch(branchLocus());
      }
      return;
    }

    if (!downPointForFloatingObject) {
      const surfaceInfo = getRegionSurfaceInfo(
        [inPxToMmPoint(eventMousePoint)],
        regionInfos
      );
      const strokeInfo = getRegionBorderInfo(
        inPxToMmPoint(eventMousePoint),
        page.region,
        regionInfos
      );

      // stroke
      if (strokeInfo) {
        const region = getObjectWithId<Region>(strokeInfo[0].id, page.region)!;
        const parent = getRegionParent(region, page.region);
        if (parent) {
          const nextIndex =
            parent.children.indexOf(region) +
            (["top", "left"].includes(strokeInfo[1]) ? -1 : 1);
          const nextRegion = parent.children[nextIndex];
          if (nextRegion && nextRegion.type === "region") {
            setPointerDownRegionRatio([region.ratio, nextRegion.ratio]);
          }
        }
      }

      setDraggedRegionInfo(
        strokeInfo
          ? { id: strokeInfo[0].id, part: "stroke", direction: strokeInfo[1] }
          : surfaceInfo
          ? { id: surfaceInfo.id, part: "surface" }
          : undefined
      );
    }
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const eventMousePoint = scalePoint(
      getPoint(e, wrapperRef.current!),
      1.0 / scalePosition.scale
    );
    const clientPoint = getClientPoint(e);
    setMousePoint(eventMousePoint);

    // pie menu
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // move the view
    if (e.shiftKey) {
      if (downScalePosition && downClientPoint) {
        setScalePosition({
          scale: scalePosition.scale,
          position: [
            downScalePosition.position[0] +
              (clientPoint[0] - downClientPoint[0]),
            downScalePosition.position[1] +
              (clientPoint[1] - downClientPoint[1]),
          ],
        });
      }
      return;
    }

    // loci
    const errorRange = 2;
    if (showsLoci) {
      // mouse over
      if (!downPoint) {
        let minLocusIndex: number | undefined = undefined;

        for (let locusi = 0; locusi < allLoci.length; locusi++) {
          const locus = allLoci[locusi];
          for (let pointi = 0; pointi < locus.points.length - 1; pointi++) {
            const mmMousePoint = inPxToMmPoint(eventMousePoint);
            const line: Line = [locus.points[pointi], locus.points[pointi + 1]];
            const error = getDistanceLineAndPoint(line, mmMousePoint);

            // vertical line
            const directionIndex =
              judgeLineDirection(line) === "horizontal" ? 1 : 0;
            const left =
              Math.min(line[0][directionIndex], line[1][directionIndex]) -
              errorRange;
            const right =
              Math.max(line[0][directionIndex], line[1][directionIndex]) +
              errorRange;
            const withinBox =
              left <= mmMousePoint[directionIndex] &&
              mmMousePoint[directionIndex] <= right;

            if (error < errorRange && withinBox) {
              minLocusIndex = locusi;
              break;
            }
          }
        }
        setMouseOveredLociIndex(minLocusIndex);
      } else {
        // draw
        if (selectedToolType.type === "pen" && downedLociIndex !== undefined) {
          dispatch(
            addPointToLocus({
              index: downedLociIndex,
              points: [inPxToMmPoint(eventMousePoint)],
            })
          );
        }
        // move
        if (
          selectedToolType.type === "move" &&
          selectedLociIndices.length === originalLoci.length
        ) {
          for (let i = 0; i < selectedLociIndices.length; i++) {
            const locus = allLoci[selectedLociIndices[i]];
            dispatch(
              updateLocus({
                index: selectedLociIndices[i],
                locus: {
                  ...locus,
                  points: originalLoci[i].points.map((point) => [
                    point[0] + pxToMm(eventMousePoint[0] - downPoint[0]),
                    point[1] + pxToMm(eventMousePoint[1] - downPoint[1]),
                  ]),
                },
              })
            );
          }
        }
      }
      return;
    }

    // mouse over
    if (!regionInfos) {
      return;
    }
    const surfaceInfo = getRegionSurfaceInfo(
      [inPxToMmPoint(eventMousePoint)],
      regionInfos
    );
    const strokeInfo = getRegionBorderInfo(
      inPxToMmPoint(eventMousePoint),
      page.region,
      regionInfos
    );
    setMouseOveredRegionInfo(
      strokeInfo
        ? { id: strokeInfo[0].id, part: "stroke", direction: strokeInfo[1] }
        : surfaceInfo
        ? { id: surfaceInfo.id, part: "surface" }
        : undefined
    );

    if (!downPoint || downPointForFloatingObject) {
      return;
    }

    /*if (draggedRegionInfo) {
      const region = getObjectWithId<Region>(draggedRegionInfo.id, page.region);
      if (region) {
        if (
          draggedRegionInfo.part === "surface" &&
          floatingObjectsContainsPoint(eventMousePoint)
        ) {
          dispatch(addPointToLastLocus([eventMousePoint]));
        }
        // surface
        if (draggedRegionInfo.part === "surface" && pointerDownRegionGap) {
          const index = region.splitDirection === "horizontal" ? 0 : 1;
          region.gap =
            pointerDownRegionGap +
            pxToMm(eventMousePoint[index] - downPoint[index]);
        }
        // stroke
        else {
          const parent = getRegionParent(region, page.region);
          if (!parent) {
            return;
          }
          // change the gap
          /*if (e.ctrlKey || e.metaKey) {
            parent.gap = getLineDistance([eventMousePoint, downPoint]);
          }
          // change the ratio
          else {
            const index = parent.children.indexOf(region);
            const isTop = draggedRegionInfo.direction === "top";
            const isRight = draggedRegionInfo.direction === "right";
            const isBottom = draggedRegionInfo.direction === "bottom";
            const isLeft = draggedRegionInfo.direction === "left";
            const isVertical = isTop || isBottom;
            const starts = isTop || isLeft;

            if (
              ((parent.splitDirection === "vertical" && isVertical) ||
                (parent.splitDirection === "horizontal" &&
                  (isLeft || isRight))) &&
              ((starts && 0 < index) ||
                (!starts && index < parent.children.length - 1))
            ) {
              const nextObject = parent.children[index + (starts ? -1 : 1)];
              if (nextObject.type === "region" && pointerDownRegionRatio) {
                const parentInfo = regionInfos.find(
                  (info) => info.id === parent.id
                )!;
                const parentRectExceptPadding = parentInfo.rect;
                const delta =
                  ((eventMousePoint[isVertical ? 1 : 0] -
                    downPoint[isVertical ? 1 : 0]) /
                    mmToPx(
                      parent.splitDirection === "horizontal"
                        ? parentRectExceptPadding.width
                        : parentRectExceptPadding.height
                    )) *
                  (starts ? -1 : 1);
                const currentRatio = Math.max(
                  Math.min(pointerDownRegionRatio[0] + delta, 1),
                  0
                );
                const nextRatio = Math.max(
                  Math.min(pointerDownRegionRatio[1] - delta, 1),
                  0
                );
                if (
                  region.id in regionIdAlignToLociIds &&
                  nextObject.id in regionIdAlignToLociIds
                ) {
                  const locusId = isTop
                    ? regionIdAlignToLociIds[region.id].top
                    : isRight
                    ? regionIdAlignToLociIds[region.id].right
                    : isBottom
                    ? regionIdAlignToLociIds[region.id].bottom
                    : regionIdAlignToLociIds[region.id].left;
                  const locusIndex = allLoci.findIndex(
                    (loci) => loci.id === locusId
                  );
                  if (locusIndex !== undefined) {
                    dispatch(
                      updateLocus({
                        index: locusIndex,
                        locus: {
                          ...allLoci[locusIndex],
                          points: allLoci[locusIndex].points.map((point) => [
                            point[0] + eventMousePoint[0] - downPoint[0],
                            point[1] + eventMousePoint[1] - downPoint[1],
                          ]),
                        },
                      })
                    );
                  }
                }
              }
            }
          }
        }
      }
    }*/
  };

  const onPointerOut = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDraggedRegionInfo(undefined);
    setMouseOveredRegionInfo(undefined);
    setMousePoint(undefined);
    setDownPoint(undefined);
    setOriginalLoci([]);
    setDownScalePosition(undefined);

    if (!e.shiftKey) {
      setSelectedLociIndices([]);
    }
  };

  const mouseOveredRegion = useMemo(
    () =>
      mouseOveredRegionInfo &&
      getRegionInfo(mouseOveredRegionInfo.id, regionInfos),
    [mouseOveredRegionInfo]
  );

  const detailDisplayValues = mouseOveredRegion
    ? [
        {
          key: "x",
          value: `${mouseOveredRegion!.rect.x.toFixed(2)} mm`,
        },
        {
          key: "y",
          value: `${mouseOveredRegion!.rect.y.toFixed(2)} mm`,
        },
      ]
    : [];

  return (
    <Wrapper
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerOut}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerOut}
      ref={wrapperRef}
    >
      {!showsLoci && (
        <MmToPxContext.Provider value={mmToPx}>
          <FloatingObjectsWrapper
            floatingObjects={page.floatingObjects}
            downPoint={downPointForFloatingObject}
            selectedFloatingObjectKey={selectedFloatingObjectKey}
            setDownPoint={setDownPointForFloatingObject}
            setPage={() => {}}
            setSelectedFloatingObjectKey={setSelectedFloatingObjectKey}
            pxToMm={pxToMm}
          />
          <TextWrapper
            textInfos={textInfos}
            penIndexToOrderedTextIds={penIndexToOrderedTextIds}
            penIndexToOrderedRelatedTextIds={penIndexToOrderedRelatedTextIds}
            displays={displayedElements.text}
          />
          <DecorationWrapper
            regionInfos={regionInfos}
            width={pageSize[0]}
            height={pageSize[1]}
            displays={displayedElements.decoration}
          />
          <RegionWrapper displays={displayedElements.layout}>
            <RegionComponent
              region={page.region}
              mouseOveredRegionInfo={mouseOveredRegionInfo}
              displaysDecoration={displayedElements.decoration}
            />
          </RegionWrapper>
        </MmToPxContext.Provider>
      )}
      {showsLoci && (
        <>
          <ConstraintCollection />
        </>
      )}
      <LociSvg
        allLoci={allLoci}
        selectedLociIndices={selectedLociIndices}
        mouseOveredLociIndex={mouseOveredLociIndex}
        width={pageSize[0]}
        height={pageSize[1]}
        strokeWidth={pageSize[1] / 500}
        displays={showsLoci}
      />
      {/*mouseOveredRegionInfo &&
        mouseOveredRegionInfo.part === "stroke" &&
        mousePoint && (
          <FloatingObject position={mousePoint}>
            <DetailDisplay values={detailDisplayValues} />
          </FloatingObject>
        )*/}
    </Wrapper>
  );
};

export default PageCanvas;
