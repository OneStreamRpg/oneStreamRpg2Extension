export const PageLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="h-full bg-red-500/20">Page: {children}</div>;
};
