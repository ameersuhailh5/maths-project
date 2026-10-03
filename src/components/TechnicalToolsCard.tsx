import React from 'react';
import { Terminal, Table, Calculator, BarChart3 } from 'lucide-react';

export const TechnicalToolsCard: React.FC = () => {
  const tools = [
    {
      name: 'Python',
      role: 'Model implementation',
      icon: Terminal,
      iconColor: 'text-[#66a3ff]',
      bgColor: 'bg-[#00264d]',
    },
    {
      name: 'Pandas',
      role: 'Data handling',
      icon: Table,
      iconColor: 'text-[#007acc]',
      bgColor: 'bg-[#00264d]',
    },
    {
      name: 'NumPy',
      role: 'Mathematical calculations',
      icon: Calculator,
      iconColor: 'text-[#e5633c]',
      bgColor: 'bg-[#00264d]',
    },
    {
      name: 'Matplotlib',
      role: 'Risk visualization',
      icon: BarChart3,
      iconColor: 'text-amber-400',
      bgColor: 'bg-[#00264d]',
    },
  ];

  return (
    <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-5 sm:p-6 space-y-4 text-white shadow-xl">
      <div className="pb-3 border-b border-[#00509e]">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Technical Tools
        </h2>
        <p className="text-xs text-[#66a3ff] mt-0.5">
          Quantitative computing stack powering mathematical risk modeling.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.name}
              className="bg-[#00264d] border border-[#00509e] rounded-xl p-4 flex flex-col items-center text-center space-y-2.5 hover:border-[#007acc] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#001429] border border-[#00509e] flex items-center justify-center">
                <Icon className={`w-6 h-6 ${t.iconColor}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">{t.name}</h3>
                <p className="text-xs text-[#66a3ff] mt-0.5">{t.role}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
