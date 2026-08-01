import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { useUiScaleStore } from "../../store/useUiScaleStore";
import { getTooltipLayer, syncTooltipLayerScale } from "./tooltipLayer";

/**
 * A react-tooltip that renders into the shared tooltip layer rather than in
 * place. See tooltipLayer for why — in short, the panels it's used in scroll
 * and would clip it, and the windows would cover it.
 */
export const PortalTooltip: React.FC<React.ComponentProps<typeof Tooltip>> = (
  props
) => {
  const scale = useUiScaleStore((state) => state.scale);
  const [layer] = useState(getTooltipLayer);

  useEffect(() => syncTooltipLayerScale(scale), [scale]);

  return createPortal(<Tooltip {...props} />, layer);
};
