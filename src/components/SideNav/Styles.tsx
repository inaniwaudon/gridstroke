import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import StylesOption from "./StylesOption";
import { activeColor, activeColorAlpha, boxShadow } from "@/const/style";
import { Border, BoxDecoration } from "@/features/decoration";
import { updateDecoration } from "@/features/page-slice";
import { RootState } from "@/features/store";
import { getPenTypeColor, PenType } from "@/features/tool-type";
import { boundingToCss, Bounding } from "@/utils/figure";
import { cmyk, colorToCss, colorToString, Color } from "@/utils/style";
import { deepCopy } from "@/utils/utils";

const Wrapper = styled.div``;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Item = styled.li`
  height: 80px;
  margin: 0 -14px;
  display: flex;
  overflow: hidden;
`;

const LeftBar = styled.div<{ color: string }>`
  color: #fff;
  padding: 0 2px 4px 2px;
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
  background: ${(props) => props.color};
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: end;
  overflow: hidden;
`;

const LeftBarIndex = styled.div`
  width: 14px;
  line-height: 14px;
  text-align: center;
  font-family: Montserrat;
  writing-mode: vertical-rl;
`;

const Sample = styled.div`
  width: 90px;
  flex-grow: 0;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Box = styled.div<{ selected: boolean }>`
  box-shadow: ${(props) =>
    props.selected && `0 1px 10px ${activeColorAlpha(0.4)}`};
`;

const Outer = styled(Box)`
  height: fit-content;
  border: dashed 1px #ccc;
`;

const SampleBox = styled(Box)<{
  fill?: Color;
  margin: Bounding<number>;
  padding: Bounding<number>;
  border: Bounding<Border>;
  borderRadius: number;
  selected: boolean;
}>`
  width: 30px;
  height: 30px;
  margin: ${(props) => boundingToCss(props.margin, "px")};
  padding: ${(props) => boundingToCss(props.padding, "px")};
  border-top: ${(props) =>
    `solid ${props.border.top.width}px ${colorToCss(props.border.top.color)}`};
  border-right: ${(props) =>
    `solid ${props.border.right.width}px ${colorToCss(
      props.border.right.color
    )}`};
  border-bottom: ${(props) =>
    `solid ${props.border.bottom.width}px ${colorToCss(
      props.border.bottom.color
    )}`};
  border-left: ${(props) =>
    `solid ${props.border.left.width}px ${colorToCss(
      props.border.left.color
    )}`};
  border-radius: ${(props) => props.borderRadius}px;
  box-shadow: ${(props) =>
    props.selected ? `0 1px 10px ${activeColorAlpha(0.4)}` : boxShadow};
  background: ${(props) => colorToCss(props.fill)};
`;

const Content = styled(Box)`
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  border: dashed 1px #ccc;
`;

const Right = styled.div`
  font-size: 10px;
  display: flex;
  align-items: center;
`;

const DetailedList = styled.ul`
  color: #666;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const DetailedItem = styled.li`
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  gap: 10px;
`;

const DetailedKey = styled.div<{ selected: boolean }>`
  color: ${(props) => (props.selected ? activeColor : "inherit")};
  font-weight: ${(props) => (props.selected ? "bold" : "normal")};
`;

const DetailedKeyTwo = styled(DetailedKey)`
  width: 2em;
`;

const DetailedKeyFive = styled(DetailedKey)`
  width: 5em;
`;

const DetailedValue = styled.div``;

interface StylesProps {}

const Styles = ({}: StylesProps) => {
  const dispatch = useDispatch();
  const decorations = useSelector((state: RootState) => state.page.decorations);
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [selectedType, setSelectedType] = useState<keyof BoxDecoration>();

  const activate = (index: number, type: keyof BoxDecoration) => {
    const notExistsFill = type === "fill" && !decorations[index].fill;
    const notExistsBorder = type === "border" && !decorations[index].border;
    if (notExistsFill || notExistsBorder) {
      const decoration = deepCopy(decorations[index]);
      if (notExistsFill) {
        decoration.fill = cmyk(0, 0, 0, 0);
      }
      if (notExistsBorder) {
        //decoration.border =
      }
      dispatch(updateDecoration({ index, decoration }));
    }
    setSelectedIndex(index);
    setSelectedType(type);
  };

  const isSelected = (index: number, type: keyof BoxDecoration) =>
    index === selectedIndex && type === selectedType;

  const getDisplayedMarginPadding = (bounding: Bounding<number>) => {
    const values = [
      bounding.top,
      bounding.right,
      bounding.bottom,
      bounding.left,
    ];
    if (values.every((value) => value === values[0])) {
      return values[0].toFixed(1);
    }
    return values.map((value) => value.toFixed(1)).join(" ");
  };

  return (
    <Wrapper>
      <List>
        {decorations.map((decoration, index) => {
          const penType: PenType = { type: "decoration", index };
          const inActivate = (type: keyof BoxDecoration) =>
            activate(index, type);

          return (
            <Item key={index}>
              <LeftBar color={getPenTypeColor(penType)}>
                <LeftBarIndex>#{index}</LeftBarIndex>
              </LeftBar>
              <Sample>
                <Outer
                  selected={
                    selectedIndex === index && selectedType === "margin"
                  }
                  onClick={(e) => {
                    inActivate("margin");
                  }}
                >
                  <SampleBox
                    fill={decoration.fill}
                    margin={decoration.margin}
                    padding={decoration.padding}
                    border={decoration.border}
                    borderRadius={decoration.borderRadius}
                    selected={
                      selectedIndex === index && selectedType === "padding"
                    }
                    onClick={(e) => {
                      inActivate("padding");
                      e.stopPropagation();
                    }}
                  >
                    <Content
                      selected={
                        selectedIndex === index && selectedType === "fill"
                      }
                      onClick={(e) => {
                        inActivate("fill");
                        e.stopPropagation();
                      }}
                    />
                  </SampleBox>
                </Outer>
              </Sample>
              <Right>
                <DetailedList>
                  <DetailedItem onClick={() => inActivate("margin")}>
                    <DetailedKeyFive selected={isSelected(index, "margin")}>
                      マージン
                    </DetailedKeyFive>
                    <DetailedValue>{`${getDisplayedMarginPadding(
                      decoration.margin
                    )}mm`}</DetailedValue>
                  </DetailedItem>
                  <DetailedItem onClick={() => inActivate("padding")}>
                    <DetailedKeyFive selected={isSelected(index, "padding")}>
                      パディング
                    </DetailedKeyFive>
                    <DetailedValue>{`${getDisplayedMarginPadding(
                      decoration.padding
                    )}mm`}</DetailedValue>
                  </DetailedItem>
                  <DetailedItem onClick={() => inActivate("fill")}>
                    <DetailedKeyTwo selected={isSelected(index, "fill")}>
                      背景
                    </DetailedKeyTwo>
                    <DetailedValue>
                      {decoration.fill
                        ? colorToString(decoration.fill)
                        : "なし"}
                    </DetailedValue>
                  </DetailedItem>
                  <DetailedItem onClick={() => inActivate("border")}>
                    <DetailedKeyTwo selected={isSelected(index, "border")}>
                      枠線
                    </DetailedKeyTwo>
                    <DetailedValue>
                      {decoration.border ? "" : "なし"}
                    </DetailedValue>
                  </DetailedItem>
                  <DetailedItem onClick={() => inActivate("borderRadius")}>
                    <DetailedKeyTwo
                      selected={isSelected(index, "borderRadius")}
                    >
                      角丸
                    </DetailedKeyTwo>
                    <DetailedValue>
                      {decoration.borderRadius === 0
                        ? "なし"
                        : decoration.borderRadius.toFixed(1) + "mm"}
                    </DetailedValue>
                  </DetailedItem>
                </DetailedList>
              </Right>
            </Item>
          );
        })}
        <StylesOption
          selectedIndex={selectedIndex}
          selectedType={selectedType}
        />
      </List>
    </Wrapper>
  );
};

export default Styles;
