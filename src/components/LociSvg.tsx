import React, { useCallback } from "react";
import styled from "styled-components";
import { activeColor } from "@/const/style";
import { Locus } from "@/features/loci";
import { getPenTypeColor } from "@/features/tool-type";
import { Point } from "@/utils/figure";

const Svg = styled.svg<{ displays: boolean }>`
  width: 100%;
  height: 100%;
  display: ${(props) => (props.displays ? "block" : "none")};
  position: absolute;
  top: 0;
  left: 0;
`;

const Polyline = styled.polyline`
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const IndexText = styled.text<{ size: number }>`
  font-size: ${(props) => props.size}px;
`;

const indexDiff = 14;
const indexSize = 10;

interface LociSvgProps {
  allLoci: Locus[];
  mouseOveredLociIndex?: number;
  selectedLociIndices: number[];
  width: number;
  height: number;
  strokeWidth: number;
  displays?: boolean;
  position?: Point;
}

const LociSvg = React.memo(
  ({
    allLoci,
    mouseOveredLociIndex,
    selectedLociIndices,
    width,
    height,
    strokeWidth,
    displays = true,
    position = [0, 0],
  }: LociSvgProps) => {
    const viewBox = [position[0], position[1], width, height].join(" ");
    return (
      <Svg viewBox={viewBox} displays={displays}>
        {allLoci.map((locus, index) => {
          const points = locus.points.map((point) => point.join(",")).join(" ");
          const penColor = getPenTypeColor(locus.type);
          const color = selectedLociIndices.includes(index)
            ? activeColor
            : penColor;
          const lociWidth =
            strokeWidth * (mouseOveredLociIndex === index ? 1.5 : 1);
          const dashes = (locus.type.type === "text" ? [3, 3] : [1, 0]).join(
            " "
          );

          return (
            <React.Fragment key={locus.id}>
              <Polyline
                points={points}
                stroke={color}
                strokeWidth={lociWidth}
                strokeDasharray={dashes}
              />
              {"index" in locus.type && (
                <IndexText
                  x={locus.points.at(-1)![0]}
                  y={locus.points.at(-1)![1] + strokeWidth * indexDiff}
                  fill={color}
                  size={strokeWidth * indexSize}
                >
                  {locus.type.index}
                </IndexText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    );
  }
);

export default LociSvg;
