import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CharacterNode = ({ data, selected }) => {
    const size = 200 + (data.importance || 0.5) * 80;
    const isActive = data.style?.opacity !== 0.1;

    return (
        <div
            style={{
                width: `${size}px`,
                height: `${size}px`,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: selected ? '8px solid #fbbf24' : '6px solid white',
                    boxShadow: selected ? '0 0 60px rgba(251,191,36,0.8)' : '0 20px 40px rgba(0,0,0,0.6)',
                    background: 'white',
                    filter: !isActive ? 'grayscale(100%) blur(2px)' : 'none',
                    opacity: !isActive ? 0.5 : 1,
                    transition: 'border 0.2s, box-shadow 0.2s, filter 0.5s'
                }}
            >
                {data.imageUrl ? (
                    <img
                        src={data.imageUrl}
                        alt={data.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', color: '#ccc' }}>?</div>
                )}
            </div>

            {isActive && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-40px',
                        backgroundColor: 'black',
                        padding: '12px 30px',
                        borderRadius: '50px',
                        border: '2px solid #333',
                        zIndex: 100,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.9)'
                    }}
                >
                    <span style={{
                        color: 'white',
                        fontWeight: '900',
                        fontSize: '28px',
                        textTransform: 'uppercase',
                        fontFamily: 'sans-serif',
                        letterSpacing: '1px'
                    }}>
                        {data.label}
                    </span>
                </div>
            )}
        </div>
    );
};

export default memo(CharacterNode);