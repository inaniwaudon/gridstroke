import React from "react";
import { useDispatch, useSelector } from "react-redux";
import BorderPicker from "./Ui/BorderPicker";
import Closable from "./Ui/Closable";
import ColorPicker from "./Ui/ColorPicker";
import MarginPaddingPicker from "./Ui/MarginPaddingPicker";
import NumberPicker from "./Ui/NumberPicker";
import { BoxDecoration } from "@/features/decoration";
import { updateDecoration } from "@/features/page-slice";
import { RootState } from "@/features/store";
import { Color } from "@/utils/style";

interface PickerProps {
  selectedIndex?: number;
  selectedType?: keyof BoxDecoration;
}

const StylesOption = ({ selectedIndex, selectedType }: PickerProps) => {
  const dispatch = useDispatch();
  const decorations = useSelector((state: RootState) => state.page.decorations);

  const updateValue = (key: keyof BoxDecoration, value: any) => {
    if (selectedIndex === undefined) {
      return;
    }
    dispatch(
      updateDecoration({
        index: selectedIndex,
        decoration: { ...decorations[selectedIndex], [key]: value },
      })
    );
  };

  if (selectedIndex === undefined) {
    return <></>;
  }

  // margin, padding
  const isMargin = selectedType === "margin";
  const isPadding = selectedType === "padding";
  if (isMargin || isPadding) {
    return (
      <MarginPaddingPicker
        value={
          isMargin
            ? decorations[selectedIndex].margin
            : decorations[selectedIndex].padding
        }
        setValue={(value) => updateValue(selectedType, value)}
      />
    );
  }
  // fill
  if (selectedType === "fill") {
    const fill = decorations[selectedIndex].fill;
    if (fill) {
      return (
        <Closable
          onClose={() => {}}
          onDelete={() => {
            updateValue("fill", undefined);
          }}
        >
          <ColorPicker
            color={fill}
            setColor={(color: Color) => {
              updateValue("fill", color);
            }}
          />
        </Closable>
      );
    }
  }
  // border
  if (selectedType === "border") {
    return (
      <BorderPicker
        border={decorations[selectedIndex].border}
        setBorder={(value) => updateValue("border", value)}
      />
    );
  }
  // border radius
  if (selectedType === "borderRadius") {
    return (
      <NumberPicker
        value={decorations[selectedIndex].borderRadius}
        min={0}
        max={20}
        unit="mm"
        setValue={(value: number) => updateValue("borderRadius", value)}
      />
    );
  }

  return <></>;
};

export default StylesOption;
