import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';

const CharacterNode = ({ id, data, selected }) => {
    const size = 100 + (data.importance || 0.5) * 300;
    const scaleRatio = size / 250;

    const isActive = data.style?.opacity !== 0.1;
    const isThinking = data.isThinking;
    const mood = data.mood || 'neutral';

    const isSummaryMode = data.isSummaryMode;
    const isThisAudioPlaying = data.activeAudioId === id;
    const audioRef = useRef(null);

    // --- THE BULLETPROOF AUDIO FIX ---
    // Convert both ID and Label to lowercase for fuzzy matching
    const normalizedId = String(id).toLowerCase();
    const normalizedLabel = String(data.label || '').toLowerCase();

    // Fuzzy check: if it says "alice" or "queen" anywhere in the ID or Label
    const isAlice = normalizedId.includes('alice') || normalizedLabel.includes('alice');
    const isQueen = normalizedId.includes('queen') || normalizedLabel.includes('queen');

    const hasAudio = isAlice || isQueen;

    // Set the exact file name you verified
    let audioFileName = '';
    if (isAlice) audioFileName = 'alice.mp3';
    if (isQueen) audioFileName = 'queen_of_hearts.mp3';

    // Removed the leading slash to prevent Vite routing bugs
    const audioFilePath = audioFileName;

    // --- IMAGE SWAPPER ---
    const rawImage = data.imageUrl || '';
    const cleanImage = rawImage.replace(/_(happy|sad|angry)/i, '');

    let targetImage = cleanImage;
    if (mood !== 'neutral' && cleanImage) {
        const extMatch = cleanImage.match(/\.(png|jpe?g|svg|webp)$/i);
        if (extMatch) {
            targetImage = cleanImage.replace(extMatch[0], `_${mood}${extMatch[0]}`);
        } else {
            targetImage = `${cleanImage}_${mood}`;
        }
    }

    const [currentSrc, setCurrentSrc] = useState(targetImage);

    useEffect(() => {
        setCurrentSrc(targetImage);
    }, [targetImage]);

    // --- AUDIO LOGIC ---
    useEffect(() => {
        if (!audioRef.current) return;

        if (isThisAudioPlaying) {
            audioRef.current.play().catch(err => console.warn("Playback blocked or file missing:", err));
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [isThisAudioPlaying]);

    const toggleAudio = (e) => {
        e.stopPropagation();
        if (isThisAudioPlaying) {
            data.setActiveAudioId(null);
        } else {
            data.setActiveAudioId(id);
        }
    };

    const handleAudioEnded = () => {
        data.setActiveAudioId(null);
    };

    const handleError = () => {
        if (currentSrc !== cleanImage) {
            setCurrentSrc(cleanImage);
        }
    };

    // --- VISUALS ---
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

            {/* AUDIO ELEMENT */}
            {hasAudio && (
                <audio
                    ref={audioRef}
                    src={audioFilePath}
                    onEnded={handleAudioEnded}
                />
            )}

            {/* THOUGHT CLOUDS */}
            {isActive && isThinking && (
                <div style={{
                    position: 'absolute',
                    top: -20 * scaleRatio,
                    right: -50 * scaleRatio,
                    zIndex: 5,
                    pointerEvents: 'none',
                    transform: `scale(${scaleRatio})`,
                    transformOrigin: 'bottom left'
                }}>
                    <div style={{ position: 'absolute', bottom: 10, left: -40, width: 25, height: 25, borderRadius: '50%', background: 'white', opacity: 0.8 }} />
                    <div style={{ position: 'absolute', bottom: 40, left: -20, width: 45, height: 45, borderRadius: '50%', background: 'white', opacity: 0.9 }} />

                    <div style={{
                        position: 'absolute', bottom: 80, left: 0,
                        width: 120, height: 90, background: 'white', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        animation: 'float 2s infinite ease-in-out'
                    }}>
                        <span style={{ fontSize: '50px', color: '#64748b', fontWeight: 'bold', marginTop: '-10px' }}>...</span>
                    </div>
                    <style>{`@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }`}</style>
                </div>
            )}

            {/* MAIN IMAGE WRAPPER */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    borderRadius: borderRadius,
                    border: isActive ? `${6 * scaleRatio}px solid ${borderColor}` : `${6 * scaleRatio}px solid white`,
                    boxShadow: selected ? '0 0 60px rgba(251,191,36,0.8)' : '0 20px 40px rgba(0,0,0,0.6)',
                    background: 'white',
                    opacity: !isActive ? 0.5 : 1,
                    transition: 'all 0.5s ease',
                    transform: isThinking ? 'translateY(-10px)' : 'none'
                }}
            >
                {/* INNER IMAGE */}
                <div style={{ width: '100%', height: '100%', borderRadius: borderRadius, overflow: 'hidden' }}>
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

                {/* SPEAKER BUTTON */}
                {isSummaryMode && hasAudio && (
                    <button
                        onClick={toggleAudio}
                        style={{
                            position: 'absolute',
                            top: '12%',
                            right: '12%',
                            width: `${35 * scaleRatio}px`,
                            height: `${35 * scaleRatio}px`,
                            borderRadius: '50%',
                            background: isThisAudioPlaying ? '#10b981' : 'rgba(30, 41, 59, 0.85)',
                            border: `2px solid ${isThisAudioPlaying ? '#fff' : '#475569'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: `${18 * scaleRatio}px`,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            zIndex: 110,
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(4px)'
                        }}
                        title={`Play ${data.label}'s summary`}
                    >
                        {isThisAudioPlaying ? '🔊' : '🔈'}
                    </button>
                )}
            </div>

            {/* LABEL */}
            {isActive && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: isThinking ? `${-60 * scaleRatio}px` : `${-40 * scaleRatio}px`,
                        backgroundColor: 'black',
                        padding: `${12 * scaleRatio}px ${30 * scaleRatio}px`,
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
                        fontSize: `${24 * scaleRatio}px`,
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