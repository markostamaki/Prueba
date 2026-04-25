import { useState, useEffect } from 'react';

export function useLocalCollection<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`/api/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refresh: fetchData };
}

export async function addLocalRecord(endpoint: string, data: any) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to add record');
  return response.json();
}

export async function updateLocalRecord(endpoint: string, id: string, data: any) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/${endpoint}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update record');
  return response.json();
}

export async function patchLocalRecord(endpoint: string, id: string, data: any) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/${endpoint}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to patch record');
  return response.json();
}

export async function deleteLocalRecord(endpoint: string, id: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api/${endpoint}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to delete record');
  return response.json();
}
