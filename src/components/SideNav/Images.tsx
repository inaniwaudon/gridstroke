import React from "react";
import styled from "styled-components";
import { boxShadow1 } from "@/const/style";
import { Page } from "@/features/page";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px;
`;

const Item = styled.div<{ src: string; selected: boolean }>`
  width: calc(50% - 5px);
  height: 100px;
  margin: ${(props) => (props.selected ? "-1px" : "initial")};
  flex-shrink: 0;
  border: ${(props) => (props.selected ? "solid 1px #f09" : "initial")};
  border-radius: 3px;
  box-shadow: ${boxShadow1};
  background-image: url(${(props) => props.src});
  background-size: cover;
`;

interface ImagesProps {
  page: Page;
  selectedFloatingObjectKey: string | undefined;
}

const Images = ({ page, selectedFloatingObjectKey }: ImagesProps) => {
  const imgs = ["cherry.jpg", "tsukuba.jpg", "kiroro.jpg", "takoyaki.jpg"];

  const select = (index: number) => {
    if (selectedFloatingObjectKey) {
      page.floatingObjects[selectedFloatingObjectKey].src = imgs[index];
    }
  };

  const selectedImageSrc = selectedFloatingObjectKey
    ? page.floatingObjects[selectedFloatingObjectKey].src
    : "";

  return (
    <Wrapper>
      {imgs.map((img, index) => (
        <Item
          src={img}
          onClick={() => select(index)}
          selected={img === selectedImageSrc}
        />
      ))}
    </Wrapper>
  );
};

export default Images;
