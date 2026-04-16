import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 20 20" fill="none">
    <Path
      d="M19 19L1 1M19.0001 1L1 19.0001"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
