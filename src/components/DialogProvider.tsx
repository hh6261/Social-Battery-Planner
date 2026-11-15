import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonVariant } from './Button';
import { AppDialog } from './AppDialog';

export interface DialogOptions {
  title: string;
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  secondaryVariant?: ButtonVariant;
}

interface DialogContextValue {
  /**
   * Show a simple message/confirmation in the app's dialog shape.
   * Resolves true for the primary button, false otherwise.
   */
  showDialog(options: DialogOptions): Promise<boolean>;
  /** Shorthand for errors and notices with a single "OK". */
  showMessage(title: string, message: string): Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

/** Use this instead of Alert.alert so every dialog matches the wireframe shape. */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const finish = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  const showDialog = useCallback((next: DialogOptions) => {
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const showMessage = useCallback(
    (title: string, message: string) => showDialog({ title, message, primaryLabel: t('common.ok') }),
    [showDialog, t],
  );

  const value = useMemo(() => ({ showDialog, showMessage }), [showDialog, showMessage]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <AppDialog
        visible={!!options}
        title={options?.title ?? ''}
        message={options?.message}
        primaryLabel={options?.primaryLabel ?? t('common.ok')}
        onPrimary={() => finish(true)}
        secondaryLabel={options?.secondaryLabel}
        secondaryVariant={options?.secondaryVariant}
        onSecondary={() => finish(false)}
        onRequestClose={() => finish(false)}
      />
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
}
