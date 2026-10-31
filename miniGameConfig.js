export const miniPolicy = { firstAt: 60, secondAt: 420, extraAt: 720, maxChallenges: 3, leaseMs: 30000, maxPauseMs: 150000, maxTries: 2 };
export const miniCatalog = [
    { id: 'cake', name: '케이크 주문 폭주!', instruction: '토핑을 골라 주문 그림과 같은 자리에 놓아요.', reward: '축하 케이크 리본', decor: 'mini-cake' },
    { id: 'oven', name: '오븐 대소동!', instruction: '빵을 골라 여러 오븐에서 굽고, 알맞은 때 꺼내 제출해요.', reward: '황금 오븐 기념패', decor: 'mini-oven' },
    { id: 'flowers', name: '꽃다발 주문 제작소!', instruction: '색·중심 꽃·장식 등 주문 조건에 맞춰 꽃다발을 만들어요.', reward: '작은 축제 꽃병', decor: 'mini-flowers' },
    { id: 'sort', name: '주문 분류 대소동', instruction: '음식을 올바른 손님 트레이에 나누어 전달해요.', reward: '정확한 주문 정리사 기념패', decor: 'mini-sort' },
    { id: 'machine', name: '커피 머신 수리', instruction: '파이프를 돌려 물·가열·추출 경로를 연결해요.', reward: '작은 머신 엔지니어 기념패', decor: 'mini-machine' },
    { id: 'tray', name: '트레이 배달 작전', instruction: '장애물을 피하며 음식을 안전하게 배달해요.', reward: '안전 배달 달인 기념패', decor: 'mini-tray' }
];
export const miniDecor = miniCatalog.map(m => ({ id: m.decor, name: m.reward, color: '#c89f68', shape: 'frame', slot: 'wall' }));
export const miniInfo = (kind) => miniCatalog.find(m => m.id === kind);
export const miniTokens = { strawberry: { name: '딸기', cell: 4 }, cream: { name: '생크림', cell: 5 }, chocolate: { name: '초콜릿', cell: 6 }, pink: { name: '분홍 장미', cell: 8 }, yellow: { name: '노란 데이지', cell: 9 }, blue: { name: '파란 꽃', cell: 10 } };
export const miniAtlas = 'assets/web/mini-games/supplies.webp';
