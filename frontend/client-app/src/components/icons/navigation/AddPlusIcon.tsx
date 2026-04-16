import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const AddPlusIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 12H18M12 18L12 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
