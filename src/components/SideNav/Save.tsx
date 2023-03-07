import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import SelectBox, { SelectBoxItem } from "./Ui/SelectBox";
import { activeColor } from "@/const/style";
import { getCurrentLoci } from "@/features/loci";
import { RootState } from "@/features/store";
import { saveJson, saveSvg, saveTwightXml } from "@/utils/save";

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SelectBoxWrapper = styled.div`
  flex-grow: 1;
`;

const AnchorButton = styled.a`
  color: #fff;
  height: 14px;
  line-height: 1;
  padding: 5px 6px 5px 6px;
  border-radius: 3px;
  cursor: pointer;
  background: ${activeColor};
  display: block;
`;

type SaveFormat = "json" | "svg" | "pdf";

const Save = () => {
  const pageState = useSelector((state: RootState) => state.page);
  const textState = useSelector((state: RootState) => state.text);
  const lociState = useSelector((state: RootState) => state.loci);
  const allLoci = getCurrentLoci(lociState);

  const [saveFormat, setSaveFormat] = useState<SaveFormat>("json");

  const save = () => {
    if (saveFormat === "json") {
      saveJson(pageState, lociState, textState);
    }
    if (saveFormat === "svg") {
      saveSvg(pageState, textState, allLoci);
    }
    if (saveFormat === "pdf") {
      saveTwightXml(pageState, textState, allLoci);
    }
  };

  const formatItems: SelectBoxItem<SaveFormat>[] = [
    { value: "json", node: "JSON" },
    { value: "svg", node: "SVG" },
    { value: "pdf", node: "PDF" },
  ];

  return (
    <Row>
      形式
      <SelectBoxWrapper>
        <SelectBox
          value={saveFormat}
          items={formatItems}
          onChange={(value) => {
            setSaveFormat(value);
          }}
        />
      </SelectBoxWrapper>
      <AnchorButton onClick={save}>保存</AnchorButton>
    </Row>
  );
};

export default Save;
