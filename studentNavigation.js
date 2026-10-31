export function organizeGrowthMenu(root, open, locked = false) {
    const groups = ['영업', '경영', '꾸미기', '마을', '기록'];
    const nav = document.createElement('nav');
    nav.className = 'student-nav';
    nav.setAttribute('aria-label', '내 카페 메뉴');
    const panels = groups.map(name => { const p = document.createElement('section'); p.className = 'student-menu-panel'; p.setAttribute('aria-label', name); return p; });
    const route = (el) => { const id = el.id; if (['mode-back'].includes(id) || /^(H2)$/.test(el.tagName))
        return -1; if (['manage-crew', 'manage-hub'].includes(id))
        return 1; if (id === 'decorate-cafe')
        return 2; if (id === 'return-village')
        return 3; if (el.classList.contains('growth-backup') || el.tagName === 'DETAILS' || id === 'last-growth-result')
        return 4; return 0; };
    for (const child of [...root.children]) {
        if (child.tagName === 'P' && (child.textContent?.startsWith('카페는 그대로,') || child.textContent?.startsWith('15분 영업 ·'))) {
            child.remove();
            continue;
        }
        const i = route(child);
        if (i >= 0)
            panels[i].append(child);
    }
    const add = (i, label, tab) => { const b = document.createElement('button'); b.className = 'secondary'; b.textContent = label; b.disabled = locked; if (locked)
        b.title = '중단한 영업을 마친 뒤 이용할 수 있어요.'; b.onclick = () => open(tab); panels[i].append(b); };
    add(0, '특별 영업 예약 · 주민 배달', 'business');
    add(1, '신메뉴 연구소', 'lab');
    add(1, '직원 교육', 'training');
    add(1, '평판 · 손님 리뷰', 'reviews');
    add(4, '카페 성장 앨범', 'album');
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = '문제팩을 고르고 15분 영업을 시작해요. 준비와 꾸미기는 영업 전후에 해요.';
    root.append(hint, nav, ...panels);
    const select = (index) => { panels.forEach((p, i) => p.hidden = i !== index); nav.querySelectorAll('button').forEach((b, i) => { b.setAttribute('aria-pressed', String(i === index)); }); };
    groups.forEach((name, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.onclick = () => select(i); nav.append(b); });
    select(0);
    if (!document.getElementById('student-nav-style')) {
        const style = document.createElement('style');
        style.id = 'student-nav-style';
        style.textContent = '.student-nav{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0}.student-nav button{min-height:44px;flex:1 1 70px;word-break:keep-all}.student-nav [aria-pressed=true]{background:#694b2d;color:white}.student-menu-panel{min-width:0;word-break:keep-all;overflow-wrap:anywhere}.student-menu-panel[hidden]{display:none}.student-menu-panel>button{min-height:44px;max-width:100%;white-space:normal}.student-menu-panel .growth-backup{margin-top:12px}';
        document.head.append(style);
    }
}
