import React, { useContext } from "react";
import styled from "styled-components";
import { MmToPxContext, MouseRegionInfo } from "./PageCanvas";
import { Region } from "@/features/region";
import { Direction } from "@/utils/figure";

const Wrapper = styled.div<{
  region: Region;
  verticalSplited: boolean;
  borders: Direction[];
  mouseOvered?: Direction;
}>`
  width: ${(props) =>
    (!props.verticalSplited ? props.region.ratio : 1.0) * 100}%;
  height: ${(props) =>
    (props.verticalSplited ? props.region.ratio : 1.0) * 100}%;
  border-top: ${(props) =>
    props.borders.includes("top")
      ? `solid 1px ${props.mouseOvered === "top" ? "#c00" : "#ccc"}`
      : "none"};
  border-right: ${(props) =>
    props.borders.includes("right")
      ? `solid 1px ${props.mouseOvered === "right" ? "#c00" : "#ccc"}`
      : "none"};
  border-bottom: ${(props) =>
    props.borders.includes("bottom")
      ? `solid 1px ${props.mouseOvered === "bottom" ? "#c00" : "#ccc"}`
      : "none"};
  border-left: ${(props) =>
    props.borders.includes("left")
      ? `solid 1px ${props.mouseOvered === "left" ? "#c00" : "#ccc"}`
      : "none"};
  box-sizing: border-box;
  position: relative;
`;

const Content = styled.div<{
  region: Region;
  mmToPx: (mm: number) => number;
  surface: boolean;
}>`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: ${(props) =>
    props.region.splitDirection === "horizontal" ? "row" : "column"};
  gap: ${(props) => props.mmToPx(props.region.gap)}px;
  background: ${(props) =>
    props.surface ? "rgba(0,0,0,0.05)" : "transparent"};
  overflow: hidden;
  position: relative;
  z-index: 1;
`;

interface RegionProps {
  region: Region;
  parentRegion?: Region;
  mouseOveredRegionInfo?: MouseRegionInfo;
  displaysDecoration: boolean;
}

const Region = ({
  region,
  parentRegion,
  mouseOveredRegionInfo,
  displaysDecoration,
}: RegionProps) => {
  const mmToPx = useContext(MmToPxContext);
  const isVerticalSplited = parentRegion
    ? parentRegion.splitDirection === "vertical"
    : true;

  // borders
  const splitedIndex = parentRegion ? parentRegion.children.indexOf(region) : 0;
  let borders: Direction[] = [];
  if (parentRegion === undefined /* || parentRegion.padding > 0*/) {
    borders = ["top", "left", "bottom", "right"];
  } else {
    if (isVerticalSplited && splitedIndex > 0) {
      borders.push("top");
    }
    if (!isVerticalSplited && splitedIndex > 0) {
      borders.push("left");
    }
  }

  const regionChildren = region.children.filter(
    (child) => child.type === "region"
  ) as Region[];

  return (
    <Wrapper
      region={region}
      verticalSplited={isVerticalSplited}
      borders={borders}
      mouseOvered={
        mouseOveredRegionInfo && mouseOveredRegionInfo.id === region.id
          ? mouseOveredRegionInfo.direction
          : undefined
      }
    >
      <Content region={region} mmToPx={mmToPx} surface={false}>
        {regionChildren.map((child, index) => (
          <Region
            region={child}
            parentRegion={region}
            mouseOveredRegionInfo={mouseOveredRegionInfo}
            displaysDecoration={displaysDecoration}
            key={index}
          />
        ))}
      </Content>
    </Wrapper>
  );
};

export default Region;
