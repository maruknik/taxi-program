import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const WorkIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8M21 11.2V16.8C21 17.9201 21.0002 18.4802 20.7822 18.908C20.5905 19.2844 20.2841 19.5902 19.9078 19.782C19.48 20 18.9203 20 17.8002 20H6.2002C5.08009 20 4.51962 20 4.0918 19.782C3.71547 19.5902 3.40973 19.2844 3.21799 18.908C3 18.4802 3 17.9201 3 16.8V11.2C3 10.0798 3 9.51986 3.21799 9.09204C3.40973 8.71572 3.71547 8.40973 4.0918 8.21799C4.51962 8 5.08009 8 6.2002 8H17.8002C18.9203 8 19.48 8 19.9078 8.21799C20.2841 8.40973 20.5905 8.71572 20.7822 9.09204C21.0002 9.51986 21 10.0798 21 11.2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
