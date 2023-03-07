import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { activeColor, boxShadow1, white100 } from "@/const/style";

const Wrapper = styled.div`
  position: relative;
`;

const Selected = styled.div`
  height: 16px;
  line-height: 16px;
  text-align: center;
  padding: 3px 4px;
  text-align: center;
  border-radius: 3px;
  cursor: pointer;
  box-shadow: ${boxShadow1};
`;

const CandidateList = styled.ul<{
  width: number;
  top: number;
  displays: boolean;
}>`
  width: ${(props) => props.width}px;
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 3px;
  box-shadow: ${boxShadow1};
  overflow: hidden;
  visibility: ${(props) => (props.displays ? "visible" : "hidden")};
  position: fixed;
  top: ${(props) => props.top}px;
  z-index: 1;
`;

const Candidate = styled.li`
  line-height: 16px;
  text-align: center;
  padding: 3px 4px;
  cursor: pointer;
  background: ${white100};

  &:hover {
    color: ${white100};
    background: ${activeColor};
  }
`;

export interface SelectBoxItem<T> {
  value: T;
  node: React.ReactNode;
}

interface SelectBoxProps<T> {
  value?: T;
  items: SelectBoxItem<T>[];
  onChange: (value: T) => void;
}

const SelectBox = <T extends React.Key>({
  value,
  items,
  onChange,
}: SelectBoxProps<T>) => {
  const selectedRef = useRef<HTMLDivElement>(null);
  const candidateListRef = useRef<HTMLUListElement>(null);

  const [width, setWidth] = useState(0);
  const [candidateListTop, setCandidateListTop] = useState(0);
  const [isCandidatesOpened, setCandidatesOpened] = useState(false);

  const selected = items.find((item) => item.value === value);

  useEffect(() => {
    if (selectedRef.current && candidateListRef.current) {
      const rect = selectedRef.current.getBoundingClientRect();
      const height = candidateListRef.current.clientHeight;

      setWidth(rect.width);
      setCandidateListTop(
        rect.top + rect.height + 4 + height < window.innerHeight
          ? rect.top + rect.height + 4
          : window.innerHeight - height - 4
      );
    }
  });

  return (
    <Wrapper>
      <Selected ref={selectedRef} onClick={() => setCandidatesOpened(true)}>
        {selected?.node ?? <></>}
      </Selected>
      <CandidateList
        ref={candidateListRef}
        width={width}
        top={candidateListTop}
        displays={isCandidatesOpened}
      >
        {items.map((item) => (
          <Candidate
            onClick={() => {
              setCandidatesOpened(false);
              onChange(item.value);
            }}
            key={item.value}
          >
            {item.node}
          </Candidate>
        ))}
      </CandidateList>
    </Wrapper>
  );
};

export default SelectBox;
