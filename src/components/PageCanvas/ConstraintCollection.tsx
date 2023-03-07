import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { locusToRect, Locus } from "@/features/loci";
import { RootState } from "@/features/store";
import { Point } from "@/utils/figure";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const Attribute = styled.input<{ x: number; y: number }>`
  width: 30px;
  height: 14px;
  font-size: 14px;
  padding: 4px;
  border-top: none;
  border-right: none;
  border-bottom: solid 1px #ccc;
  border-left: none;
  position: absolute;
  top: ${(props) => props.y - 7}px;
  left: ${(props) => props.x}px;
  outline: none;
`;

const ConstraintCollection = () => {
  // const dispatch = useDispatch();
  // const allTexts = useSelector((state: RootState) => state.loci.loci);

  const getCentralPoint = (locus: Locus): Point => {
    const rect = locusToRect(locus);
    return [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2];
  };

  return (
    <Wrapper>
      {/*allTexts
        .filter((locus) => locus.type.type === "constraint")
        .map((locus) => {
          const point = getCentralPoint(locus);
          return <Attribute x={point[0]} y={point[1]} type="text" />;
        })*/}
    </Wrapper>
  );
};

export default ConstraintCollection;
