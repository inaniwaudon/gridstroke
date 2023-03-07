import React from "react";
import styled from "styled-components";
import { CharacterStyle } from "@/features/text";

const Wrapper = styled.span<{
  ratio?: number;
  kerning?: number;
  shift?: number;
  weight?: number;
}>`
  font-size: ${(props) => (props.ratio ?? 100) / 100}em;
  font-weight: ${(props) => props.weight ?? "inherit"};
  margin-left: ${(props) => (props.kerning ?? 0) / 1000}em;
  display: inline-block;
  transform: translateY(${(props) => -(props.shift ?? 0) / 100}em);
`;

interface CharacterProps {
  charStyle: CharacterStyle;
  children: string;
}

const Character = ({ charStyle, children }: CharacterProps) => {
  return (
    <Wrapper
      ratio={charStyle?.ratio}
      kerning={charStyle?.kerning}
      shift={charStyle?.shift}
      weight={charStyle?.weight}
    >
      {children}
    </Wrapper>
  );
};

export default Character;
