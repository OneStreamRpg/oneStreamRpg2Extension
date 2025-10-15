import React from "react";

type ClickMarkerProps = {
  x: number;
  y: number;
};

const ClickMarker: React.FC<ClickMarkerProps> = ({ x, y }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        width: 10,
        height: 10,
        backgroundColor: "red",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    />
  );
};

export default ClickMarker;
