import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

const CharacterNode = ({ data, selected }) => {
    const size = 140 + (data.importance || 0.5) * 160;
    const isActive = data.style?.opacity !== 0.1;

    const isThinking = data.isThinking;
    const mood = data.mood || 'neutral';

    const baseImage = data.imageUrl;
    let targetImage = baseImage;

    if (mood === 'happy') {
        targetImage = baseImage?.replace('.png', '_happy.png').replace('.jpg', '_happy.jpg');
    } else if (mood === 'sad') {
        targetImage = baseImage?.replace('.png', '_sad.png').replace('.jpg', '_sad.jpg');
    } else if (mood === 'angry') {
        targetImage = baseImage?.replace('.png', '_angry.png').replace('.jpg', '_angry.jpg');
    }

    const [currentSrc, setCurrentSrc] = useState(targetImage);

    useEffect(() => {
        setCurrentSrc(targetImage);
    }, [targetImage]);

    const handleError = () => {
        if (currentSrc !== baseImage) {
            setCurrentSrc(baseImage);
        }
    };

    let borderColor = selected ? '#fbbf24' : 'white';
    let imageTransform = 'scale(1)';

    if (mood === 'sad') {
        borderColor = '#94a3b8';
    } else if (mood === 'happy') {
        borderColor = '#10b981';
        imageTransform = 'scale(1.05)';
    } else if (mood === 'angry') {
        borderColor = '#ef4444';
        imageTransform = 'scale(1.1)';
    }

    if (isThinking) borderColor = '6px dashed #fff';

    const borderRadius = isThinking
        ? '50% 50% 50% 50% / 60% 60% 40% 40%'
        : '50%';

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

            {/* CLOUDS: RESTORED TO MEDIUM SIZE & POSITION */}
            {isActive && isThinking && (
                <div style={{ position: 'absolute', top: -35, right: -25, zIndex: 5, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', bottom: 10, left: -20, width: 12, height: 12, borderRadius: '50%', background: 'white', opacity: 0.8 }} />
                    <div style={{ position: 'absolute', bottom: 25, left: -10, width: 20, height: 20, borderRadius: '50%', background: 'white', opacity: 0.9 }} />
                    {/* Medium Cloud (60x45) */}
                    <div style={{
                        position: 'absolute', bottom: 45, left: 0,
                        width: 60, height: 45, background: 'white', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                        animation: 'float 2s infinite ease-in-out'
                    }}>
                        <span style={{ fontSize: '24px', color: '#64748b', fontWeight: 'bold' }}>...</span>
                    </div>
                    <style>{`@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }`}</style>
                </div>
            )}

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: borderRadius,
                    overflow: 'hidden',
                    border: isActive ? `6px solid ${borderColor}` : '6px solid white',
                    boxShadow: selected ? '0 0 60px rgba(251,191,36,0.8)' : '0 20px 40px rgba(0,0,0,0.6)',
                    background: 'white',
                    opacity: !isActive ? 0.5 : 1,
                    transition: 'all 0.5s ease',
                    transform: isThinking ? 'translateY(-10px)' : 'none'
                }}
            >
                {currentSrc ? (
                    <img
                        src={currentSrc}
                        alt={data.label}
                        onError={handleError}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: !isActive ? 'grayscale(100%) blur(2px)' : 'none',
                            transform: imageTransform,
                            transition: 'transform 0.5s ease'
                        }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', color: '#ccc' }}>?</div>
                )}
            </div>

            {isActive && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: isThinking ? '-60px' : '-40px',
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
                        fontSize: '24px',
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