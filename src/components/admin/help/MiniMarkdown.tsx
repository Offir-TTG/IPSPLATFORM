'use client';

import * as React from 'react';
import { Info, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

/**
 * Markdown renderer for help articles. Zero deps, no innerHTML, XSS-safe.
 *
 * Supported syntax:
 *  - Headings: # / ## / ###
 *  - Bold (double asterisks), italic (single asterisks or underscores)
 *  - Inline code (single backticks)
 *  - Code blocks: triple backticks
 *  - Links: standard markdown link syntax
 *  - Bullet lists (`- `) and numbered lists (`1. `)
 *  - Blockquotes (`> `)
 *  - Callouts: `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!SUCCESS]`
 *  - Paragraphs separated by blank lines
 */

interface Props {
  source: string;
  className?: string;
}

export function MiniMarkdown({ source, className }: Props) {
  const blocks = React.useMemo(() => parseBlocks(source), [source]);
  return (
    <div className={className}>
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  );
}

// ---------- block parsing ----------

type CalloutKind = 'note' | 'tip' | 'warning' | 'success';

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'callout'; variant: CalloutKind; text: string }
  | { kind: 'code'; lang: string | null; body: string };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code block: triple backtick start, then capture until matching close
    if (line.trimStart().startsWith('```')) {
      const lang = line.trimStart().slice(3).trim() || null;
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        body.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ kind: 'code', lang, body: body.join('\n') });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        kind: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const calloutMatch = line.match(/^>\s*\[!(NOTE|TIP|WARNING|SUCCESS)\]\s*(.*)$/i);
      if (calloutMatch) {
        const variant = calloutMatch[1].toLowerCase() as CalloutKind;
        const buf: string[] = [calloutMatch[2]];
        i++;
        while (i < lines.length && lines[i].startsWith('> ')) {
          buf.push(lines[i].slice(2));
          i++;
        }
        blocks.push({ kind: 'callout', variant, text: buf.join(' ').trim() });
        continue;
      }

      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: 'quote', text: buf.join(' ') });
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|>\s|-\s|\d+\.\s|```)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: 'paragraph', text: buf.join(' ') });
  }

  return blocks;
}

// ---------- inline rendering ----------

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`md-${key++}`}
          className="rounded-md bg-muted px-1.5 py-0.5 text-[0.85em] font-mono text-foreground"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={`md-${key++}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') || token.startsWith('_')) {
      nodes.push(<em key={`md-${key++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const isExternal = /^https?:\/\//.test(href);
        nodes.push(
          <a
            key={`md-${key++}`}
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {label}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return nodes;
}

// ---------- block rendering ----------

const CALLOUT_CONFIG: Record<CalloutKind, { icon: React.ComponentType<{ className?: string }>; cls: string; iconCls: string }> = {
  note:    { icon: Info,           cls: 'bg-blue-500/5 border-blue-500/30 text-foreground',   iconCls: 'text-blue-500' },
  tip:     { icon: Lightbulb,      cls: 'bg-amber-500/5 border-amber-500/30 text-foreground', iconCls: 'text-amber-500' },
  warning: { icon: AlertTriangle,  cls: 'bg-red-500/5 border-red-500/30 text-foreground',     iconCls: 'text-red-500' },
  success: { icon: CheckCircle2,   cls: 'bg-emerald-500/5 border-emerald-500/30 text-foreground', iconCls: 'text-emerald-500' },
};

function renderBlock(block: Block, idx: number): React.ReactNode {
  switch (block.kind) {
    case 'heading': {
      if (block.level === 1) {
        return (
          <h1 key={idx} className="text-xl font-bold tracking-tight mt-6 first:mt-0 mb-3 text-foreground">
            {renderInline(block.text)}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2 key={idx} className="text-base font-semibold tracking-tight mt-5 first:mt-0 mb-2 text-foreground flex items-center gap-2 before:content-[''] before:h-4 before:w-1 before:rounded-full before:bg-primary">
            {renderInline(block.text)}
          </h2>
        );
      }
      return (
        <h3 key={idx} className="text-sm font-semibold mt-4 mb-1.5 text-foreground/90">
          {renderInline(block.text)}
        </h3>
      );
    }
    case 'paragraph':
      return (
        <p key={idx} className="my-2.5 leading-relaxed text-[14px] text-foreground/85">
          {renderInline(block.text)}
        </p>
      );
    case 'ul':
      return (
        <ul key={idx} className="my-3 space-y-1.5 text-[14px] text-foreground/85">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 leading-relaxed ps-1">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
              <span className="flex-1 min-w-0">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={idx} className="my-3 space-y-2 text-[14px] text-foreground/85">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 leading-relaxed">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 pt-0.5">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    case 'quote':
      return (
        <blockquote
          key={idx}
          className="my-3 rounded-r-md border-s-2 border-foreground/30 bg-muted/30 ps-4 py-2 text-[14px] italic text-foreground/75"
        >
          {renderInline(block.text)}
        </blockquote>
      );
    case 'callout': {
      const cfg = CALLOUT_CONFIG[block.variant];
      const Icon = cfg.icon;
      return (
        <div
          key={idx}
          className={`my-4 flex gap-3 rounded-lg border p-3.5 ${cfg.cls}`}
          role="note"
        >
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.iconCls}`} />
          <div className="flex-1 min-w-0 text-[14px] leading-relaxed">
            {renderInline(block.text)}
          </div>
        </div>
      );
    }
    case 'code':
      return (
        <pre
          key={idx}
          className="my-3 overflow-x-auto rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed"
        >
          <code className="font-mono text-foreground/90">{block.body}</code>
        </pre>
      );
  }
}
