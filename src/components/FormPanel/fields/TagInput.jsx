import { useState } from 'react';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function TagInput({ value, onChange, placeholder }) {
  const [inputVal, setInputVal] = useState('');

  const tags = Array.isArray(value) ? value : [];

  const addTag = (val) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputVal('');
  };

  const removeTag = (idx) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    }
    if (e.key === 'Backspace' && !inputVal && tags.length) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-variant px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
      {tags.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-primary-container text-on-primary-container px-2 py-1 text-xs">
          {tag}
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeTag(i)} className="text-on-primary-container hover:opacity-80">×</Button>
        </span>
      ))}
      <Input
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputVal)}
        placeholder={tags.length ? '' : (placeholder || 'Type and press Enter')}
        className="border-0 bg-transparent px-0 py-0 h-7 focus:ring-0 focus:border-0 shadow-none min-w-[120px] flex-1 text-on-surface placeholder:text-on-surface-variant"
      />
    </div>
  );
}
