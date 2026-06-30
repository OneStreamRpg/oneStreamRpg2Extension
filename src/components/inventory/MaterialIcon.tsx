import { MaterialCategory, materialIconSrc } from "./types";

interface MaterialIconProps {
  category: MaterialCategory;
  size?: number;
  className?: string;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  category,
  size = 20,
  className,
}) => (
  <img
    src={materialIconSrc(category)}
    width={size}
    height={size}
    alt={category}
    className={className}
    style={{ imageRendering: "pixelated" }}
  />
);
