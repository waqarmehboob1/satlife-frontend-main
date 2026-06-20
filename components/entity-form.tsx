'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: number | string }>;
}

interface EntityFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function EntityForm({ onSubmit, fields, isLoading = false, onCancel }: EntityFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {field.type === 'text' && (
            <Input
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              className={errors[field.name] ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'textarea' && (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              className={errors[field.name] ? 'border-red-500' : ''}
            />
          )}

          {field.type === 'select' && (
            <Select 
              value={formData[field.name]?.toString() || ''} 
              onValueChange={(value) => {
                setFormData({ ...formData, [field.name]: value });
              }}
            >
              <SelectTrigger className={errors[field.name] ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options && field.options.map(opt => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {errors[field.name] && (
            <p className="text-sm text-red-500">{errors[field.name]}</p>
          )}
        </div>
      ))}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting || isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
