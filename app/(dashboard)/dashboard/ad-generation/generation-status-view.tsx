'use client';

import Link from 'next/link';

export type GenerationStatusPrimaryAction =
  | { label: string; href: string }
  | { label: string; onClick: () => void };

type GenerationStatusViewProps = {
  title: string;
  description?: string;
  primaryAction: GenerationStatusPrimaryAction;
  /** When true, title uses gradient text; when false, uses default (e.g. for errors). Default true. */
  titleGradient?: boolean;
};

export function GenerationStatusView({
  title,
  description,
  primaryAction,
  titleGradient = true,
}: GenerationStatusViewProps) {
  const buttonClass =
    'gradient-primary text-white font-bold px-8 py-4 rounded-full shadow-md hover:opacity-95 transition-opacity';

  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] w-full bg-[#F9FAFB] text-center px-4">
      <h2
        className={
          titleGradient
            ? 'text-3xl font-bold bg-gradient-to-r from-brand-secondary via-brand-tertiary to-brand-primary bg-clip-text text-transparent tracking-tight md:text-4xl mb-3'
            : 'text-3xl font-bold text-foreground tracking-tight md:text-4xl mb-3'
        }
      >
        {title}
      </h2>
      {description != null && (
        <p className="text-muted-foreground text-lg md:text-xl mb-10">
          {description}
        </p>
      )}
      <div className={description != null ? undefined : 'mt-10'}>
      {'href' in primaryAction ? (
        <Link href={primaryAction.href} className={buttonClass}>
          {primaryAction.label}
        </Link>
      ) : (
        <button type="button" onClick={primaryAction.onClick} className={buttonClass}>
          {primaryAction.label}
        </button>
      )}
      </div>
    </div>
  );
}
