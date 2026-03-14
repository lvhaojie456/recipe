import { GoogleGenAI, Type, Chat } from "@google/genai";
import { UserPreferences, Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Keep a reference to the chat session
let chatSession: Chat | null = null;

// Helper to construct BMI string
const getBmiInfo = (prefs: UserPreferences) => {
    let bmiInfo = "";
    if (prefs.height && prefs.weight) {
        const h = prefs.height / 100;
        const w = prefs.weight;
        if (!isNaN(h) && !isNaN(w) && h > 0) {
            const bmi = (w / (h*h)).toFixed(1);
            bmiInfo = `BMI: ${bmi}, Height: ${prefs.height}cm, Weight: ${prefs.weight}kg, Age: ${prefs.age}, Gender: ${prefs.gender}`;
        }
    }
    return bmiInfo;
};

// Define Schema centrally to reuse
const RECIPE_SCHEMA = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        cuisine: { type: Type.STRING, description: "Style of cooking, inferred from location" },
        prepTime: { type: Type.NUMBER },
        cookTime: { type: Type.NUMBER },
        difficulty: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fats: { type: Type.NUMBER },
        matchReason: { type: Type.STRING, description: "Detailed reason linking BMI and Location to recipe" },
        authorUid: { type: Type.STRING },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        allergens: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              amount: { type: Type.STRING },
            }
          }
        },
        instructions: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        knowledgeGraph: {
          type: Type.OBJECT,
          properties: {
              nodes: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ['Root', 'Ingredient', 'Effect', 'BodyCondition', 'LocationFactor'] }
                      }
                  }
              },
              links: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          source: { type: Type.STRING },
                          target: { type: Type.STRING },
                          label: { type: Type.STRING }
                      }
                  }
              }
          }
        }
      }
    }
  };

export const getDishImageUrl = (title: string, cuisine: string): string => {
    // Simple hash function to get a deterministic number
    let hash = 0;
    const str = title + cuisine;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const seed = Math.abs(hash);
    return `https://loremflickr.com/800/600/food?lock=${seed}`;
};

export const generateRecipes = async (prefs: UserPreferences, targetCalories: number): Promise<Recipe[]> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    你是一位结合了现代营养学和中医智慧的顶级行政总厨及健康专家。
    请根据用户的详细健康档案，生成 3 个独特的个性化食谱。
    
    【用户档案】
    1. 生理参数: 性别 ${prefs.gender}, 年龄 ${prefs.age}, 身高 ${prefs.height}cm, 体重 ${prefs.weight}kg, 活动量 ${prefs.activityLevel}, 目标 ${prefs.healthGoal}
       -> 建议单餐热量目标: 约 ${targetCalories} kcal
    2. 健康禁忌: 过敏原 [${prefs.allergies.join(', ') || '无'}], 慢性病 [${prefs.chronicDiseases.join(', ') || '无'}], 服药情况 [${prefs.medications || '无'}]
       -> 绝对红线：食谱中绝对不能包含过敏原。如果有慢性病（如糖尿病），必须低GI；如果有高血压，必须低钠。
    3. 饮食偏好: 口味 [${prefs.flavorPreferences.join(', ') || '无'}], 饮食流派 [${prefs.dietType}], 厌恶食物 [${prefs.dislikedFoods.join(', ') || '无'}]
       -> 绝对红线：食谱中绝对不能包含厌恶食物。
    4. 生活方式: 厨艺 [${prefs.cookingSkill}], 备餐时间限制 [${prefs.prepTimeLimit}分钟], 预算 [${prefs.budget}], 用餐场景 [${prefs.diningContext}]

    **核心要求：**
    1. **精准推荐**：食谱必须严格遵守上述红线（无过敏原、无厌恶食物、符合时间限制）。
    2. **营养达标**：每道菜的热量应尽量接近 ${targetCalories} kcal。
    3. **知识图谱数据**：对于每个食谱，必须生成一个微型“知识图谱(Knowledge Graph)”数据结构。
       - 节点(Node)类型应包括：Root(食谱名), Ingredient(核心食材), Effect(功效/作用), BodyCondition(针对的身体状况), LocationFactor(地理/环境因素)。
       - 连线(Link)应描述它们之间的逻辑关系。
    4. **标签与过敏原**：在 tags 数组中放入口味、流派、适合的慢性病等标签。在 allergens 数组中列出该菜品可能含有的常见过敏原（如果有的话，但绝不能是用户过敏的）。
    5. **中文输出**：所有内容必须使用简体中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No data returned from Gemini");
    }
    
    return JSON.parse(jsonText) as Recipe[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const refineRecipes = async (prefs: UserPreferences, instruction: string): Promise<Recipe[]> => {
    const model = "gemini-3-flash-preview";

    const prompt = `
      你是一位顶级健康大厨。你之前根据用户的详细档案生成了一份菜单。
      现在，用户对菜单提出了**修改意见**。请根据新的指令，**重新生成** 3 个全新的食谱。
      
      【用户档案】
      - 目标: ${prefs.healthGoal}
      - 禁忌: 过敏原 [${prefs.allergies.join(', ') || '无'}], 厌恶食物 [${prefs.dislikedFoods.join(', ') || '无'}]
  
      **用户的新指令/修改意见**: "${instruction}"
      
      **核心要求：**
      1. 必须严格遵守用户的新指令。
      2. 仍然不能偏离健康的底线（绝不能包含过敏原和厌恶食物）。
      3. 必须生成包含 KnowledgeGraph 的完整数据结构。
      4. 必须使用简体中文。
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: RECIPE_SCHEMA
        }
      });
  
      const jsonText = response.text;
      if (!jsonText) throw new Error("No data");
      return JSON.parse(jsonText) as Recipe[];
    } catch (error) {
      console.error("Gemini Refine Error:", error);
      throw error;
    }
};

export const chatWithChef = async (
    message: string, 
    context: { prefs?: UserPreferences, recipe?: Recipe }
): Promise<string> => {
    const model = "gemini-3-flash-preview";

    // Initialize chat session if it doesn't exist
    if (!chatSession) {
        chatSession = ai.chats.create({
            model: model,
            config: {
                systemInstruction: "你是一位专业、友好且富有中医智慧的营养师和私人大厨。请根据用户的身体情况、健康目标以及他们正在查看的食谱来回答问题。你的回答应当简明扼要，具有指导意义。",
            }
        });
    }

    let contextPrompt = "";
    if (context.recipe) {
        contextPrompt += `\n[当前上下文 - 用户正在查看食谱]\n标题: ${context.recipe.title}\n描述: ${context.recipe.description}\n推荐理由: ${context.recipe.matchReason}\n\n`;
    }
    
    if (context.prefs) {
        contextPrompt += `\n[当前上下文 - 用户资料]\n目标: ${context.prefs.healthGoal}\n禁忌: ${context.prefs.allergies.join(',')}\n\n`;
    }

    const fullMessage = `${contextPrompt}用户问题: ${message}`;

    try {
        const result = await chatSession.sendMessage({ message: fullMessage });
        return result.text || "抱歉，我走神了，请再说一遍。";
    } catch (e) {
        console.error("Chat Error", e);
        return "网络连接似乎有点问题，请稍后再试。";
    }
}