'use client';

import { useState } from 'react';

interface DescriptionSection {
  title: string;
  content: string;
  htmlContent?: string; // For sections that contain HTML like tables
}

interface CollapsibleDescriptionProps {
  description: string;
  descriptionHtml?: string;
}

// Parse HTML description into sections based on bold tags
function parseDescriptionHtml(html: string): DescriptionSection[] {
  const sections: DescriptionSection[] = [];

  // Parse HTML
  if (typeof window === 'undefined') {
    // Server-side fallback - simple regex approach
    const boldMatches = html.match(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi);
    if (boldMatches) {
      let remainingHtml = html;
      boldMatches.forEach((match, index) => {
        const title = match.replace(/<\/?(?:strong|b)>/gi, '').trim();
        const nextMatch = boldMatches[index + 1];
        const startIndex = remainingHtml.indexOf(match) + match.length;
        const endIndex = nextMatch ? remainingHtml.indexOf(nextMatch) : remainingHtml.length;
        const content = remainingHtml
          .substring(startIndex, endIndex)
          .replace(/<[^>]*>/g, '')
          .trim();

        if (title && content) {
          sections.push({ title, content });
        }
        remainingHtml = remainingHtml.substring(startIndex);
      });
    }
    return sections.length > 0 ? sections : [{ title: 'Details', content: html.replace(/<[^>]*>/g, '') }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Helper function to check if element or its children have bold styling
  const hasBoldStyling = (element: HTMLElement): boolean => {
    // Check for strong/b tags
    if (element.tagName === 'STRONG' || element.tagName === 'B') {
      return true;
    }

    // Check for font-weight in style attribute
    const style = element.getAttribute('style');
    if (style && /font-weight:\s*(700|bold|bolder)/i.test(style)) {
      return true;
    }

    return false;
  };

  // Find all elements with bold styling (including nested spans)
  const allElements = doc.body.querySelectorAll('*');
  const boldElements: HTMLElement[] = [];

  allElements.forEach(el => {
    const element = el as HTMLElement;
    if (hasBoldStyling(element)) {
      // Make sure this isn't a child of another bold element we already found
      const isNested = boldElements.some(parent => parent.contains(element));
      if (!isNested) {
        const text = element.textContent?.trim() || '';
        // Only consider non-empty short text as titles (< 50 chars), longer text is likely content
        if (text.length > 0 && text.length < 50) {
          boldElements.push(element);
        }
      }
    }
  });

  // Process each bold element as a section title
  boldElements.forEach((boldEl, index) => {
    const title = boldEl.textContent?.trim() || '';

    if (!title) return;

    // Find content between this bold element and the next one
    let content = '';

    // Start from the bold element's next sibling
    let currentNode: Node | null = boldEl.nextSibling;

    // If no next sibling, try parent's next sibling (up to 5 levels)
    let searchElement: HTMLElement | null = boldEl;
    let parentLevel = 0;
    while (!currentNode && searchElement?.parentElement && parentLevel < 5) {
      currentNode = searchElement.parentElement.nextSibling;
      searchElement = searchElement.parentElement;
      parentLevel++;
    }

    const nextBoldEl = boldElements[index + 1];
    let htmlContent = '';
    let hasTable = false;

    while (currentNode) {
      // Stop if we hit the next bold element
      if (nextBoldEl && (currentNode === nextBoldEl || currentNode.contains(nextBoldEl))) {
        break;
      }

      if (currentNode.nodeType === Node.TEXT_NODE) {
        const text = currentNode.textContent?.replace(/\s+/g, ' ').trim() || '';
        if (text) {
          content += (content ? '\n' : '') + text;
        }
      } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;

        // Skip if this element is or contains a bold element
        const containsBold = boldElements.some(b => element === b || element.contains(b));
        if (containsBold) {
          break;
        }

        // Check if this is a table - if so, preserve the HTML
        if (element.tagName === 'TABLE') {
          hasTable = true;
          htmlContent = element.outerHTML;
          // Get text content for fallback
          content = element.textContent?.trim() || '';
          break; // Table is the content, stop here
        }

        // Handle BR tags as line breaks
        if (element.tagName === 'BR') {
          content += '\n';
        } else {
          // Get all text from this element, preserving line breaks from BR tags
          const clone = element.cloneNode(true) as HTMLElement;

          // Replace BR tags with newline markers
          clone.querySelectorAll('br').forEach(br => {
            const textNode = document.createTextNode('\n');
            br.replaceWith(textNode);
          });

          const text = clone.textContent || '';
          if (text.trim()) {
            // Preserve all lines, including empty ones for spacing
            const lines = text.split('\n');
            const processedLines = lines.map(l => l.trim());

            // Add to content, preserving structure
            if (content && !content.endsWith('\n')) {
              content += '\n';
            }
            content += processedLines.join('\n');
          }
        }
      }

      // Move to next sibling, or parent's next sibling if needed
      if (currentNode.nextSibling) {
        currentNode = currentNode.nextSibling;
      } else if (currentNode.parentElement && currentNode.parentElement !== doc.body) {
        currentNode = currentNode.parentElement.nextSibling;
      } else {
        break;
      }
    }

    if (content.trim() || htmlContent) {
      sections.push({
        title: title,
        content: content.trim(),
        htmlContent: hasTable ? htmlContent : undefined
      });
    }
  });

  // If no sections found, create a default one
  if (sections.length === 0) {
    const text = doc.body.textContent?.trim() || '';
    if (text) {
      sections.push({
        title: 'Details',
        content: text
      });
    }
  }

  return sections;
}

// Fallback parser for plain text
function parseDescriptionText(description: string): DescriptionSection[] {
  return [{
    title: 'Description',
    content: description
  }];
}

// Check if content contains HTML table and extract it
function extractHtmlTable(html: string): string | null {
  if (typeof window === 'undefined') return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');

  return table ? table.outerHTML : null;
}

// Parse size chart content into table data (fallback for text format)
function parseSizeChart(content: string): { size: string; measurements: string[] }[] | null {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  // Common size keywords
  const sizeKeywords = ['small', 'medium', 'large', 'x-large', 'xl', 'xxl', '2xl', 'xs', 's', 'm', 'l'];
  const sizes: { size: string; measurements: string[] }[] = [];
  let currentSize: { size: string; measurements: string[] } | null = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if this line is a size name
    const isSize = sizeKeywords.some(keyword =>
      lowerLine === keyword ||
      lowerLine.startsWith(keyword + ' ') ||
      lowerLine === keyword.replace('-', '')
    );

    if (isSize) {
      // Save previous size if exists
      if (currentSize && currentSize.measurements.length > 0) {
        sizes.push(currentSize);
      }
      // Start new size
      currentSize = { size: line, measurements: [] };
    } else if (currentSize) {
      // Add measurement to current size
      currentSize.measurements.push(line);
    }
  }

  // Add last size
  if (currentSize && currentSize.measurements.length > 0) {
    sizes.push(currentSize);
  }

  return sizes.length > 0 ? sizes : null;
}

function CollapsibleSection({ title, content, htmlContent, defaultOpen = false }: DescriptionSection & { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Check if this is a size chart
  const isSizeChart = title.toLowerCase().includes('size') && title.toLowerCase().includes('chart');
  const sizeData = !htmlContent && isSizeChart ? parseSizeChart(content) : null;

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 text-left sm:py-4"
      >
        <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
          {title}
        </h3>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-600 transition-transform duration-200 sm:h-5 sm:w-5 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="pb-3 sm:pb-4">
          {htmlContent ? (
            // Display HTML content (e.g., tables from Shopify)
            <div
              className="size-chart-table overflow-x-auto text-xs sm:text-sm"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : sizeData ? (
            // Display as parsed table (fallback)
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="px-2 py-2 text-left font-semibold text-gray-900 sm:px-3">Size</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-900 sm:px-3">Measurements</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-200 last:border-b-0">
                      <td className="px-2 py-2 font-medium text-gray-900 sm:px-3">{row.size}</td>
                      <td className="px-2 py-2 text-gray-700 sm:px-3">
                        {row.measurements.map((m, j) => (
                          <div key={j}>{m}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Display as regular text
            <div className="space-y-1 text-xs leading-relaxed text-gray-700 sm:text-sm">
              {content.split('\n').map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line.trim() || '\u00A0'}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CollapsibleDescription({ description, descriptionHtml }: CollapsibleDescriptionProps) {
  const sections = descriptionHtml
    ? parseDescriptionHtml(descriptionHtml)
    : parseDescriptionText(description);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div>
      {sections.map((section, index) => (
        <CollapsibleSection
          key={index}
          title={section.title}
          content={section.content}
          htmlContent={section.htmlContent}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
}
