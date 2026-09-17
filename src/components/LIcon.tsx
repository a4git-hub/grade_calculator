import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: number;
}

const lc = 'round' as const;
const lj = 'round' as const;

export const LIcon = {
  Home: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Bell: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Path d="M10 19a2 2 0 004 0"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Calc: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Rect x="7" y="6" width="10" height="3" rx="0.5"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Circle cx="8"  cy="13" r="0.8" fill={color}/>
      <Circle cx="12" cy="13" r="0.8" fill={color}/>
      <Circle cx="16" cy="13" r="0.8" fill={color}/>
      <Circle cx="8"  cy="17" r="0.8" fill={color}/>
      <Circle cx="12" cy="17" r="0.8" fill={color}/>
      <Circle cx="16" cy="17" r="0.8" fill={color}/>
    </Svg>
  ),

  Gear: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3"
              stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06A2 2 0 113.27 16.92l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H2a2 2 0 010-4h.1a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06A2 2 0 116.08 4.21l.06.06a1.7 1.7 0 001.87.34H8a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V8a1.7 1.7 0 001.55 1H22a2 2 0 010 4h-.1a1.7 1.7 0 00-1.55 1z"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Sparkle: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Chevron: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  ChevronLeft: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Arrow: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  ArrowUp: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M6 11l6-6 6 6"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Plus: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Check: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12l5 5L20 6"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  X: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Trend: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17l6-6 4 4 8-8M14 7h7v7"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  TrendDown: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7l6 6 4-4 8 8M14 17h7v-7"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Doc: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Path d="M14 3v5h5M9 13h6M9 17h4"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Refresh: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Search: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7"
              stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Path d="M20 20l-3.5-3.5"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Lock: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="10" rx="2"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Path d="M8 11V8a4 4 0 018 0v3"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Sync: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M20 4v4h-4M4 20v-4h4"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Filter: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 5h16M7 12h10M10 19h4"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Target: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9"
              stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Circle cx="12" cy="12" r="5"
              stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Circle cx="12" cy="12" r="1.8" fill={color}/>
    </Svg>
  ),

  Calendar: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="2"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
      <Path d="M3 10h18M8 3v4M16 3v4"
            stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj}/>
    </Svg>
  ),

  Logo: ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6"/>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <Circle cx="12" cy="12" r="2.2" fill={color}/>
    </Svg>
  ),

  Laptop: ({ size = 20, color = 'currentColor', stroke = 1.6 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj} />
      <Path d="M2 21h20M12 17v4" stroke={color} strokeWidth={stroke} strokeLinecap={lc} strokeLinejoin={lj} />
    </Svg>
  ),
};
