import React, { memo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { RootState } from "@/features/store";
import { layoutGridColor } from "@/const/style";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

const Svg = styled.svg`
  width: 100%;
  height: 100%;
  opacity: 0.3;
`;

const PageRect = styled.rect`
  fill: none;
  stroke: ${layoutGridColor};
  stroke-width: 0.2;
`;

const Rect = styled.rect<{ fills: boolean }>`
  fill: ${(props) => (props.fills ? layoutGridColor : "none")};
  stroke: ${layoutGridColor};
  stroke-width: 0.2;
`;

const LayoutGridDisplay = memo(() => {
  const pageSize = useSelector(
    (state: RootState) => state.page.size,
    () => false
  );
  const layoutGrid = useSelector(
    (state: RootState) => state.page.layoutGrid,
    () => false
  );

  return (
    <Wrapper>
      <Svg viewBox={`0 0 ${pageSize[0]} ${pageSize[1]}`}>
        {[...Array(layoutGrid.columns)].map((_, columni) => {
          const columnWidth = layoutGrid.fontSize * layoutGrid.charsPerLine;
          const columnX =
            layoutGrid.padding.left +
            (columnWidth + layoutGrid.columnSpace) * columni;
          return (
            <React.Fragment key={columni}>
              {[...Array(layoutGrid.lines)].map((_, yi) => {
                const y = layoutGrid.padding.top + layoutGrid.lineHeight * yi;
                return [...Array(layoutGrid.charsPerLine)].map((_, xi) => {
                  const x = columnX + layoutGrid.fontSize * xi;
                  return (
                    <Rect
                      x={x}
                      y={y}
                      width={layoutGrid.fontSize}
                      height={layoutGrid.fontSize}
                      fills={xi % 10 === 9}
                      key={xi}
                    />
                  );
                });
              })}
              <PageRect
                x={columnX}
                y={layoutGrid.padding.top}
                width={columnWidth}
                height={
                  pageSize[1] -
                  (layoutGrid.padding.top + layoutGrid.padding.bottom)
                }
              />
            </React.Fragment>
          );
        })}
        <PageRect
          x={layoutGrid.padding.left}
          y={layoutGrid.padding.top}
          width={
            pageSize[0] - (layoutGrid.padding.left + layoutGrid.padding.right)
          }
          height={
            pageSize[1] - (layoutGrid.padding.top + layoutGrid.padding.bottom)
          }
        />
      </Svg>
    </Wrapper>
  );
});

export default LayoutGridDisplay;
