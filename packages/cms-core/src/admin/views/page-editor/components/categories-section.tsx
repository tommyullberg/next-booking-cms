"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Layers, CheckSquare, CircleDot } from "lucide-react";
import { Badge, Card, Label } from "@cms/components/ui";
import { CategoryTypeItem, CategoryItem } from "../../categories-view";

export interface CategoriesSectionProps {
  categoryTypes?: CategoryTypeItem[];
  selectedCategoryIds: string[];
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function CategoriesSection({
  categoryTypes = [],
  selectedCategoryIds,
  setSelectedCategoryIds,
}: CategoriesSectionProps) {
  const t = useTranslations("pageEditor");
  const tCommon = useTranslations("common");

  if (!categoryTypes || categoryTypes.length === 0) {
    return null;
  }

  return (
    <div className='space-y-3 pt-1'>
      <div className='flex items-center gap-2'>
        <Layers className='cms-icon-md text-sky-400' />
        <Label className='block text-xs font-medium text-slate-200'>
          {t("categoriesAndTypes")}
        </Label>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {categoryTypes.map((ct) => {
          const cats: CategoryItem[] = ct.categories || [];
          const isMulti = Boolean(ct.is_multiple);
          const typeCatIds = new Set(cats.map((c) => c.id));
          const selectedInThisType = selectedCategoryIds.filter((id) =>
            typeCatIds.has(id)
          );

          const handleSelectSingle = (catId: string | null) => {
            setSelectedCategoryIds((prev) => {
              const withoutThisType = prev.filter((id) => !typeCatIds.has(id));
              return catId ? [...withoutThisType, catId] : withoutThisType;
            });
          };

          const handleToggleMulti = (catId: string) => {
            setSelectedCategoryIds((prev) =>
              prev.includes(catId)
                ? prev.filter((id) => id !== catId)
                : [...prev, catId]
            );
          };

          return (
            <Card
              key={ct.id}
              variant='admin'
              className='p-3.5 space-y-2.5 bg-slate-950/70 border-slate-800/90'
            >
              <div className='flex items-center justify-between gap-2 border-b border-slate-800/70 pb-2'>
                <span className='text-xs font-semibold text-slate-200'>
                  {ct.name}
                </span>
                <Badge
                  variant='outline'
                  className='text-[10px] font-medium text-slate-400 bg-slate-900 border-slate-800 px-1.5 py-0.5 gap-1'
                >
                  {isMulti ? (
                    <>
                      <CheckSquare className='cms-icon-xs text-sky-400' />
                      <span>{t("multi")}</span>
                    </>
                  ) : (
                    <>
                      <CircleDot className='cms-icon-xs text-sky-400' />
                      <span>{t("single")}</span>
                    </>
                  )}
                </Badge>
              </div>

              {cats.length === 0 ? (
                <div className='cms-text-meta text-slate-500 italic'>
                  {t("noCategoriesInGroup")}
                </div>
              ) : isMulti ? (
                <div className='space-y-1.5'>
                  {cats.map((cat) => {
                    const checked = selectedCategoryIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition select-none ${
                          checked
                            ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium"
                            : "text-slate-300 hover:bg-slate-900 border border-transparent"
                        }`}
                      >
                        <input
                          type='checkbox'
                          checked={checked}
                          onChange={() => handleToggleMulti(cat.id)}
                          className='h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className='space-y-1.5'>
                  <label
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition select-none ${
                      selectedInThisType.length === 0
                        ? "bg-slate-900 text-slate-300 border border-slate-800 font-medium"
                        : "text-slate-500 hover:bg-slate-900/60 border border-transparent"
                    }`}
                  >
                    <input
                      type='radio'
                      name={`cat-type-${ct.id}`}
                      checked={selectedInThisType.length === 0}
                      onChange={() => handleSelectSingle(null)}
                      className='h-3.5 w-3.5 border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
                    />
                    <span>{tCommon("none")}</span>
                  </label>
                  {cats.map((cat) => {
                    const checked = selectedCategoryIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition select-none ${
                          checked
                            ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium"
                            : "text-slate-300 hover:bg-slate-900 border border-transparent"
                        }`}
                      >
                        <input
                          type='radio'
                          name={`cat-type-${ct.id}`}
                          checked={checked}
                          onChange={() => handleSelectSingle(cat.id)}
                          className='h-3.5 w-3.5 border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
