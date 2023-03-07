import React, { useState } from "react";
import styled from "styled-components";
import { boxShadow1 } from "@/const/style";
import { colorToCss, cmyk, truncateColor, Color } from "@/utils/style";
import { deepCopy } from "@/utils/utils";

export const colorPickerSize = 80;

const Wrapper = styled.div<{}>`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Component = styled.div<{ keyColor: Color }>`
  height: 12px;
  padding: 2px;
  box-shadow: ${boxShadow1};
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    #fff,
    ${(props) => colorToCss(props.keyColor)}
  );
`;

const Circle = styled.div<{ ratio: number }>`
  width: 12px;
  height: 12px;
  margin-left: calc((100% - 12px) * ${(props) => props.ratio});
  border-radius: 6px;
  box-shadow: ${boxShadow1};
  background: #fff;
`;

interface ColorPickerProps {
  color: Color;
  setColor: (color: Color) => void;
}

const ColorPicker = ({ color, setColor }: ColorPickerProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>();

  const setColorInternally = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max(0, (e.clientX - rect.x) / rect.width), 1);
    const newColor = deepCopy(color);
    switch (newColor.colorSpace) {
      case "cmyk":
        newColor.cmyk[index] = ratio * 100;
        break;
      case "rgb":
        newColor.rgb[index] = ratio;
        break;
      case "hsl":
        newColor.hsl[index] = ratio;
    }
    truncateColor(newColor);
    setColor(newColor);
  };

  const onMouseDown = (e: React.MouseEvent, index: number) => {
    setSelectedIndex(index);
    setColorInternally(e, index);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (selectedIndex !== undefined) {
      setColorInternally(e, selectedIndex);
    }
  };

  const onMouseUp = () => {
    setSelectedIndex(undefined);
  };

  return (
    <Wrapper
      onMouseMove={(e) => onMouseMove(e)}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {color.colorSpace === "cmyk" ? (
        color.cmyk.map((_, index) => {
          const cmykArray: [number, number, number, number] = [0, 0, 0, 0];
          cmykArray[index] = 100;
          return (
            <Component
              keyColor={cmyk(...cmykArray)}
              onMouseDown={(e) => onMouseDown(e, index)}
              key={index}
            >
              <Circle ratio={color.cmyk[index] / 100} />
            </Component>
          );
        })
      ) : (
        <>Unsupported.</>
      )}
    </Wrapper>
  );
};

export default ColorPicker;
