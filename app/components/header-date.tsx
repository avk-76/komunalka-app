
'use client';

import { useState, useEffect } from 'react';

export default function HeaderDate() {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      setCurrentDateTime(now.toLocaleDateString('uk-UA', options));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Оновлюється кожну хвилину

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-gray-600">
      {currentDateTime}
    </div>
  );
}
