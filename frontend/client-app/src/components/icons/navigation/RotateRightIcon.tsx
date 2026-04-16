import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const RotateRightIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path d="M14.89 5.0799C14.02 4.8199 13.06 4.6499 12 4.6499C7.20999 4.6499 3.32999 8.5299 3.32999 13.3199C3.32999 18.1199 7.20999 21.9999 12 21.9999C16.79 21.9999 20.67 18.1199 20.67 13.3299C20.67 11.5499 20.13 9.8899 19.21 8.5099" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16.13 5.32L13.24 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16.13 5.32007L12.76 7.78007" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
