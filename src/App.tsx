import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useKey } from "react-use";
import styled from "styled-components";
import "./global.css";
import PieMenu from "./components/PieMenu";
import ToolTypesDisplay from "./components/ToolTypesDisplay";
import PageCanvasWrapper from "./components/PageCanvas/PageCanvasWrapper";
import RelatedEditorView from "./components/RelatedText/RelatedEditorView";
import RelatedTextCollection from "./components/RelatedText/RelatedTextCollection";
import SideNav from "./components/SideNav/SideNav";
import { getCurrentLoci, separateLociByPenIndex } from "./features/loci";
import { backLociIndex, forwardLociIndex } from "./features/loci-slice";
import { determinePage, Page } from "./features/page";
import {
  createRootRegion,
  RegionIdAlignToLociIds,
  RegionInfo,
} from "./features/region";
import { initializeSettings } from "./features/settings";
import { setAllSettings } from "./features/settings-slice";
import { RootState } from "./features/store";
import {
  getPenIndexToOrderedRelatedTextIds,
  TextInfo,
  TextSelection,
} from "./features/text";
import { getToolTypes, IndexedPenType } from "./features/tool-type";
import {
  getPoint,
  mmToPxWithHeight,
  pxToMmWithHeight,
  Point,
} from "./utils/figure";
import { saveToLocalStorage } from "./utils/save";
import { generateFontFaces } from "./utils/style";
import { pieMenuMs, DisplayedElements } from "./utils/utils";

const Main = styled.main`
  width: 100%;
  height: 100vh;
  flex-grow: 1;
  position: relative;
`;

const SnackBarWrapper = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
`;

const App = () => {
  const [showsLoci, setShowsLoci] = useState(true);
  const mainRef = useRef<HTMLElement>(null);

  const dispatch = useDispatch();
  const pageState = useSelector((state: RootState) => state.page);
  const lociState = useSelector((state: RootState) => state.loci);
  const textState = useSelector((state: RootState) => state.text);
  const decorations = useSelector((state: RootState) => state.page.decorations);
  const allLoci = getCurrentLoci(lociState);

  // tool
  const [toolIndex, setToolIndex] = useState<number>(0);
  const [toolSubIndices, setToolSubIndices] = useState<{
    [key in IndexedPenType]: number;
  }>({ region: 0, text: 0, decoration: 0 });

  // view
  const [displayedElements, setDisplayedElements] = useState<DisplayedElements>(
    { layout: true, decoration: true, text: true }
  );

  // page
  const pageSize = useSelector((state: RootState) => state.page.size);
  const [page, setPage] = useState<Page>({
    region: createRootRegion(),
    floatingObjects: {},
    regionInfos: [],
  });

  // history
  const undo = () => {
    dispatch(backLociIndex());
  };

  const redo = () => {
    dispatch(forwardLociIndex());
  };

  // pie menu
  const switchLoci = () => {
    setShowsLoci(!showsLoci);
  };

  const [pieMenuPosition, setPieMenuPosition] = useState<Point>();
  const [mouseDownTime, setMouseDownTime] = useState<number>();
  const pieMenuItems = [
    {
      display: showsLoci ? "プレビュー" : "ストローク",
      action: switchLoci,
    },
    { display: "やり直す", action: redo },
    { display: "" },
    { display: "元に戻す", action: undo },
  ];

  // convert an unit
  const height = window.innerHeight - 20;
  const mmToPx = mmToPxWithHeight(pageSize[1], height);
  const pxToMm = pxToMmWithHeight(pageSize[1], height);

  // text
  const textLoci = useSelector((state: RootState) => state.text.loci);
  const relatedTexts = useSelector((state: RootState) => state.text.texts);
  const [penIndexToOrderedTextIds, setPenIndexToOrderedTextIds] = useState<{
    [key in number]: string[];
  }>({});
  const [textInfos, setTextInfos] = useState<TextInfo[]>([]);
  const [editingTextId, setEditingTextId] = useState<string>();
  const [textSelection, setTextSelection] = useState<TextSelection>();

  const penIndexToOrderedRelatedTextIds = useMemo(() => {
    const penIndexToLoci = separateLociByPenIndex(
      textLoci.filter((locus) => locus.type.type === "text")
    );
    return getPenIndexToOrderedRelatedTextIds(
      Object.values(relatedTexts),
      penIndexToLoci
    );
  }, [textLoci, relatedTexts]);

  // region
  const [regionInfos, setRegionInfos] = useState<RegionInfo[]>([]);
  const [regionIdAlignToLociIds, setRegionIdAlignToLociIds] =
    useState<RegionIdAlignToLociIds>({});

  // floating object
  const [selectedFloatingObjectKey, setSelectedFloatingObjectKey] =
    useState<string>();

  const determineRegion = () => {
    const determinedPage = determinePage(allLoci, decorations, pageSize);
    const newPage: Page = {
      region: determinedPage.rootRegion,
      floatingObjects: determinedPage.floatingObjects,
      regionInfos: determinedPage.regionInfos,
    };
    setPage(newPage);
    setRegionInfos(determinedPage.regionInfos);
    setTextInfos(determinedPage.textInfos);
    setPenIndexToOrderedTextIds(determinedPage.penIndexToOrderedTextIds);
    setRegionIdAlignToLociIds(determinedPage.regionIdAlignToLociIds);
  };

  useEffect(() => {
    if (!showsLoci) {
      determineRegion();
    }
  }, [allLoci, decorations, showsLoci]);

  // mouse event
  const onMainMouseDown = (e: React.MouseEvent) => {
    setMouseDownTime(Date.now());
  };

  const onMainMouseUp = (e: React.MouseEvent) => {
    const eventMousePoint = getPoint(e, mainRef.current!);
    if (
      pieMenuPosition ||
      ((e.ctrlKey || e.metaKey) &&
        mouseDownTime !== undefined &&
        Date.now() - mouseDownTime < pieMenuMs)
    ) {
      setPieMenuPosition(
        e.ctrlKey || e.metaKey
          ? eventMousePoint
          : pieMenuPosition
          ? undefined
          : eventMousePoint
      );
    }
  };

  // key
  useKey(
    "Enter",
    () => {
      if (!editingTextId) {
        setShowsLoci(!showsLoci);
      }
    },
    {},
    [showsLoci, editingTextId]
  );

  // save
  useKey(
    "s",
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        saveToLocalStorage(pageState, lociState, textState);
        e.preventDefault();
      }
    },
    {},
    [pageState, textState]
  );

  // undo
  useKey(
    "z",
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    },
    {},
    [history]
  );

  // settings
  useEffect(() => {
    dispatch(setAllSettings(initializeSettings()));
  }, []);

  return (
    <>
      <Helmet>
        <style>{generateFontFaces()}</style>
        <title>gridstroke</title>
      </Helmet>
      {/*<LeftNavigation
          pages={pages}
          history={[]}
          currentPageIndex={currentPageIndex}
          setCurrentPageIndex={setCurrentPageIndex}
          createPage={createPage}
        />*/}
      <Main
        ref={mainRef}
        onMouseDown={onMainMouseDown}
        onMouseUp={onMainMouseUp}
      >
        <PageCanvasWrapper
          page={page}
          regionInfos={regionInfos}
          textInfos={textInfos}
          penIndexToOrderedTextIds={penIndexToOrderedTextIds}
          penIndexToOrderedRelatedTextIds={penIndexToOrderedRelatedTextIds}
          selectedFloatingObjectKey={selectedFloatingObjectKey}
          showsLoci={showsLoci}
          toolIndex={toolIndex}
          toolSubIndices={toolSubIndices}
          regionIdAlignToLociIds={regionIdAlignToLociIds}
          displayedElements={displayedElements}
          mmToPx={mmToPx}
          pxToMm={pxToMm}
          setSelectedFloatingObjectKey={setSelectedFloatingObjectKey}
        />
        {false ? (
          <RelatedEditorView />
        ) : (
          <RelatedTextCollection
            toolIndex={toolIndex}
            textPenIndex={toolSubIndices.text}
            penIndexToOrderedRelatedTextIds={penIndexToOrderedRelatedTextIds}
            textSelection={textSelection}
            editingTextId={editingTextId}
            setTextSelection={setTextSelection}
            setEditingTextId={setEditingTextId}
          />
        )}
      </Main>
      <ToolTypesDisplay
        toolIndex={toolIndex}
        toolSubIndices={toolSubIndices}
        displayedElements={displayedElements}
        isEditing={editingTextId !== undefined}
        setToolIndex={setToolIndex}
        setToolSubIndices={setToolSubIndices}
        setDisplayedElements={setDisplayedElements}
      />
      <SideNav
        page={page}
        toolType={getToolTypes({})[toolIndex]}
        selectedFloatingObjectKey={selectedFloatingObjectKey}
        textSelection={textSelection}
      />
      <PieMenu
        items={pieMenuItems}
        position={pieMenuPosition}
        setPieMenuPosition={setPieMenuPosition}
      />
      {/*<SnackBarWrapper>
        <SnackBar />
        </SnackBarWrapper>*/}
    </>
  );
};

export default App;
