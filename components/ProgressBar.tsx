
import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = true,
  label,
  animated = true,
  className = ''
}: ProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className={`font-medium text-foreground ${labelSizeClasses[size]}`}>
            {label || 'Progress'}
          </span>
          <span className={`font-medium text-muted-foreground ${labelSizeClasses[size]}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={`theme-progress-track ${sizeClasses[size]}`}>
        <div
          className={`theme-progress-fill ${animated ? 'transition-all duration-500 ease-out' : ''}`}
          style={{ 
            width: `${displayValue}%`,
            '--progress-width': `${displayValue}%`
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

// Specialized progress components
export function XPProgressBar({ 
  currentXP, 
  nextLevelXP, 
  level, 
  className = '' 
}: { 
  currentXP: number; 
  nextLevelXP: number; 
  level: number; 
  className?: string; 
}) {
  const percentage = (currentXP / nextLevelXP) * 100;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">
          Level {level}
        </span>
        <span className="text-sm text-muted-foreground">
          {currentXP} / {nextLevelXP} XP
        </span>
      </div>
      
      <div className="theme-progress-track h-2">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function CircularProgress({ 
  value, 
  size = 48, 
  strokeWidth = 4, 
  className = '' 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number; 
  className?: string; 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--surface-elevated))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-foreground">
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}
