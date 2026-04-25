import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  QueryConstraint,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query as firestoreQuery
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // throw new Error(JSON.stringify(errInfo)); // Keep it simple for UI display
  return errInfo;
}

export function useCollection<T>(
  collectionName: string, 
  constraints: QueryConstraint[] = [], 
  enabled: boolean = true,
  ignoreUserFilter: boolean = false
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

    setLoading(true);
    
    let q;
    if (ignoreUserFilter) {
      q = firestoreQuery(collection(db, collectionName), ...constraints);
    } else if (collectionName === 'properties') {
      q = firestoreQuery(collection(db, collectionName), where('ownerId', '==', user.uid), ...constraints);
    } else if (collectionName === 'users') {
      q = firestoreQuery(collection(db, collectionName), where('uid', '==', user.uid), ...constraints);
    } else {
      q = firestoreQuery(collection(db, collectionName), where('userId', '==', user.uid), ...constraints);
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T)));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(handleFirestoreError(err, OperationType.LIST, collectionName));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, user?.uid, enabled, ignoreUserFilter]);

  return { data, loading, error };
}

export async function addRecord(collectionName: string, data: any) {
  try {
    return await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, collectionName);
    throw err;
  }
}

export async function updateRecord(collectionName: string, id: string, data: any) {
  try {
    const ref = doc(db, collectionName, id);
    return await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${id}`);
    throw err;
  }
}

export async function deleteRecord(collectionName: string, id: string) {
  try {
    const ref = doc(db, collectionName, id);
    return await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    throw err;
  }
}
