import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, type MouseEvent } from "react";

export interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number;
  open: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  index,
  open,
  onIndexChange,
  onClose,
}: ImageLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const currentIndex = images.length ? Math.min(Math.max(index, 0), images.length - 1) : 0;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && images.length > 1) {
        onIndexChange((currentIndex - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && images.length > 1) {
        onIndexChange((currentIndex + 1) % images.length);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [currentIndex, images.length, onClose, onIndexChange, open]);

  if (!open || !images.length) return null;

  const previous = () =>
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  const next = () => onIndexChange((currentIndex + 1) % images.length);
  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-950/90 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de fotografías"
      onMouseDown={closeOnBackdrop}
    >
      <button
        ref={closeRef}
        type="button"
        className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white sm:right-5 sm:top-5"
        aria-label="Cerrar visor de fotografías"
        onClick={onClose}
      >
        <X className="size-6" />
      </button>

      {images.length > 1 && (
        <button
          type="button"
          className="absolute left-2 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white sm:left-5 sm:size-12"
          aria-label="Fotografía anterior"
          onClick={previous}
        >
          <ChevronLeft className="size-7" />
        </button>
      )}

      <div
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col items-center justify-center gap-3 sm:max-h-[calc(100dvh-3rem)]"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          className="max-h-[calc(100dvh-6rem)] max-w-full select-none object-contain sm:max-h-[calc(100dvh-8rem)]"
        />
        <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-bold text-white/90">
          {currentIndex + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <button
          type="button"
          className="absolute right-2 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white sm:right-5 sm:size-12"
          aria-label="Fotografía siguiente"
          onClick={next}
        >
          <ChevronRight className="size-7" />
        </button>
      )}
    </div>
  );
}
