
'use client';

import { useState, useEffect } from 'react';
import { Apartment, CalculationResult, getServiceIcon } from '@/lib/types';

interface ApartmentCardProps {
  apartment: Apartment;
  isWinterMonth: boolean;
  lastReadings: Record<string, number>;
  currentPeriod: string;
  onCalculationComplete: (result: CalculationResult) => void;
}

export default function ApartmentCard({ 
  apartment, 
  isWinterMonth, 
  lastReadings, 
  currentPeriod, 
  onCalculationComplete 
}: ApartmentCardProps) {
  const [readings, setReadings] = useState<Record<string, { previous: number; current: number }>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Автоматично заповнити попередні показники з історії
  useEffect(() => {
    const initialReadings: Record<string, { previous: number; current: number }> = {};
    
    apartment.services.forEach(service => {
      if (service.type === 'meter') {
        const lastReading = lastReadings[service.name] || 0;
        initialReadings[service.name] = {
          previous: Math.round(lastReading), // Попередні показники - це останні поточні з історії
          current: 0   // Поточні показники - порожні для заповнення користувачем
        };
      }
    });
    
    setReadings(initialReadings);
  }, [apartment.services, lastReadings, currentPeriod]); // Додаємо currentPeriod як залежність

  const handleReadingChange = (serviceName: string, type: 'previous' | 'current', value: string) => {
    // Для ОСББ дозволяємо дробові значення (суми), для інших лічильників - тільки цілі
    let numValue: number;
    if (serviceName === 'ОСББ') {
      numValue = parseFloat(value) || 0;
    } else {
      numValue = Math.round(parseFloat(value) || 0); // Цілі числа для показників лічильників
    }
    
    setReadings(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        [type]: numValue
      }
    }));
  };

  const calculateApartment = () => {
    setIsCalculating(true);
    
    const results: CalculationResult = {
      apartmentId: apartment.id,
      apartmentName: apartment.name,
      services: [],
      totalAmount: 0,
      calculationDate: new Date().toISOString(),
      period: currentPeriod
    };

    apartment.services.forEach(service => {
      // Пропустити зимові послуги в не зимові місяці
      if (service.isWinterOnly && !isWinterMonth) {
        return;
      }

      let amount = 0;
      let consumption: number | undefined;

      if (service.type === 'meter') {
        const reading = readings[service.name];
        if (service.name === 'ОСББ') {
          // Для ОСББ використовуємо введену суму напряму
          if (reading && reading.current > 0) {
            amount = reading.current;
          }
        } else {
          // Для звичайних лічильників розраховуємо споживання
          if (reading && reading.current >= reading.previous) {
            consumption = Math.round(reading.current) - Math.round(reading.previous); // Цілі числа для споживання
            amount = Math.round((consumption * (service.tariff || 0)) * 100) / 100; // Сума до сотих
          }
        }
      } else {
        amount = service.fixedAmount || 0;
      }

      if (amount > 0) {
        results.services.push({
          name: service.name,
          previousReading: service.type === 'meter' ? Math.round(readings[service.name]?.previous || 0) : undefined,
          currentReading: service.type === 'meter' ? (service.name === 'ОСББ' ? readings[service.name]?.current : Math.round(readings[service.name]?.current || 0)) : undefined,
          consumption,
          tariff: service.tariff,
          amount: Math.round(amount * 100) / 100, // Сума до сотих
          unit: service.unit
        });
        results.totalAmount += amount;
      }
    });

    // Округлити загальну суму до сотих
    results.totalAmount = Math.round(results.totalAmount * 100) / 100;

    setTimeout(() => {
      setIsCalculating(false);
      onCalculationComplete(results);
    }, 500);
  };

  const canCalculate = apartment.services
    .filter(service => service.type === 'meter')
    .every(service => {
      const reading = readings[service.name];
      if (service.name === 'ОСББ') {
        // Для ОСББ достатньо тільки поля current
        return reading && reading.current > 0;
      } else {
        // Для звичайних лічильників потрібні обидва показники
        return reading && reading.current >= reading.previous;
      }
    });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">{apartment.name}</h2>
        <p className="text-emerald-100">{apartment.address}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Meter Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Показники лічильників
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apartment.services
              .filter(service => service.type === 'meter')
              .map(service => (
                <div key={service.name} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center mb-3">
                    <span className="mr-2 text-lg">{getServiceIcon(service.name)}</span>
                    <h4 className="font-medium text-gray-800">{service.name}</h4>
                  </div>
                  {service.name === 'ОСББ' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Сума до сплати ({service.unit})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="0.00"
                          value={readings[service.name]?.current || ''}
                          onChange={(e) => handleReadingChange(service.name, 'current', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Попередній показник ({service.unit})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="0.00"
                          value={readings[service.name]?.previous || ''}
                          onChange={(e) => handleReadingChange(service.name, 'previous', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Поточний показник ({service.unit})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="0.00"
                          value={readings[service.name]?.current || ''}
                          onChange={(e) => handleReadingChange(service.name, 'current', e.target.value)}
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        Тариф: {service.tariff} грн за {service.unit}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Fixed Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Постійні платежі
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {apartment.services
              .filter(service => service.type === 'fixed' || (service.type === 'seasonal' && (!service.isWinterOnly || isWinterMonth)))
              .map(service => (
                <div key={service.name} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="mr-2 text-lg">{getServiceIcon(service.name)}</span>
                    <h4 className="font-medium text-gray-800">{service.name}</h4>
                  </div>
                  <p className="text-emerald-600 font-bold">
                    {service.fixedAmount} грн
                  </p>
                  {service.isWinterOnly && (
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      Зимовий період
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Calculate Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={calculateApartment}
            disabled={!canCalculate || isCalculating}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
              canCalculate && !isCalculating
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isCalculating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Розраховується...
              </span>
            ) : (
              'Розрахувати платежі'
            )}
          </button>
          {!canCalculate && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Заповніть всі показники лічильників для розрахунку
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
