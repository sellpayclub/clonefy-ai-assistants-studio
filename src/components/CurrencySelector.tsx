import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Taxa em relação ao USD
  flag: string;
}

const currencies: Currency[] = [
  { code: "USD", name: "Dólar Americano", symbol: "$", rate: 1, flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", rate: 0.92, flag: "🇪🇺" },
  { code: "BRL", name: "Real Brasileiro", symbol: "R$", rate: 5.2, flag: "🇧🇷" },
  { code: "ARS", name: "Peso Argentino", symbol: "$", rate: 350, flag: "🇦🇷" },
  { code: "CLP", name: "Peso Chileno", symbol: "$", rate: 900, flag: "🇨🇱" },
  { code: "COP", name: "Peso Colombiano", symbol: "$", rate: 4200, flag: "🇨🇴" },
  { code: "MXN", name: "Peso Mexicano", symbol: "$", rate: 17, flag: "🇲🇽" },
  { code: "PEN", name: "Sol Peruano", symbol: "S/", rate: 3.7, flag: "🇵🇪" },
  { code: "UYU", name: "Peso Uruguayo", symbol: "$", rate: 39, flag: "🇺🇾" },
  { code: "GBP", name: "Libra Esterlina", symbol: "£", rate: 0.79, flag: "🇬🇧" }
];

interface CurrencySelectorProps {
  basePrice: number;
  onCurrencyChange?: (currency: Currency, convertedPrice: number) => void;
}

export const CurrencySelector = ({ basePrice, onCurrencyChange }: CurrencySelectorProps) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setSelectedCurrency(currency);
      const convertedPrice = basePrice * currency.rate;
      onCurrencyChange?.(currency, convertedPrice);
    }
  };

  const convertedPrice = basePrice * selectedCurrency.rate;
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: selectedCurrency.code === 'USD' || selectedCurrency.code === 'EUR' ? 2 : 0,
    maximumFractionDigits: selectedCurrency.code === 'USD' || selectedCurrency.code === 'EUR' ? 2 : 0,
  }).format(convertedPrice);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
      <Select value={selectedCurrency.code} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-full sm:w-[200px] bg-white/90 backdrop-blur-sm border-primary/20">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCurrency.flag}</span>
              <span className="hidden sm:inline">{selectedCurrency.code}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[200px] overflow-y-auto">
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{currency.flag}</span>
                <span className="font-medium">{currency.code}</span>
                <span className="text-sm text-muted-foreground">{currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="text-center sm:text-left">
        <div className="text-2xl sm:text-3xl font-bold text-primary">
          {selectedCurrency.symbol}{formattedPrice}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">
          {selectedCurrency.code} por mes
        </div>
      </div>
    </div>
  );
};