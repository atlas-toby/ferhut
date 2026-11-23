import { useState } from "react";
import { Award } from "lucide-react";
import { useAmbient } from "@/context/AmbientContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function HallOfFameDialog() {
  const { hallOfFameOpen, setHallOfFameOpen } = useAmbient();
  const [imgError, setImgError] = useState(false);

  return (
    <Dialog open={hallOfFameOpen} onOpenChange={setHallOfFameOpen}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span>Hall of Fame</span>
            </DialogTitle>
            <DialogDescription>
              Ferhat Kargo ve Müze tarihinin seçkin onur karesi.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-secondary/40">
            {imgError ? (
              <div className="flex h-[360px] flex-col items-center justify-center gap-2 text-muted-foreground">
                <Award className="h-8 w-8 opacity-50" />
                <p className="text-sm">Görsel yüklenemedi.</p>
              </div>
            ) : (
              <img
                src="/img/wowwww.png"
                alt="Ferhat'ın Müzesi Hall of Fame"
                onError={() => setImgError(true)}
                className="max-h-[540px] w-full object-contain bg-black/5 dark:bg-black/40"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
