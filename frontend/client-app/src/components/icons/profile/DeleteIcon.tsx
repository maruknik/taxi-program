import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const DeleteIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.85 9.13989L18.2 19.2099C18.09 20.7799 18 21.9999 15.21 21.9999H8.78999C5.99999 21.9999 5.90999 20.7799 5.79999 19.2099L5.14999 9.13989" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.33 16.5H13.66" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.5 12.5H14.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
