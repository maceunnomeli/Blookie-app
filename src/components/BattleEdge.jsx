import React, { memo } from 'react';
import { getBezierPath } from 'reactflow';

const SwordIcon = ({ flip }) => (
  <g transform={flip ? "scale(-1, 1)" : ""}>
    <g transform="translate(-12, -12) scale(2)">
      <path d="M4 20 L20 4" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
      <path d="M3 21 L6 18 M21 3 L18 6" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
      <path d="M5 19 L8 22 M2 16 L5 19" stroke="#9ca3af" strokeWidth="2" />
    </g>
  </g>
);

const BattleEdge = ({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data
}) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const sourceImp = data?.sourceImp || 0;
  const targetImp = data?.targetImp || 0;
  const isForward = sourceImp >= targetImp;
  const keyPoints = isForward ? "0;1" : "1;0";

  return (
    <>
      <path
        id={id}
        style={{ ...style, stroke: '#ef4444', strokeWidth: 4 }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      <g>
        <animateMotion dur="4s" repeatCount="indefinite" path={edgePath} keyPoints={keyPoints} keyTimes="0;1" calcMode="linear" />

        <g transform="translate(0, 0)">
          <g>
            <animateTransform attributeName="transform" type="translate" values="-35,15; -5,0; -35,15" dur="1s" repeatCount="indefinite" />
            <SwordIcon />
          </g>

          <g>
            <animateTransform attributeName="transform" type="translate" values="35,-15; 5,0; 35,-15" dur="1s" repeatCount="indefinite" />
            <SwordIcon flip />
          </g>

          {/* Core Spark */}
          <circle r="15" fill="#fbbf24" opacity="0">
            <animate attributeName="opacity" values="0; 0; 1; 0" keyTimes="0; 0.8; 0.9; 1" dur="1s" repeatCount="indefinite" />
            <animate attributeName="r" values="5; 5; 20; 5" keyTimes="0; 0.8; 0.9; 1" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    </>
  );
};

export default memo(BattleEdge);