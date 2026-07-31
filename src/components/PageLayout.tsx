import { WindowContainer } from "./ui/WindowContainer";

// Closing happens on the draggable title bar, same as every other window.
export const PageLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  // Design px, not vh: the interface is scaled as a whole, so a viewport unit
  // here would shrink twice over in a small player.
  <WindowContainer className="pointer-events-auto w-86 max-h-[700px] overflow-y-auto overflow-x-hidden p-4">
    <div className="pointer-events-auto">{children}</div>
  </WindowContainer>
);
