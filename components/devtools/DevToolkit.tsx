'use client';
import {
  Braces,
  Clock3,
  Fingerprint,
  Hash,
  KeyRound,
  Link2,
  type LucideIcon,
  ShieldCheck,
  Ticket,
  Binary,
} from 'lucide-react';
import { useState } from 'react';
import { BrutalLabel } from '@/components/brutal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Base64Tool,
  HashTool,
  JsonTool,
  JwtTool,
  PasswordTool,
  TimestampTool,
  TokenTool,
  UrlTool,
  UuidTool,
} from './tools';

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  Component: () => React.JSX.Element;
};

const SECTIONS: { title: string; tools: Tool[] }[] = [
  {
    title: 'Generate',
    tools: [
      {
        id: 'password',
        name: 'Password',
        description: 'Strong random passwords, with a strength estimate.',
        icon: KeyRound,
        Component: PasswordTool,
      },
      {
        id: 'token',
        name: 'Token / API key',
        description: 'Random secrets in hex, Base64url, Base64 or alphanumeric.',
        icon: Ticket,
        Component: TokenTool,
      },
      {
        id: 'uuid',
        name: 'UUID',
        description: 'Version 4 (random) UUIDs, one or many at once.',
        icon: Fingerprint,
        Component: UuidTool,
      },
    ],
  },
  {
    title: 'Encode',
    tools: [
      {
        id: 'hash',
        name: 'Hash',
        description: 'SHA-256, SHA-384, SHA-512 and SHA-1 of any text.',
        icon: Hash,
        Component: HashTool,
      },
      {
        id: 'base64',
        name: 'Base64',
        description: 'Encode and decode Base64 (UTF-8 safe), optionally URL-safe.',
        icon: Binary,
        Component: Base64Tool,
      },
      {
        id: 'url',
        name: 'URL encode',
        description: 'Percent-encode or decode text for URLs and query strings.',
        icon: Link2,
        Component: UrlTool,
      },
    ],
  },
  {
    title: 'Inspect',
    tools: [
      {
        id: 'jwt',
        name: 'JWT decoder',
        description: 'Read a token’s header, payload and expiry.',
        icon: ShieldCheck,
        Component: JwtTool,
      },
      {
        id: 'json',
        name: 'JSON formatter',
        description: 'Validate, pretty-print or minify JSON.',
        icon: Braces,
        Component: JsonTool,
      },
      {
        id: 'timestamp',
        name: 'Timestamp',
        description: 'Convert Unix time to and from readable dates.',
        icon: Clock3,
        Component: TimestampTool,
      },
    ],
  },
];

const TOOLS = SECTIONS.flatMap((section) => section.tools);

// A developer toolkit in a window styled after hover.dev's app mockup: title
// bar with traffic lights, a sidebar of tools, the tool on grid paper.
// Everything runs in the browser (lib/devtools.ts); nothing is sent anywhere.
export default function DevToolkit({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [toolId, setToolId] = useState(TOOLS[0].id);
  const tool = TOOLS.find((t) => t.id === toolId) ?? TOOLS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex h-[92dvh] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden border-2 border-brutal-line bg-brutal-paper p-0 font-brutal text-brutal-text shadow-[6px_6px_0_0_rgb(var(--brutal-shadow))] sm:rounded-none'
      >
        {/* Title bar */}
        <div className='flex shrink-0 items-center gap-3 border-b-2 border-brutal-line bg-brutal-paper px-4 py-3 pr-14'>
          <div className='flex gap-1.5' aria-hidden>
            <span className='h-3 w-3 rounded-full border border-brutal-line bg-rose-500' />
            <span className='h-3 w-3 rounded-full border border-brutal-line bg-amber-400' />
            <span className='h-3 w-3 rounded-full border border-brutal-line bg-emerald-500' />
          </div>
          <DialogTitle className='font-brutal text-base font-extrabold'>
            Developer <span className='text-brutal-accent'>toolkit</span>
          </DialogTitle>
          <DialogDescription className='hidden text-xs text-brutal-muted sm:block'>
            Runs in your browser. Nothing is sent anywhere.
          </DialogDescription>
        </div>

        <div className='flex min-h-0 flex-1 flex-col md:flex-row'>
          {/* Sidebar: a scrolling row of tools on small screens. */}
          <nav
            aria-label='Tools'
            className='shrink-0 overflow-x-auto border-b-2 border-brutal-line bg-brutal-paper md:w-56 md:overflow-y-auto md:border-b-0 md:border-r-2'
          >
            <div className='flex gap-2 p-3 md:flex-col md:gap-5 md:p-4'>
              {SECTIONS.map((section) => (
                <div key={section.title} className='flex gap-2 md:flex-col md:gap-1'>
                  <div className='hidden px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 md:block'>
                    {section.title}
                  </div>
                  {section.tools.map((t) => (
                    <button
                      key={t.id}
                      type='button'
                      onClick={() => setToolId(t.id)}
                      aria-current={t.id === tool.id ? 'page' : undefined}
                      className={cn(
                        'flex shrink-0 items-center gap-2 whitespace-nowrap border-2 px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                        t.id === tool.id
                          ? 'border-brutal-line bg-brutal-soft text-brutal-accent shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))]'
                          : 'border-transparent hover:border-brutal-line hover:bg-brutal-soft',
                      )}
                    >
                      <t.icon className='h-4 w-4 shrink-0' />
                      {t.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </nav>

          {/* Tool */}
          <section className='grid-paper min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'>
            <div className='mx-auto max-w-2xl border-2 border-brutal-line bg-brutal-paper p-5 shadow-[4px_4px_0_0_rgb(var(--brutal-shadow))] sm:p-6'>
              <BrutalLabel icon={<tool.icon />}>{tool.name}</BrutalLabel>
              <p className='mb-5 mt-1 text-sm text-brutal-muted'>{tool.description}</p>
              <tool.Component key={tool.id} />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
