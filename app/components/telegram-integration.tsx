

'use client';

import { useState } from 'react';
import { Send, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { CalculationResult } from '@/lib/types';

interface TelegramIntegrationProps {
  results: CalculationResult[];
}

export default function TelegramIntegration({ results }: TelegramIntegrationProps) {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentResults, setSentResults] = useState<string[]>([]);

  // Симуляція перевірки конфігурації бота
  const checkBotConfiguration = () => {
    // В реальній реалізації тут буде перевірка з Telegram API
    setIsConfigured(botToken.trim() !== '' && chatId.trim() !== '');
  };

  // Форматування повідомлення для Telegram
  const formatTelegramMessage = (result: CalculationResult): string => {
    const period = new Date(result.period + '-01').toLocaleDateString('uk-UA', { 
      year: 'numeric', 
      month: 'long' 
    });

    let message = `🏠 *${result.apartmentName}*\n`;
    message += `📅 Період: ${period}\n`;
    message += `💰 Загальна сума: *${result.totalAmount.toFixed(2)} грн*\n\n`;
    
    message += `📋 *Деталі розрахунку:*\n`;
    result.services.forEach(service => {
      message += `• ${service.name}: ${service.amount.toFixed(2)} грн`;
      if (service.consumption) {
        message += ` (${service.consumption.toFixed(2)} ${service.unit})`;
      }
      message += '\n';
    });

    message += `\n📊 Розраховано: ${new Date(result.calculationDate).toLocaleDateString('uk-UA')}`;
    message += `\n\n❓ Підтвердіть надсилання (+) або скасуйте (-)`;

    return message;
  };

  // Симуляція відправки до Telegram
  const sendToTelegram = async (result: CalculationResult) => {
    setIsSending(true);
    
    // Симуляція API запиту
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // В реальній реалізації тут буде:
    // const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: chatId,
    //     text: formatTelegramMessage(result),
    //     parse_mode: 'Markdown'
    //   })
    // });

    setSentResults(prev => [...prev, result.apartmentId]);
    setIsSending(false);
  };

  // Симуляція отримання підтвердження
  const simulateConfirmation = (apartmentId: string) => {
    // В реальній реалізації тут буде webhook endpoint для отримання відповідей
    alert(`Симуляція: отримано підтвердження "+" для ${apartmentId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Send className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Telegram інтеграція</h2>
        {isConfigured && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>

      {/* Configuration */}
      {!isConfigured && (
        <div className="space-y-4 mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Налаштування Telegram бота</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Для автоматичної відправки результатів потрібно налаштувати Telegram бота
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bot Token (з @BotFather)
              </label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdef..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chat ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="@username або числовий ID"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <button
            onClick={checkBotConfiguration}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Перевірити налаштування</span>
          </button>
        </div>
      )}

      {/* Results to Send */}
      {isConfigured && results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Результати для відправки</h3>
          
          <div className="space-y-3">
            {results.map(result => {
              const isSent = sentResults.includes(result.apartmentId);
              
              return (
                <div key={result.apartmentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{result.apartmentName}</div>
                    <div className="text-sm text-gray-500">
                      {result.totalAmount.toFixed(2)} грн • {' '}
                      {new Date(result.period + '-01').toLocaleDateString('uk-UA', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </div>
                    {isSent && (
                      <div className="text-sm text-green-600 mt-1">✓ Відправлено, очікується підтвердження</div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!isSent ? (
                      <button
                        onClick={() => sendToTelegram(result)}
                        disabled={isSending}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        <span>{isSending ? 'Відправляю...' : 'Відправити'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => simulateConfirmation(result.apartmentId)}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Симуляція +</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Інструкції для майбутньої інтеграції:</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Створіть бота через @BotFather в Telegram</li>
          <li>Отримайте Bot Token та збережіть його</li>
          <li>Створіть канал або групу для розсилки</li>
          <li>Додайте бота до каналу з правами адміністратора</li>
          <li>Налаштуйте webhook endpoint для отримання підтверджень</li>
          <li>Створіть список абонентів з їх Chat ID</li>
        </ol>
      </div>

      {!isConfigured && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Send className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Немає результатів для відправки</p>
          <p className="text-sm">Спочатку розрахуйте платежі для квартир</p>
        </div>
      )}
    </div>
  );
}
