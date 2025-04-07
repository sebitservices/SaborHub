import { collection, addDoc, getDocs, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Colección donde se guardan las categorías
const CATEGORIES_COLLECTION = 'inventarioCategorias';

/**
 * Obtiene todas las categorías de inventario
 * @returns {Promise<Array>} Arreglo de categorías
 */
export const fetchAllCategories = async () => {
  const categoriesSnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
  return categoriesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Crea una nueva categoría
 * @param {Object} categoryData - Datos de la categoría a crear
 * @returns {Promise<Object>} La categoría creada con su ID
 */
export const createCategory = async (categoryData) => {
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
    ...categoryData,
    creado: new Date().toISOString()
  });
  
  return {
    id: docRef.id,
    ...categoryData
  };
};

/**
 * Actualiza una categoría existente
 * @param {string} categoryId - ID de la categoría
 * @param {Object} categoryData - Nuevos datos de la categoría
 * @returns {Promise<void>}
 */
export const updateCategory = async (categoryId, categoryData) => {
  await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), {
    ...categoryData,
    actualizado: new Date().toISOString()
  });
};

/**
 * Elimina una categoría
 * @param {string} categoryId - ID de la categoría a eliminar
 * @returns {Promise<void>}
 */
export const deleteCategory = async (categoryId) => {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
};

/**
 * Categorías predefinidas comunes para inventario
 */
export const PRESET_CATEGORIES = [
  { nombre: "Lácteos", color: "#93C5FD" }, // Azul claro
  { nombre: "Carnes", color: "#FCA5A5" }, // Rojo claro
  { nombre: "Verduras", color: "#6EE7B7" }, // Verde claro
  { nombre: "Frutas", color: "#FCD34D" }, // Amarillo
  { nombre: "Bebidas", color: "#A78BFA" }, // Púrpura claro
  { nombre: "Abarrotes", color: "#D1D5DB" }, // Gris claro
  { nombre: "Condimentos", color: "#FBBF24" }, // Ámbar
  { nombre: "Congelados", color: "#60A5FA" }, // Azul
  { nombre: "Snacks", color: "#F97316" }, // Naranja
  { nombre: "Limpieza", color: "#22D3EE" } // Cyan
];
