import { useState, useEffect, useCallback } from 'react';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../services/supabase';
import type { CustomerRecord } from '../types';

interface UseCustomersReturn {
  customers: CustomerRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCustomer: (record: CustomerRecord, organizationId: string) => Promise<CustomerRecord | null>;
  editCustomer: (record: CustomerRecord) => Promise<CustomerRecord | null>;
  removeCustomer: (id: string) => Promise<boolean>;
}

export function useCustomers(organizationId: string | undefined): UseCustomersReturn {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    console.log('[useCustomers] loadCustomers called, organizationId:', organizationId);

    if (!organizationId) {
      console.log('[useCustomers] No organizationId, returning empty');
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useCustomers] Fetching customers...');
      const data = await fetchCustomers();
      console.log('[useCustomers] Customers loaded:', data.length);
      setCustomers(data);
    } catch (err) {
      setError('고객 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const addCustomer = async (
    record: CustomerRecord,
    orgId: string
  ): Promise<CustomerRecord | null> => {
    try {
      const newRecord = await createCustomer(record, orgId);
      if (newRecord) {
        setCustomers((prev) => [newRecord, ...prev]);
      }
      return newRecord;
    } catch (err) {
      setError('고객 추가에 실패했습니다.');
      console.error(err);
      return null;
    }
  };

  const editCustomer = async (record: CustomerRecord): Promise<CustomerRecord | null> => {
    try {
      const updated = await updateCustomer(record);
      if (updated) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      }
      return updated;
    } catch (err) {
      setError('고객 수정에 실패했습니다.');
      console.error(err);
      return null;
    }
  };

  const removeCustomer = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteCustomer(id);
      if (success) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      }
      return success;
    } catch (err) {
      setError('고객 삭제에 실패했습니다.');
      console.error(err);
      return false;
    }
  };

  return {
    customers,
    loading,
    error,
    refresh: loadCustomers,
    addCustomer,
    editCustomer,
    removeCustomer,
  };
}

export default useCustomers;
