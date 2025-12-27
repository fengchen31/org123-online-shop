import clsx from 'clsx';

interface ProseProps {
  html: string;
  className?: string;
}

export default function Prose({ html, className }: ProseProps) {
  // Clean up HTML: remove leading underscores and extra blank lines
  let cleanedHtml = html;

  // Remove ALL <br> tags first (before other processing)
  cleanedHtml = cleanedHtml.replace(/<br\s*\/?>/gi, '');

  // Remove ALL underscores (very aggressive - remove any underscore character)
  cleanedHtml = cleanedHtml.replace(/_/g, '');

  // Strip margin-bottom from inline styles
  cleanedHtml = cleanedHtml.replace(/margin-bottom:\s*\d+px;?/gi, '');

  // Clean up empty style attributes
  cleanedHtml = cleanedHtml.replace(/style=["'][\s;]*["']/gi, '');

  // Remove paragraphs that only contain whitespace
  cleanedHtml = cleanedHtml.replace(/<p[^>]*>[\s\n]*<\/p>/gi, '');

  // Remove divs that only contain whitespace
  cleanedHtml = cleanedHtml.replace(/<div[^>]*>[\s\n]*<\/div>/gi, '');

  return (
    <div
      className={clsx(
        'prose prose-sm dark:prose-invert max-w-none',
        // Add custom spacing controls - remove all margins
        '[&_p]:!m-0 [&_div]:!m-0 [&_span]:!m-0',
        className
      )}
      dangerouslySetInnerHTML={{ __html: cleanedHtml }}
    />
  );
}
