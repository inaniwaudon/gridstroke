import React, { useState } from "react";
import styled from "styled-components";
import TabMenu from "./SideNav/TabMenu";
import { white100, white90 } from "@/const/style";
import { Page } from "@/features/page";

const Wrapper = styled.nav`
  width: 100px;
  height: 100vh;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
`;

const Tab = styled.div``;

const Content = styled.div`
  margin: 10px 10px;
`;

const PageList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PageItem = styled.li<{ selected: boolean }>`
  width: 100%;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  background: ${(props) => (props.selected ? white100 : white90)};
`;

interface PageListProps {
  pages: Page[];
  history: Page[];
  currentPageIndex: number;
  setCurrentPageIndex: React.Dispatch<React.SetStateAction<number>>;
  createPage: () => void;
}

const LeftNavigation = ({
  pages,
  history,
  currentPageIndex,
  setCurrentPageIndex,
  createPage,
}: PageListProps) => {
  const [mode, setMode] = useState<"page" | "history">("page");
  const tabs = [
    { key: "page", display: "ページ" },
    { key: "history", display: "履歴" },
  ];

  return (
    <Wrapper>
      {/*<TabMenu tabs={tabs} state={mode} setState={setMode} />*/}
      <Content>
        {mode === "page" ? (
          <Tab>
            <PageList>
              {pages.map((_, index) => (
                <PageItem
                  selected={index === currentPageIndex}
                  onClick={() => setCurrentPageIndex(index)}
                  key={index}
                >
                  {index}
                </PageItem>
              ))}
              <PageItem selected={false} onClick={createPage}>
                +
              </PageItem>
            </PageList>
          </Tab>
        ) : (
          <Tab>
            <ul>
              <li></li>
            </ul>
          </Tab>
        )}
      </Content>
    </Wrapper>
  );
};

export default LeftNavigation;
