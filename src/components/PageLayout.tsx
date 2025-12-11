import { useUIStore } from "../store/useUIStore";
import { PagePosition } from "../types/ui";

export const PageLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const closeActivePage = useUIStore((state) => state.closeActivePage);
  const pagePosition = useUIStore((state) => state.pagePosition);

  return (
    <section
      className={`h-full bg-red-500/20 w-86 overflow-y-scroll overflow-x-hidden p-4 ${
        pagePosition === PagePosition.RIGHT && "ml-auto"
      }`}
    >
      <div className="pointer-events-auto">
        <nav className="flex">
          <button
            className="cursor-pointer ml-auto"
            onClick={() => closeActivePage()}
          >
            Close
          </button>
        </nav>
        {children}
      </div>
    </section>
  );
};
