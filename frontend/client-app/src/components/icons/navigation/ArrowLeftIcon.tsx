import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12H3M3 12L8 17M3 12L8 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
