export const WindowContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div
      className={`pointer-events-auto ${className}`}
      style={{
        color: "white",
        boxShadow: [
          "inset 0 2px 0 rgb(255, 255, 255, 0.1)", // top
          "inset 6px 0 0 #343131", // right
          "inset -6px 0 0 #343131", // left
          "inset 0 4px 0 rgb(255, 255, 255, 0.1)", // top
          "inset 0 6px 0 #343131", // top
          "inset 0 -2px 0 #343131", // bottom
          "inset 0 -4px 0 rgb(255, 255, 255, 0.1)", // bottom
          "inset 0 -6px 0 #343131", // bottom
          "inset 0px 0px 20px -5px black",
          "0px 0px 8px 0px black",
        ].join(", "),
        borderTop: "3px solid #3f4347",
        borderBottom: "3px solid #28201b",
        borderLeft: "3px solid #28201b",
        borderRight: "3px solid #28201b",
        backgroundColor: "#111011",
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingLeft: "8px",
        paddingRight: "0px",
      }}
    >
      {children}
    </div>
  );
};
