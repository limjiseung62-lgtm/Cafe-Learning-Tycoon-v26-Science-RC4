export const branchCatalog = [
    { id: 'garden', name: '정원 카페', feature: '온실 지붕 · 꽃 아치 · 목재 테이블 · 테라스', future: 'Lv.11 이후 꽃 축제형 · 희귀 손님형 예정', event: '꽃 축제와 정원 모임을 준비하는 가게' },
    { id: 'bakery', name: '베이커리 카페', feature: '박공지붕 · 굴뚝 · 빵 진열창 · 작업대', future: 'Lv.11 이후 대량 생산형 · 장인 제빵형 예정', event: '아침 빵 예약과 제빵 시연을 꿈꾸는 가게' },
    { id: 'dessert', name: '디저트 카페', feature: '유리 돔 · 곡선 창문 · 쇼케이스 · 살롱', future: 'Lv.11 이후 VIP형 · 특별 주문형 예정', event: '기념일 주문과 디저트 시식회를 꿈꾸는 가게' }
];
export const isBranch = (v) => branchCatalog.some(b => b.id === v);
export function validBranch(v) { if (!v || typeof v !== 'object')
    return false; const b = v; return b.version === 1 && isBranch(b.selected) && (b.active === null || b.active === b.selected) && Object.keys(b).every(k => ['version', 'selected', 'active'].includes(k)); }
export const branchPreview = (id) => 'assets/web/branches/' + id + '-preview.webp';
export const branchRoom = (id) => 'assets/web/branches/' + id + '.webp';
// Existing high-level saves are offered a choice only AFTER their next business closes.
export const canOfferBranch = (base, level, closed) => !base.growthBranch && !base.campaign?.run?.closed && level >= 7 && (base.cafeLevel < 7 || closed);
