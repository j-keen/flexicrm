import { useState, useEffect, useCallback } from 'react';
import { fetchAutomationRules, saveAutomationRules } from '../services/supabase';
import type { DependencyRule } from '../types';

interface UseAutomationRulesReturn {
  rules: DependencyRule[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateRules: (rules: DependencyRule[]) => void;
  saveRules: (rules: DependencyRule[], organizationId: string) => Promise<boolean>;
}

export function useAutomationRules(organizationId: string | undefined): UseAutomationRulesReturn {
  const [rules, setRules] = useState<DependencyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    if (!organizationId) {
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAutomationRules();
      setRules(data);
    } catch (err) {
      setError('자동화 규칙을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Local update (for optimistic UI)
  const updateRules = (newRules: DependencyRule[]) => {
    setRules(newRules);
  };

  const saveRulesToDb = async (
    newRules: DependencyRule[],
    orgId: string
  ): Promise<boolean> => {
    try {
      const success = await saveAutomationRules(newRules, orgId);
      if (success) {
        setRules(newRules);
      }
      return success;
    } catch (err) {
      setError('자동화 규칙 저장에 실패했습니다.');
      console.error(err);
      return false;
    }
  };

  return {
    rules,
    loading,
    error,
    refresh: loadRules,
    updateRules,
    saveRules: saveRulesToDb,
  };
}

export default useAutomationRules;
