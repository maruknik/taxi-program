import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const MenuHamburgerIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7H21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M3 12H21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M3 17H21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
