import { useUIStore } from "../store/useUIStore";

export const PageLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const closeActivePage = useUIStore((state) => state.closeActivePage);

  return (
    <section className="h-full bg-red-500/20">
      <nav className="flex">
        <button
          className="cursor-pointer ml-auto"
          onClick={() => closeActivePage()}
        >
          Close
        </button>
      </nav>
      {children}
    </section>
  );
};
