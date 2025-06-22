import { useState, useEffect, useCallback } from "react";

interface UseDialogFormOptions<T> {
  initialValues: T;
  resetOnClose?: boolean;
}

interface UseDialogFormReturn<T> {
  values: T;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  updateValue: <K extends keyof T>(key: K, value: T[K]) => void;
  resetForm: () => void;
  handleClose: (onClose: () => void) => void;
}

export function useDialogForm<T extends Record<string, any>>({
  initialValues,
  resetOnClose = true,
}: UseDialogFormOptions<T>): UseDialogFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);

  const updateValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleClose = useCallback(
    (onClose: () => void) => {
      if (resetOnClose) {
        resetForm();
      }
      onClose();
    },
    [resetForm, resetOnClose]
  );

  return {
    values,
    setValues,
    updateValue,
    resetForm,
    handleClose,
  };
}

// Hook for managing editing state in dialogs
export function useEditableDialog<T>(
  editingItem: T | null,
  extractValues: (item: T) => Record<string, any>,
  initialValues: Record<string, any>
) {
  const isEditing = !!editingItem;

  // Create form values based on editing state
  const formValues = editingItem ? extractValues(editingItem) : initialValues;

  const form = useDialogForm({
    initialValues: formValues,
    resetOnClose: true,
  });

  // Update form when editing item changes
  useEffect(() => {
    if (editingItem) {
      form.setValues(extractValues(editingItem));
    } else {
      form.resetForm();
    }
  }, [editingItem, extractValues, form]);

  return {
    isEditing,
    ...form,
  };
}
