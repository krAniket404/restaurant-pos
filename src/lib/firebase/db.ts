import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config';

export type Category = { id: string; name: string; slug: string };
export type MenuItem = { id: string; name: string; price: number; dietType: 'veg' | 'non-veg'; isAvailable: boolean; description: string; categoryId: string | null };
export type User = { id: string; username: string; password?: string; role: 'owner' | 'cashier' | 'supervisor' };

// --- Categories ---
export async function getCategories(): Promise<Category[]> {
  const q = collection(db, 'categories');
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
}

export async function addCategory(name: string, slug: string) {
  return await addDoc(collection(db, 'categories'), { name, slug });
}

export async function updateCategory(id: string, name: string, slug: string) {
  const docRef = doc(db, 'categories', id);
  return await updateDoc(docRef, { name, slug });
}

export async function deleteCategory(id: string) {
  const docRef = doc(db, 'categories', id);
  return await deleteDoc(docRef);
}

// --- Menu Items ---
export async function getMenuItems(): Promise<MenuItem[]> {
  const q = collection(db, 'menuItems');
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>) {
  return await addDoc(collection(db, 'menuItems'), item);
}

export async function updateMenuItem(id: string, item: Partial<MenuItem>) {
  const docRef = doc(db, 'menuItems', id);
  return await updateDoc(docRef, item);
}

export async function deleteMenuItem(id: string) {
  const docRef = doc(db, 'menuItems', id);
  return await deleteDoc(docRef);
}

// --- Users ---
export async function getUsers(): Promise<User[]> {
  const q = collection(db, 'users');
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { id: doc.id, username: data.username, role: data.role } as User;
  });
}

export async function addUser(user: Omit<User, 'id'>) {
  return await addDoc(collection(db, 'users'), user);
}

export async function updateUser(id: string, user: Partial<User>) {
  const docRef = doc(db, 'users', id);
  return await updateDoc(docRef, user);
}

export async function deleteUser(id: string) {
  const docRef = doc(db, 'users', id);
  return await deleteDoc(docRef);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('username', '==', username));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const data = querySnapshot.docs[0].data();
  return { id: querySnapshot.docs[0].id, ...data } as User;
}

// --- Settings ---
export async function getGeneralSettings() {
  const docRef = doc(db, 'settings', 'general');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // defaults
    return { numberOfTables: 20, name: 'Geethika Restaurant' };
  }
}

export async function updateGeneralSettings(settings: any) {
  const docRef = doc(db, 'settings', 'general');
  return await setDoc(docRef, settings, { merge: true });
}

// For tables array specifically
export async function getTables() {
  const settings = await getGeneralSettings();
  const numberOfTables = settings.numberOfTables || 0;
  return Array.from({ length: numberOfTables }, (_, i) => ({
    _id: `table-${i + 1}`,
    tableNumber: i + 1,
  }));
}
