import axios from "axios";
import urlJoin from "url-join";
import { getCurrentLoci, Locus } from "@/features/loci";
import { LociState } from "@/features/loci-slice";
import { pageToSvg, pageToTwightXml } from "@/features/page";
import { PageState } from "@/features/page-slice";
import { TextState } from "@/features/text-slice";

// generate a typesetted PDF file by connecting with the server.
export const saveTwightXml = async (
  pageState: PageState,
  textState: TextState,
  loci: Locus[]
) => {
  // const filename = `data-${Date.now()}.svg`;
  const { xml, css } = await pageToTwightXml(loci, pageState, textState);

  const endpoint = urlJoin(process.env.BACKEND_URL!, "pdf");
  const response = await axios.post(endpoint, { xml, css });
  if (response.status === 200) {
    window.open(endpoint);
  }
};

export const saveSvg = async (
  pageState: PageState,
  textState: TextState,
  loci: Locus[]
) => {
  const filename = `data-${Date.now()}.svg`;
  const svg = await pageToSvg(loci, pageState, textState);
  localDownload(filename, svg, "image/svg+xml");
};

export const localDownload = (
  filename: string,
  content: string,
  mimeType: string
) => {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

const stringifyDataAsJSON = (
  page: PageState,
  loci: LociState,
  text: TextState,
  indent?: string
) =>
  JSON.stringify(
    {
      page,
      loci: getCurrentLoci(loci),
      text,
    },
    null,
    indent ?? ""
  );

export const saveJson = async (
  page: PageState,
  loci: LociState,
  text: TextState
) => {
  const indent = "  ";
  const json = stringifyDataAsJSON(page, loci, text, indent);
  const filename = `data-${Date.now()}.json`;
  localDownload(filename, json, "application/json");
};

export const restoreFromJsonString = (
  json: string,
  setState: (page: PageState, loci: Locus[], text: TextState) => void
) => {
  const obj = JSON.parse(json);
  if ("page" in obj && "loci" in obj && "text" in obj) {
    setState(obj.page, obj.loci, obj.text);
  }
};

// local storage
export const saveToLocalStorage = (
  page: PageState,
  loci: LociState,
  text: TextState
) => {
  const json = stringifyDataAsJSON(page, loci, text);
  localStorage.setItem("pages", json);
};

export const restoreFromLocalStorage = (
  setState: (page: PageState, loci: Locus[], text: TextState) => void
) => {
  const item = localStorage.getItem("pages");
  if (item !== null) {
    restoreFromJsonString(item, setState);
  }
};
