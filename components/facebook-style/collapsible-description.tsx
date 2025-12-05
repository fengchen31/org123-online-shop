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

  console.log('=== PARSING HTML ===');
  console.log('Original HTML:', html);

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
        // Check if this element has direct text that could be a title
        // We need to check child nodes to see if there's a short title before nested content
        let hasShortTitle = false;
        let directText = '';

        element.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            directText += node.textContent || '';
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const childStyle = el.getAttribute('style');
            // If child has font-weight: 400, it's content not title
            if (!childStyle || !/font-weight:\s*(400|normal)/i.test(childStyle)) {
              directText += el.textContent || '';
            }
          }
        });

        directText = directText.trim();
        if (directText.length > 0 && directText.length < 50) {
          hasShortTitle = true;
        }

        // Also accept elements with textContent < 50 if they don't contain nested font-weight: 400
        const text = element.textContent?.trim() || '';
        const hasNestedNormalWeight = Array.from(element.querySelectorAll('*')).some(child => {
          const childStyle = (child as HTMLElement).getAttribute('style');
          return childStyle && /font-weight:\s*(400|normal)/i.test(childStyle);
        });

        if (hasShortTitle || (text.length > 0 && text.length < 50 && !hasNestedNormalWeight)) {
          boldElements.push(element);
        }
      }
    }
  });

  // Process each bold element as a section title
  boldElements.forEach((boldEl, index) => {
    // Extract only the direct text nodes of the bold element, not nested elements with different font-weight
    let title = '';
    boldEl.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        title += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        // Only include text from child elements that maintain bold styling
        const childStyle = el.getAttribute('style');
        if (!childStyle || !/font-weight:\s*(400|normal)/i.test(childStyle)) {
          // This child doesn't override to normal weight, include its text
          title += el.textContent || '';
        }
      }
    });
    title = title.trim();

    if (!title) return;

    // Find content between this bold element and the next one
    let content = '';

    // First, check if there are child nodes with font-weight: 400 (nested content in the same element)
    boldEl.childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const childStyle = el.getAttribute('style');
        if (childStyle && /font-weight:\s*(400|normal)/i.test(childStyle)) {
          // This is nested content with normal font-weight, extract it
          const clone = el.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('br').forEach(br => {
            const textNode = document.createTextNode('\n');
            br.replaceWith(textNode);
          });
          const text = clone.textContent || '';
          if (text.trim()) {
            content += text;
          }
        }
      }
    });

    // If we found content inside the bold element, we're done with this section
    if (content.trim()) {
      // Clean up content: remove leading underscores and trim lines
      const lines = content.split('\n');
      const cleanedLines = lines
        .map(l => {
          const trimmed = l.trim();
          return trimmed.startsWith('_') ? trimmed.substring(1).trim() : trimmed;
        })
        .filter(l => l.length > 0);
      content = cleanedLines.join('\n');

      if (content.trim()) {
        sections.push({
          title: title,
          content: content.trim()
        });
      }
      console.log(`Section "${title}" (nested content):`, content);
      return; // Skip to next bold element
    }

    // Otherwise, start from the bold element's next sibling
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
      console.log(`Section "${title}" (normal):`, content.trim());
      sections.push({
        title: title,
        content: content.trim(),
        htmlContent: hasTable ? htmlContent : undefined
      });
    }
  });

  console.log('=== PARSED SECTIONS ===');
  sections.forEach(s => {
    console.log(`Title: "${s.title}"`);
    console.log(`Content: "${s.content}"`);
    if (s.htmlContent) console.log(`Has HTML content`);
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

function CollapsibleSection({ title, content, htmlContent, defaultOpen = false, isFirst = false }: DescriptionSection & { defaultOpen?: boolean; isFirst?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Check if this is a size chart
  const isSizeChart = title.toLowerCase().includes('size') && title.toLowerCase().includes('chart');
  const sizeData = !htmlContent && isSizeChart ? parseSizeChart(content) : null;

  return (
    <div className={`border-b border-gray-200 ${isFirst ? 'mt-4' : ''}`}>
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

// Check if a title represents a size option
function isSizeTitle(title: string): boolean {
  const sizeKeywords = ['small', 'medium', 'large', 'x-large', 'xl', 'xxl', '2xl', 'xs', 's', 'm', 'l', '3xl', 'xxxl'];
  const lowerTitle = title.toLowerCase().trim();

  return sizeKeywords.some(keyword =>
    lowerTitle === keyword ||
    lowerTitle === keyword.replace('-', '') ||
    lowerTitle.startsWith(keyword + ' ') ||
    lowerTitle.startsWith(keyword.replace('-', '') + ' ')
  );
}

// Check if a section is a Size Chart
function isSizeChartSection(section: DescriptionSection): boolean {
  const title = section.title.toLowerCase();
  return title.includes('size') && title.includes('chart');
}

// Merge all non-size sections into Features and keep Size Chart separate
function mergeIntoFeaturesAndSizeChart(sections: DescriptionSection[]): DescriptionSection[] {
  console.log('=== BEFORE MERGE ===');
  sections.forEach(s => console.log(`Title: "${s.title}", Content length: ${s.content.length}`));

  const sizeChartSections: DescriptionSection[] = [];
  const featureSections: DescriptionSection[] = [];

  // Separate Size Chart sections from feature sections
  sections.forEach(section => {
    if (isSizeChartSection(section) || isSizeTitle(section.title)) {
      sizeChartSections.push(section);
    } else {
      featureSections.push(section);
    }
  });

  const result: DescriptionSection[] = [];

  // Create a single Features section from all feature sections
  if (featureSections.length > 0) {
    // Create HTML for better formatting with inline styles
    let featuresHtml = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
    featureSections.forEach((section) => {
      featuresHtml += '<div>';
      featuresHtml += `<div style="font-weight: 700; color: #111827; font-size: 0.875rem;">${section.title}</div>`;
      featuresHtml += `<div style="color: #374151; margin-top: 0.25rem; font-size: 0.875rem;">${section.content.split('\n').join('<br>')}</div>`;
      featuresHtml += '</div>';
    });
    featuresHtml += '</div>';

    // Also create plain text version as fallback
    let featuresContent = '';
    featureSections.forEach((section, index) => {
      if (index > 0) featuresContent += '\n\n';
      featuresContent += `${section.title}\n${section.content}`;
    });

    result.push({
      title: 'Description',
      content: featuresContent,
      htmlContent: featuresHtml
    });
    console.log('=== FEATURES HTML ===');
    console.log(featuresHtml);
  }

  // Create a single Size Chart section
  if (sizeChartSections.length > 0) {
    // Check if any section already has HTML table
    const htmlSection = sizeChartSections.find(s => s.htmlContent);

    if (htmlSection) {
      result.push({
        title: 'Size Chart',
        content: htmlSection.content,
        htmlContent: htmlSection.htmlContent
      });
    } else if (sizeChartSections.length >= 1 && sizeChartSections[0] && isSizeTitle(sizeChartSections[0].title)) {
      // Create a table from size sections
      let tableHtml = '<table class="w-full border-collapse"><thead><tr class="border-b border-gray-300 bg-gray-50">';
      tableHtml += '<th class="px-2 py-2 text-left font-semibold text-gray-900 sm:px-3">Size</th>';
      tableHtml += '<th class="px-2 py-2 text-left font-semibold text-gray-900 sm:px-3">Measurements</th>';
      tableHtml += '</tr></thead><tbody>';

      sizeChartSections.forEach(section => {
        tableHtml += '<tr class="border-b border-gray-200 last:border-b-0">';
        tableHtml += `<td class="px-2 py-2 font-medium text-gray-900 sm:px-3">${section.title}</td>`;
        tableHtml += `<td class="px-2 py-2 text-gray-700 sm:px-3">${section.content.split('\n').join('<br>')}</td>`;
        tableHtml += '</tr>';
      });

      tableHtml += '</tbody></table>';

      result.push({
        title: 'Size Chart',
        content: sizeChartSections.map(s => `${s.title}:\n${s.content}`).join('\n\n'),
        htmlContent: tableHtml
      });
    } else if (sizeChartSections.length > 0 && sizeChartSections[0]) {
      // Just use the first size chart section as-is
      result.push({
        title: 'Size Chart',
        content: sizeChartSections.map(s => s.content).join('\n\n'),
        htmlContent: sizeChartSections[0].htmlContent
      });
    }
  }

  return result;
}

export function CollapsibleDescription({ description, descriptionHtml }: CollapsibleDescriptionProps) {
  let sections = descriptionHtml
    ? parseDescriptionHtml(descriptionHtml)
    : parseDescriptionText(description);

  // Merge all sections into Features and Size Chart
  sections = mergeIntoFeaturesAndSizeChart(sections);

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
          isFirst={index === 0}
        />
      ))}
    </div>
  );
}
