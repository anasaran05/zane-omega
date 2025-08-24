
import { useState, useEffect } from 'react';
import { ExternalLink, Check, FileText, Form } from 'lucide-react';

interface TaskResourceButtonProps {
  title: string;
  url: string;
  type: 'pdf' | 'form' | 'link';
  taskId: string;
  resourceId: string;
  required?: boolean;
  onVisited?: (resourceId: string) => void;
  className?: string;
}

export default function TaskResourceButton({
  title,
  url,
  type,
  taskId,
  resourceId,
  required = true,
  onVisited,
  className = ''
}: TaskResourceButtonProps) {
  const [isVisited, setIsVisited] = useState(false);

  // Check if this resource was previously visited
  useEffect(() => {
    const visitedKey = `task_${taskId}_resource_${resourceId}_visited`;
    const wasVisited = sessionStorage.getItem(visitedKey) === 'true';
    setIsVisited(wasVisited);
  }, [taskId, resourceId]);

  const handleClick = () => {
    // Mark as visited before opening
    const visitedKey = `task_${taskId}_resource_${resourceId}_visited`;
    sessionStorage.setItem(visitedKey, 'true');
    setIsVisited(true);
    
    // Notify parent component
    onVisited?.(resourceId);
    
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getIcon = () => {
    if (isVisited) {
      return <Check className="w-5 h-5 text-success-foreground" />;
    }
    
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'form':
        return <Form className="w-5 h-5" />;
      default:
        return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'pdf':
        return 'PDF Document';
      case 'form':
        return 'Fillable Form';
      default:
        return 'External Link';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        theme-resource-button group w-full text-left
        ${isVisited ? 'visited' : ''}
        ${className}
      `}
      aria-label={`Open ${title} in new tab`}
    >
      <div className="flex items-center gap-3">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
          ${isVisited 
            ? 'bg-success text-success-foreground' 
            : 'bg-surface text-muted-foreground group-hover:text-foreground'
          }
        `}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`
              font-medium text-sm truncate
              ${isVisited ? 'text-success-foreground' : 'text-foreground'}
            `}>
              {title}
            </h4>
            {required && !isVisited && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                Required
              </span>
            )}
          </div>
          
          <p className={`
            text-xs mt-1
            ${isVisited ? 'text-success-foreground/80' : 'text-muted-foreground'}
          `}>
            {getTypeLabel()} • Opens in new tab
          </p>
        </div>
        
        <div className={`
          flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1
          ${isVisited ? 'text-success-foreground' : 'text-muted-foreground'}
        `}>
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>
      
      {isVisited && (
        <div className="mt-3 p-2 bg-success/10 rounded-lg border border-success/20">
          <div className="flex items-center gap-2 text-success-foreground">
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
        </div>
      )}
    </button>
  );
}

// Specialized resource button variants
export function PDFResourceButton(props: Omit<TaskResourceButtonProps, 'type'>) {
  return <TaskResourceButton type="pdf" {...props} />;
}

export function FormResourceButton(props: Omit<TaskResourceButtonProps, 'type'>) {
  return <TaskResourceButton type="form" {...props} />;
}

export function LinkResourceButton(props: Omit<TaskResourceButtonProps, 'type'>) {
  return <TaskResourceButton type="link" {...props} />;
}
