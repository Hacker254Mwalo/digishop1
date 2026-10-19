import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { getProductImageUrls } from "@shared/productCatalog";

type ProductImageGalleryProps = {
  name: string;
  imageUrl?: string | null;
  imageUrls?: unknown;
};

export default function ProductImageGallery({ name, imageUrl, imageUrls }: ProductImageGalleryProps) {
  const images = getProductImageUrls({ imageUrl, imageUrls });
  const imageKey = images.join("\u0000");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setActiveIndex(0), [imageKey]);

  if (!images.length) {
    return (
      <div className="grid h-52 place-items-center rounded-xl border border-[#e5ded5] bg-[#f6f3ee] text-[#b53d25]">
        <div className="grid justify-items-center gap-2">
          <Package className="h-10 w-10" aria-hidden="true" />
          <span className="text-xs font-semibold text-[#69747b]">No product photo provided</span>
        </div>
      </div>
    );
  }

  const previous = () => setActiveIndex(index => (index - 1 + images.length) % images.length);
  const next = () => setActiveIndex(index => (index + 1) % images.length);

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5ded5] bg-[#f6f3ee]">
      <div className="relative grid h-52 place-items-center">
        <img
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${name} — photo ${activeIndex + 1} of ${images.length}`}
          width="640"
          height="480"
          className="h-full w-full object-contain p-4"
          loading="lazy"
        />
        {images.length > 1 && <>
          <button type="button" onClick={previous} aria-label={`Show previous photo of ${name}`} className="absolute left-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#202a30] shadow hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b53d25]">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={next} aria-label={`Show next photo of ${name}`} className="absolute right-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#202a30] shadow hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b53d25]">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="absolute bottom-2 right-2 rounded-full bg-[#202a30]/85 px-2 py-1 text-[10px] font-bold text-white" aria-live="polite">
            {activeIndex + 1} / {images.length}
          </span>
        </>}
      </div>
      {images.length > 1 && <div className="flex gap-2 overflow-x-auto border-t border-[#e5ded5] bg-white p-2" aria-label={`${name} photos`}>
        {images.map((src, index) => <button
          key={`${src}-${index}`}
          type="button"
          onClick={() => setActiveIndex(index)}
          aria-label={`Show photo ${index + 1} of ${images.length} for ${name}`}
          aria-pressed={activeIndex === index}
          className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-[#f6f3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b53d25] ${activeIndex === index ? "border-[#b53d25] ring-2 ring-[#d94b2b]/20" : "border-[#d9d2c8]"}`}
        >
          <img src={src} alt="" className="h-full w-full object-contain p-1" loading="lazy" />
        </button>)}
      </div>}
    </div>
  );
}
