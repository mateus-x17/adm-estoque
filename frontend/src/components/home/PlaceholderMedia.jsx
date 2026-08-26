import React from 'react';
import { FiImage, FiPlay } from 'react-icons/fi';

const PlaceholderMedia = ({ 
  type = 'image', // 'image' or 'video'
  className = '', 
  aspectRatio = 'aspect-square',
  text = 'Media Placeholder',
  iconSize = 24,
  src = null
}) => {
  if (src) {
    if (type === 'video') {
      return (
        <video 
           src={src} 
           autoPlay 
           loop 
           muted 
           playsInline
           className={`object-cover ${aspectRatio} ${className}`}
        />
      );
    }
    return (
      <img 
         src={src} 
         alt={text} 
         className={`object-cover ${aspectRatio} ${className}`}
      />
    );
  }

  return (
    <div className={`relative flex items-center justify-center bg-gray-200 dark:bg-[#1A1A24] rounded-2xl overflow-hidden border border-[var(--color-border-light)] ${aspectRatio} ${className}`}>
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]" 
           style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
      </div>
      
      <div className="flex flex-col items-center justify-center text-text-secondary z-10 p-4 text-center">
        {type === 'video' ? (
          <div className="bg-[var(--color-surface)] p-4 rounded-full backdrop-blur-sm shadow-sm mb-2 border border-[var(--color-border-light)]">
             <FiPlay size={iconSize} className="ml-1 text-text-primary" />
          </div>
        ) : (
          <FiImage size={iconSize} className="mb-2 opacity-50 text-text-primary" />
        )}
        <span className="text-[10px] font-mono font-medium uppercase tracking-widest opacity-70">{text}</span>
      </div>
    </div>
  );
};

export default PlaceholderMedia;
