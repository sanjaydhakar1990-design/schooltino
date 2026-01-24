/**
 * TinoFace - AI Face Component with Lip Sync
 * Displays male/female AI face with animated speaking effect
 */

import React from 'react';

// Face image URLs
const TINO_FACES = {
  male: "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/zun0ltqf_file_0000000025187209a5652c1654e41827.png",
  female: "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/0xijk3by_file_00000000a4b87209bd803c4c7b66fdb1.png"
};

const TinoFace = ({ 
  state = 'idle',  // idle, listening, thinking, speaking
  gender = 'male', // male, female
  size = 'md',     // sm, md, lg, xl
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };

  const faceImage = gender === 'female' ? TINO_FACES.female : TINO_FACES.male;

  return (
    <div 
      className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}
      data-testid="tino-face"
      data-state={state}
      data-gender={gender}
      onClick={onClick}
    >
      {/* Outer Glow Ring */}
      <div 
        className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
          state === 'speaking' ? 'bg-blue-500/40 animate-pulse-speak scale-110' :
          state === 'listening' ? 'bg-cyan-400/40 animate-pulse-fast scale-105' :
          state === 'thinking' ? 'bg-indigo-500/30 animate-spin-slow' :
          'bg-blue-400/20 animate-breathe'
        }`}
      />

      {/* Animated Ring Effects */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping-slow" />
          <div className="absolute inset-2 rounded-full border border-cyan-400/30 animate-ping-slower" />
          <div className="absolute inset-4 rounded-full border border-blue-300/20 animate-ping-slowest" />
        </>
      )}

      {/* Sound Wave Effect for Speaking */}
      {state === 'speaking' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-full h-full rounded-full border-2 border-blue-400/30 animate-wave-1" />
          <div className="absolute w-full h-full rounded-full border-2 border-cyan-300/25 animate-wave-2" />
          <div className="absolute w-full h-full rounded-full border-2 border-blue-300/20 animate-wave-3" />
        </div>
      )}

      {/* Main Face Container */}
      <div 
        className={`relative rounded-full overflow-hidden shadow-2xl transition-all duration-300 ${
          state === 'speaking' ? 'scale-105' :
          state === 'listening' ? 'scale-102' :
          'scale-100'
        }`}
        style={{
          width: '85%',
          height: '85%',
          boxShadow: state === 'speaking' 
            ? '0 0 60px rgba(59, 130, 246, 0.5), 0 0 100px rgba(6, 182, 212, 0.3)'
            : state === 'listening'
            ? '0 0 50px rgba(6, 182, 212, 0.5), 0 0 80px rgba(59, 130, 246, 0.3)'
            : '0 0 40px rgba(59, 130, 246, 0.3)'
        }}
      >
        {/* Face Image */}
        <img 
          src={faceImage}
          alt={`Tino AI ${gender}`}
          className={`w-full h-full object-cover transition-all duration-300 ${
            state === 'speaking' ? 'animate-face-speak' :
            state === 'listening' ? 'brightness-110' :
            state === 'thinking' ? 'brightness-90 saturate-110' :
            ''
          }`}
        />

        {/* Lip Sync Overlay - Subtle glow on mouth area when speaking */}
        {state === 'speaking' && (
          <div 
            className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-1/3 h-[15%] bg-blue-400/20 rounded-full blur-md animate-lip-sync"
          />
        )}

        {/* Listening Indicator */}
        {state === 'listening' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-1.5 h-4 bg-cyan-400 rounded-full animate-sound-bar-1" />
            <div className="w-1.5 h-6 bg-cyan-400 rounded-full animate-sound-bar-2" />
            <div className="w-1.5 h-3 bg-cyan-400 rounded-full animate-sound-bar-3" />
            <div className="w-1.5 h-5 bg-cyan-400 rounded-full animate-sound-bar-1" />
            <div className="w-1.5 h-4 bg-cyan-400 rounded-full animate-sound-bar-2" />
          </div>
        )}

        {/* Thinking Overlay */}
        {state === 'thinking' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
            <div className="w-10 h-10 border-3 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* State Label */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg transition-all ${
          state === 'listening' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' :
          state === 'speaking' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
          state === 'thinking' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' :
          'bg-white/90 text-slate-700 border border-slate-200'
        }`}>
          {state === 'listening' ? '🎤 सुन रहा हूं...' :
           state === 'speaking' ? '🗣️ बोल रहा हूं...' :
           state === 'thinking' ? '🧠 सोच रहा हूं...' :
           `✨ Tino AI ${gender === 'female' ? '(Female)' : '(Male)'}`}
        </span>
      </div>
    </div>
  );
};

export default TinoFace;
