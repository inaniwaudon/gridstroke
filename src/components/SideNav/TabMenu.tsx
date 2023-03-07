import React, { useState } from "react";
import styled from "styled-components";
import { TabItem, TabType } from "./SideNav";
import ToolTip from "./ToolTip";
import { activeColor } from "@/const/style";
import { translatePoint, Point } from "@/utils/figure";

const Wrapper = styled.nav`
  width: 100%;

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    justify-content: space-between;
  }
`;

const Tab = styled.li<{ selected: boolean }>`
  height: 20px;
  line-height: 20px;
  text-align: center;
  padding-bottom: 6px;
  border-bottom: ${(props) =>
    props.selected ? `solid 2px ${activeColor}` : "none"};
  flex-grow: 1;
  cursor: pointer;
`;

const Icon = styled.div`
  font-size: 20px;
`;

interface TabMenuProps {
  tabs: TabItem[];
  state: string;
  setState: (value: TabType) => void;
}

const TabMenu = ({ tabs, state, setState }: TabMenuProps) => {
  const [hovered, setHovered] = useState<string>();
  const [mousePoint, setMousePoint] = useState<Point>();

  return (
    <Wrapper>
      <ul>
        {tabs.map(({ key, icon, display }) => (
          <React.Fragment key={key}>
            <Tab
              selected={state === key}
              onMouseOver={(e) => {
                setHovered(key);
                setMousePoint([e.pageX, e.pageY]);
              }}
              onMouseMove={(e) => setMousePoint([e.pageX, e.pageY])}
              onMouseOut={() => setHovered(undefined)}
              onClick={() => setState(key)}
            >
              <Icon>{icon}</Icon>
            </Tab>
            {hovered === key && mousePoint && (
              <ToolTip position={translatePoint(mousePoint, [6, 6])}>
                {display}
              </ToolTip>
            )}
          </React.Fragment>
        ))}
      </ul>
    </Wrapper>
  );
};

export default TabMenu;
