import React, { memo } from 'react';
import { getBezierPath } from 'reactflow';

const PersonIcon = ({ color, style, flip }) => (
  <svg viewBox="0 0 24 24" width="30" height="30" style={style}>
    <g transform={flip ? "scale(-1, 1) translate(-24, 0)" : ""}>
      <circle cx="12" cy="8" r="4" fill={color} />
      <path d="M12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" fill={color} />
      <path d="M16 16 C 19 16, 22 14, 23 11" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

const FriendshipEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // REVERTED: 300 is enough
  const showIcon = distance > 300;

  return (
    <>
      <path
        id={id}
        style={{ ...style, stroke: '#10b981', strokeWidth: 4, strokeDasharray: '8,4' }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {showIcon && (
        <foreignObject
          width={80}
          height={50}
          x={labelX - 40}
          y={labelY - 25}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', animation: 'hugLeft 2s infinite ease-in-out' }}>
              <PersonIcon color="#10b981" />
            </div>
            <div style={{ position: 'absolute', animation: 'hugRight 2s infinite ease-in-out' }}>
              <PersonIcon color="#34d399" flip />
            </div>
            <div style={{ position: 'absolute', top: -10, fontSize: '20px', animation: 'pop 2s infinite ease-in-out' }}>
              ✨
            </div>
          </div>
          <style>
            {`
              @keyframes hugLeft { 0% { transform: translateX(-15px); } 40% { transform: translateX(-4px) rotate(-5deg); } 60% { transform: translateX(-4px) rotate(-5deg); } 100% { transform: translateX(-15px); } }
              @keyframes hugRight { 0% { transform: translateX(15px); } 40% { transform: translateX(4px) rotate(5deg); } 60% { transform: translateX(4px) rotate(5deg); } 100% { transform: translateX(15px); } }
              @keyframes pop { 0% { transform: scale(0); opacity: 0; } 40% { transform: scale(1.2); opacity: 1; } 60% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }
            `}
          </style>
        </foreignObject>
      )}
    </>
  );
};

export default memo(FriendshipEdge);