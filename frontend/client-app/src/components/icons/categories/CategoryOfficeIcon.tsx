import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from '../types';

export const CategoryOfficeIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D', style }) => (
  <Svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 20H22M7 10H11M14 20H20V12C20 11.0681 19.9999 10.6022 19.8477 10.2346C19.6447 9.74456 19.2554 9.35523 18.7654 9.15224C18.3978 9 17.9321 9 17.0002 9C16.0683 9 15.6024 9 15.2349 9.15224C14.7448 9.35523 14.3552 9.74456 14.1522 10.2346C14 10.6022 14 11.0681 14 12V20ZM14 20V6.19995C14 5.07985 14.0002 4.51986 13.7822 4.09204C13.5905 3.71572 13.2841 3.40973 12.9078 3.21799C12.48 3 11.9203 3 10.8002 3H7.2002C6.08009 3 5.51962 3 5.0918 3.21799C4.71547 3.40973 4.40973 3.71572 4.21799 4.09204C4 4.51986 4 5.07985 4 6.19995V20H14ZM7 7L11 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
