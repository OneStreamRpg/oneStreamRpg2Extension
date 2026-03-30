import { useState } from "react";
import { getCdnIconUrl } from "../../utils/cdnIcon";

type CdnIconProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  type: "items" | "enemy" | "npc" | "abilities";
  id: string;
};

export const CdnIcon: React.FC<CdnIconProps> = ({
  type,
  id,
  className = "",
  alt,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`bg-gray-700 flex items-center justify-center text-gray-400 text-xs ${className}`}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={getCdnIconUrl(type, id)}
      alt={alt ?? id}
      className={className}
      style={{ imageRendering: "pixelated" }}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
};
