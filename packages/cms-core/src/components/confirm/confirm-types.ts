import * as React from "react";

export type ConfirmVariant = "destructive" | "default" | "warning";

export interface ConfirmOptions {
  /**
   * Title of the dialog. If omitted, an accessible default title will be used.
   */
  title?: React.ReactNode;
  /**
   * Description message or custom body nodes.
   */
  description: React.ReactNode;
  /**
   * Custom label for the confirm button.
   */
  confirmLabel?: string;
  /**
   * Custom label for the cancel button.
   */
  cancelLabel?: string;
  /**
   * Visual variant: "destructive" (red/rose), "default" (sky/primary), or "warning" (amber).
   */
  variant?: ConfirmVariant;
  /**
   * Optional asynchronous function executed upon confirm click.
   * Keeps dialog open with loading state until resolved.
   * If onConfirm throws an error, the error is displayed inside an Alert in the dialog.
   */
  onConfirm?: () => Promise<void> | void;
}

export interface InformOptions {
  /**
   * Title of the informational dialog.
   */
  title?: React.ReactNode;
  /**
   * Message or content to display.
   */
  description: React.ReactNode;
  /**
   * Custom label for the acknowledge button. Defaults to "Close".
   */
  confirmLabel?: string;
  /**
   * Visual variant: "info" (sky), "warning" (amber), or "destructive" (rose).
   */
  variant?: "info" | "warning" | "destructive";
}

export interface ConfirmContextValue {
  /**
   * Opens a confirmation dialog. Resolves to true if confirmed, false if cancelled.
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /**
   * Opens an informational dialog with a single Close button.
   */
  inform: (options: InformOptions) => Promise<void>;
}

export type QueueItem =
  | {
      id: string;
      type: "confirm";
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    }
  | {
      id: string;
      type: "inform";
      options: InformOptions;
      resolve: () => void;
    };
