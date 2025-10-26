import { Overlay } from "./pages/Overlay";

const extType = import.meta.env.VITE_EXT_TYPE;

export const App: React.FC = () => {
  if (extType !== "panel" && extType !== "overlay") {
    console.error("No valid extension type specified in .env");
  }

  // const { token, channelId, isAuthenticated } = useAuthStore();

  return <Overlay />;
};
