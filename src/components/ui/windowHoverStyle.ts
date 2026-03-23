import React from "react";

export function windowHoverStyle(isHovered: boolean): React.CSSProperties {
  const a = isHovered ? 1 : 0.4;
  return {
    backgroundColor: `rgba(30, 15, 6, ${a})`,
    borderTopColor: `rgba(154, 114, 40, ${a})`,
    borderBottomColor: `rgba(61, 26, 6, ${a})`,
    borderLeftColor: `rgba(61, 26, 6, ${a})`,
    borderRightColor: `rgba(61, 26, 6, ${a})`,
    boxShadow: [
      `inset 0 2px 0 rgba(255,220,120,${0.12 * a})`,
      `inset 6px 0 0 rgba(45,26,10,${a})`,
      `inset -6px 0 0 rgba(45,26,10,${a})`,
      `inset 0 4px 0 rgba(255,220,120,${0.08 * a})`,
      `inset 0 6px 0 rgba(45,26,10,${a})`,
      `inset 0 -2px 0 rgba(45,26,10,${a})`,
      `inset 0 -4px 0 rgba(0,0,0,${0.3 * a})`,
      `inset 0 -6px 0 rgba(45,26,10,${a})`,
      `inset 0px 0px 20px -5px rgba(10,5,2,${a})`,
      `0px 0px 8px 0px rgba(0,0,0,${0.8 * a})`,
    ].join(", "),
    transition: "background-color 150ms, border-color 150ms",
  };
}
