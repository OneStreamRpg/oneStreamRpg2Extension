export const WindowContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = "", style: styleProp = {} }) => {
  return (
    <div
      className={`pointer-events-auto ${className}`}
      style={{
        color: "#f0d8a8",
        boxShadow: [
          "inset 0 2px 0 rgba(255,220,120,0.12)",
          "inset 6px 0 0 #2d1a0a",
          "inset -6px 0 0 #2d1a0a",
          "inset 0 4px 0 rgba(255,220,120,0.08)",
          "inset 0 6px 0 #2d1a0a",
          "inset 0 -2px 0 #2d1a0a",
          "inset 0 -4px 0 rgba(0,0,0,0.3)",
          "inset 0 -6px 0 #2d1a0a",
          "inset 0px 0px 20px -5px #0a0502",
          "0px 0px 8px 0px rgba(0,0,0,0.8)",
        ].join(", "),
        borderTop: "3px solid #9a7228",
        borderBottom: "3px solid #3d1a06",
        borderLeft: "3px solid #3d1a06",
        borderRight: "3px solid #3d1a06",
        backgroundColor: "#1e0f06",
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingLeft: "8px",
        paddingRight: "0px",
        ...styleProp,
      }}
    >
      {children}
    </div>
  );
};
