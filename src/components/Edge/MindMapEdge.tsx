import { radialEdgePath } from '../../utils/layout';

interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export default function MindMapEdge({ x1, y1, x2, y2, color }: Props) {
  return (
    <path
      d={radialEdgePath(x1, y1, x2, y2)}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeOpacity={0.6}
    />
  );
}
