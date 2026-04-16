import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const HeadsetIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 25" fill="none">
    <Path d="M21 13H19C17.8954 13 17 13.8954 17 15V17C17 18.1046 17.8954 19 19 19C20.1046 19 21 18.1046 21 17V13ZM21 13C21 8.02944 16.9706 4 12 4C7.02944 4 3 8.02944 3 13M3 13V17C3 18.1046 3.89543 19 5 19C6.10457 19 7 18.1046 7 17V15C7 13.8954 6.10457 13 5 13H3Z" stroke={color} />
    <Path d="M21 15V19C21 19 21 22 19 22C17 22 14 22 14 22" stroke={color} strokeLinejoin="round" />
  </Svg>
);
