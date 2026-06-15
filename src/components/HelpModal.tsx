import { X } from 'lucide-preact';
import { Button } from './commons';
import './HelpModal.css';

interface HelpModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

function formatContent(text: string): preact.JSX.Element[] {
  return text.split('\n').filter(p => p.trim()).map((paragraph, i) => {
    const parts = paragraph.split(/(\*\*.*?\*\*)/g);
    const formatted = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return <p key={i}>{formatted}</p>;
  });
}

export function HelpModal({ title, content, onClose }: HelpModalProps) {
  return (
    <div class="help-modal-overlay" onClick={onClose}>
      <div class="help-modal" onClick={(e) => e.stopPropagation()}>
        <div class="help-modal-header">
          <h3>{title}</h3>
          <Button variant="ghost" icon={X} size="icon" onClick={onClose} aria-label="Close" />
        </div>
        <div class="help-modal-content">
          {formatContent(content)}
        </div>
      </div>
    </div>
  );
}
