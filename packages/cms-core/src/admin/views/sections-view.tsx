"use client";

import React, { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, FolderTree } from "lucide-react";

export interface SectionItem {
  id: string;
  name: string;
  start_page_id?: string | null;
  sort_order: number;
  is_visible: boolean;
  pages?: Array<{ id: string; page_title: string }>;
}

export interface SectionsViewProps {
  sections: SectionItem[];
  onCreateSection: (data: { name: string; sortOrder: number; isVisible: boolean }) => Promise<void>;
  onDeleteSection: (id: string) => Promise<void>;
  onToggleVisibility: (id: string, current: boolean) => Promise<void>;
}

export function SectionsView({
  sections,
  onCreateSection,
  onDeleteSection,
  onToggleVisibility,
}: SectionsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(sections.length + 1);
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateSection({ name, sortOrder, isVisible });
      setIsModalOpen(false);
      setName("");
      setSortOrder(sections.length + 2);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sektioner</h1>
          <p className="mt-1 text-sm text-slate-400">
            Organisera sidor i sektioner och styr deras synlighet och ordning i menyn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Skapa sektion</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium">
            <tr>
              <th className="py-3 px-4">Ordning</th>
              <th className="py-3 px-4">Namn</th>
              <th className="py-3 px-4">Kopplade sidor</th>
              <th className="py-3 px-4">Synlighet</th>
              <th className="py-3 px-4 text-right">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sections.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Inga sektioner skapade ännu.
                </td>
              </tr>
            ) : (
              sections.map((sec) => (
                <tr key={sec.id} className="hover:bg-slate-850/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-400">{sec.sort_order}</td>
                  <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-sky-400" />
                    <span>{sec.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {sec.pages?.length || 0} sidor
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => onToggleVisibility(sec.id, sec.is_visible)}
                      className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white"
                    >
                      {sec.is_visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Synlig</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Dold</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Radera sektionen "${sec.name}"?`)) {
                          onDeleteSection(sec.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                      title="Radera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
            <h2 className="text-base font-semibold mb-4">Skapa ny sektion</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sektionsnamn
                </label>
                <input
                  type="text"
                  required
                  placeholder="t.ex. Boende, Om Gotland"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sorteringsordning
                </label>
                <input
                  type="number"
                  required
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sec-vis"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
                <label htmlFor="sec-vis" className="text-xs text-slate-300">
                  Synlig i navigation
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                >
                  {isSubmitting ? "Skapar..." : "Skapa sektion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
