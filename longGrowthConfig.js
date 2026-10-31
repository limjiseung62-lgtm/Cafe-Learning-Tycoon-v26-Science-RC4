import { miniDecor } from './miniGameConfig.js';
import { specializationBoards, specializationDecor } from './specializationConfig.js';
// Only CAFE_GROWTH consumes these settings. Approved class-match values stay untouched.
export const longGrowthLevels = [
    { level: 7, name: '햇살 정원 카페', capacity: 9 },
    { level: 8, name: '꽃길 정원 카페', capacity: 10 },
    { level: 9, name: '향기로운 온실 카페', capacity: 11 },
    { level: 10, name: '사계절 정원 카페', capacity: 12 },
    { level: 11, name: '복층 베이커리', capacity: 13 },
    { level: 12, name: '창가 베이커리', capacity: 14 },
    { level: 13, name: '모두의 베이커리', capacity: 14 },
    { level: 14, name: '빛나는 복층 베이커리', capacity: 14 },
    { level: 15, name: '우리 동네 그랜드 베이커리', capacity: 14 }
];
export const decorationCatalog = [
    { id: 'flower', name: '꽃 화분', color: '#d9979d', shape: 'flower', slot: 'ledge' },
    { id: 'clock', name: '나무 벽시계', color: '#b98d55', shape: 'clock', slot: 'wall' },
    { id: 'lamp', name: '작은 조명', color: '#e5b956', shape: 'lamp', slot: 'ledge' },
    { id: 'frame', name: '첫 추억 액자', color: '#b98755', shape: 'frame', slot: 'wall' },
    { id: 'garden', name: '정원 리스', color: '#6e9961', shape: 'wreath', slot: 'wall' },
    { id: 'showcase', name: '미니 쇼케이스', color: '#bf9361', shape: 'showcase', slot: 'ledge' },
    { id: 'star', name: '별빛 기념패', color: '#dbbd68', shape: 'star', slot: 'wall' },
    { id: 'bread', name: '빵 바구니', color: '#d6a658', shape: 'bread', slot: 'ledge' }
];
export const decorSlots = [{ id: 'wall-left', name: '왼쪽 벽', type: 'wall', x: 19, y: 16 }, { id: 'wall-right', name: '오른쪽 벽', type: 'wall', x: 72, y: 16 }, { id: 'ledge-left', name: '왼쪽 진열대', type: 'ledge', x: 12, y: 29 }, { id: 'ledge-right', name: '오른쪽 진열대', type: 'ledge', x: 78, y: 28 }];
export const boardCatalog = [
    { id: 'study', kind: 'learning', name: '디저트 장인', description: '문제를 차근차근 맞혀요.', metric: 'correct', base: 8, reward: 'flower', unlock: 1 },
    { id: 'skills', kind: 'learning', name: '공부하는 사장님', description: '서로 다른 학습 요소에서 정답을 찾아요.', metric: 'skills', base: 2, reward: 'clock', unlock: 1 },
    { id: 'review', kind: 'review', name: '다시 해내는 힘', description: '오답·쌍둥이 복습에 성공해요.', metric: 'review', base: 1, reward: 'frame', unlock: 1 },
    { id: 'service', kind: 'operations', name: '손님 맞이 달인', description: '손님을 정상적으로 서빙해요.', metric: 'served', base: 4, reward: 'lamp', unlock: 1 },
    { id: 'variety', kind: 'operations', name: '다채로운 메뉴판', description: '서로 다른 메뉴를 손님께 서빙해요.', metric: 'menus', base: 2, reward: 'showcase', unlock: 1 },
    { id: 'visitor', kind: 'visitors', name: '반가운 만남', description: '도움·특별·이벤트 손님을 한 분 만나요.', metric: 'special', base: 1, reward: 'star', unlock: 2 },
    { id: 'festival', kind: 'events', name: '이벤트의 주인공', description: '긴급 미션이나 돌발 손님을 한 번 성공적으로 맞이해요.', metric: 'events', base: 1, reward: 'star', unlock: 3 },
    { id: 'garden', kind: 'visitors', name: '정원의 초대', description: '정원 카페에서 손님을 편안히 대접해요.', metric: 'served', base: 5, reward: 'garden', unlock: 7 },
    { id: 'bakery', kind: 'operations', name: '윗층까지 따뜻하게', description: '복층의 위층 좌석에도 서빙해요.', metric: 'upstairs', base: 2, reward: 'bread', unlock: 11 }
];
export const allBoardCatalog = [...boardCatalog, ...specializationBoards];
export const allDecorationCatalog = [...decorationCatalog, ...specializationDecor, ...miniDecor];
