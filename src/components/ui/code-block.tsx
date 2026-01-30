'use client';

import { useState } from 'react';
import { Check, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ScrollArea } from './scroll-area';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'json',
  filename,
  showLineNumbers = true,
  maxHeight = '400px',
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className={cn('rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {filename && (
            <span className="text-xs text-zinc-400 font-mono">{filename}</span>
          )}
          {language && !filename && (
            <span className="text-xs text-zinc-500 font-mono uppercase">{language}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Code content */}
      <ScrollArea style={{ maxHeight }} className="bg-zinc-950">
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono leading-relaxed">
            <code>
              {lines.map((line, i) => (
                <div key={i} className="flex">
                  {showLineNumbers && (
                    <span className="select-none w-10 pr-4 text-right text-zinc-600 shrink-0">
                      {i + 1}
                    </span>
                  )}
                  <span className="text-zinc-300 whitespace-pre-wrap break-all">
                    {highlightSyntax(line, language)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </ScrollArea>
    </div>
  );
}

// Simple syntax highlighting
function highlightSyntax(line: string, language: string): React.ReactNode {
  if (language === 'json') {
    return highlightJSON(line);
  }
  if (language === 'typescript' || language === 'javascript' || language === 'ts' || language === 'js') {
    return highlightTS(line);
  }
  if (language === 'bash' || language === 'shell') {
    return highlightBash(line);
  }
  return line;
}

function highlightJSON(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  // Match patterns in order
  const patterns = [
    { regex: /^\s+/, className: '' }, // Leading whitespace (must match at least one)
    { regex: /"([^"\\]|\\.)*"(?=\s*:)/, className: 'text-sky-400' }, // Property keys
    { regex: /"([^"\\]|\\.)*"/, className: 'text-emerald-400' }, // String values
    { regex: /\b(true|false)\b/, className: 'text-amber-400' }, // Booleans
    { regex: /\b(null)\b/, className: 'text-rose-400' }, // Null
    { regex: /-?\d+\.?\d*([eE][+-]?\d+)?/, className: 'text-violet-400' }, // Numbers
    { regex: /[{}[\],:]/, className: 'text-zinc-500' }, // Punctuation
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const { regex, className } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index === 0) {
        const text = match[0];
        if (className) {
          parts.push(
            <span key={key++} className={className}>
              {text}
            </span>
          );
        } else {
          parts.push(text);
        }
        remaining = remaining.slice(text.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return parts;
}

function highlightTS(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  const patterns = [
    { regex: /\/\/.*$/, className: 'text-zinc-500 italic' }, // Comments
    { regex: /\b(import|export|from|const|let|var|function|async|await|return|if|else|for|while|class|interface|type|extends|implements|new|this|super)\b/, className: 'text-rose-400' }, // Keywords
    { regex: /\b(true|false|null|undefined)\b/, className: 'text-amber-400' }, // Literals
    { regex: /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`/, className: 'text-emerald-400' }, // Strings
    { regex: /-?\d+\.?\d*([eE][+-]?\d+)?/, className: 'text-violet-400' }, // Numbers
    { regex: /\b[A-Z][a-zA-Z0-9]*\b/, className: 'text-sky-400' }, // Types/Classes
    { regex: /[{}[\](),;:.]/, className: 'text-zinc-500' }, // Punctuation
    { regex: /=>|[+\-*/%=<>!&|?]+/, className: 'text-amber-300' }, // Operators
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const { regex, className } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index === 0) {
        const text = match[0];
        parts.push(
          <span key={key++} className={className}>
            {text}
          </span>
        );
        remaining = remaining.slice(text.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return parts;
}

function highlightBash(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  const patterns = [
    { regex: /^#.*$/, className: 'text-zinc-500 italic' }, // Comments
    { regex: /^\$\s*/, className: 'text-emerald-400' }, // Prompt
    { regex: /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"/, className: 'text-amber-400' }, // Strings
    { regex: /\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{[^}]+\}/, className: 'text-sky-400' }, // Variables
    { regex: /\b(npm|pnpm|yarn|vercel|git|cd|ls|mkdir|rm|cp|mv|echo|export|source)\b/, className: 'text-rose-400' }, // Commands
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const { regex, className } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index === 0) {
        const text = match[0];
        parts.push(
          <span key={key++} className={className}>
            {text}
          </span>
        );
        remaining = remaining.slice(text.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return parts;
}

// JSON Tree View Component
interface JsonTreeViewProps {
  data: unknown;
  maxHeight?: string;
  className?: string;
}

export function JsonTreeView({ data, maxHeight = '400px', className }: JsonTreeViewProps) {
  return (
    <div className={cn('rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950', className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-zinc-500 font-mono">JSON</span>
        </div>
        <CopyButton text={JSON.stringify(data, null, 2)} />
      </div>
      <ScrollArea style={{ maxHeight }} className="bg-zinc-950">
        <div className="p-4 font-mono text-sm">
          <JsonNode data={data} depth={0} />
        </div>
      </ScrollArea>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
      onClick={copy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

interface JsonNodeProps {
  data: unknown;
  depth: number;
  keyName?: string;
  isLast?: boolean;
}

function JsonNode({ data, depth, keyName, isLast = true }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const indent = depth * 16;

  if (data === null) {
    return (
      <div style={{ paddingLeft: indent }}>
        {keyName && <span className="text-sky-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-zinc-500">: </span>}
        <span className="text-rose-400">null</span>
        {!isLast && <span className="text-zinc-500">,</span>}
      </div>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <div style={{ paddingLeft: indent }}>
        {keyName && <span className="text-sky-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-zinc-500">: </span>}
        <span className="text-amber-400">{data.toString()}</span>
        {!isLast && <span className="text-zinc-500">,</span>}
      </div>
    );
  }

  if (typeof data === 'number') {
    return (
      <div style={{ paddingLeft: indent }}>
        {keyName && <span className="text-sky-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-zinc-500">: </span>}
        <span className="text-violet-400">{data}</span>
        {!isLast && <span className="text-zinc-500">,</span>}
      </div>
    );
  }

  if (typeof data === 'string') {
    const truncated = data.length > 100 ? data.slice(0, 100) + '...' : data;
    return (
      <div style={{ paddingLeft: indent }} className="break-all">
        {keyName && <span className="text-sky-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-zinc-500">: </span>}
        <span className="text-emerald-400">&quot;{truncated}&quot;</span>
        {!isLast && <span className="text-zinc-500">,</span>}
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div style={{ paddingLeft: indent }}>
          {keyName && <span className="text-sky-400">&quot;{keyName}&quot;</span>}
          {keyName && <span className="text-zinc-500">: </span>}
          <span className="text-zinc-500">[]</span>
          {!isLast && <span className="text-zinc-500">,</span>}
        </div>
      );
    }

    return (
      <div>
        <div
          style={{ paddingLeft: indent }}
          className="cursor-pointer hover:bg-zinc-900/50 -mx-4 px-4 flex items-center gap-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          ) : (
            <ChevronRight className="h-3 w-3 text-zinc-500" />
          )}
          {keyName && <span className="text-sky-400">&quot;{keyName}&quot;</span>}
          {keyName && <span className="text-zinc-500">: </span>}
          <span className="text-zinc-500">[</span>
          {!expanded && (
            <>
              <span className="text-zinc-600 text-xs">{data.length} items</span>
              <span className="text-zinc-500">]</span>
              {!isLast && <span className="text-zinc-500">,</span>}
            </>
          )}
        </div>
        {expanded && (
          <>
            {data.map((item, i) => (
              <JsonNode
                key={i}
                data={item}
                depth={depth + 1}
                isLast={i === data.length - 1}
              />
            ))}
            <div style={{ paddingLeft: indent }}>
              <span className="text-zinc-500">]</span>
              {!isLast && <span className="text-zinc-500">,</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return (
        <div style={{ paddingLeft: indent }}>
          {keyName && <span className="text-sky-400">&quot;{keyName}&quot;</span>}
          {keyName && <span className="text-zinc-500">: </span>}
          <span className="text-zinc-500">{'{}'}</span>
          {!isLast && <span className="text-zinc-500">,</span>}
        </div>
      );
    }

    return (
      <div>
        <div
          style={{ paddingLeft: indent }}
          className="cursor-pointer hover:bg-zinc-900/50 -mx-4 px-4 flex items-center gap-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          ) : (
            <ChevronRight className="h-3 w-3 text-zinc-500" />
          )}
          {keyName && <span className="text-sky-400">&quot;{keyName}&quot;</span>}
          {keyName && <span className="text-zinc-500">: </span>}
          <span className="text-zinc-500">{'{'}</span>
          {!expanded && (
            <>
              <span className="text-zinc-600 text-xs">{entries.length} keys</span>
              <span className="text-zinc-500">{'}'}</span>
              {!isLast && <span className="text-zinc-500">,</span>}
            </>
          )}
        </div>
        {expanded && (
          <>
            {entries.map(([key, value], i) => (
              <JsonNode
                key={key}
                data={value}
                depth={depth + 1}
                keyName={key}
                isLast={i === entries.length - 1}
              />
            ))}
            <div style={{ paddingLeft: indent }}>
              <span className="text-zinc-500">{'}'}</span>
              {!isLast && <span className="text-zinc-500">,</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}
