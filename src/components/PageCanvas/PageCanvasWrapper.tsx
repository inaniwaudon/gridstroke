import React, { useState } from "react";
import styled from "styled-components";
import LayoutGridDisplay from "./LayoutGridDisplay";
import PageCanvas from "./PageCanvas";
import { boxShadow } from "@/const/style";
import { Page } from "@/features/page";
import { RegionIdAlignToLociIds, RegionInfo } from "@/features/region";
import { TextInfo } from "@/features/text";
import { IndexedPenType } from "@/features/tool-type";
import { DisplayedElements, ScalePosition } from "@/utils/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/features/store";

const Wrapper = styled.div<{
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}>`
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  box-shadow: ${boxShadow};
  background: #fff;
  transform: scale(${(props) => props.scale});
  position: absolute;
  top: ${(props) => props.y}px;
  left: ${(props) => props.x}px;
  z-index: 1;
`;

interface PageCanvasWrapperProps {
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
  displayedElements: DisplayedElements;
  mmToPx: (mm: number) => number;
  pxToMm: (px: number) => number;
  setSelectedFloatingObjectKey: React.Dispatch<string | undefined>;
}

const PageCanvasWrapper = ({
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
  displayedElements,
  mmToPx,
  pxToMm,
  setSelectedFloatingObjectKey,
}: PageCanvasWrapperProps) => {
  const [scalePosition, setScalePosition] = useState<ScalePosition>({
    scale: 1.0,
    position: [40, 10],
  });
  const pageSize = useSelector((state: RootState) => state.page.size);

  const wheelRatio = 0.01;

  const onWheel = (e: React.WheelEvent) => {
    if (e.shiftKey) {
      setScalePosition({
        scale: Math.max(scalePosition.scale + e.deltaY * wheelRatio, 0.5),
        position: scalePosition.position,
      });
    }
  };

  return (
    <Wrapper
      x={scalePosition.position[0]}
      y={scalePosition.position[1]}
      width={mmToPx(pageSize[0])}
      height={mmToPx(pageSize[1])}
      scale={scalePosition.scale}
      onWheel={onWheel}
    >
      <PageCanvas
        page={page}
        regionInfos={regionInfos}
        textInfos={textInfos}
        penIndexToOrderedTextIds={penIndexToOrderedTextIds}
        penIndexToOrderedRelatedTextIds={penIndexToOrderedRelatedTextIds}
        selectedFloatingObjectKey={selectedFloatingObjectKey}
        showsLoci={showsLoci}
        toolIndex={toolIndex}
        toolSubIndices={toolSubIndices}
        regionIdAlignToLociIds={regionIdAlignToLociIds}
        scalePosition={scalePosition}
        displayedElements={displayedElements}
        mmToPx={mmToPx}
        pxToMm={pxToMm}
        setSelectedFloatingObjectKey={setSelectedFloatingObjectKey}
        setScalePosition={setScalePosition}
      />
      <LayoutGridDisplay />
    </Wrapper>
  );
};

export default PageCanvasWrapper;
