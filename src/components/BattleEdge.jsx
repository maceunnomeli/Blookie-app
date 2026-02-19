import React, { memo } from 'react';
import { getBezierPath } from 'reactflow';

const SwordIcon = ({ style, flip }) => (
  <svg
    viewBox="0 0 24 24"
    width="50"
    height="50"
    style={{ ...style, filter: 'drop-shadow(0 0 5px rgba(255,0,0,0.5))' }}
  >
    <g transform={flip ? "scale(-1, 1) translate(-24, 0)" : ""}>
      <path d="M4 20 L20 4" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
      <path d="M3 21 L6 18 M21 3 L18 6" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
      <path d="M5 19 L8 22 M2 16 L5 19" stroke="#9ca3af" strokeWidth="2" />
    </g>
  </svg>
);

const BattleEdge = ({
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

  // REVERTED: 300 is enough for 50px icons
  const showIcon = distance > 300;

  return (
    <>
      <path
        id={id}
        style={{ ...style, stroke: '#ef4444', strokeWidth: 4, strokeDasharray: '5,5' }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {showIcon && (
        <foreignObject
          width={60}
          height={60}
          x={labelX - 30}
          y={labelY - 30}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            <div style={{ position: 'absolute', animation: 'clashLeft 1s infinite alternate ease-in-out' }}>
              <SwordIcon />
            </div>
            <div style={{ position: 'absolute', animation: 'clashRight 1s infinite alternate ease-in-out' }}>
              <SwordIcon flip />
            </div>
            <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)', animation: 'spark 1s infinite alternate', zIndex: -1 }} />
          </div>
          <style>
            {`
              @keyframes clashLeft { 0% { transform: translate(-25px, 12px) rotate(-45deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(-5px, 0px) rotate(0deg); } }
              @keyframes clashRight { 0% { transform: translate(25px, -12px) rotate(45deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(5px, 0px) rotate(0deg); } }
              @keyframes spark { 0% { opacity: 0; transform: scale(0.5); } 90% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(2); } }
            `}
          </style>
        </foreignObject>
      )}
    </>
  );
};

export default memo(BattleEdge);