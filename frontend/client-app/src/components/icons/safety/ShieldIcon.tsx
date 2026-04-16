import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const ShieldIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path d="M10.49 2.23006L5.5 4.11006C4.35 4.54006 3.41 5.90006 3.41 7.12006V14.5501C3.41 15.7301 4.19 17.2801 5.14 17.9901L9.44 21.2001C10.85 22.2601 13.17 22.2601 14.58 21.2001L18.88 17.9901C19.83 17.2801 20.61 15.7301 20.61 14.5501V7.12006C20.61 5.89006 19.67 4.53006 18.52 4.10006L13.53 2.23006C12.68 1.92006 11.32 1.92006 10.49 2.23006Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.05 11.8699L10.66 13.4799L14.96 9.17993" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
