import React from 'react';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'card';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  variant = 'card',
  hoverEffect = false,
  onClick
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'subtle':
        return 'liquid-glass-subtle';
      case 'default':
        return 'liquid-glass';
      case 'card':
      default:
        return 'liquid-glass-card';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl md:rounded-3xl p-5 md:p-6 
        transition-all duration-300 ease-out
        ${getVariantClass()}
        ${hoverEffect ? 'liquid-glass-card-hover cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Specular glass reflection highlight at top border */}
      <div 
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-80" 
        aria-hidden="true" 
      />
      {children}
    </div>
  );
};
