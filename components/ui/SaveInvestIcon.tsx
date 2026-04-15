import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export function SaveInvestIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Hand holding from bottom */}
      <Path d="M6 19L3 16" />
      <Path d="M11 21h6.5a2.5 2.5 0 0 0 2.5-2.5v-1.5a2.5 2.5 0 0 0-2.5-2.5h-5.5" />
      <Path d="M11 21A5.5 5.5 0 0 1 3 16V9" />
      
      {/* Money Bag resting on hand */}
      <Path d="M14 15V8c0-3.5 3-5 3-5h-8s3 1.5 3 5v7" />
      <Path d="M8 15h10" />
      
      {/* Rupee Symbol inside bag */}
      <Path d="M11 8h4" />
      <Path d="M11 10h3.5" />
      <Path d="M13 8v3c0 1.5-1 2-2.5 2V13l3 2" />
      <Path d="M10.5 8v5" />
    </Svg>
  );
}
