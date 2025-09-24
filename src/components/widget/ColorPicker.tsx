import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const predefinedColors = [
    '#0066cc', '#0084ff', '#00a86b', '#ff6b35', '#ff4757',
    '#ff3838', '#ff6348', '#ffa502', '#f39c12', '#2ed573',
    '#5352ed', '#6c5ce7', '#a55eea', '#fd79a8', '#fdcb6e',
    '#6c757d', '#495057', '#343a40', '#212529', '#000000'
  ];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className="w-12 h-10 p-0 border-2"
            style={{ backgroundColor: value }}
            onClick={() => setIsOpen(!isOpen)}
          />
          
          {isOpen && (
            <div className="absolute top-12 left-0 z-10 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
              <div className="grid grid-cols-5 gap-2 mb-3">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onChange(color);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
              <div className="border-t pt-3">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full h-8 rounded border"
                />
              </div>
            </div>
          )}
        </div>
        
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ColorPicker;