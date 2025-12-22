import { useUIStore } from "../store/useUIStore";
import { PagePosition } from "../types/ui";
import { WindowContainer } from "./ui/WindowContainer";

export const PageLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const closeActivePage = useUIStore((state) => state.closeActivePage);
  const pagePosition = useUIStore((state) => state.pagePosition);

  return (
    <WindowContainer
      className={`h-full w-86 overflow-y-scroll overflow-x-hidden p-4 ${
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
    </WindowContainer>
  );
};
