import { balance } from './config.js';
export const menuDefinitions = [
    { menuId: 'coffee', name: '아메리카노', unlockCafeLevel: 1, basePrice: 100, currentLevel: 1, maxLevel: 5, visualKey: 'coffee' },
    { menuId: 'cookie', name: '초코쿠키', unlockCafeLevel: 1, basePrice: 130, currentLevel: 1, maxLevel: 5, visualKey: 'cookie' },
    { menuId: 'cake', name: '딸기케이크', unlockCafeLevel: 1, basePrice: 160, currentLevel: 1, maxLevel: 5, visualKey: 'cake' },
    { menuId: 'strawberry-latte', name: '딸기라떼', unlockCafeLevel: 2, basePrice: 180, currentLevel: 1, maxLevel: 5, visualKey: 'strawberry-latte' },
    { menuId: 'croissant', name: '크루아상', unlockCafeLevel: 2, basePrice: 220, currentLevel: 1, maxLevel: 5, visualKey: 'croissant' },
    { menuId: 'icecream', name: '소프트아이스크림', unlockCafeLevel: 2, basePrice: 250, currentLevel: 1, maxLevel: 5, visualKey: 'icecream' },
    { menuId: 'waffle', name: '과일와플', unlockCafeLevel: 3, basePrice: 280, currentLevel: 1, maxLevel: 5, visualKey: 'waffle' },
    { menuId: 'cupcake', name: '컵케이크', unlockCafeLevel: 3, basePrice: 330, currentLevel: 1, maxLevel: 5, visualKey: 'cupcake' },
    { menuId: 'donut', name: '도넛', unlockCafeLevel: 3, basePrice: 380, currentLevel: 1, maxLevel: 5, visualKey: 'donut' },
    { menuId: 'sandwich', name: '샌드위치', unlockCafeLevel: 4, basePrice: 400, currentLevel: 1, maxLevel: 5, visualKey: 'sandwich' },
    { menuId: 'pizza', name: '미니피자', unlockCafeLevel: 4, basePrice: 480, currentLevel: 1, maxLevel: 5, visualKey: 'pizza' },
    { menuId: 'bread', name: '허니브레드', unlockCafeLevel: 4, basePrice: 550, currentLevel: 1, maxLevel: 5, visualKey: 'bread' },
    { menuId: 'bingsu', name: '과일빙수', unlockCafeLevel: 5, basePrice: 600, currentLevel: 1, maxLevel: 5, visualKey: 'bingsu' },
    { menuId: 'ade', name: '과일에이드', unlockCafeLevel: 5, basePrice: 700, currentLevel: 1, maxLevel: 5, visualKey: 'ade' },
    { menuId: 'pudding', name: '푸딩', unlockCafeLevel: 5, basePrice: 800, currentLevel: 1, maxLevel: 5, visualKey: 'pudding' },
    { menuId: 'parfait', name: '딸기파르페', unlockCafeLevel: 6, basePrice: 900, currentLevel: 1, maxLevel: 5, visualKey: 'parfait' },
    { menuId: 'pancake', name: '팬케이크타워', unlockCafeLevel: 6, basePrice: 1050, currentLevel: 1, maxLevel: 5, visualKey: 'pancake' },
    { menuId: 'special-cake', name: '스페셜케이크', unlockCafeLevel: 6, basePrice: 1200, currentLevel: 1, maxLevel: 5, visualKey: 'special-cake' }
];
export const createMenus = (level = 1) => menuDefinitions.filter(m => m.unlockCafeLevel <= level).map(m => ({ ...m, stock: balance.stock.initial, maxStock: balance.stock.capacity }));
export const customers = [
    { ...{ "personality": "RELAXED", "orderPreference": "DESSERT", "characterTrait": "공부하며 천천히 간식을 즐기는 학생", "unlockCafeLevel": 1, "spawnWeight": 1 }, customerId: 'student', name: '동네 학생 민지', visualKey: 'student', patienceSeconds: 130, category: 'friendly', orderProfile: { ...balance.order } },
    { ...{ "personality": "KIND", "orderPreference": "BAKERY", "characterTrait": "언제나 다정하게 기다려 주는 이웃", "unlockCafeLevel": 1, "spawnWeight": 1 }, customerId: 'grandma', name: '다정한 할머니', visualKey: 'grandma', patienceSeconds: 150, category: 'friendly', orderProfile: { ...balance.order } },
    { ...{ "personality": "KIND", "orderPreference": "COFFEE", "characterTrait": "책장을 넘기며 여유롭게 기다리는 독서가", "unlockCafeLevel": 1, "spawnWeight": 1 }, customerId: 'reader', name: '책 읽는 손님', visualKey: 'reader', patienceSeconds: 140, category: 'friendly', orderProfile: { ...balance.order } },
    { ...{ "personality": "RELAXED", "orderPreference": "DRINK", "characterTrait": "산책 끝에 시원한 음료를 즐기는 손님", "unlockCafeLevel": 1, "spawnWeight": 1 }, customerId: 'walker', name: '산책 나온 손님', visualKey: 'walker', patienceSeconds: 120, category: 'friendly', orderProfile: { ...balance.order } },
    { ...{ "customerId": "bookworm", "name": "책벌레 학생 서윤", "personality": "KIND", "patienceSeconds": 150, "orderPreference": "COFFEE", "unlockCafeLevel": 1, "spawnWeight": 1, "characterTrait": "책을 읽으며 오래 기다리는 손님", "visualKey": "bookworm", "category": "friendly" }, orderProfile: { ...balance.order } },
    { ...{ "customerId": "athlete", "name": "운동 소녀 지아", "personality": "RELAXED", "patienceSeconds": 120, "orderPreference": "DRINK", "unlockCafeLevel": 1, "spawnWeight": 1, "characterTrait": "운동 뒤 간단한 음료와 간식을 즐김", "visualKey": "athlete", "category": "friendly" }, orderProfile: { ...balance.order } },
    { ...{ "customerId": "gentleman", "name": "느긋한 신사 태식", "personality": "RELAXED", "patienceSeconds": 120, "orderPreference": "COFFEE", "unlockCafeLevel": 2, "spawnWeight": 1, "characterTrait": "신문을 읽으며 오후의 여유를 즐김", "visualKey": "gentleman", "category": "friendly" }, orderProfile: { ...balance.order } },
    { ...{ "customerId": "painter", "name": "젊은 화가 하린", "personality": "KIND", "patienceSeconds": 150, "orderPreference": "DESSERT", "unlockCafeLevel": 2, "spawnWeight": 1, "characterTrait": "카페의 빛과 색을 천천히 관찰하는 화가", "visualKey": "painter", "category": "friendly" }, orderProfile: { ...balance.order } },
    { ...{ "customerId": "traveler", "name": "여행자 노아", "personality": "NORMAL", "patienceSeconds": 100, "orderPreference": "NONE", "unlockCafeLevel": 3, "spawnWeight": 0.8, "characterTrait": "새로운 곳에서 다양한 메뉴를 맛보는 여행자", "visualKey": "traveler", "category": "friendly" }, orderProfile: { ...balance.order } },
    { ...{ "customerId": "child", "name": "꼬마 민호", "personality": "KIND", "patienceSeconds": 150, "orderPreference": "DESSERT", "unlockCafeLevel": 3, "spawnWeight": 1, "characterTrait": "토끼 인형과 함께 달콤한 간식을 기다림", "visualKey": "child", "category": "friendly" }, orderProfile: { ...balance.order } },
    { ...{ "customerId": "office", "name": "직장인 유진", "personality": "BUSY", "patienceSeconds": 70, "orderPreference": "COFFEE", "unlockCafeLevel": 4, "spawnWeight": 0.15, "characterTrait": "짧은 휴식 시간에 커피를 마시는 직장인", "visualKey": "office", "category": "busy" }, orderProfile: { ...balance.order } },
    { ...{ "customerId": "fashion", "name": "패셔너블한 도윤", "personality": "BUSY", "patienceSeconds": 70, "orderPreference": "BAKERY", "unlockCafeLevel": 4, "spawnWeight": 0.15, "characterTrait": "약속에 가기 전 가볍게 들르는 청년", "visualKey": "fashion", "category": "busy" }, orderProfile: { ...balance.order } }
];
export const visuals = { coffee: '☕', cookie: '🍪', cake: '🍰', student: '👧', grandma: '👵', reader: '🧑‍🏫', walker: '🧑‍🌾' };
Object.assign(visuals, { "strawberry-latte": "🥛", "croissant": "🥐", "icecream": "🍦", "waffle": "🧇", "cupcake": "🧁", "donut": "🍩", "sandwich": "🥪", "pizza": "🍕", "bread": "🍞", "bingsu": "🍧", "ade": "🍹", "pudding": "🍮", "parfait": "🍨", "pancake": "🥞", "special-cake": "🎂" });
