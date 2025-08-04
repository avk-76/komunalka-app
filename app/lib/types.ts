
export interface Service {
  name: string;
  type: 'meter' | 'fixed' | 'seasonal';
  unit: string;
  tariff?: number;
  previousReading?: number;
  currentReading?: number;
  fixedAmount?: number;
  isWinterOnly?: boolean;
}

export interface Apartment {
  id: string;
  name: string;
  address: string;
  services: Service[];
}

export interface CalculationResult {
  apartmentId: string;
  apartmentName: string;
  services: {
    name: string;
    previousReading?: number;
    currentReading?: number;
    consumption?: number;
    tariff?: number;
    amount: number;
    unit: string;
  }[];
  totalAmount: number;
  calculationDate: string;
  period: string; // YYYY-MM формат
}

// Нові типи для історії
export interface ReadingRecord {
  serviceName: string;
  apartmentId: string;
  previousReading?: number;
  currentReading: number;
  period: string; // YYYY-MM
  entryDate: string;
  tariff?: number;
  amount: number;
  consumption?: number;
}

export interface PeriodSummary {
  period: string; // YYYY-MM
  apartmentId: string;
  apartmentName: string;
  totalAmount: number;
  calculationDate: string;
  readings: ReadingRecord[];
}

export interface GoogleSheetsRow {
  apartment: string;
  address: string;
  period: string;
  serviceName: string;
  serviceType: string;
  previousReading?: number;
  currentReading?: number;
  consumption?: number;
  tariff?: number;
  fixedAmount?: number;
  calculatedAmount: number;
  unit: string;
  entryDate: string;
  calculationDate: string;
}

// Mapping послуг до іконок
export const serviceIcons: Record<string, string> = {
  // Електроенергія
  'Світло День': '💡',
  'Світло Ніч': '🌙',
  
  // Вода
  'Вода': '💧',
  'Вода лічильник 1': '💧',
  'Вода лічильник 2': '💧',
  'АП Вода (фікс)': '💧',
  'АП Вода': '💧',
  
  // Газ
  'Газ': '🔥',
  'АП Газ (фікс)': '🔥',
  'АП Газ': '🔥',
  
  // Житло
  'Орендна плата': '🏠',
  'ОСББ': '🏢',
  
  // Опалення
  'Опалення в зимовий період': '🌡️',
  'АП Опалення': '🌡️',
  
  // Комунікації
  'Домофон': '📞',
  'Інтернет': '🌐',
  
  // Послуги
  'ЖЕУ': '🏢',
  'Сміття': '🗑️',
  
  // Інше
  'default': '⚡'
};

// Функція для отримання іконки послуги
export const getServiceIcon = (serviceName: string): string => {
  return serviceIcons[serviceName] || serviceIcons['default'];
};

// Дані квартир на основі аналізу Google Sheets (оновлено відповідно до реальних даних)
export const apartments: Apartment[] = [
  {
    id: 'khmelnytskogo',
    name: 'Б.Хмельницького 8е/20',
    address: 'вул. Б.Хмельницького 8е, кв. 20',
    services: [
      { name: 'Світло День', type: 'meter', unit: 'кВт·год', tariff: 4.32 },
      { name: 'Світло Ніч', type: 'meter', unit: 'кВт·год', tariff: 2.16 },
      { name: 'Вода лічильник 1', type: 'meter', unit: 'м³', tariff: 31.36 },
      { name: 'Газ', type: 'meter', unit: 'м³', tariff: 7.89 },
      { name: 'Орендна плата', type: 'fixed', unit: 'грн', fixedAmount: 9500 },
      { name: 'АП Вода (фікс)', type: 'fixed', unit: 'грн', fixedAmount: 38 },
      { name: 'АП Газ (фікс)', type: 'fixed', unit: 'грн', fixedAmount: 3.51 },
      { name: 'Домофон', type: 'fixed', unit: 'грн', fixedAmount: 70 },
      { name: 'Інтернет', type: 'fixed', unit: 'грн', fixedAmount: 260 },
      { name: 'ЖЕУ', type: 'fixed', unit: 'грн', fixedAmount: 328.92 },
      { name: 'Сміття', type: 'fixed', unit: 'грн', fixedAmount: 33.57 },
      { name: 'АП Опалення', type: 'fixed', unit: 'грн', fixedAmount: 35 },
    ]
  },
  {
    id: 'mechnykova',
    name: 'Мечнікова 5/20',
    address: 'вул. Мечнікова 5, кв. 20',
    services: [
      { name: 'Світло День', type: 'meter', unit: 'кВт·год', tariff: 4.32 },
      { name: 'Світло Ніч', type: 'meter', unit: 'кВт·год', tariff: 2.16 },
      { name: 'Вода', type: 'meter', unit: 'м³', tariff: 31.36 },
      { name: 'ОСББ', type: 'meter', unit: 'грн', tariff: 1.0 },
      { name: 'Орендна плата', type: 'fixed', unit: 'грн', fixedAmount: 18500 },
      { name: 'АП Вода (фікс)', type: 'fixed', unit: 'грн', fixedAmount: 38 },
      { name: 'Опалення в зимовий період', type: 'seasonal', unit: 'грн', fixedAmount: 1200, isWinterOnly: true },
    ]
  },
  {
    id: 'salakyna',
    name: 'М. Салакунова 12/5',
    address: 'вул. М. Салакунова 12, кв. 5',
    services: [
      { name: 'Світло День', type: 'meter', unit: 'кВт·год', tariff: 4.32 },
      { name: 'Світло Ніч', type: 'meter', unit: 'кВт·год', tariff: 2.16 },
      { name: 'Вода лічильник 1', type: 'meter', unit: 'м³', tariff: 31.36 },
      { name: 'Орендна плата', type: 'fixed', unit: 'грн', fixedAmount: 10200 },
      { name: 'ОСББ', type: 'fixed', unit: 'грн', fixedAmount: 477.08 },
      { name: 'АП Опалення', type: 'fixed', unit: 'грн', fixedAmount: 27.42 },
      { name: 'АП Вода (фікс)', type: 'fixed', unit: 'грн', fixedAmount: 38 },
    ]
  },
  {
    id: 'sevastopolska',
    name: 'Севастопольська 67А/2',
    address: 'вул. Севастопольська 67А, кв. 2',
    services: [
      { name: 'Світло День', type: 'meter', unit: 'кВт·год', tariff: 4.32 },
      { name: 'Світло Ніч', type: 'meter', unit: 'кВт·год', tariff: 2.16 },
      { name: 'Вода лічильник 1', type: 'meter', unit: 'м³', tariff: 31.36 },
      { name: 'Вода лічильник 2', type: 'meter', unit: 'м³', tariff: 31.36 },
      { name: 'Газ', type: 'meter', unit: 'м³', tariff: 7.89 },
      { name: 'АП Вода (фікс)', type: 'fixed', unit: 'грн', fixedAmount: 38 },
      { name: 'АП Газ (фікс)', type: 'fixed', unit: 'грн', fixedAmount: 101.96 },
    ]
  }
];
