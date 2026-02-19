import React from 'react';
import { getBezierPath } from 'reactflow';

// Simple Heart SVG
const HeartIcon = ({ style }) => (
  <svg viewBox="0 0 24 24" width="30" height="30" style={style}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="#ec4899"
      stroke="#be185d"
      strokeWidth="1"
    />
  </svg>
);

export default function LoveEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* 1. The Green Dashed Line */}
      <path
        id={id}
        style={{ ...style, stroke: '#10b981', strokeWidth: 4, strokeDasharray: '8,4' }} // Dashed!
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* 2. The Love Animation Container */}
      <foreignObject
        width={60}
        height={60}
        x={labelX - 30}
        y={labelY - 30}
        requiredExtensions="http://www.w3.org/1999/xhtml"
        style={{ overflow: 'visible' }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Main Heart */}
          <div style={{ animation: 'heartbeat 1.5s infinite ease-in-out' }}>
            <HeartIcon />
          </div>

          {/* Floating Mini Hearts */}
          <div style={{ position: 'absolute', top: -10, right: -10, animation: 'floatUp 2s infinite ease-in', opacity: 0 }}>
            <HeartIcon style={{ width: 15, height: 15 }} />
          </div>
          <div style={{ position: 'absolute', top: -5, left: -10, animation: 'floatUp 2.5s infinite ease-in 0.5s', opacity: 0 }}>
            <HeartIcon style={{ width: 12, height: 12 }} />
          </div>

        </div>

        <style>
          {`
            @keyframes heartbeat {
              0% { transform: scale(1); }
              15% { transform: scale(1.3); }
              30% { transform: scale(1); }
              45% { transform: scale(1.15); }
              60% { transform: scale(1); }
            }
            @keyframes floatUp {
              0% { transform: translateY(0) scale(0.5); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translateY(-30px) scale(1); opacity: 0; }
            }
          `}
        </style>
      </foreignObject>
    </>
  );
}