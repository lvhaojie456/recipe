import React, { useState } from 'react';
import { Sliders, Sparkles } from './Icons';

interface MenuAdjusterProps {
  onAdjust: (instruction: string) => void;
  isAdjusting: boolean;
}

const MenuAdjuster: React.FC<MenuAdjusterProps> = ({ onAdjust, isAdjusting }) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !isAdjusting) {
      onAdjust(instruction);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-gradient-to-r from-brand-600 to-orange-500 p-1 rounded-2xl shadow-lg">
        <form onSubmit={handleSubmit} className="bg-white rounded-[13px] flex items-center p-2 relative overflow-hidden">
            
            {/* Loading Overlay */}
            {isAdjusting && (
                <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center gap-3 text-brand-600 font-medium">
                    <Sparkles className="animate-spin w-5 h-5" />
                    AI 正在重新规划菜单...
                </div>
            )}

            <div className="pl-3 pr-2 text-gray-400">
                <Sliders className="w-5 h-5" />
            </div>
            
            <input 
                type="text" 
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="觉得不满意？告诉 AI 调整... (例如：太清淡了，想吃辣一点 / 换成西餐 / 简单一点)"
                className="flex-grow p-2.5 text-gray-700 outline-none placeholder-gray-400 bg-transparent"
                disabled={isAdjusting}
            />
            
            <button 
                type="submit"
                disabled={!instruction.trim() || isAdjusting}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
                调整菜单
            </button>
        </form>
      </div>
      <p className="text-xs text-center text-gray-400 mt-2">
         AI 将结合您的身体数据(BMI)和新指令实时生成
      </p>
    </div>
  );
};

export default MenuAdjuster;