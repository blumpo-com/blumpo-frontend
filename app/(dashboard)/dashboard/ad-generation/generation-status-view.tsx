'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export type GenerationStatusPrimaryAction =
  | { label: string; href: string }
  | { label: string; onClick: () => void };

type GenerationStatusViewProps = {
  title: string;
  description?: string;
  primaryAction: GenerationStatusPrimaryAction;
  /** When true, title uses gradient text; when false, uses default (e.g. for errors). Default true. */
  titleGradient?: boolean;
  success: boolean;
};

export function GenerationStatusView({
  title,
  description,
  primaryAction,
  titleGradient = true,
  success,
}: GenerationStatusViewProps) {

  const buttonClass = 'px-10 py-6 text-base font-bold shadow-md';

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
          <Button asChild variant="cta" className={buttonClass}>
            <Link href={primaryAction.href}>
              Go home
            </Link>
          </Button>

        ) : (
          <Button variant="cta" className={buttonClass} onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}
      </div>

      <Image
        src={success ? '/images/blumpo/blumpo-reading.png' : '/images/blumpo/confused-blumpo-narrow.png'}
        alt="Blumpo"
        width={142}
        height={277}
        className="mt-10 w-32"
      />
    </div>
  );
}
