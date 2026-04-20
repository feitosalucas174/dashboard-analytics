interface CategoryFilterProps {
  selected:  string[];
  onToggle:  (cat: string) => void;
}

const CATEGORIES = [
  { name: 'Vendas',     color: '#6366f1' },
  { name: 'Marketing',  color: '#f59e0b' },
  { name: 'Operações',  color: '#10b981' },
  { name: 'Financeiro', color: '#ef4444' },
  { name: 'RH',         color: '#8b5cf6' },
];

export default function CategoryFilter({ selected, onToggle }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((cat) => {
        const isSelected = selected.includes(cat.name);
        return (
          <button
            key={cat.name}
            onClick={() => onToggle(cat.name)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium border transition-all
              ${isSelected
                ? 'text-white border-transparent'
                : 'bg-transparent border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
              }`}
            style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: cat.color }}
            />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
