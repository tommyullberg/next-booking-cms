"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Images,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Grid,
} from "lucide-react";
import { useCMSPage } from "./provider";
import { useEditorStore } from "../../state/editor-store";
import { CMSGalleryItem } from "./types";
import { ModalPortal } from "../ui/modal-portal";

export interface CMSGalleryFieldProps {
  nbr: number;
  layout?: "grid" | "bento" | "carousel";
  columns?: 2 | 3 | 4;
  aspectRatio?: "16/9" | "4/3" | "3/2" | "1/1";
  captionPosition?: "lightbox" | "both" | "hidden";
  showThumbnails?: boolean;
  className?: string;
}

export function CMSGalleryField({
  nbr,
  layout: layoutProp,
  columns: columnsProp,
  aspectRatio: aspectRatioProp,
  captionPosition: captionPositionProp,
  showThumbnails: showThumbnailsProp,
  className = "",
}: CMSGalleryFieldProps) {
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user);
  const { page, locale, getGalleryItems, gallerySettings } = useCMSPage();
  const { mode, setSelectedField, openModal } = useEditorStore();

  const items = getGalleryItems(nbr).filter((item) => item.image?.file_url);
  const isEditing = isAdmin && mode === "image";

  const layout = layoutProp || gallerySettings.layout || "grid";
  const columns = columnsProp || gallerySettings.columns || 3;
  const aspectRatio = aspectRatioProp || gallerySettings.aspectRatio || "16/9";
  const captionPosition =
    captionPositionProp || gallerySettings.captionPosition || "both";
  const showThumbnails =
    showThumbnailsProp !== undefined
      ? showThumbnailsProp
      : gallerySettings.showThumbnails !== false;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const getItemCaption = useCallback(
    (item: CMSGalleryItem): string => {
      if (
        locale &&
        locale !== "sv" &&
        item.translations &&
        typeof item.translations === "object" &&
        item.translations[locale]
      ) {
        return String(item.translations[locale]);
      }
      return item.caption || "";
    },
    [locale]
  );

  const handlePrevLightbox = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || items.length === 0) return null;
      return (prev - 1 + items.length) % items.length;
    });
  }, [items.length]);

  const handleNextLightbox = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || items.length === 0) return null;
      return (prev + 1) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        handlePrevLightbox();
      } else if (e.key === "ArrowRight") {
        handleNextLightbox();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, handlePrevLightbox, handleNextLightbox]);

  if (items.length === 0 && !isEditing) {
    return null;
  }

  const handleEditClick = (e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedField({
      pageId: page.id,
      nbr,
      fieldType: "GALLERY",
      galleryItems: items,
      locale,
    });
    openModal();
  };

  const handleImageClick = (index: number, e: React.MouseEvent) => {
    if (isEditing) {
      handleEditClick(e);
      return;
    }
    setLightboxIndex(index);
  };

  if (items.length === 0 && isEditing) {
    return (
      <div
        onClick={handleEditClick}
        className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-amber-500/60 dark:border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/15 p-8 cursor-pointer transition ${className}`}
      >
        <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Images className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-amber-900 dark:text-amber-300">
          Click to configure Gallery #{nbr}
        </span>
        <span className="text-xs text-amber-800/80 dark:text-amber-200/75">
          Add multiple images, sort with drag and drop, and write captions
        </span>
      </div>
    );
  }

  const gridColsClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  const activeLightboxItem =
    lightboxIndex !== null ? items[lightboxIndex] : null;
  const activeLightboxCaption = activeLightboxItem
    ? getItemCaption(activeLightboxItem)
    : "";

  return (
    <>
      <div
        onClick={isEditing ? handleEditClick : undefined}
        className={`relative ${
          isEditing
            ? "cursor-pointer outline-dashed outline-2 outline-amber-500 rounded-2xl p-2 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition"
            : ""
        } ${className}`}
      >
        {isEditing && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-md">
            <Images className="w-3.5 h-3.5" />
            <span>
              Edit Gallery #{nbr} ({items.length}{" "}
              {items.length === 1 ? "image" : "images"})
            </span>
          </div>
        )}

        {/* LAYOUT 1: GRID */}
        {layout === "grid" && (
          <div className={`grid ${gridColsClass} gap-4`}>
            {items.map((item, idx) => {
              const url = item.image?.file_url || "";
              const caption = getItemCaption(item);
              const showCardCaption =
                captionPosition === "both" && Boolean(caption);

              return (
                <div
                  key={item.id || `${item.image_id}-${idx}`}
                  onClick={(e) => handleImageClick(idx, e)}
                  className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer"
                >
                  <div
                    className="relative w-full overflow-hidden bg-slate-200 dark:bg-slate-800"
                    style={{ aspectRatio }}
                  >
                    <img
                      src={url}
                      alt={caption || item.image?.file_name || `Gallery image ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {showCardCaption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3.5 pt-8 pb-3 text-xs font-medium text-white">
                        <p className="line-clamp-2 drop-shadow-sm">{caption}</p>
                      </div>
                    )}
                  </div>

                  {/* Hover icon */}
                  <div className="absolute top-3 right-3 rounded-full bg-black/55 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LAYOUT 2: BENTO (Hero + Grid) */}
        {layout === "bento" && (
          <div className="relative">
            {items.length === 1 ? (
              <div
                onClick={(e) => handleImageClick(0, e)}
                className="group relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 cursor-pointer max-h-[480px]"
                style={{ aspectRatio: "16/9" }}
              >
                <img
                  src={items[0].image?.file_url}
                  alt={getItemCaption(items[0]) || "Gallery hero"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 h-[340px] sm:h-[420px] md:h-[460px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                {/* Main Hero Image */}
                <div
                  onClick={(e) => handleImageClick(0, e)}
                  className="group relative md:col-span-2 md:row-span-2 overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer"
                >
                  <img
                    src={items[0].image?.file_url}
                    alt={getItemCaption(items[0]) || "Gallery image 1"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {captionPosition === "both" && getItemCaption(items[0]) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 text-xs font-medium text-white">
                      <p className="line-clamp-2">{getItemCaption(items[0])}</p>
                    </div>
                  )}
                </div>

                {/* Up to 4 Side Images */}
                {items.slice(1, 5).map((item, idx) => {
                  const actualIndex = idx + 1;
                  const isLastVisible = actualIndex === 4 && items.length > 5;
                  const remainingCount = items.length - 5;
                  const caption = getItemCaption(item);

                  return (
                    <div
                      key={item.id || `${item.image_id}-${actualIndex}`}
                      onClick={(e) => handleImageClick(actualIndex, e)}
                      className={`group relative hidden md:block overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer ${
                        items.length === 2
                          ? "md:col-span-2 md:row-span-2"
                          : items.length === 3
                          ? "md:col-span-2 md:row-span-1"
                          : "md:col-span-1 md:row-span-1"
                      }`}
                    >
                      <img
                        src={item.image?.file_url}
                        alt={caption || `Gallery image ${actualIndex + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {captionPosition === "both" && caption && !isLastVisible && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2.5 text-[11px] font-medium text-white">
                          <p className="line-clamp-1">{caption}</p>
                        </div>
                      )}
                      {isLastVisible && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-semibold text-sm transition group-hover:bg-black/70">
                          +{remainingCount} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={(e) => handleImageClick(0, e)}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white shadow-lg hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Show all {items.length} photos</span>
            </button>
          </div>
        )}

        {/* LAYOUT 3: CAROUSEL */}
        {layout === "carousel" && (
          <div className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div
              className="relative w-full overflow-hidden cursor-pointer"
              style={{ aspectRatio }}
              onClick={(e) =>
                handleImageClick(
                  Math.min(carouselIndex, items.length - 1),
                  e
                )
              }
            >
              {items[Math.min(carouselIndex, items.length - 1)] && (
                <>
                  <img
                    src={
                      items[Math.min(carouselIndex, items.length - 1)].image
                        ?.file_url
                    }
                    alt={
                      getItemCaption(
                        items[Math.min(carouselIndex, items.length - 1)]
                      ) || `Slide ${carouselIndex + 1}`
                    }
                    className="h-full w-full object-cover transition-all duration-500"
                  />
                  {captionPosition === "both" &&
                    getItemCaption(
                      items[Math.min(carouselIndex, items.length - 1)]
                    ) && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-6 pt-10 pb-5 text-sm font-medium text-white">
                        <p>
                          {getItemCaption(
                            items[Math.min(carouselIndex, items.length - 1)]
                          )}
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCarouselIndex(
                      (prev) => (prev - 1 + items.length) % items.length
                    );
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2.5 text-white hover:bg-black/75 transition cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCarouselIndex((prev) => (prev + 1) % items.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2.5 text-white hover:bg-black/75 transition cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {Math.min(carouselIndex, items.length - 1) + 1} /{" "}
                  {items.length}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* FANCYBOX-STYLE LIGHTBOX MODAL */}
      {lightboxIndex !== null && activeLightboxItem && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[10000] flex flex-col justify-between bg-black/95 backdrop-blur-md select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar */}
            <div
              className="flex items-center justify-between px-5 py-4 text-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-mono font-semibold text-white">
                  {lightboxIndex + 1} / {items.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition cursor-pointer"
                aria-label="Close gallery"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image Stage */}
            <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-16 min-h-0">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevLightbox();
                  }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 transition cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div
                className="flex flex-col items-center justify-center max-h-full max-w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={activeLightboxItem.image?.file_url}
                  alt={
                    activeLightboxCaption ||
                    activeLightboxItem.image?.file_name ||
                    "Gallery preview"
                  }
                  className="max-h-[72vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                />

                {captionPosition !== "hidden" && activeLightboxCaption && (
                  <div className="mt-4 max-w-2xl text-center px-4">
                    <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                      {activeLightboxCaption}
                    </p>
                  </div>
                )}
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextLightbox();
                  }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 transition cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {showThumbnails && items.length > 1 ? (
              <div
                className="px-4 py-3 bg-black/60 border-t border-white/10 overflow-x-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center gap-2 min-w-max mx-auto">
                  {items.map((item, idx) => {
                    const isCurrent = idx === lightboxIndex;
                    return (
                      <button
                        key={item.id || `${item.image_id}-${idx}`}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className={`relative h-14 w-20 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                          isCurrent
                            ? "border-sky-400 scale-105 opacity-100"
                            : "border-transparent opacity-50 hover:opacity-85"
                        }`}
                      >
                        <img
                          src={item.image?.file_url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-4" />
            )}
          </div>
        </ModalPortal>
      )}
    </>
  );
}

