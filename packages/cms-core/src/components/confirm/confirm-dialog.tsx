"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@cms/components/ui";
import { Loader2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { QueueItem } from "./confirm-types";

interface ConfirmDialogProps {
  item: QueueItem | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function ConfirmDialog({
  item,
  onConfirm,
  onCancel,
  isSubmitting,
  errorMessage,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  const cancelButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = React.useRef<HTMLButtonElement | null>(null);

  if (!item) {
    return null;
  }

  const isConfirmType = item.type === "confirm";
  const confirmOptions = isConfirmType ? item.options : null;
  const informOptions = !isConfirmType ? item.options : null;

  const variant = isConfirmType
    ? confirmOptions?.variant || "default"
    : informOptions?.variant || "info";

  const isDestructive = variant === "destructive";

  const fallbackTitle = isConfirmType
    ? t("confirm")
    : t("information");

  const titleNode = isConfirmType ? confirmOptions?.title : informOptions?.title;
  const descriptionNode = isConfirmType
    ? confirmOptions?.description
    : informOptions?.description;

  const defaultConfirmLabel = isConfirmType
    ? isDestructive
      ? t("delete")
      : t("confirm")
    : t("close");

  const confirmLabel =
    (isConfirmType ? confirmOptions?.confirmLabel : informOptions?.confirmLabel) ||
    defaultConfirmLabel;

  const cancelLabel =
    (isConfirmType ? confirmOptions?.cancelLabel : undefined) || t("cancel");

  const renderIcon = () => {
    if (variant === "destructive") {
      return (
        <div className="shrink-0 p-2 rounded-admin-compact bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
      );
    }
    if (variant === "warning") {
      return (
        <div className="shrink-0 p-2 rounded-admin-compact bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <AlertCircle className="h-5 w-5" />
        </div>
      );
    }
    return (
      <div className="shrink-0 p-2 rounded-admin-compact bg-sky-500/10 border border-sky-500/20 text-sky-400">
        <Info className="h-5 w-5" />
      </div>
    );
  };

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <DialogContent
        variant="admin"
        size="sm"
        hideCloseButton={isSubmitting}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
        onOpenAutoFocus={(e) => {
          if (isDestructive && cancelButtonRef.current) {
            e.preventDefault();
            cancelButtonRef.current.focus();
          }
        }}
      >
        <DialogHeader className="border-b-0 pb-0 mb-0">
          <div className="flex items-start gap-3.5">
            {renderIcon()}
            <div className="flex-1 min-w-0">
              {titleNode ? (
                <DialogTitle variant="admin" size="default">
                  {titleNode}
                </DialogTitle>
              ) : (
                <DialogTitle variant="admin" className="sr-only">
                  {fallbackTitle}
                </DialogTitle>
              )}
              <DialogDescription className="mt-1.5 text-slate-300 leading-relaxed text-xs sm:text-sm">
                {descriptionNode}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-2">
            <Alert variant="destructive">
              <AlertTitle>{t("error")}</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="border-t border-slate-800/80 pt-4 mt-2 gap-2">
          {isConfirmType && (
            <Button
              ref={cancelButtonRef}
              type="button"
              variant="adminSecondary"
              size="sm"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              <span>{cancelLabel}</span>
            </Button>
          )}

          <Button
            ref={confirmButtonRef}
            type="button"
            variant={
              isDestructive
                ? "adminDestructive"
                : isConfirmType
                ? "adminPrimary"
                : "adminSecondary"
            }
            size="sm"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="gap-1.5 min-w-[5rem]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t("loading")}</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
