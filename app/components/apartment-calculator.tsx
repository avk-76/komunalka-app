
'use client';

import { useState, useEffect } from 'react';
import { Apartment, CalculationResult } from '@/lib/types';
import { HistoryService } from '@/lib/history-service';
import ApartmentCard from './apartment-card';
import CalculationResults from './calculation-results';
import PeriodManager from './period-manager';

interface ApartmentCalculatorProps {
  apartments: Apartment[];
}

export default function ApartmentCalculator({ apartments }: ApartmentCalculatorProps) {
  const [selectedApartment, setSelectedApartment] = useState<string | null>(null);
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<string>('');
  const [lastReadings, setLastReadings] = useState<Record<string, Record<string, number>>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('=== ІНІЦІАЛІЗАЦІЯ КОМПОНЕНТА ===');
    console.log('Отримані apartments:', apartments.map(a => ({ id: a.id, name: a.name })));
    
    // Ініціалізувати після монтування компонента (уникнути помилки гідратації)
    const period = HistoryService.getCurrentPeriod();
    setCurrentPeriod(period);
    
    // Завантажити показники з попереднього періоду для всіх квартир (як базові для нового періоду)
    const allLastReadings: Record<string, Record<string, number>> = {};
    apartments.forEach(apartment => {
      console.log(`Ініціалізація для квартири: ${apartment.id} (${apartment.name})`);
      allLastReadings[apartment.id] = HistoryService.getPreviousPeriodReadings(apartment.id, currentPeriod);
    });
    console.log('Ініціалізовані lastReadings:', allLastReadings);
    setLastReadings(allLastReadings);
    setIsLoaded(true);
    console.log('=== КІНЕЦЬ ІНІЦІАЛІЗАЦІЇ ===');
  }, [apartments]);

  const handleApartmentSelect = (apartmentId: string) => {
    console.log('=== ВИБІР КВАРТИРИ ===');
    console.log('Обрано apartmentId:', apartmentId);
    console.log('Поточний selectedApartment:', selectedApartment);
    console.log('lastReadings для цієї квартири:', lastReadings[apartmentId]);
    console.log('=== КІНЕЦЬ ВИБОРУ КВАРТИРИ ===');
    
    setSelectedApartment(selectedApartment === apartmentId ? null : apartmentId);
  };

  const handleCalculationComplete = (result: CalculationResult) => {
    // Додати період до результату
    const resultWithPeriod = {
      ...result,
      period: currentPeriod
    };

    // Зберегти в історію
    HistoryService.saveReadings(result.apartmentId, resultWithPeriod);

    // Оновити результати для відображення
    setCalculationResults(prev => {
      const filtered = prev.filter(r => r.apartmentId !== result.apartmentId);
      return [...filtered, resultWithPeriod].sort((a, b) => a.apartmentName.localeCompare(b.apartmentName));
    });

    // Оновити показники з попереднього періоду для наступного використання
    const newLastReadings = HistoryService.getPreviousPeriodReadings(result.apartmentId, currentPeriod);
    setLastReadings(prev => ({
      ...prev,
      [result.apartmentId]: newLastReadings
    }));
  };

  const handlePeriodChange = (newPeriod: string) => {
    console.log('=== ЗМІНА ПЕРІОДУ ===');
    console.log('Новий період:', newPeriod);
    console.log('Квартири:', apartments.map(a => ({ id: a.id, name: a.name })));
    
    setCurrentPeriod(newPeriod);
    setCalculationResults([]); // Очистити поточні результати
    setSelectedApartment(null); // Скинути вибір квартири
    
    // Завантажити показники з попереднього періоду для нового періоду
    const allLastReadings: Record<string, Record<string, number>> = {};
    apartments.forEach(apartment => {
      console.log(`Завантажуємо показники для квартири: ${apartment.id} (${apartment.name})`);
      allLastReadings[apartment.id] = HistoryService.getPreviousPeriodReadings(apartment.id, newPeriod);
    });
    
    console.log('Всі завантажені показники:', allLastReadings);
    setLastReadings(allLastReadings);
    console.log('=== КІНЕЦЬ ЗМІНИ ПЕРІОДУ ===');
  };

  const isWinterMonth = (period?: string) => {
    const targetDate = period ? new Date(period + '-01') : new Date();
    const month = targetDate.getMonth() + 1; // Січень = 1
    return month >= 10 || month <= 4; // Жовтень - Квітень
  };

  // Показати завантаження поки не ініціалізовано
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Manager */}
      <PeriodManager 
        apartments={apartments}
        currentPeriod={currentPeriod}
        onPeriodChange={handlePeriodChange}
      />

      {/* Apartment Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {apartments.map((apartment) => {
          const hasLastReadings = lastReadings[apartment.id] && Object.keys(lastReadings[apartment.id]).length > 0;
          return (
            <button
              key={apartment.id}
              onClick={() => {
                console.log('=== КЛІК НА КНОПКУ ===');
                console.log('apartment.id в onClick:', apartment.id);
                console.log('apartment.name в onClick:', apartment.name);
                console.log('apartment object:', apartment);
                console.log('=== ПЕРЕДАЮ В handleApartmentSelect ===');
                handleApartmentSelect(apartment.id)
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedApartment === apartment.id
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'
              }`}
            >
              <h3 className="font-semibold text-gray-800 mb-1">{apartment.name}</h3>
              <p className="text-sm text-gray-600">{apartment.address}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-emerald-600">
                  {apartment.services.length} послуг
                </span>
                <div className="flex items-center space-x-2">
                  {hasLastReadings && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Є попередні показники
                    </span>
                  )}
                  {selectedApartment === apartment.id && (
                    <span className="text-emerald-500 text-sm">Обрано ✓</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Apartment Details */}
      {selectedApartment && (
        <ApartmentCard
          apartment={apartments.find(apt => apt.id === selectedApartment)!}
          isWinterMonth={isWinterMonth(currentPeriod)}
          lastReadings={lastReadings[selectedApartment] || {}}
          currentPeriod={currentPeriod}
          onCalculationComplete={handleCalculationComplete}
        />
      )}

      {/* Calculation Results */}
      {calculationResults.length > 0 && (
        <CalculationResults results={calculationResults} />
      )}
    </div>
  );
}
