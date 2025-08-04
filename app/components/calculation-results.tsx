
'use client';

import { useState } from 'react';
import { CalculationResult, getServiceIcon } from '@/lib/types';
import TelegramIntegration from './telegram-integration';
import { Send, FileText } from 'lucide-react';

interface CalculationResultsProps {
  results: CalculationResult[];
}

export default function CalculationResults({ results }: CalculationResultsProps) {
  const [showTelegram, setShowTelegram] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportResults = () => {
    const exportData = results.map(result => ({
      'Квартира': result.apartmentName,
      'Період': new Date(result.period + '-01').toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' }),
      'Загальна сума': formatCurrency(result.totalAmount),
      'Дата розрахунку': formatDate(result.calculationDate),
      'Деталі': result.services.map(service => 
        `${service.name}: ${formatCurrency(service.amount)}`
      ).join('; ')
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `комунальні_платежі_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotalAllApartments = () => {
    return results.reduce((sum, result) => sum + result.totalAmount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Результати розрахунків</h2>
          <p className="text-gray-600 mt-1">
            {results.length} квартир • Загалом: {formatCurrency(getTotalAllApartments())}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTelegram(!showTelegram)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showTelegram 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>Telegram</span>
          </button>
          
          <button
            onClick={exportResults}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <FileText className="w-4 h-4" />
            <span>Експорт CSV</span>
          </button>
        </div>
      </div>

      {/* Telegram Integration */}
      {showTelegram && (
        <TelegramIntegration results={results} />
      )}

      <div className="grid gap-6">
        {results.map((result) => (
          <div key={result.apartmentId} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold">{result.apartmentName}</h3>
                  <div className="text-emerald-100 text-sm mb-3">
                    Розрахунки за {new Date(result.period + '-01').toLocaleDateString('uk-UA', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                  
                  {/* Компактна розшифровка */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {result.services.map((service, index) => (
                      <div key={index} className="text-emerald-50 flex items-center">
                        <span className="mr-2 text-base">{getServiceIcon(service.name)}</span>
                        <span className="truncate flex-1">{service.name}</span>
                        <span className="ml-2 font-medium text-white">
                          {formatCurrency(service.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="text-2xl font-bold">{formatCurrency(result.totalAmount)}</div>
                  <div className="text-emerald-100 text-sm">
                    {formatDate(result.calculationDate)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.services.map((service, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <span className="mr-2 text-lg">{getServiceIcon(service.name)}</span>
                      <h4 className="font-semibold text-gray-800">{service.name}</h4>
                    </div>
                    
                    {service.consumption !== undefined && (
                      <div className="space-y-1 text-sm text-gray-600 mb-2">
                        <div>Попередній: {service.previousReading} {service.unit}</div>
                        <div>Поточний: {service.currentReading} {service.unit}</div>
                        <div className="font-medium text-emerald-600">
                          Споживання: {service.consumption} {service.unit}
                        </div>
                        {service.tariff && (
                          <div>Тариф: {service.tariff} грн/{service.unit}</div>
                        )}
                      </div>
                    )}

                    <div className="text-lg font-bold text-gray-800">
                      {formatCurrency(service.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Загальна сума:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(result.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Загальний підсумок</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {results.length}
            </div>
            <div className="text-emerald-100">Квартир розраховано</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatCurrency(results.reduce((sum, result) => sum + result.totalAmount, 0))}
            </div>
            <div className="text-emerald-100">Загальна сума</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatCurrency(results.reduce((sum, result) => sum + result.totalAmount, 0) / results.length)}
            </div>
            <div className="text-emerald-100">Середня сума</div>
          </div>
        </div>
      </div>
    </div>
  );
}
