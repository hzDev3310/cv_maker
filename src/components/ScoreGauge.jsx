import { RadialBarChart, RadialBar } from 'recharts';

export default function ScoreGauge({ score = 0, size = 160, label = '' }) {
  const color = score < 50 ? '#dc2626' : score < 75 ? '#ea580c' : '#16a34a';
  const data = [{ name: 'Score', value: Math.max(0, Math.min(100, Math.round(score))), fill: color }];
  const half = size / 2;
  const innerR = size * 0.5;
  const outerR = size * 0.72;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size + 4} style={{ overflow: 'visible' }}>
        <RadialBarChart
          width={size}
          height={size}
          cx={half}
          cy={half}
          innerRadius={innerR}
          outerRadius={outerR}
          barSize={size * 0.07}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={size * 0.1}
            background={{ fill: '#e5e1e7' }}
          />
        </RadialBarChart>
        <text
          x={half}
          y={half}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.22}
          fontWeight={800}
          fill={color}
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        >
          {Math.round(score)}
        </text>
        <text
          x={half}
          y={half + size * 0.14}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.075}
          fontWeight={600}
          fill="#7a7582"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        >
          / 100
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: 11, fontWeight: 700, color: '#494551', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 }}>
          {label}
        </span>
      )}
    </div>
  );
}
