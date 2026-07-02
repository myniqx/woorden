import { marked } from 'marked';

marked.use({ breaks: true });

interface Props {
  content: string;
  class?: string;
}

export function Markdown({ content, class: className }: Props) {
  return (
    <div
      class={`leading-relaxed
        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:text-text-primary
        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-text-primary
        [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:mb-1 [&_h4]:text-text-secondary
        [&_p]:mb-3
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:mb-4
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-4
        [&_li]:text-text-primary
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
        [&_strong]:font-semibold [&_strong]:text-text-primary
        [&_em]:text-primary [&_em]:not-italic [&_em]:font-medium
        [&_code]:bg-surface-elevated [&_code]:text-text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-sm [&_code]:text-xs [&_code]:font-mono
        [&_pre]:bg-surface-elevated [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs [&_pre_code]:font-mono
        [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-3 [&_blockquote]:text-text-secondary [&_blockquote]:text-xs
        [&_blockquote_p]:m-0
        [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:mb-3 [&_table]:border-collapse [&_table]:text-xs
        [&_th]:border [&_th]:border-border [&_th]:bg-surface-elevated [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-text-primary [&_th]:whitespace-nowrap
        [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_td]:text-text-primary
        ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }}
    />
  );
}
