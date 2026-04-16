import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const SwapIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.8396 20.1642V6.54639"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.9172 16.0681L16.8394 20.1648L12.7617 16.0681"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.91112 3.83276V17.4505"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.83344 7.92894L6.91121 3.83228L10.989 7.92894"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
