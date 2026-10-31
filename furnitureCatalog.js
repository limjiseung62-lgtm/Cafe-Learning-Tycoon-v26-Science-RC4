const path = (theme) => theme === 'classic' ? 'assets/web/free-layout/furniture-atlas.webp' : 'assets/web/theme-furniture/' + theme + '.webp';
export const furnitureCatalog = [
    { id: 'classic-two', name: '기본 원목 2인 테이블', kind: 'two', theme: 'classic', atlas: path('classic'), row: 0, chairRow: 3, chairWidth: 9, condition: '처음부터 사용' },
    { id: 'classic-four', name: '4인 사각 테이블', kind: 'four', theme: 'classic', atlas: path('classic'), row: 1, chairRow: 3, chairWidth: 9, condition: '처음부터 사용' },
    { id: 'classic-long', name: '6인 단체 테이블', kind: 'long', theme: 'classic', atlas: path('classic'), row: 2, chairRow: 3, chairWidth: 9, condition: '처음부터 사용' },
    { id: 'garden-round', name: '꽃잎 원형 테이블', kind: 'two', theme: 'garden', atlas: path('garden'), row: 0, chairRow: 2, chairWidth: 9, condition: '카페 Lv.3' },
    { id: 'garden-outdoor', name: '햇살 야외 테이블', kind: 'four', theme: 'garden', atlas: path('garden'), row: 1, chairRow: 3, chairWidth: 9, condition: 'Lv.7 + 정원 분기 또는 미션 2회 완료' },
    { id: 'bakery-bench', name: '포근한 목재 벤치 세트', kind: 'four', theme: 'bakery', atlas: path('bakery'), row: 0, chairRow: 2, chairWidth: 8, condition: '카페 Lv.5 또는 미션 1회 완료' },
    { id: 'bakery-workbench', name: '밀빛 제빵 작업대', kind: 'long', theme: 'bakery', atlas: path('bakery'), row: 1, chairRow: 3, chairWidth: 9, condition: 'Lv.7 + 베이커리 분기 또는 손님 도감 서빙 8종' },
    { id: 'dessert-marble', name: '별빛 대리석 디저트 테이블', kind: 'two', theme: 'dessert', atlas: path('dessert'), row: 0, chairRow: 2, chairWidth: 9, condition: 'Lv.7 + 디저트 분기 또는 이벤트 성공 1회' },
    { id: 'dessert-sofa', name: '구름 소파 좌석', kind: 'two', theme: 'dessert', atlas: path('dessert'), row: 1, chairRow: 3, chairWidth: 10, condition: 'Lv.9 + 특별 손님 서빙 2종 또는 미션 3회 또는 이벤트 성공 2회' }
];
export const classicFurniture = (kind) => 'classic-' + kind;
export const furnitureFor = (kind, id) => furnitureCatalog.find(d => d.id === (id ?? classicFurniture(kind)) && d.kind === kind);
export function validFurnitureUnlocks(v) { const s = v; return !!s && s.version === 1 && Array.isArray(s.unlocks) && s.unlocks.length <= furnitureCatalog.length && new Set(s.unlocks.map(r => r.id)).size === s.unlocks.length && s.unlocks.every(r => furnitureCatalog.some(d => d.id === r.id) && ['level', 'mission', 'collection', 'branch', 'event', 'legacy'].includes(r.source)); }
export function furnitureChairSize(id) { if (id === 'dessert-sofa')
    return { w: 6.8, h: 6 }; if (id === 'garden-outdoor')
    return { w: 5.5, h: 5.4 }; if (id === 'bakery-bench')
    return { w: 4.8, h: 4 }; if (id === 'garden-round' || id === 'dessert-marble')
    return { w: 4.4, h: 5 }; return { w: 3.4, h: 4.8 }; }
export const furnitureSeatLift = (id) => id === 'dessert-sofa' ? 6 : id === 'bakery-bench' ? 5 : id === 'garden-outdoor' || id === 'bakery-workbench' ? 4.5 : 3.5;
