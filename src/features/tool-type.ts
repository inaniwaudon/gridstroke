export const indexedPenTypes = ["region", "text", "decoration"] as const;
export type IndexedPenType = typeof indexedPenTypes[number];

export type PenType =
  | { type: IndexedPenType; index: number }
  | { type: "constraint"; attribute: string }
  | { type: "memo" };

export type ToolType = (
  | {
      type: "pen";
      pen: PenType;
    }
  | { type: "eraser" | "move" }
) & { color: string };

export const toolIndices = {
  region: 0,
  text: 1,
  decoration: 2,
};

export const getToolTypes = ({
  region = 0,
  text = 0,
  decoration = 0,
}: Partial<{ [key in IndexedPenType]: number }>): ToolType[] => [
  {
    type: "pen",
    pen: { type: "region", index: region },
    color: "#333",
  },
  {
    type: "pen",
    pen: { type: "text", index: text },
    color: "#0c3",
  },
  {
    type: "pen",
    pen: { type: "decoration", index: decoration },
    color: "#f6c",
  },
  { type: "pen", pen: { type: "constraint", attribute: "" }, color: "#09c" },
  { type: "pen", pen: { type: "memo" }, color: "#f90" },
  { type: "move", color: "#999" } as const,
  { type: "eraser", color: "#eee" } as const,
];

export const getPenTypeColor = (penType: PenType) => {
  if (penType.type === "region") {
    return `hsl(0, 0%, ${penType.index * 30}%)`;
  }
  if (penType.type === "text") {
    return `hsl(${120 + penType.index * 50}, 60%, 50%)`;
  }
  if (penType.type === "decoration") {
    return `hsl(${310 + penType.index * 50}, 80%, 70%)`;
  }
  return getToolTypes({}).find(
    (tool) => tool.type === "pen" && tool.pen.type === penType.type
  )!.color;
};

export const getToolColor = (tool: ToolType) => {
  if (tool.type === "pen") {
    return getPenTypeColor(tool.pen);
  } else {
    return tool.color;
  }
};
