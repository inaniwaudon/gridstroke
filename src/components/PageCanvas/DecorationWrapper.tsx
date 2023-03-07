import React from "react";
import { toXml } from "xast-util-to-xml";
import styled from "styled-components";
import { regionInfoToSvg, RegionInfo } from "@/features/region";

const Wrapper = styled.div<{ displays: boolean }>`
  width: 100%;
  height: 100%;
  display: ${(props) => (props.displays ? "block" : "none")};
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const Svg = styled.svg`
  width: 100%;
  height: 100%;
`;

interface DecorationProps {
  regionInfos: RegionInfo[];
  width: number;
  height: number;
  displays: boolean;
}

const DecorationWrapper = ({
  regionInfos,
  width,
  height,
  displays,
}: DecorationProps) => {
  return (
    <Wrapper displays={displays}>
      <Svg viewBox={`0 0 ${width} ${height}`}>
        {regionInfos.map((info) => (
          <g
            dangerouslySetInnerHTML={{ __html: toXml(regionInfoToSvg(info)) }}
            key={info.id}
          ></g>
        ))}
      </Svg>
    </Wrapper>
  );
};

export default DecorationWrapper;
