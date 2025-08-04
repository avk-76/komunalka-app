
import { apartments } from '@/lib/types';
import ApartmentCalculator from '@/components/apartment-calculator';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Калькулятор комунальних послуг
        </h1>
        <p className="text-emerald-100 max-w-2xl mx-auto">
          Розрахуйте комунальні платежі для ваших квартир швидко та зручно
        </p>
      </div>

      {/* Main Calculator */}
      <ApartmentCalculator apartments={apartments} />
    </div>
  );
}
