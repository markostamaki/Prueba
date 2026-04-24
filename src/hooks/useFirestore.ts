import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { apiRequest } from '../lib/api';

export function useCollection<T>(
  collectionName: string, 
  enabled: boolean = true,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || enabled === false) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = collectionName === 'maintenance_tasks' ? '/maintenance' : `/${collectionName}`;
        const result = await apiRequest(endpoint);
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName, user?.id, enabled]);

  return { data, loading, error };
}

export async function addRecord(collectionName: string, data: any) {
  const endpoint = collectionName === 'maintenance_tasks' ? '/maintenance' : `/${collectionName}`;
  return await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRecord(collectionName: string, id: string, data: any) {
  const endpoint = collectionName === 'maintenance_tasks' ? `/maintenance/${id}` : `/${collectionName}/${id}`;
  // Handle admin updates to users separately if needed, but for now properties/maintenance use this
  const targetEndpoint = collectionName === 'users' ? `/admin/users/${id}` : endpoint;
  
  return await apiRequest(targetEndpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRecord(collectionName: string, id: string) {
  const endpoint = collectionName === 'maintenance_tasks' ? `/maintenance/${id}` : `/${collectionName}/${id}`;
  return await apiRequest(endpoint, {
    method: 'DELETE',
  });
}
