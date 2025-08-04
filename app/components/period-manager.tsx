

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, History, BarChart3, Settings } from 'lucide-react';
import { HistoryService } from '@/lib/history-service';
import { Apartment, PeriodSummary } from '@/lib/types';

interface PeriodManagerProps {
  apartments: Apartment[];
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
}

export default function PeriodManager({ apartments, currentPeriod, onPeriodChange }: PeriodManagerProps) {
  const [summaries, setSummaries] = useState<PeriodSummary[]>([]);
  const [statistics, setStatistics] = useState<{
    totalPeriods: number;
    totalReadings: number;
    apartmentsWithData: string[];
    lastUpdateDate: string | null;
  }>({
    totalPeriods: 0,
    totalReadings: 0,
    apartmentsWithData: [],
    lastUpdateDate: null
  });
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentPeriod]);

  const loadData = () => {
    setSummaries(HistoryService.getPeriodSummariesByPeriod(currentPeriod));
    setStatistics(HistoryService.getStatistics());
  };

  const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    
    // Додаємо поточний та наступні 12 місяців
    for (let i = -6; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' });
      options.push({ value: period, label });
    }
    
    return options;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH'
    }).format(amount);
  };

  const handleExportToGoogleSheets = () => {
    HistoryService.exportToGoogleSheets(apartments, currentPeriod);
  };

  const getTotalForPeriod = () => {
    return summaries.reduce((sum, summary) => sum + summary.totalAmount, 0);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-800">Управління періодами</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${
              showHistory 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <History className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleExportToGoogleSheets}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Google Sheets</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Оберіть період
          </label>
          <select
            value={currentPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {generatePeriodOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Підсумок періоду</div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(getTotalForPeriod())}
          </div>
          <div className="text-sm text-gray-500">
            {summaries.length} з {apartments.length} квартир розраховано
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Періодів</span>
          </div>
          <div className="text-xl font-bold text-emerald-800">{statistics.totalPeriods}</div>
        </div>

        <div className="bg-cyan-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Settings className="h-4 w-4 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-700">Показників</span>
          </div>
          <div className="text-xl font-bold text-cyan-800">{statistics.totalReadings}</div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Квартир</span>
          </div>
          <div className="text-xl font-bold text-blue-800">{statistics.apartmentsWithData.length}</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <History className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Останнє</span>
          </div>
          <div className="text-sm font-bold text-purple-800">
            {statistics.lastUpdateDate 
              ? new Date(statistics.lastUpdateDate).toLocaleDateString('uk-UA')
              : 'Немає даних'
            }
          </div>
        </div>
      </div>

      {/* Current Period Summary */}
      {summaries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Розрахунки за {new Date(currentPeriod + '-01').toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })}
          </h3>
          
          <div className="grid gap-4">
            {summaries.map((summary) => (
              <div key={`${summary.apartmentId}-${summary.period}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{summary.apartmentName}</div>
                  <div className="text-sm text-gray-500">
                    {summary.readings.length} послуг • {' '}
                    {new Date(summary.calculationDate).toLocaleDateString('uk-UA')}
                  </div>
                </div>
                <div className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(summary.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Toggle */}
      {showHistory && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Історія періодів</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {HistoryService.getPeriodSummaries()
              .sort((a, b) => new Date(b.calculationDate).getTime() - new Date(a.calculationDate).getTime())
              .map((summary, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="text-sm">
                    <span className="font-medium">{summary.apartmentName}</span>
                    <span className="text-gray-500 ml-2">
                      {new Date(summary.period + '-01').toLocaleDateString('uk-UA', { year: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-emerald-600">
                    {formatCurrency(summary.totalAmount)}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {summaries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Немає розрахунків за цей період</p>
          <p className="text-sm">Оберіть квартиру та внесіть показники для розрахунку</p>
        </div>
      )}
    </div>
  );
}
