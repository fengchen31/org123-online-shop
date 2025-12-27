'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface DescriptionSection {
  title: string;
  content: string;
  htmlContent?: string; // For sections that contain HTML like tables
  isNotice?: boolean; // For non-collapsible notice sections
}

interface CollapsibleDescriptionProps {
  description: string;
  descriptionHtml?: string;
}

// Helper function to clean content lines: remove leading underscores and trim
function cleanContentLines(content: string): string {
  const lines = content.split('\n');
  const cleanedLines = lines
    .map(l => {
      const trimmed = l.trim();
      return trimmed.startsWith('_') ? trimmed.substring(1).trim() : trimmed;
    })
    .filter(l => l.length > 0);
  return cleanedLines.join('\n');
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

  // Track the text content of notice sections to avoid duplication
  let noticeText = '';

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

  // Find all elements with color styling anywhere in the document
  const coloredElements: HTMLElement[] = [];
  const allElementsInDoc = doc.body.querySelectorAll('*');

  allElementsInDoc.forEach(el => {
    const element = el as HTMLElement;
    const style = element.getAttribute('style');

    // Check if this element has color or background color styling
    if (style && /color:\s*rgb\(255,\s*42,\s*0\)|color:\s*red/i.test(style)) {
      // Make sure this isn't nested inside another colored element we already found
      const isNested = coloredElements.some(parent => parent.contains(element));
      if (!isNested) {
        coloredElements.push(element);
      }
    }
  });

  // Create notice section from colored elements
  if (coloredElements.length > 0) {
    let noticeHtml = '';
    let noticeContent = '';

    coloredElements.forEach(element => {
      noticeHtml += element.outerHTML;
      noticeContent += (element.textContent?.trim() || '') + '\n';
    });

    if (noticeContent.trim()) {
      noticeText = noticeContent.trim(); // Save for deduplication
      sections.push({
        title: 'Notice',
        content: noticeContent.trim(),
        htmlContent: noticeHtml,
        isNotice: true
      });
    }
  }

  // Helper function to check if text contains the notice text
  const containsNoticeText = (text: string): boolean => {
    if (!noticeText) return false;
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const cleanNotice = noticeText.replace(/\s+/g, ' ').trim();
    return cleanText.includes(cleanNotice);
  };

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
    let contentHtml = '';

    // First, check if there are child nodes with font-weight: 400 (nested content in the same element)
    boldEl.childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const childStyle = el.getAttribute('style');
        if (childStyle && /font-weight:\s*(400|normal)/i.test(childStyle)) {
          // This is nested content with normal font-weight, extract it
          const clone = el.cloneNode(true) as HTMLElement;

          const text = clone.textContent || '';

          // Skip this content if it contains the notice text
          if (text.trim() && !containsNoticeText(text)) {
            // Preserve HTML with inline styles (especially color)
            contentHtml += el.innerHTML;

            clone.querySelectorAll('br').forEach(br => {
              const textNode = document.createTextNode('\n');
              br.replaceWith(textNode);
            });
            if (text.trim()) {
              content += text;
            }
          }
        }
      }
    });

    // If we found content inside the bold element, we're done with this section
    if (content.trim()) {
      // Clean up content: remove leading underscores and trim lines
      content = cleanContentLines(content);

      if (content.trim()) {
        sections.push({
          title: title,
          content: content.trim(),
          htmlContent: contentHtml || undefined
        });
      }
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
    let hasInlineStyles = false;

    while (currentNode) {
      // Stop if we hit the next bold element
      if (nextBoldEl && (currentNode === nextBoldEl || currentNode.contains(nextBoldEl))) {
        break;
      }

      if (currentNode.nodeType === Node.TEXT_NODE) {
        const text = currentNode.textContent?.replace(/\s+/g, ' ').trim() || '';
        if (text && !containsNoticeText(text)) {
          content += (content ? '\n' : '') + text;
          htmlContent += text;
        }
      } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;

        // Skip if this element is or contains a bold element
        const containsBold = boldElements.some(b => element === b || element.contains(b));
        if (containsBold) {
          break;
        }

        // Get element's text to check for notice duplication
        const elementText = element.textContent || '';

        // Skip this element if it contains the notice text
        if (containsNoticeText(elementText)) {
          // Move to next sibling
          if (currentNode.nextSibling) {
            currentNode = currentNode.nextSibling;
          } else if (currentNode.parentElement && currentNode.parentElement !== doc.body) {
            currentNode = currentNode.parentElement.nextSibling;
          } else {
            break;
          }
          continue;
        }

        // Check if this is a table - if so, preserve the HTML
        if (element.tagName === 'TABLE') {
          hasTable = true;
          htmlContent = element.outerHTML;
          // Get text content for fallback
          content = element.textContent?.trim() || '';
          break; // Table is the content, stop here
        }

        // Check if element has inline styles (color, etc.)
        const style = element.getAttribute('style');
        if (style && (style.includes('color') || style.includes('background'))) {
          hasInlineStyles = true;
        }

        // Handle BR tags as line breaks
        if (element.tagName === 'BR') {
          content += '\n';
          htmlContent += '<br>';
        } else {
          // Preserve HTML for elements with styling
          htmlContent += element.outerHTML;

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
      // Clean up content: remove leading underscores
      const cleanedContent = content.trim() ? cleanContentLines(content) : content.trim();
      sections.push({
        title: title,
        content: cleanedContent,
        htmlContent: (hasTable || hasInlineStyles) ? htmlContent : undefined
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

// Parse size chart content into horizontal table data (sizes as columns)
function parseSizeChart(content: string): {
  sizes: string[];
  measurements: { label: string; values: string[] }[]
} | null {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  // Common size keywords
  const sizeKeywords = ['small', 'medium', 'large', 'x-large', 'xl', 'xxl', '2xl', 'xs', 's', 'm', 'l', '3xl', 'xxxl'];

  interface SizeData {
    size: string;
    measurements: Map<string, string>;
  }

  const sizesData: SizeData[] = [];
  let currentSize: SizeData | null = null;

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
      if (currentSize && currentSize.measurements.size > 0) {
        sizesData.push(currentSize);
      }
      // Start new size
      currentSize = { size: line, measurements: new Map() };
    } else if (currentSize) {
      // Parse measurement line (e.g., "Length: 60cm / Chest: 62cm" or "Length: 60cm")
      const parts = line.split('/').map(p => p.trim());

      parts.forEach(part => {
        const match = part.match(/^(.+?):\s*(.+)$/);
        if (match && match[1] && match[2]) {
          const label = match[1].trim();
          const value = match[2].trim();
          currentSize!.measurements.set(label, value);
        }
      });
    }
  }

  // Add last size
  if (currentSize && currentSize.measurements.size > 0) {
    sizesData.push(currentSize);
  }

  if (sizesData.length === 0) return null;

  // Extract all unique measurement labels
  const measurementLabels = new Set<string>();
  sizesData.forEach(sizeData => {
    sizeData.measurements.forEach((_, label) => measurementLabels.add(label));
  });

  // Build the table data structure
  const sizes = sizesData.map(sd => getSizeAcronym(sd.size));
  const measurements = Array.from(measurementLabels).map(label => ({
    label: label.toUpperCase(),
    values: sizesData.map(sd => sd.measurements.get(label) || '-')
  }));

  return { sizes, measurements };
}

function CollapsibleSection({ title, content, htmlContent, defaultOpen = false, isFirst = false, sectionId }: DescriptionSection & { defaultOpen?: boolean; isFirst?: boolean; sectionId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial state from URL or use defaultOpen
  const getInitialOpenState = () => {
    const urlParam = searchParams.get(`tab_${sectionId}`);
    if (urlParam !== null) {
      return urlParam === 'open';
    }
    return defaultOpen;
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState);

  // Check if this is a size chart
  const isSizeChart = title.toLowerCase().includes('size') && title.toLowerCase().includes('chart');
  const sizeData = !htmlContent && isSizeChart ? parseSizeChart(content) : null;

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Update URL params to persist state
    const newParams = new URLSearchParams(window.location.search);
    if (newIsOpen) {
      newParams.set(`tab_${sectionId}`, 'open');
    } else {
      newParams.delete(`tab_${sectionId}`);
    }

    // Update URL without scroll and without navigation
    router.replace(`?${newParams.toString()}`, { scroll: false });
  };

  return (
    <div className={`border-b border-gray-200 ${isFirst ? 'mt-4' : ''}`}>
      <button
        onClick={handleToggle}
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
            // Display as horizontal table with sizes as columns
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="px-2 py-2 text-left font-semibold text-gray-900 sm:px-3">SIZE</th>
                    {sizeData.sizes.map((size, i) => (
                      <th key={i} className="px-2 py-2 text-center font-semibold text-gray-900 sm:px-3">{size}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeData.measurements.map((measurement, i) => (
                    <tr key={i} className="border-b border-gray-200 last:border-b-0">
                      <td className="px-2 py-2 font-medium text-gray-900 sm:px-3">{measurement.label}</td>
                      {measurement.values.map((value, j) => (
                        <td key={j} className="px-2 py-2 text-center text-gray-700 sm:px-3">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Display content - use HTML if available, otherwise plain text
            htmlContent ? (
              <div
                className="space-y-1 text-xs leading-relaxed sm:text-sm"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              <div className="space-y-1 text-xs leading-relaxed text-gray-700 sm:text-sm">
                {content.split('\n').map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap">
                    {line.trim() || '\u00A0'}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Convert size names to acronyms
function getSizeAcronym(value: string): string {
  const lowerValue = value.toLowerCase().trim();
  const sizeMap: Record<string, string> = {
    'small': 'S',
    'medium': 'M',
    'large': 'L',
    'x-large': 'XL',
    'extra large': 'XL',
    'xlarge': 'XL',
    'xx-large': 'XXL',
    '2x-large': 'XXL',
    'xxlarge': 'XXL',
    'xxx-large': 'XXXL',
    '3x-large': 'XXXL',
    'xxxlarge': 'XXXL'
  };

  return sizeMap[lowerValue] || value;
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
  const sizeChartSections: DescriptionSection[] = [];
  const featureSections: DescriptionSection[] = [];
  const noticeSections: DescriptionSection[] = [];

  // Separate Size Chart sections, Notice sections, and feature sections
  sections.forEach(section => {
    if (section.isNotice) {
      noticeSections.push(section);
    } else if (isSizeChartSection(section) || isSizeTitle(section.title)) {
      sizeChartSections.push(section);
    } else {
      featureSections.push(section);
    }
  });

  const result: DescriptionSection[] = [];

  // Add Notice sections first (preserving HTML content)
  noticeSections.forEach(section => {
    result.push(section);
  });

  // Create a single Features section from all feature sections
  if (featureSections.length > 0) {
    // Create HTML for better formatting with inline styles
    let featuresHtml = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
    featureSections.forEach((section) => {
      featuresHtml += '<div>';
      featuresHtml += `<div style="font-weight: 700; color: #111827; font-size: 0.875rem;">${section.title}</div>`;
      // Use section's HTML content if available, otherwise convert plain text to HTML
      // Clean up: remove underscores and trim leading/trailing <br> tags
      let sectionContent = section.htmlContent || section.content.split('\n').join('<br>');
      // Remove all underscores
      sectionContent = sectionContent.replace(/_/g, '');
      // Remove leading <br> tags
      sectionContent = sectionContent.replace(/^(<br\s*\/?>)+/gi, '');
      // Remove trailing <br> tags
      sectionContent = sectionContent.replace(/(<br\s*\/?>)+$/gi, '');
      // Remove inline font-size styles to ensure consistent sizing
      sectionContent = sectionContent.replace(/font-size:\s*[^;]+;?/gi, '');
      featuresHtml += `<div style="color: #374151; margin-top: 0.25rem; font-size: 0.875rem;">${sectionContent}</div>`;
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
  }

  // Create a single Size Chart section
  if (sizeChartSections.length > 0) {
    // Check if any section already has a proper HTML table
    const htmlSection = sizeChartSections.find(s => s.htmlContent && s.htmlContent.includes('<table'));

    if (htmlSection) {
      // Already has a table, use it as-is
      result.push({
        title: 'Size Chart',
        content: htmlSection.content,
        htmlContent: htmlSection.htmlContent
      });
    } else if (sizeChartSections.length >= 1) {
      // Try to parse size sections into horizontal table format
      interface SizeMeasurements {
        [measurementName: string]: string;
      }

      const sizesData: { size: string; measurements: SizeMeasurements }[] = [];
      const allMeasurements = new Set<string>();

      // Extract data from each size section
      sizeChartSections.forEach(section => {
        const sizeName = getSizeAcronym(section.title);
        const measurements: SizeMeasurements = {};

        // Parse measurements from content (e.g., "Length: 60cm / Chest: 62cm")
        // Normalize line breaks first
        const normalizedContent = section.content
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n');

        const lines = normalizedContent.split('\n')
          .map(l => l.trim().replace(/\s+/g, ' '))  // Normalize spaces within each line
          .filter(Boolean);
        lines.forEach(line => {
          const parts = line.split('/').map(p => p.trim());
          parts.forEach(part => {
            // More robust regex: handle optional whitespace and special characters
            const match = part.match(/^(.+?)\s*:\s*(.+?)$/);
            if (match && match[1] && match[2]) {
              const label = match[1].trim().toUpperCase().replace(/\s+/g, ' ');
              const value = match[2].trim();
              measurements[label] = value;
              allMeasurements.add(label);
            }
          });
        });

        sizesData.push({ size: sizeName, measurements });
      });

      const measurementOrder = Array.from(allMeasurements);

      // Only create table if we successfully parsed measurements
      if (sizesData.length > 0 && measurementOrder.length > 0) {
        // Create horizontal table HTML with 30% smaller font
        let tableHtml = '<table class="w-full border-collapse text-xs sm:text-sm" style="font-size: 70%;"><thead><tr class="border-b border-gray-300 bg-gray-50">';
        tableHtml += '<th class="px-2 py-2 text-left font-semibold text-gray-900 sm:px-3">SIZE</th>';
        sizesData.forEach(sizeData => {
          tableHtml += `<th class="px-2 py-2 text-center font-semibold text-gray-900 sm:px-3">${sizeData.size}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        // Add rows for each measurement
        measurementOrder.forEach(measurement => {
          tableHtml += '<tr class="border-b border-gray-200 last:border-b-0">';
          tableHtml += `<td class="px-2 py-2 font-medium text-gray-900 sm:px-3">${measurement}</td>`;
          sizesData.forEach(sizeData => {
            const value = sizeData.measurements[measurement] || '-';
            tableHtml += `<td class="px-2 py-2 text-center text-gray-700 sm:px-3">${value}</td>`;
          });
          tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table>';

        result.push({
          title: 'Size Chart',
          content: sizeChartSections.map(s => `${s.title}:\n${s.content}`).join('\n\n'),
          htmlContent: tableHtml
        });
      } else {
        // Fallback: couldn't parse into table, use first section's HTML or content
        const firstSection = sizeChartSections[0];
        if (firstSection) {
          result.push({
            title: 'Size Chart',
            content: sizeChartSections.map(s => s.content).join('\n\n'),
            htmlContent: firstSection.htmlContent
          });
        }
      }
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

  // Separate notice sections from collapsible sections
  const noticeSections = sections.filter(s => s.isNotice);
  const collapsibleSections = sections.filter(s => !s.isNotice);

  return (
    <div>
      {/* Render notice sections as non-collapsible banners */}
      {noticeSections.map((section, index) => (
        <div key={`notice-${index}`} className="mb-4">
          <div
            className="text-xs leading-relaxed sm:text-sm"
            dangerouslySetInnerHTML={{ __html: section.htmlContent || section.content }}
          />
        </div>
      ))}

      {/* Render collapsible sections */}
      {collapsibleSections.map((section, index) => (
        <CollapsibleSection
          key={index}
          title={section.title}
          content={section.content}
          htmlContent={section.htmlContent}
          defaultOpen={index === 0}
          isFirst={index === 0}
          sectionId={section.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}
        />
      ))}
    </div>
  );
}
