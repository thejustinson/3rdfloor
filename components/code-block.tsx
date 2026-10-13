'use client';

import { useState } from 'react';
import { Highlight, type PrismTheme } from 'prism-react-renderer';
import { Check, Copy, Eye, EyeOff } from '@/components/docs-icons';

/**
 * Syntax theme modeled directly after the reference Terminal snippet:
 * Deep black surface (#0A0A0A), soft violet commands/keywords (#C084FC),
 * crisp syntax green arguments/strings (#4ADE80), and clean white properties.
 */
export const TERMINAL_PRISM_THEME: PrismTheme = {
  plain: {
    color: '#4ADE80',
    backgroundColor: '#0A0A0A',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#6B7280', fontStyle: 'italic' },
    },
    {
      types: ['keyword', 'operator', 'builtin', 'function', 'method'],
      style: { color: '#C084FC' },
    },
    {
      types: ['string', 'attr-value', 'template-string', 'char'],
      style: { color: '#4ADE80' },
    },
    {
      types: ['property', 'attr-name', 'variable', 'parameter'],
      style: { color: '#F3F4F6' },
    },
    {
      types: ['number', 'boolean', 'constant'],
      style: { color: '#C084FC' },
    },
    {
      types: ['punctuation', 'symbol'],
      style: { color: '#9CA3AF' },
    },
  ],
};

export type CodeBlockTab = {
  id: string;
  label: string;
};

export function CodeBlock({
  title = 'Terminal',
  language = 'bash',
  code,
  tabs,
  activeTab,
  onTabChange,
  canMaskKey = false,
  isMasked = false,
  onToggleMask,
  surface = 'light',
}: {
  title?: string;
  language?: 'bash' | 'typescript' | 'json' | 'tsx';
  code: string;
  tabs?: CodeBlockTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  canMaskKey?: boolean;
  isMasked?: boolean;
  onToggleMask?: () => void;
  surface?: 'light' | 'dark';
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lines = code.trim().split('\n');

  return (
    <div className="my-6">
      {/* External Pill Tabs (matching reference screenshot) */}
      {tabs && tabs.length > 0 && onTabChange && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-[8px] text-[13px] transition-colors cursor-pointer ${
                  active
                    ? surface === 'light'
                      ? 'bg-[#141414] text-white font-medium'
                      : 'bg-[#222222] text-white font-medium'
                    : surface === 'light'
                    ? 'text-[#6B6B6B] hover:text-[#0A0A0A] font-normal'
                    : 'text-[#8E8E93] hover:text-white font-normal'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Rounded Terminal / Code Box */}
      <div className="rounded-[12px] border border-[#242424] bg-[#0A0A0A] text-[#F3F4F6] overflow-hidden shadow-sm">
        {/* Top Bar with >_ Terminal prompt & Copy Icon */}
        <div className="h-11 px-4 border-b border-[#1F1F1F] bg-[#0D0D0D] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="font-mono text-[13px] font-medium text-[#8E8E93] select-none shrink-0"
              aria-hidden="true"
            >
              &gt;_
            </span>
            <span className="text-[13px] font-normal text-[#A1A1AA] truncate">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canMaskKey && onToggleMask && (
              <button
                type="button"
                onClick={onToggleMask}
                aria-label={isMasked ? 'Reveal secret key' : 'Mask secret key'}
                className="h-7 px-2 rounded-md text-[#8E8E93] hover:text-white hover:bg-white/8 text-[11.5px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isMasked ? (
                  <>
                    <Eye className="size-3.5" />
                    <span>Reveal</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="size-3.5" />
                    <span>Mask</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy code to clipboard"
              title="Copy code"
              className="size-7 rounded-md text-[#8E8E93] hover:text-white hover:bg-white/8 flex items-center justify-center transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="size-4 text-[#4ADE80]" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Code Body */}
        {language === 'bash' ? (
          <pre className="px-5 py-5 font-mono text-[13px] leading-[1.8] tracking-[0.01em] overflow-x-auto">
            {lines.map((line, idx) => {
              const trimmed = line.trimStart();
              if (trimmed.startsWith('#')) {
                return (
                  <div key={idx} className="text-[#6B7280] italic whitespace-pre">
                    {line}
                  </div>
                );
              }
              const firstSpace = line.indexOf(' ');
              if (firstSpace === -1) {
                return (
                  <div key={idx} className="text-[#4ADE80] whitespace-pre">
                    {line}
                  </div>
                );
              }
              const firstToken = line.slice(0, firstSpace);
              const rest = line.slice(firstSpace);
              const isCommand = /^(curl|pnpm|npm|yarn|bun|cd|git|npx|export|Authorization:|x-api-key:)$/.test(
                firstToken.trim()
              );
              return (
                <div key={idx} className="whitespace-pre">
                  <span
                    className={
                      isCommand ? 'text-[#C084FC]' : 'text-[#4ADE80]'
                    }
                  >
                    {firstToken}
                  </span>
                  <span className="text-[#4ADE80]">{rest}</span>
                </div>
              );
            })}
          </pre>
        ) : (
          <Highlight
            theme={TERMINAL_PRISM_THEME}
            code={code.trim()}
            language={language}
          >
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre
                style={style}
                className="px-5 py-5 font-mono text-[13px] leading-[1.8] tracking-[0.01em] overflow-x-auto"
              >
                {tokens.map((line, i) => (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className="whitespace-pre"
                  >
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  );
}
