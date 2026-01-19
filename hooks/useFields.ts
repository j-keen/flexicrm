import { useState, useEffect, useCallback } from 'react';
import {
  fetchFields,
  createField,
  updateField,
  deleteField,
} from '../services/supabase';
import type { FieldDefinition } from '../types';

interface UseFieldsReturn {
  fields: FieldDefinition[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addField: (field: FieldDefinition, organizationId: string) => Promise<FieldDefinition | null>;
  editField: (field: FieldDefinition, organizationId: string) => Promise<FieldDefinition | null>;
  removeField: (fieldId: string, organizationId: string) => Promise<boolean>;
  updateFields: (fields: FieldDefinition[]) => void;
}

export function useFields(organizationId: string | undefined): UseFieldsReturn {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFields = useCallback(async () => {
    console.log('[useFields] loadFields called, organizationId:', organizationId);

    if (!organizationId) {
      console.log('[useFields] No organizationId, returning empty');
      setFields([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useFields] Fetching fields...');
      const data = await fetchFields();
      console.log('[useFields] Fields loaded:', data.length);
      setFields(data);
    } catch (err) {
      setError('필드 정의를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const addField = async (
    field: FieldDefinition,
    orgId: string
  ): Promise<FieldDefinition | null> => {
    try {
      const newField = await createField(field, orgId);
      if (newField) {
        setFields((prev) => [...prev, newField]);
      }
      return newField;
    } catch (err) {
      setError('필드 추가에 실패했습니다.');
      console.error(err);
      return null;
    }
  };

  const editField = async (
    field: FieldDefinition,
    orgId: string
  ): Promise<FieldDefinition | null> => {
    try {
      const updated = await updateField(field, orgId);
      if (updated) {
        setFields((prev) =>
          prev.map((f) => (f.id === updated.id ? updated : f))
        );
      }
      return updated;
    } catch (err) {
      setError('필드 수정에 실패했습니다.');
      console.error(err);
      return null;
    }
  };

  const removeField = async (fieldId: string, orgId: string): Promise<boolean> => {
    try {
      const success = await deleteField(fieldId, orgId);
      if (success) {
        setFields((prev) => prev.filter((f) => f.id !== fieldId));
      }
      return success;
    } catch (err) {
      setError('필드 삭제에 실패했습니다.');
      console.error(err);
      return false;
    }
  };

  // Local update (for optimistic UI)
  const updateFields = (newFields: FieldDefinition[]) => {
    setFields(newFields);
  };

  return {
    fields,
    loading,
    error,
    refresh: loadFields,
    addField,
    editField,
    removeField,
    updateFields,
  };
}

export default useFields;
