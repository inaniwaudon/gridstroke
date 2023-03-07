import React from "react";
import styled from "styled-components";
import { white90 } from "@/const/style";
import { ElementObject } from "@/features/object";
import { Page } from "@/features/page";

type ObjectLayer = {
  type: "page" | "region" | "text";
  name: string;
  id: string;
  level: number;
  hasText: boolean;
};

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Ulist = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const Layer = styled.li<{ level: number; selected: boolean }>`
  height: 1em;
  line-height: 1em;
  color: #666;
  font-size: 0.9rem;
  padding: 4px 4px 4px ${(prop) => `${prop.level * 12}px`};
  display: inline-block;
  overflow: hidden;
  display: flex;
  background: ${(prop) => (prop.selected ? white90 : "transparent")};

  .text {
    margin-left: 10px;
  }
`;

const Icon = styled.span<{ type: "page" | "region" | "text" }>`
  width: 10px;
  height: 10px;
  margin-right: 4px;
  display: inline-block;
  background: ${(prop) =>
    prop.type === "page" ? "#fc0" : prop.type === "region" ? "#06f" : "#3c0"};
`;

interface LayerProps {
  page: Page;
}

const Layers = ({ page }: LayerProps) => {
  // dfs
  const regionStack: [ElementObject, number][] = [];
  regionStack.push([page.region, 0]);

  const layers: ObjectLayer[] = [
    {
      type: "page",
      name: "ページ",
      id: "",
      level: 0,
      hasText: false,
    },
  ];

  while (regionStack.length > 0) {
    const [current, depth] = regionStack.pop()!;
    if (current.type === "region") {
      layers.push({
        type: current.type,
        name: current.type === "region" ? "領域" : "テキスト",
        id: current.id,
        level: depth + 1,
        hasText:
          current.children.length > 0 && current.children[0].type === "text",
      });
      for (const child of current.children) {
        regionStack.push([child, depth + 1]);
      }
    }
  }

  return (
    <Wrapper>
      <Ulist>
        {layers.map((layer, index) => (
          <Layer level={layer.level} selected={false} key={index}>
            <Icon type={layer.type} />
            {layer.name}
            {layer.hasText && (
              <div className="text">
                <Icon type="text" />
                テキスト
              </div>
            )}
          </Layer>
        ))}
      </Ulist>
    </Wrapper>
  );
};

export default Layers;
