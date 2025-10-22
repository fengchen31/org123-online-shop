import clsx from 'clsx';

interface ProseProps {
  html: string;
  className?: string;
}

export default function Prose({ html, className }: ProseProps) {
  return (
    <div
      className={clsx(
        'prose prose-sm dark:prose-invert max-w-none',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
