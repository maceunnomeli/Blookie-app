import React, { memo } from 'react';
import { getBezierPath } from 'reactflow';

// Native SVG structure for seamless transformations
const PersonIcon = ({ color, flip }) => (
  <g transform={flip ? "scale(-1, 1)" : ""}>
    <g transform="translate(-12, -12) scale(1.5)">
      <circle cx="12" cy="8" r="4" fill={color} />
      <path d="M12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" fill={color} />
      <path d="M16 16 C 19 16, 22 14, 23 11" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
  </g>
);

const FriendshipEdge = ({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data
}) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  // Math to determine direction of travel based on importance
  const sourceImp = data?.sourceImp || 0;
  const targetImp = data?.targetImp || 0;

  // If source is more important (or equal), travel from Source -> Target (0 to 1)
  // Otherwise travel from Target -> Source (1 to 0)
  const isForward = sourceImp >= targetImp;
  const keyPoints = isForward ? "0;1" : "1;0";

  return (
    <>
      <path
        id={id}
        style={{ ...style, stroke: '#10b981', strokeWidth: 4, strokeDasharray: '8,4' }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* Trajectory Engine */}
      <g>
        <animateMotion dur="5s" repeatCount="indefinite" path={edgePath} keyPoints={keyPoints} keyTimes="0;1" calcMode="linear" />

        {/* Centers the animation on the travel path */}
        <g transform="translate(0, -20)">

          <g>
            <animateTransform attributeName="transform" type="translate" values="-20,0; -5,0; -5,0; -20,0" keyTimes="0; 0.4; 0.6; 1" dur="2s" repeatCount="indefinite" />
            <PersonIcon color="#10b981" />
          </g>

          <g>
            <animateTransform attributeName="transform" type="translate" values="20,0; 5,0; 5,0; 20,0" keyTimes="0; 0.4; 0.6; 1" dur="2s" repeatCount="indefinite" />
            <PersonIcon color="#34d399" flip />
          </g>

          <text y="-15" fontSize="24" textAnchor="middle">
            <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.4; 0.6; 1" dur="2s" repeatCount="indefinite" />
            ✨
          </text>
        </g>
      </g>
    </>
  );
};

export default memo(FriendshipEdge);