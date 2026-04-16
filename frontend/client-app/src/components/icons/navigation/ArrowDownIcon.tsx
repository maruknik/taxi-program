import React from "react";
import Svg, { Path } from "react-native-svg";
import { IconProps } from "../types";

export const ArrowDownIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#2C293D",
  style,
}) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 12 12" fill="none">
    <Path
      d="M8.96 4.09009H5.845H3.04C2.56 4.09009 2.32 4.67009 2.66 5.01009L5.25 7.60009C5.665 8.01509 6.34 8.01509 6.755 7.60009L7.74 6.61509L9.345 5.01009C9.68 4.67009 9.44 4.09009 8.96 4.09009Z"
      fill={color}
    />
  </Svg>
);
