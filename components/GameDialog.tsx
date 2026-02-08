'use client';

import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { JetpackGame } from '@/components/JetpackGame';

interface GameDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GameDialog({ open, onClose }: GameDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      contentClassName="w-[min(92vw,800px)] p-4 sm:p-6 bg-white/95 rounded-3xl shadow-2xl"
    >
      <div className="flex items-center justify-end gap-4 pb-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0"
        >
          <Image
            src="/assets/icons/Cancel2.svg"
            alt=""
            width={22}
            height={22}
            className="opacity-90"
          />
        </Button>
      </div>
      <div className="mb-4">
        <JetpackGame />
      </div>

    </Dialog>
  );
}
