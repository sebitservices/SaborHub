import { db } from './config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

// Servicios para Áreas
export const crearArea = async (area) => {
  try {
    const docRef = await addDoc(collection(db, 'areas'), area);
    return { id: docRef.id, ...area };
  } catch (error) {
    console.error('Error al crear área:', error);
    throw error;
  }
};

export const obtenerAreas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'areas'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    throw error;
  }
};

export const eliminarArea = async (areaId) => {
  try {
    await deleteDoc(doc(db, 'areas', areaId));
  } catch (error) {
    console.error('Error al eliminar área:', error);
    throw error;
  }
};

// Servicios para Mesas
export const crearMesa = async (mesa) => {
  try {
    const docRef = await addDoc(collection(db, 'mesas'), mesa);
    return { id: docRef.id, ...mesa };
  } catch (error) {
    console.error('Error al crear mesa:', error);
    throw error;
  }
};

export const obtenerMesas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'mesas'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    throw error;
  }
};

export const actualizarMesa = async (mesaId, datos) => {
  try {
    await updateDoc(doc(db, 'mesas', mesaId), datos);
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    throw error;
  }
};

export const eliminarMesa = async (mesaId) => {
  try {
    await deleteDoc(doc(db, 'mesas', mesaId));
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    throw error;
  }
}; 