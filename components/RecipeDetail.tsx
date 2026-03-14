import React from 'react';
import { Recipe } from '../types';
import { Clock, Flame, ChefHat, ChevronLeft, Sparkles, Network, ImageIcon } from './Icons';
import KnowledgeGraphViz from './KnowledgeGraphViz';
import { getDishImageUrl } from '../services/geminiService';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack }) => {
  const imageUrl = getDishImageUrl(recipe.title, recipe.cuisine);

  return (
    <div className="bg-white min-h-screen md:min-h-[80vh] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-500">
      {/* Header Image Area */}
      <div className="relative h-64 md:h-80 w-full shrink-0 bg-gray-200">
        <img 
          src={imageUrl} 
          alt={recipe.title} 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>
        
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-2 rounded-full transition-all z-20"
        >
          <ChevronLeft />
        </button>

        <div className="absolute bottom-6 left-6 md:left-10 text-white right-6 z-10">
            <div className="flex gap-2 mb-2">
                <span className="px-2 py-1 bg-brand-500 rounded text-xs font-bold uppercase tracking-wide">
                    {recipe.cuisine}
                </span>
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs font-bold uppercase tracking-wide">
                    {recipe.difficulty}
                </span>
            </div>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">{recipe.title}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          
          {/* Recommendation Reason Section */}
          {recipe.matchReason && (
             <div className="mb-8 p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 relative overflow-hidden shadow-sm">
                <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                    <Sparkles className="w-24 h-24 text-brand-600" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI 智能推荐分析
                    </h3>
                    <p className="text-gray-800 font-medium leading-relaxed text-lg">
                        {recipe.matchReason}
                    </p>
                </div>
             </div>
          )}

          {/* Knowledge Graph Section */}
          <div className="mb-8">
             <div className="flex items-center gap-2 mb-4">
                <Network className="text-brand-600" />
                <h3 className="text-xl font-bold text-gray-800">食谱知识图谱</h3>
             </div>
             <div className="w-full h-80 md:h-96">
                <KnowledgeGraphViz data={recipe.knowledgeGraph} />
             </div>
             <p className="text-xs text-gray-400 mt-2 text-center">图谱展示了食材、功效与您身体状况（BMI/环境）的关联网络</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
             <div className="text-center">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">时间</p>
                <div className="flex items-center justify-center gap-1 text-gray-900 font-bold">
                    <Clock className="text-brand-500" />
                    {recipe.prepTime + recipe.cookTime} 分钟
                </div>
             </div>
             <div className="text-center border-l border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">热量</p>
                <div className="flex items-center justify-center gap-1 text-gray-900 font-bold">
                    <Flame className="text-brand-500" />
                    {recipe.calories}
                </div>
             </div>
             <div className="text-center border-l border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">营养成分</p>
                <div className="text-xs text-gray-600 mt-1">
                   <span className="font-bold text-gray-900">{recipe.protein}</span> 蛋 • <span className="font-bold text-gray-900">{recipe.carbs}</span> 碳 • <span className="font-bold text-gray-900">{recipe.fats}</span> 脂
                </div>
             </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Ingredients Column */}
            <div className="md:col-span-1 space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <ChefHat className="text-brand-500" />
                食材
              </h3>
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-2 shrink-0" />
                    <span className="font-medium text-gray-900">{ing.amount}</span>
                    <span className="text-gray-600 leading-tight">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions Column */}
            <div className="md:col-span-2 space-y-6">
               <h3 className="text-xl font-bold text-gray-800 pb-2 border-b border-gray-100">
                烹饪步骤
              </h3>
              <div className="space-y-6">
                {recipe.instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-100 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed pt-1 group-hover:text-gray-900 transition-colors">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;