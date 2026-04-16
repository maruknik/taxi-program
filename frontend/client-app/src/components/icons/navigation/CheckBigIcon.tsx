import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const CheckBigIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12.0001L8.94975 16.9499L19.5568 6.34326"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
