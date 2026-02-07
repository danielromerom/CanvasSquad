import { Calendar, Timer, BarChart3, ListTodo } from 'lucide-react';

const TAB_CONFIG = {
  main: [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'timer',    label: 'Timer',    icon: Timer },
    { id: 'stats',    label: 'Stats',    icon: BarChart3 },
  ],
  assignment: [
    { id: 'tasks',    label: 'Tasks',    icon: ListTodo },
    { id: 'timer',    label: 'Timer',    icon: Timer },
    { id: 'stats',    label: 'Stats',    icon: BarChart3 },
  ]
};

export default function TabSwitcher({ 
  activeTab, 
  onTabChange, 
  variant = 'main'
}) {
  const tabs = TAB_CONFIG[variant];

  return (
    <div className="bg-[#f4f4f5] p-1 rounded-full flex items-center justify-between w-full max-w-[320px] mx-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 
              py-1.5 px-3 rounded-full text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }
            `}
          >
            <Icon size={16} strokeWidth={2.5} className={isActive ? 'text-gray-900' : 'text-gray-500'} />
            
            {/* Text */}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}