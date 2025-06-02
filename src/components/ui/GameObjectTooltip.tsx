import React from "react";

interface Props {
  name: string;
  x: number;
  y: number;
}

const GameObjectTooltip: React.FC<Props> = ({ name, x, y }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: y + 10,
        left: x + 10,
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: 4,
        pointerEvents: "none",
        fontSize: 12,
        zIndex: 1000,
      }}
    >
      {name}
    </div>
  );
};

export default GameObjectTooltip;
