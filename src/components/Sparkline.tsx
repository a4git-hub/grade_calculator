import React from 'react';
import Svg, { Path, Circle, LinearGradient, Stop, Defs } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  dotted?: boolean;
}

export function Sparkline({ data, color, width = 80, height = 28, dotted = false }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data) - 0.4;
  const max = Math.max(...data) + 0.4;
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `spk${color.replace('#', '').replace(/[^a-zA-Z0-9]/g, '')}`;
  const last = pts[pts.length - 1];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill={`url(#${gradId})`} />
      <Path
        d={linePath}
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dotted ? '2 2' : undefined}
      />
      <Circle cx={last.x} cy={last.y} r={2.5} fill={color} />
    </Svg>
  );
}
