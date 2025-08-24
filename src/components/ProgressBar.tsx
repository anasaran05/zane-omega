
import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

export default function ProgressBar({
  value,
  label,
  showValue = true,
  size = 'md',
  className = '',
  animate = true
}: ProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animate]);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label and Value */}
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className={`font-medium text-foreground ${textSizeClasses[size]}`}>
              {label}
            </span>
          )}
          {showValue && (
            <span className={`text-muted-foreground ${textSizeClasses[size]}`}>
              {Math.round(displayValue)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div className={`
        w-full bg-surface-elevated rounded-full overflow-hidden
        ${sizeClasses[size]}
      `}>
        {/* Progress Fill */}
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(Math.max(displayValue, 0), 100)}%`,
            transition: animate ? 'width 300ms ease-out' : 'none'
          }}
        />
      </div>
    </div>
  );
}
