/**
 * Utilidades de formateo de fechas y horas.
 * - Sin dependencias externas.
 * - Compatible con React Native (no usa Intl.DateTimeFormat completo en Hermes antiguo).
 */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/**
 * Normaliza un string para búsqueda: minúsculas, sin acentos, sin diacríticos.
 * Útil para búsqueda tolerante a tildes/teclados sin ñ/acentos.
 * @example "Categoría" → "categoria", "TÁREA" → "tarea", "niño" → "nino"
 */
export const normalizeForSearch = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')           // Descompone caracteres con acentos (á → a + ´)
    .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas (los acentos)
    .replace(/ñ/g, 'n')         // ñ → n
    .trim();
};

/**
 * Formatea fecha ISO (YYYY-MM-DD) a "DD de mes de YYYY".
 * @example "2025-03-15" → "15 de marzo de 2025"
 */
export const formatDateLong = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day} de ${MESES[month - 1]} de ${year}`;
};

/**
 * Formatea fecha ISO a "DD/MM/YYYY".
 */
export const formatDateShort = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

/**
 * Formatea hora 24h (HH:mm) a formato 12h con am/pm.
 * @example "14:30" → "2:30 PM"
 */
export const formatTime12h = (time24: string): string => {
  const [h, m] = time24.split(':').map(Number);
  if (h === undefined || m === undefined) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Formatea fecha + hora para mostrar en lista.
 * @example ("2025-03-15", "14:30") → "15 mar, 2:30 PM"
 */
export const formatDateTime = (isoDate: string, time24: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return `${isoDate} ${time24}`;
  const d = new Date(year, month - 1, day);
  const diaSemana = DIAS_SEMANA[d.getDay()];
  return `${day} ${diaSemana}, ${formatTime12h(time24)}`;
};

/**
 * Verifica si una fecha ISO es hoy.
 */
export const isToday = (isoDate: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return isoDate === today;
};

/**
 * Verifica si una fecha ISO es en el futuro (estrictamente > hoy).
 */
export const isFuture = (isoDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d > today;
};

/**
 * Verifica si una fecha ISO es pasada (< hoy).
 */
export const isPast = (isoDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d < today;
};

/**
 * Devuelve string relativa: "Hoy", "Mañana", "Pasado mañana", "DD/MM", etc.
 */
export const getRelativeDateLabel = (isoDate: string): string => {
  if (isToday(isoDate)) return 'Hoy';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];
  if (isoDate === tomorrowISO) return 'Mañana';
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterISO = dayAfter.toISOString().split('T')[0];
  if (isoDate === dayAfterISO) return 'Pasado mañana';
  return formatDateShort(isoDate);
};