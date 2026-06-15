import { Modal } from './commons';

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
        return <strong key={j} class="text-[var(--color-text-primary)] font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <p key={i} class="m-0 mb-[var(--spacing-md)] last:mb-0 text-[length:var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed">
        {formatted}
      </p>
    );
  });
}

export function HelpModal({ title, content, onClose }: HelpModalProps) {
  return (
    <Modal onClose={onClose} maxWidth="sm">
      <Modal.Header title={title} onClose={onClose} />
      <Modal.Body>{formatContent(content)}</Modal.Body>
    </Modal>
  );
}
