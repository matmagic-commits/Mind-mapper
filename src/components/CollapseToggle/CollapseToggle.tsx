import React from 'react';

interface Props {
  x: number;
  y: number;
  collapsed: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

export default function CollapseToggle({ x, y, collapsed, onToggle }: Props) {
  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onToggle}
      style={{ cursor: 'pointer' }}
    >
      <circle r={8} fill="white" stroke="#888" strokeWidth={1.5} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        fill="#555"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {collapsed ? '+' : '−'}
      </text>
    </g>
  );
}
