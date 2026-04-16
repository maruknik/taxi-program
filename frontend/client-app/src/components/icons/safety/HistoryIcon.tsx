import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const HistoryIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path d="M12.1243 18.0584C15.6993 17.1167 18.3327 13.8667 18.3327 10.0001C18.3327 5.40008 14.6327 1.66675 9.99935 1.66675C4.44102 1.66675 1.66602 6.30008 1.66602 6.30008M1.66602 6.30008V2.50008M1.66602 6.30008H3.34102H5.36602" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1.66602 10C1.66602 14.6 5.39935 18.3333 9.99935 18.3333" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />
  </Svg>
);
