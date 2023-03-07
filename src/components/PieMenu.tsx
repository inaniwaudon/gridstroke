import React, { useRef, useState } from "react";
import styled from "styled-components";
import {
  activeColor,
  boxShadow1,
  textColor,
  textShadow,
  white100,
} from "@/const/style";
import { getPoint, Point } from "@/utils/figure";

const radius = 46;
const width = 80;
const height = 30;
const textRatio = 0.8;

const Wrapper = styled.nav<{ position?: Point }>`
  width: ${radius * 2}px;
  height: ${radius * 2}px;
  font-size: 12px;
  border-radius: 50%;
  display: ${(props) => (props.position ? "block" : "none")};
  position: absolute;
  top: ${(props) => props.position && `${props.position[1] - radius}px`};
  left: ${(props) => props.position && `${props.position[0] - radius}px`};
  z-index: 200;

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
`;

const Item = styled.li<{ radian: number; selected: boolean }>`
  width: ${width}px;
  height: ${height}px;
  line-height: ${height}px;
  color: ${(props) => (props.selected ? "#fff" : textColor)};
  text-align: center;
  text-shadow: ${(props) => (props.selected ? textShadow : "")};
  pointer-events: none;
  user-select: none;
  position: absolute;
  top: ${(props) =>
    radius +
    radius * textRatio * Math.sin(props.radian - Math.PI / 2) -
    height / 2}px;
  left: ${(props) =>
    radius +
    radius * textRatio * Math.cos(props.radian - Math.PI / 2) -
    width / 2}px;
`;

const BackgroundSvg = styled.svg`
  width: 200%;
  height: 200%;
  margin: -50%;
  position: absolute;
  z-index: -1;
`;

const Circle = styled.path`
  fill: ${white100};
  filter: drop-shadow(${boxShadow1});
`;

const SelectionGroup = styled.g`
  transition: opacity 0.2s;
`;

const SelectionPath = styled.path`
  fill: ${activeColor};
`;

interface SelectionProps {
  index: number;
}

const startAngle = 1 / 8 - 1 / 2;
const no = 4;

const Selection = ({ index }: SelectionProps) => {
  const fromRadian = 2 * Math.PI * ((1 / no) * index + startAngle);
  const toRadian = 2 * Math.PI * ((1 / no) * (index + 1) + startAngle);
  return (
    <SelectionPath
      d={`M 0 0 L ${Math.cos(fromRadian) * radius * 2} ${
        Math.sin(fromRadian) * radius * 2
      } L ${Math.cos(toRadian) * radius * 2} ${
        Math.sin(toRadian) * radius * 2
      } Z`}
      clipPath="url(#piemenu-selection-clip)"
    />
  );
};

interface PieMenuProps {
  items: {
    display: string;
    action?: () => void;
  }[];
  position?: Point;
  setPieMenuPosition: (position: Point | undefined) => void;
}

const PieMenu = ({ items, position, setPieMenuPosition }: PieMenuProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const wrapperRef = useRef<HTMLElement>(null);

  const onMouseDown = () => {
    if (selectedIndex !== undefined) {
      const action = items[selectedIndex].action;
      if (action) {
        action();
      }
      setPieMenuPosition(undefined);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const point = getPoint(e, wrapperRef.current!);
    const [x, y] = [point[0] - radius, point[1] - radius];
    setSelectedIndex(
      (Math.floor(
        (Math.atan2(-x, y) / (2 * Math.PI) + startAngle) * items.length
      ) +
        items.length) %
        items.length
    );
  };

  const ratio = 0.6;

  const getCircle = (radius: number, f2: 0 | 1) =>
    `M ${radius} 0 A ${radius} ${radius} 0 1 ${f2} ${-radius} 0 A ${radius} ${radius} 180 0 ${f2} ${radius} 0`;

  return (
    <Wrapper
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      ref={wrapperRef}
      position={position}
    >
      <ul>
        {items.map((item, index) => (
          <Item
            radian={((2 * Math.PI) / items.length) * index}
            selected={index === selectedIndex}
            key={index}
          >
            {item.display}
          </Item>
        ))}
      </ul>
      <BackgroundSvg
        viewBox={[-radius * 2, -radius * 2, radius * 4, radius * 4].join(" ")}
      >
        <defs>
          <clipPath id="piemenu-selection-clip">
            <Circle
              d={`${getCircle(radius, 0)} ${getCircle(radius * ratio, 1)}`}
            />
          </clipPath>
        </defs>
        <Circle d={`${getCircle(radius, 0)} ${getCircle(radius * ratio, 1)}`} />
        {[...Array(no)].map((_, index) => (
          <SelectionGroup key={index} opacity={index === selectedIndex ? 1 : 0}>
            <Selection index={index} />
          </SelectionGroup>
        ))}
      </BackgroundSvg>
    </Wrapper>
  );
};

export default PieMenu;
