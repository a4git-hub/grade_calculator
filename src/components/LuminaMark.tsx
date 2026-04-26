import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ThemeTokens } from '../tokens';

interface Props {
  T: ThemeTokens;
  size?: number;
}

export function LuminaMark({ T, size = 96 }: Props) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={T.accent} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={T.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={48} cy={48} r={48} fill="url(#halo)" />
        <Circle cx={48} cy={48} r={42} stroke={T.hairline2} strokeWidth={1} fill="none" />
        <Circle cx={48} cy={48} r={30} stroke={T.hairline2} strokeWidth={1} fill="none" />
        <Circle cx={48} cy={48} r={18} stroke={T.accent} strokeWidth={1.5} fill="none"
                strokeDasharray="2 4" />
        <Circle cx={48} cy={48} r={6} fill={T.accent} />
        <Circle cx={48} cy={6}  r={2.5} fill={T.accent} />
        <Circle cx={90} cy={48} r={2}   fill={T.ink} />
        <Circle cx={48} cy={90} r={1.5} fill={T.text2} />
      </Svg>
    </View>
  );
}
