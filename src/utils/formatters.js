/**
 * Formatea un número como moneda en Peso Chileno (CLP)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada con símbolo $ y separadores de miles
 */
export const formatCLPCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  
  return `$${amount.toLocaleString('es-CL', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  })}`;
};

/**
 * Formatea un valor de precio para input (con separadores de miles)
 * @param {number|string} price - Precio a formatear
 * @returns {string} Precio formateado con separadores de miles
 */
export const formatPriceForInput = (price) => {
  if (price === null || price === undefined) return '';
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Parsea un precio desde formato de entrada (con separadores) a número
 * @param {string} value - Valor a parsear (ej: "1.234.567")
 * @returns {number} Valor numérico
 */
export const parsePriceInput = (value) => {
  if (!value) return 0;
  // Eliminar puntos de separación de miles
  const numericValue = value.replace(/\./g, '');
  return parseInt(numericValue, 10);
};

/**
 * Formatea un número como entero con separadores de miles
 * @param {number} number - Número a formatear 
 * @returns {string} Número formateado con separador de miles
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  return number.toLocaleString('es-CL');
};

/**
 * Convierte un string en formato chileno a número
 * @param {string} str - String en formato $1.234.567 o 1.234.567
 * @returns {number} Valor numérico
 */
export const parseChileanNumber = (str) => {
  if (!str) return 0;
  
  // Remover símbolo de peso y puntos separadores de miles
  const cleanStr = str.replace(/[$\.]/g, '');
  return parseInt(cleanStr, 10);
};
