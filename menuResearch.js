import { menuDefinitions } from './data.js';
export const researchRecipes = [
    { id: 'research-fruit', name: '햇살 과일 소다', visual: 'ade', base: 'coffee', level: 1, ingredients: ['fruit', 'milk'], heat: 1, description: '과일과 우유를 차갑게 섞어 산뜻하게 만들어요.' },
    { id: 'research-latte', name: '구름 밀크 라테', visual: 'strawberry-latte', base: 'strawberry-latte', level: 2, ingredients: ['milk', 'flower'], heat: 2, description: '우유와 꽃향기를 미지근하게 데워요.' },
    { id: 'research-cookie', name: '나무집 수제 쿠키', visual: 'cookie', base: 'cookie', level: 1, ingredients: ['flour', 'milk'], heat: 3, description: '밀가루와 우유 반죽을 바삭하게 구워요.' },
    { id: 'research-cake', name: '계절 과일 케이크', visual: 'special-cake', base: 'waffle', level: 3, ingredients: ['flour', 'fruit'], heat: 2, description: '과일과 밀가루 반죽을 부드럽게 익혀요.' },
    { id: 'research-bread', name: '정원 향기 브레드', visual: 'bread', base: 'bread', level: 4, ingredients: ['flour', 'flower'], heat: 3, description: '꽃향기 반죽을 노릇하게 구워요.' },
    { id: 'research-dessert', name: '우리 카페 시그니처', visual: 'parfait', base: 'pudding', level: 5, ingredients: ['fruit', 'flower'], heat: 1, description: '꽃과 과일을 차갑게 층층이 쌓아요.' }
];
export const materialNames = { fruit: '과일', milk: '우유', flour: '밀가루', flower: '꽃향 재료' };
export function selectRecipe(m, id, level) { if (m.progressiveLevel !== undefined && m.progressiveLevel < 9)
    return false; const recipe = researchRecipes.find(r => r.id === id); if (!recipe || recipe.level > level || m.research[id])
    return false; m.research[id] = { stage: 'selected', ingredients: [], rating: 0 }; return true; }
export function combineRecipe(m, id, ingredients) { if (m.progressiveLevel !== undefined && m.progressiveLevel < 9)
    return false; const recipe = researchRecipes.find(r => r.id === id), r = m.research[id]; if (!recipe || !r || r.stage !== 'selected' || ingredients.length !== 2 || [...ingredients].sort().join() !== [...recipe.ingredients].sort().join() || ingredients.some(i => !Object.hasOwn(m.materials, i) || m.materials[i] < 1))
    return false; for (const i of ingredients)
    m.materials[i]--; r.ingredients = [...ingredients]; r.stage = 'combined'; return true; }
export function prototypeRecipe(m, id, heat) { if (m.progressiveLevel !== undefined && m.progressiveLevel < 9)
    return false; const recipe = researchRecipes.find(r => r.id === id), r = m.research[id]; if (!recipe || !r || !['combined', 'prototype', 'tasted'].includes(r.stage) || ![1, 2, 3].includes(heat))
    return false; r.rating = heat === recipe.heat ? 5 : 3; r.attempts = [...(r.attempts ?? []), { heat, rating: r.rating }].slice(-3); r.stage = 'prototype'; return true; }
export function tasteRecipe(m, id) { if (m.progressiveLevel !== undefined && m.progressiveLevel < 9)
    return false; const r = m.research[id]; if (!r || r.stage !== 'prototype')
    return false; r.stage = 'tasted'; return true; }
export function registerRecipe(m, id) { if (m.progressiveLevel !== undefined && m.progressiveLevel < 9)
    return false; const r = m.research[id]; if (!r || r.stage !== 'tasted' || r.rating < 4)
    return false; r.stage = 'registered'; return true; }
export function researchMenuDefinitions(m) { return researchRecipes.filter(r => m?.research[r.id]?.stage === 'registered').map(r => ({ menuId: r.id, name: r.name, visualKey: r.visual, basePrice: menuDefinitions.find(m => m.menuId === r.base).basePrice, unlockCafeLevel: r.level, currentLevel: 1, maxLevel: 5 })); }
export function growthMenuDefinitions(level, m) { return [...menuDefinitions, ...researchMenuDefinitions(m)].filter(d => d.unlockCafeLevel <= level); }
export function syncResearchMenus(s) { for (const m of researchMenuDefinitions(s.management)) {
    if (m.unlockCafeLevel > s.cafeLevel)
        continue;
    if (!s.unlockedMenuIds.includes(m.menuId))
        s.unlockedMenuIds.push(m.menuId);
    s.menuLevels[m.menuId] ??= 1;
} }
export const researchBrief = {
    'research-fruit': '상큼하고 시원한 한 잔을 원하는 손님을 위한 메뉴예요.',
    'research-latte': '꽃향기가 은은하고 입안이 따뜻한 라테가 목표예요.',
    'research-cookie': '겉은 바삭하고 속은 고소한 간식을 만들어 봐요.',
    'research-cake': '과일향과 촉촉한 식감을 함께 살려 봐요.',
    'research-bread': '은은한 향과 노릇한 빵 껍질을 살려 봐요.',
    'research-dessert': '시원한 과일과 꽃향기가 어우러진 디저트가 목표예요.'
};
export function researchFeedback(m, id) { const r = m.research[id], recipe = researchRecipes.find(x => x.id === id); if (!r || !recipe || !['prototype', 'tasted', 'registered'].includes(r.stage))
    return ''; if (r.rating === 5)
    return '목표한 맛과 식감이 잘 어울려요! 메뉴로 등록해도 좋겠어요.'; const heat = r.attempts?.at(-1)?.heat; return heat === 1 ? '향은 좋지만 덜 익은 식감이에요. 열을 주는 방법을 비교해 보세요.' : heat === 3 ? '겉이 너무 바삭해 목표한 부드러움과 달라요. 더 순한 방법을 골라 보세요.' : recipe.heat === 1 ? '따뜻해지면서 산뜻함이 줄었어요. 시원하게 만드는 방법을 찾아보세요.' : '촉촉하지만 바삭함이 부족해요. 더 노릇하게 만드는 방법을 골라 보세요.'; }
