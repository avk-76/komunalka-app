

'use client';

import { ReadingRecord, PeriodSummary, CalculationResult, GoogleSheetsRow, Apartment } from './types';

export class HistoryService {
  private static readonly STORAGE_KEY = 'utility_calculator_history';
  private static readonly PERIODS_KEY = 'utility_calculator_periods';

  // Отримати поточний період (YYYY-MM)
  static getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Зберегти показники в історію
  static saveReadings(apartmentId: string, result: CalculationResult): void {
    const readings: ReadingRecord[] = result.services.map(service => ({
      serviceName: service.name,
      apartmentId,
      previousReading: service.previousReading,
      currentReading: service.currentReading || 0,
      period: result.period,
      entryDate: new Date().toISOString(),
      tariff: service.tariff,
      amount: service.amount,
      consumption: service.consumption
    }));

    // Зберегти окремі показники
    const existingReadings = this.getReadings();
    const updatedReadings = [
      ...existingReadings.filter(r => 
        !(r.apartmentId === apartmentId && r.period === result.period)
      ),
      ...readings
    ];
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedReadings));

    // Зберегти підсумок періоду
    const periodSummary: PeriodSummary = {
      period: result.period,
      apartmentId,
      apartmentName: result.apartmentName,
      totalAmount: result.totalAmount,
      calculationDate: result.calculationDate,
      readings
    };

    this.savePeriodSummary(periodSummary);
  }

  // Отримати всі показники
  static getReadings(): ReadingRecord[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Отримати показники за період
  static getReadingsByPeriod(period: string): ReadingRecord[] {
    return this.getReadings().filter(r => r.period === period);
  }

  // Отримати останні показники для квартири
  static getLastReadings(apartmentId: string): Record<string, number> {
    const allReadings = this.getReadings();
    
    // ДЕТАЛЬНА ДІАГНОСТИКА
    console.log('=== ДІАГНОСТИКА getLastReadings ===');
    console.log('Шукаємо apartmentId:', apartmentId);
    console.log('Всього записів у базі:', allReadings.length);
    
    // Показати всі записи
    allReadings.forEach((reading, index) => {
      console.log(`Запис ${index + 1}:`, {
        apartmentId: reading.apartmentId,
        serviceName: reading.serviceName,
        currentReading: reading.currentReading,
        period: reading.period
      });
    });
    
    const readings = allReadings
      .filter(r => r.apartmentId === apartmentId)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    
    console.log('Знайдені записи для квартири:', readings.length);
    
    const lastReadings: Record<string, number> = {};
    
    // Групуємо по сервісах і беремо останні показники
    readings.forEach(reading => {
      console.log('Обробляємо сервіс:', reading.serviceName, 'поточний показник:', reading.currentReading);
      
      if (!lastReadings.hasOwnProperty(reading.serviceName) && reading.currentReading != null) {
        lastReadings[reading.serviceName] = reading.currentReading;
        console.log('✅ Додано:', reading.serviceName, '=', reading.currentReading);
      } else {
        console.log('❌ Пропущено:', reading.serviceName, 'вже є:', lastReadings.hasOwnProperty(reading.serviceName), 'поточний null:', reading.currentReading == null);
      }
    });
    
    console.log('Фінальний результат:', lastReadings);
    console.log('=== КІНЕЦЬ ДІАГНОСТИКИ ===');

    return lastReadings;
  }

  // Отримати показники з попереднього періоду для використання як базових
  static getPreviousPeriodReadings(apartmentId: string, currentPeriod: string): Record<string, number> {
    console.log('=== ОТРИМАННЯ ПОПЕРЕДНІХ ПОКАЗНИКІВ ===');
    console.log('apartmentId:', apartmentId);
    console.log('currentPeriod:', currentPeriod);
    
    // Обчислити попередній період
    const [year, month] = currentPeriod.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    
    const previousPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    console.log('Розрахований попередній період:', previousPeriod);
    
    const readings = this.getReadings()
      .filter(r => r.apartmentId === apartmentId && r.period === previousPeriod);

    console.log('Знайдено записів за попередній період:', readings.length);
    readings.forEach(reading => {
      console.log(`- ${reading.serviceName}: ${reading.currentReading}`);
    });

    const previousReadings: Record<string, number> = {};
    
    // Беремо поточні показники з попереднього періоду як попередні для поточного
    readings.forEach(reading => {
      if (reading.currentReading !== undefined) {
        previousReadings[reading.serviceName] = Math.round(reading.currentReading);
      }
    });

    console.log('Фінальні попередні показники:', previousReadings);
    console.log('=== КІНЕЦЬ ОТРИМАННЯ ПОПЕРЕДНІХ ПОКАЗНИКІВ ===');

    return previousReadings;
  }

  // Зберегти підсумок періоду
  static savePeriodSummary(summary: PeriodSummary): void {
    if (typeof window === 'undefined') return;
    
    const existingSummaries = this.getPeriodSummaries();
    const updatedSummaries = [
      ...existingSummaries.filter(s => 
        !(s.apartmentId === summary.apartmentId && s.period === summary.period)
      ),
      summary
    ];
    
    localStorage.setItem(this.PERIODS_KEY, JSON.stringify(updatedSummaries));
  }

  // Отримати підсумки періодів
  static getPeriodSummaries(): PeriodSummary[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.PERIODS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Отримати підсумки за період
  static getPeriodSummariesByPeriod(period: string): PeriodSummary[] {
    return this.getPeriodSummaries().filter(s => s.period === period);
  }

  // Генерувати CSV для Google Sheets
  static generateGoogleSheetsCSV(apartments: Apartment[], period?: string): string {
    const targetPeriod = period || this.getCurrentPeriod();
    const readings = this.getReadingsByPeriod(targetPeriod);
    const summaries = this.getPeriodSummariesByPeriod(targetPeriod);

    const googleSheetsData: GoogleSheetsRow[] = [];

    summaries.forEach(summary => {
      const apartment = apartments.find(apt => apt.id === summary.apartmentId);
      if (!apartment) return;

      summary.readings.forEach(reading => {
        const service = apartment.services.find(s => s.name === reading.serviceName);
        if (!service) return;

        googleSheetsData.push({
          apartment: apartment.name,
          address: apartment.address,
          period: reading.period,
          serviceName: reading.serviceName,
          serviceType: service.type,
          previousReading: reading.previousReading,
          currentReading: reading.currentReading,
          consumption: reading.consumption,
          tariff: reading.tariff,
          fixedAmount: service.fixedAmount,
          calculatedAmount: reading.amount,
          unit: service.unit,
          entryDate: reading.entryDate,
          calculationDate: summary.calculationDate
        });
      });

      // Додати фіксовані послуги, які не мають показників
      apartment.services.forEach(service => {
        if (service.type === 'fixed' || service.type === 'seasonal') {
          const existingReading = summary.readings.find(r => r.serviceName === service.name);
          if (!existingReading && service.fixedAmount && service.fixedAmount > 0) {
            googleSheetsData.push({
              apartment: apartment.name,
              address: apartment.address,
              period: targetPeriod,
              serviceName: service.name,
              serviceType: service.type,
              previousReading: undefined,
              currentReading: undefined,
              consumption: undefined,
              tariff: undefined,
              fixedAmount: service.fixedAmount,
              calculatedAmount: service.fixedAmount,
              unit: service.unit,
              entryDate: summary.calculationDate,
              calculationDate: summary.calculationDate
            });
          }
        }
      });
    });

    // Формуємо CSV заголовки українською
    const headers = [
      'Квартира',
      'Адреса', 
      'Період',
      'Назва послуги',
      'Тип послуги',
      'Попередній показник',
      'Поточний показник', 
      'Споживання',
      'Тариф',
      'Фіксована сума',
      'Розрахована сума',
      'Одиниця виміру',
      'Дата внесення',
      'Дата розрахунку'
    ];

    const csvRows = [
      headers.join(','),
      ...googleSheetsData.map(row => [
        `"${row.apartment}"`,
        `"${row.address}"`,
        row.period,
        `"${row.serviceName}"`,
        `"${row.serviceType}"`,
        row.previousReading || '',
        row.currentReading || '',
        row.consumption || '',
        row.tariff || '',
        row.fixedAmount || '',
        row.calculatedAmount,
        `"${row.unit}"`,
        new Date(row.entryDate).toLocaleDateString('uk-UA'),
        new Date(row.calculationDate).toLocaleDateString('uk-UA')
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  // Експорт до Google Sheets
  static exportToGoogleSheets(apartments: Apartment[], period?: string): void {
    const csv = this.generateGoogleSheetsCSV(apartments, period);
    const targetPeriod = period || this.getCurrentPeriod();
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `комунальні_показники_${targetPeriod}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Очистити всю історію (для налагодження)
  static clearHistory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.PERIODS_KEY);
    }
  }

  // Отримати статистику
  static getStatistics(): {
    totalPeriods: number;
    totalReadings: number;
    apartmentsWithData: string[];
    lastUpdateDate: string | null;
  } {
    const readings = this.getReadings();
    const summaries = this.getPeriodSummaries();
    
    const uniquePeriods = new Set(readings.map(r => r.period));
    const uniqueApartments = new Set(readings.map(r => r.apartmentId));
    const lastReading = readings.sort((a, b) => 
      new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    )[0];

    return {
      totalPeriods: uniquePeriods.size,
      totalReadings: readings.length,
      apartmentsWithData: Array.from(uniqueApartments),
      lastUpdateDate: lastReading?.entryDate || null
    };
  }
}
