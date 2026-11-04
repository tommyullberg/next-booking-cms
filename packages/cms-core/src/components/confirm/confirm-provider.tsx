"use client";

import * as React from "react";
import { ConfirmContext } from "./confirm-context";
import { ConfirmDialog } from "./confirm-dialog";
import { ConfirmOptions, InformOptions, QueueItem } from "./confirm-types";

interface ConfirmProviderProps {
  children: React.ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Synchronous guard against double-clicks
  const isExecutingRef = React.useRef(false);
  // Track mount state
  const isMountedRef = React.useRef(true);
  // Keep pending resolvers for clean resolution on unmount
  const pendingResolversRef = React.useRef<
    Map<string, { type: "confirm" | "inform"; resolve: (val?: any) => void }>
  >(new Map());

  React.useEffect(() => {
    isMountedRef.current = true;
    const resolvers = pendingResolversRef.current;

    return () => {
      isMountedRef.current = false;
      // Resolve all remaining/queued promises safely
      resolvers.forEach(({ type, resolve }) => {
        if (type === "confirm") {
          resolve(false);
        } else {
          resolve();
        }
      });
      resolvers.clear();
    };
  }, []);

  const confirm = React.useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const id = "confirm_" + Math.random().toString(36).substring(2, 9);
      pendingResolversRef.current.set(id, { type: "confirm", resolve });

      setQueue((prev) => [
        ...prev,
        {
          id,
          type: "confirm",
          options,
          resolve: (val: boolean) => {
            pendingResolversRef.current.delete(id);
            resolve(val);
          },
        },
      ]);
    });
  }, []);

  const inform = React.useCallback((options: InformOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      const id = "inform_" + Math.random().toString(36).substring(2, 9);
      pendingResolversRef.current.set(id, { type: "inform", resolve });

      setQueue((prev) => [
        ...prev,
        {
          id,
          type: "inform",
          options,
          resolve: () => {
            pendingResolversRef.current.delete(id);
            resolve();
          },
        },
      ]);
    });
  }, []);

  const currentItem = queue[0] || null;

  const handleCancel = React.useCallback(() => {
    if (isExecutingRef.current) return;
    if (!currentItem) return;

    const item = currentItem;
    setQueue((prev) => prev.slice(1));
    setErrorMessage(null);
    setIsSubmitting(false);

    if (item.type === "confirm") {
      item.resolve(false);
    } else {
      item.resolve();
    }
  }, [currentItem]);

  const handleConfirm = React.useCallback(async () => {
    // Synchronous guard prevents double execution from rapid clicks
    if (isExecutingRef.current) return;
    if (!currentItem) return;

    if (currentItem.type === "inform") {
      const item = currentItem;
      setQueue((prev) => prev.slice(1));
      setErrorMessage(null);
      item.resolve();
      return;
    }

    const { options } = currentItem;

    if (!options.onConfirm) {
      const item = currentItem;
      setQueue((prev) => prev.slice(1));
      setErrorMessage(null);
      item.resolve(true);
      return;
    }

    isExecutingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await options.onConfirm();

      // Check if still mounted before updating state
      if (!isMountedRef.current) {
        currentItem.resolve(true);
        return;
      }

      const item = currentItem;
      setQueue((prev) => prev.slice(1));
      setIsSubmitting(false);
      setErrorMessage(null);
      isExecutingRef.current = false;
      item.resolve(true);
    } catch (err: any) {
      // If unmounted while onConfirm was in-flight, do not update state
      if (!isMountedRef.current) {
        currentItem.resolve(false);
        return;
      }

      isExecutingRef.current = false;
      setIsSubmitting(false);
      setErrorMessage(err?.message || "Operationen misslyckades.");
      // Dialog remains open so user can retry or cancel
    }
  }, [currentItem]);

  const contextValue = React.useMemo(
    () => ({
      confirm,
      inform,
    }),
    [confirm, inform]
  );

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        item={currentItem}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </ConfirmContext.Provider>
  );
}
