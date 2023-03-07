import React, { useState } from "react";
import {
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import Closable from "./Ui/Closable";
import ColorPicker from "./Ui/ColorPicker";
import Input from "./UI/Input";
import RadioButton, { RadioButtonItem } from "./UI/RadioButton";
import SelectBox from "./Ui/SelectBox";
import { setLayoutGrid } from "@/features/page-slice";
import { RootState } from "@/features/store";
import {
  getSelectedFromParagraph,
  changeCharacterStyles,
  CharacterStyle,
  CharacterStyleNumberKey,
  LayoutGrid,
  LayoutGridNumberKey,
  Paragraph,
  ParagraphNumberKey,
  TextAlign,
  TextSelection,
} from "@/features/text";
import { updateParagraph } from "@/features/text-slice";
import { mmToQ, QToMm } from "@/utils/figure";
import { colorToString } from "@/utils/style";
import { deepCopy } from "@/utils/utils";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Column = styled.div`
  display: flex;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 4px;
`;

const HalfRow = styled(Row)`
  flex-basis: 50%;
`;

const H2 = styled.h2`
  font-size: 14px;
  margin: 0 0 4px 0;
`;

const ColumnLabel = styled.label`
  display: flex;
  gap: 10px;
`;

const LeftLabel = styled.div<{ length: number }>`
  width: ${(props) => props.length}em;
  flex-shrink: 0;
`;

const Right = styled.div`
  flex-grow: 1;
`;

const WeightSample = styled.span<{ weight: number }>`
  font-family: "ShinGo";
  font-weight: ${(props) => props.weight};
  margin-right: 10px;
`;

interface TextsProps {
  textSelection?: TextSelection;
}

type InputField<T> = {
  label: string;
  key: T;
  step: number;
  defaultValue?: number;
  unit?: string;
};

const Texts = ({ textSelection }: TextsProps) => {
  const dispatch = useDispatch();
  const layoutGrid = useSelector((state: RootState) => state.page.layoutGrid);
  const texts = useSelector((state: RootState) => state.text.texts);
  const [displaysColor, setDisplaysColor] = useState(false);

  const layoutGridFields: {
    label: string;
    key: LayoutGridNumberKey;
    step: number;
  }[] = [
    { label: "サイズ", key: "fontSize", step: 0.25 },
    { label: "行送り", key: "lineHeight", step: 0.1 },
    { label: "長体", key: "proportion", step: 1 },
    { label: "行数", key: "lines", step: 1 },
    { label: "行長", key: "charsPerLine", step: 1 },
    { label: "段数", key: "columns", step: 1 },
    { label: "段間", key: "columnSpace", step: 1 },
  ];

  const paragraphFields: InputField<ParagraphNumberKey>[] = [
    { label: "サイズ", key: "fontSize", step: 0.25, unit: "Q" },
    { label: "行送り", key: "lineHeight", step: 0.1 },
    { label: "字間", key: "letterSpacing", step: 0.05 },
    { label: "段落前", key: "lineBefore", step: 0.1, unit: "mm" },
    { label: "段落後", key: "lineAfter", step: 0.1, unit: "mm" },
  ];

  const charStyleFields: InputField<CharacterStyleNumberKey>[] = [
    { label: "比率", key: "ratio", step: 1, defaultValue: 100, unit: "%" },
    { label: "カーニング", key: "kerning", step: 1 },
    { label: "ベースライン", key: "shift", step: 1, unit: "%" },
  ];

  const paragraphAligns: RadioButtonItem<TextAlign>[] = [
    { value: "left", node: <MdFormatAlignLeft /> },
    { value: "center", node: <MdFormatAlignCenter /> },
    { value: "right", node: <MdFormatAlignRight /> },
  ];

  const weightItems = [...Array(9)].map((_, index) => {
    const weight = 100 * index + 100;
    return {
      value: weight,
      node: (
        <>
          <WeightSample weight={weight}>あ</WeightSample>
          {weight}
        </>
      ),
    };
  });

  const paragraph = textSelection
    ? getSelectedFromParagraph(texts, textSelection).paragraph
    : undefined;

  const charStyle =
    textSelection && paragraph
      ? paragraph.charStyles[textSelection.from.row]
      : undefined;

  const changeLayoutGrid = (key: keyof LayoutGrid, value: number) => {
    dispatch(setLayoutGrid({ ...layoutGrid, [key]: value }));
  };

  const changeParagraph = (key: keyof Paragraph, value: any) => {
    if (textSelection && paragraph) {
      dispatch(
        updateParagraph({
          id: textSelection.id,
          paragraphIndex: textSelection.from.paragraph,
          paragraph: {
            ...paragraph,
            [key]: value,
          },
        })
      );
    }
  };

  const changeCharStyle = (key: keyof CharacterStyle, value: any) => {
    if (!textSelection) {
      return;
    }
    const { paragraph } = getSelectedFromParagraph(texts, textSelection);
    if (!paragraph) {
      return;
    }
    const newParagraph = deepCopy(paragraph);
    const fromIndex = textSelection.from.row;
    const values =
      key === "kerning"
        ? [value]
        : [...Array(textSelection.to.row - fromIndex)].map(() => value);
    changeCharacterStyles(
      textSelection.from.row,
      key,
      values,
      newParagraph.charStyles
    );
    dispatch(
      updateParagraph({
        id: textSelection.id,
        paragraphIndex: textSelection.from.paragraph,
        paragraph: newParagraph,
      })
    );
  };

  const displayColor = () => {
    setDisplaysColor(true);
  };

  return (
    <Wrapper>
      <Row>
        <H2>レイアウトグリッド</H2>
        <Column>
          {[
            { from: 0, to: 3, labelLength: 3 },
            { from: 3, to: 7, labelLength: 2 },
          ].map(({ from, to, labelLength }) => (
            <HalfRow key={from}>
              {layoutGridFields.slice(from, to).map(({ label, key, step }) => (
                <ColumnLabel key={key}>
                  <LeftLabel length={labelLength}>{label}</LeftLabel>
                  <Input
                    value={layoutGrid[key]}
                    step={step}
                    setValue={(value) => changeLayoutGrid(key, value)}
                  />
                </ColumnLabel>
              ))}
            </HalfRow>
          ))}
        </Column>
      </Row>
      {paragraph && (
        <Row>
          <H2>段落スタイル</H2>
          {paragraphFields.map(({ label, key, step, unit }) => (
            <div key={key}>
              <ColumnLabel>
                <LeftLabel length={4}>{label}</LeftLabel>
                <Input
                  value={unit === "Q" ? mmToQ(paragraph[key]) : paragraph[key]}
                  step={step}
                  unit={unit}
                  setValue={(value) =>
                    changeParagraph(key, unit === "Q" ? QToMm(value) : value)
                  }
                />
              </ColumnLabel>
            </div>
          ))}
          <div>
            <ColumnLabel>
              <LeftLabel length={4}>位置</LeftLabel>
              <RadioButton
                value={paragraph.align}
                items={paragraphAligns}
                onChange={(value) => changeParagraph("align", value)}
              />
            </ColumnLabel>
          </div>
          <div>
            <ColumnLabel>
              <LeftLabel length={4}>ウェイト</LeftLabel>
              <Right>
                <SelectBox
                  value={paragraph.weight}
                  items={weightItems}
                  onChange={(value: number) => {
                    changeParagraph("weight", value);
                  }}
                />
              </Right>
            </ColumnLabel>
          </div>
          <div>
            <ColumnLabel onClick={displayColor}>
              <LeftLabel length={4}>塗り</LeftLabel>
              {colorToString(paragraph.color)}
            </ColumnLabel>
          </div>
          {displaysColor && (
            <Closable onClose={() => setDisplaysColor(false)}>
              <ColorPicker
                color={paragraph.color}
                setColor={(color) => changeParagraph("color", color)}
              />
            </Closable>
          )}
        </Row>
      )}
      {charStyle && (
        <Row>
          <H2>文字スタイル</H2>
          {charStyleFields.map(({ label, key, step, defaultValue, unit }) => {
            const value = charStyle[key];
            return (
              <div key={key}>
                <ColumnLabel>
                  <LeftLabel length={6}>{label}</LeftLabel>
                  <Input
                    value={
                      unit === "Q" && value !== undefined ? mmToQ(value) : value
                    }
                    step={step}
                    unit={unit}
                    defaultValue={defaultValue}
                    setValue={(value) =>
                      changeCharStyle(key, unit === "Q" ? QToMm(value) : value)
                    }
                  />
                </ColumnLabel>
              </div>
            );
          })}
          <div>
            <ColumnLabel>
              <LeftLabel length={6}>ウェイト</LeftLabel>
              <Right>
                <SelectBox
                  value={charStyle.weight}
                  items={weightItems}
                  onChange={(value: number) => {
                    changeCharStyle("weight", value);
                  }}
                />
              </Right>
            </ColumnLabel>
          </div>
        </Row>
      )}
    </Wrapper>
  );
};

export default Texts;
