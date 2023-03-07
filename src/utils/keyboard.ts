import { useEffect, useState } from "react";

export const useKey = (
  key: string,
  onKeyDown: ((e: KeyboardEvent, withCodes: string[]) => void) | undefined,
  onKeyUp: ((e: KeyboardEvent, withCodes: string[]) => void) | undefined,
  deps: any[]
) => {
  const [pressedCodes, setPressedKeys] = useState<string[]>([]);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (!pressedCodes.includes(e.code)) {
        setPressedKeys([...pressedCodes, e.code]);
      }
      if (e.key === key && onKeyDown) {
        onKeyDown(e, pressedCodes);
      }
    };
    const keyUpHandler = (e: KeyboardEvent) => {
      setPressedKeys(pressedCodes.filter((code) => code !== e.code));
      if (e.key === key && onKeyUp) {
        onKeyUp(e, pressedCodes);
      }
    };
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, [...deps, pressedCodes]);
};

export const usePressedKeyCodes = () => {
  const [pressedCodes, setPressedKeys] = useState<string[]>([]);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (!pressedCodes.includes(e.code)) {
        setPressedKeys([...pressedCodes, e.code]);
      }
    };
    const keyUpHandler = (e: KeyboardEvent) => {
      setPressedKeys(pressedCodes.filter((code) => code !== e.code));
    };
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, []);

  return pressedCodes;
};

export const isAltKey = (code: string) =>
  ["AltLeft", "AltRight"].includes(code);

export const isCtrlKey = (code: string) =>
  ["ControlLeft", "ControlRight", "MetaLeft", "MetaRight"].includes(code);

export const isShiftKey = (code: string) =>
  ["ShiftLeft", "ShiftRight"].includes(code);
