/**
 * TinoAvatar - Full Face AI Avatar Component
 * 
 * Features:
 * - 3 Avatar Types: Male Human, Female Human, Mouse Character
 * - Full face display (no circle crop)
 * - Expressions & Emotions (idle, listening, thinking, speaking, happy, curious)
 * - Lip sync animation when speaking
 * - Body animations for mouse character
 */

import React, { useEffect, useState } from 'react';

// Avatar image URLs
const AVATAR_IMAGES = {
  male: "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/zun0ltqf_file_0000000025187209a5652c1654e41827.png",
  female: "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/0xijk3by_file_00000000a4b87209bd803c4c7b66fdb1.png",
  mouse: "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/n5ydts5x_file_00000000791472098b8ae0c774846f1e.png"
};

const TinoAvatar = ({ 
  state = 'idle',  // idle, listening, thinking, speaking
  avatarType = 'mouse', // male, female, mouse
  size = 'lg',     // sm, md, lg, xl
  className = '',
  onClick,
  showLabel = true
}) => {
  const [currentExpression, setCurrentExpression] = useState('neutral');
  const [bodyAnimation, setBodyAnimation] = useState('');

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-40 h-40', image: 'max-h-36' },
    md: { container: 'w-56 h-56', image: 'max-h-52' },
    lg: { container: 'w-72 h-72', image: 'max-h-68' },
    xl: { container: 'w-96 h-96', image: 'max-h-88' }
  };

  // Update expression based on state
  useEffect(() => {
    switch (state) {
      case 'listening':
        setCurrentExpression('curious');
        setBodyAnimation('animate-avatar-listen');
        break;
      case 'thinking':
        setCurrentExpression('thinking');
        setBodyAnimation('animate-avatar-think');
        break;
      case 'speaking':
        setCurrentExpression('speaking');
        setBodyAnimation('animate-avatar-speak');
        break;
      default:
        setCurrentExpression('neutral');
        setBodyAnimation('animate-avatar-idle');
    }
  }, [state]);

  const avatarImage = AVATAR_IMAGES[avatarType] || AVATAR_IMAGES.mouse;
  const config = sizeConfig[size] || sizeConfig.lg;

  return (
    <div 
      className={`relative flex flex-col items-center justify-center ${className}`}
      data-testid="tino-avatar"
      data-state={state}
      data-avatar-type={avatarType}
      onClick={onClick}
    >
      {/* Background Glow Effects */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer ambient glow */}
        <div 
          className={`absolute rounded-full blur-3xl transition-all duration-500 ${
            state === 'speaking' ? 'w-80 h-80 bg-blue-500/30 animate-pulse-speak' :
            state === 'listening' ? 'w-72 h-72 bg-cyan-400/30 animate-pulse-fast' :
            state === 'thinking' ? 'w-64 h-64 bg-indigo-500/25 animate-spin-slow' :
            'w-56 h-56 bg-blue-400/20 animate-breathe'
          }`}
        />
        
        {/* Sound waves for speaking */}
        {state === 'speaking' && (
          <>
            <div className="absolute w-80 h-80 rounded-full border-2 border-blue-400/30 animate-wave-1" />
            <div className="absolute w-96 h-96 rounded-full border border-cyan-400/20 animate-wave-2" />
          </>
        )}
        
        {/* Listening indicator rings */}
        {state === 'listening' && (
          <>
            <div className="absolute w-72 h-72 rounded-full border-2 border-cyan-400/40 animate-ping-slow" />
            <div className="absolute w-80 h-80 rounded-full border border-blue-400/30 animate-ping-slower" />
          </>
        )}
      </div>

      {/* Main Avatar Container - NO CIRCLE CROP */}
      <div 
        className={`relative ${config.container} flex items-center justify-center cursor-pointer transition-transform duration-300 ${
          state === 'listening' ? 'scale-105' :
          state === 'speaking' ? 'scale-103' :
          'scale-100'
        }`}
      >
        {/* Avatar Image - Full display, no circular crop */}
        <img 
          src={avatarImage}
          alt={`Tino AI ${avatarType}`}
          className={`${config.image} w-auto object-contain transition-all duration-300 drop-shadow-2xl ${bodyAnimation} ${
            state === 'speaking' ? 'brightness-110 animate-avatar-speak' :
            state === 'listening' ? 'brightness-105' :
            state === 'thinking' ? 'brightness-95 saturate-110' :
            ''
          }`}
          style={{
            filter: state === 'speaking' 
              ? 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.5))' 
              : state === 'listening'
              ? 'drop-shadow(0 0 25px rgba(6, 182, 212, 0.4))'
              : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
          }}
        />

        {/* Expression Overlay - Lip Sync for Speaking */}
        {state === 'speaking' && (
          <div className="absolute inset-0 flex items-end justify-center pb-[25%]">
            <div className="flex gap-0.5 items-end">
              <div className="w-1 bg-blue-400/60 rounded-full animate-speak-bar-1" style={{ height: '6px' }} />
              <div className="w-1 bg-blue-400/60 rounded-full animate-speak-bar-2" style={{ height: '10px' }} />
              <div className="w-1 bg-blue-400/60 rounded-full animate-speak-bar-3" style={{ height: '8px' }} />
              <div className="w-1 bg-blue-400/60 rounded-full animate-speak-bar-2" style={{ height: '12px' }} />
              <div className="w-1 bg-blue-400/60 rounded-full animate-speak-bar-1" style={{ height: '6px' }} />
            </div>
          </div>
        )}

        {/* Listening Sound Bars */}
        {state === 'listening' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-0.5 items-end">
            <div className="w-1.5 bg-cyan-400/80 rounded-full animate-sound-bar-1" style={{ height: '8px' }} />
            <div className="w-1.5 bg-cyan-400/80 rounded-full animate-sound-bar-2" style={{ height: '14px' }} />
            <div className="w-1.5 bg-cyan-400/80 rounded-full animate-sound-bar-3" style={{ height: '6px' }} />
            <div className="w-1.5 bg-cyan-400/80 rounded-full animate-sound-bar-1" style={{ height: '12px' }} />
            <div className="w-1.5 bg-cyan-400/80 rounded-full animate-sound-bar-2" style={{ height: '10px' }} />
          </div>
        )}

        {/* Thinking Spinner */}
        {state === 'thinking' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute bottom-8 w-8 h-8 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* State Label */}
      {showLabel && (
        <div className="mt-2 whitespace-nowrap">
          <span className={`text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg transition-all ${
            state === 'listening' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' :
            state === 'speaking' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
            state === 'thinking' ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white' :
            'bg-white/90 text-slate-700 border border-slate-200'
          }`}>
            {state === 'listening' ? '🎤 सुन रहा हूं...' :
             state === 'speaking' ? '🗣️ बोल रहा हूं...' :
             state === 'thinking' ? '🧠 सोच रहा हूं...' :
             `✨ Tino AI`}
          </span>
        </div>
      )}
    </div>
  );
};

export default TinoAvatar;
