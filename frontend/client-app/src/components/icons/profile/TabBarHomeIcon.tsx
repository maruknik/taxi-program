import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const TabBarHomeIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path d="M2 22H22" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2.95001 22L3.00001 9.96999C3.00001 9.35999 3.29001 8.78004 3.77001 8.40004L10.77 2.95003C11.49 2.39003 12.5 2.39003 13.23 2.95003L20.23 8.39003C20.72 8.77003 21 9.34999 21 9.96999V22" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinejoin="round" />
    <Path d="M13 17H11C10.17 17 9.5 17.67 9.5 18.5V22H14.5V18.5C14.5 17.67 13.83 17 13 17Z" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinejoin="round" />
    <Path d="M9.5 13.75H7.5C6.95 13.75 6.5 13.3 6.5 12.75V11.25C6.5 10.7 6.95 10.25 7.5 10.25H9.5C10.05 10.25 10.5 10.7 10.5 11.25V12.75C10.5 13.3 10.05 13.75 9.5 13.75Z" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinejoin="round" />
    <Path d="M16.5 13.75H14.5C13.95 13.75 13.5 13.3 13.5 12.75V11.25C13.5 10.7 13.95 10.25 14.5 10.25H16.5C17.05 10.25 17.5 10.7 17.5 11.25V12.75C17.5 13.3 17.05 13.75 16.5 13.75Z" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinejoin="round" />
  </Svg>
);
