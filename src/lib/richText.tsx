import { Fragment, type ReactNode } from 'react';

/**
 * Tiny inline markdown renderer for static legal/policy pages.
 *
 * Supports a deliberately small subset:
 *   **bold**          → <strong>
 *   - bullet item     → <ul><li>
 *   [label](url)      → <a> (mailto:/tel:/http(s):/ schemes only)
 *   blank line        → block separator (paragraph break)
 *
 * Why not pull in `react-markdown`? Content is author-controlled, static,
 * and tiny. A 60-line parser avoids ~30KB of dependency weight.
 *
 * Security: input is hardcoded TS literals. React escapes text by default,
 * so even if content were ever user-supplied this would be safe against XSS.
 * The link regex restricts hrefs to mailto/tel/http(s).
 */

const LINK_REGEX = /\[([^\]]+)\]\((mailto:[^)\s]+|tel:[^)\s]+|https?:\/\/[^)\s]+)\)/g;

function renderInline(line: string): ReactNode {
  const renderBold = (text: string): ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-foreground font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <Fragment key={i}>{part}</Fragment>;
    });
  };

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  // Reset regex state for each call (LINK_REGEX is global).
  LINK_REGEX.lastIndex = 0;
  while ((match = LINK_REGEX.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`t-${key++}`}>{renderBold(line.slice(lastIndex, match.index))}</Fragment>,
      );
    }
    nodes.push(
      <a
        key={`l-${key++}`}
        href={match[2]}
        className="text-primary hover:underline font-medium"
      >
        {match[1]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    nodes.push(<Fragment key={`t-${key++}`}>{renderBold(line.slice(lastIndex))}</Fragment>);
  }
  return nodes;
}

/**
 * Parse a multi-line block into a sequence of <p> and <ul> nodes.
 * Use for rendering legal/policy section bodies.
 */
export function renderRichText(body: string): ReactNode {
  const lines = body.split('\n');
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let blockKey = 0;

  const flushPara = () => {
    if (!para.length) return;
    blocks.push(
      <p key={`p-${blockKey++}`} className="mb-4 last:mb-0 leading-relaxed">
        {para.map((l, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {renderInline(l)}
          </Fragment>
        ))}
      </p>,
    );
    para = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul
        key={`u-${blockKey++}`}
        className="mb-4 last:mb-0 space-y-2 list-disc pl-5 marker:text-primary"
      >
        {list.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('- ')) {
      flushPara();
      list.push(line.slice(2));
    } else if (line === '') {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
