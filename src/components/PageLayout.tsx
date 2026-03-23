import { useState } from "react";
import { useUIStore } from "../store/useUIStore";
import { PagePosition } from "../types/ui";
import { WindowContainer } from "./ui/WindowContainer";
import { windowHoverStyle } from "./ui/windowHoverStyle";

export const PageLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const closeActivePage = useUIStore((state) => state.closeActivePage);
  const pagePosition = useUIStore((state) => state.pagePosition);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="pointer-events-auto h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
    <WindowContainer
      className={`h-full w-86 overflow-y-scroll overflow-x-hidden p-4 ${
        pagePosition === PagePosition.RIGHT && "ml-auto"
      }`}
      style={windowHoverStyle(isHovered)}
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
    </div>
  );
};
