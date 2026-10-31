import { validateGrowthSave } from './growthSave.js';
import { restoreGrowthRun } from './growthCampaign.js';
import { questionCatalog } from './questionPack.js';
export function exportGrowth(save) { if (!validateGrowthSave(save))
    throw Error('저장 데이터를 확인해 주세요.'); return JSON.stringify({ format: save.portfolio ? 'cafe-growth-backup-v19c' : 'cafe-growth-backup-v16', exportedAt: new Date().toISOString(), save }, null, 2); }
export function parseGrowthBackup(text) { if (text.length > 4000000)
    throw Error('백업 파일이 너무 커요.'); const value = JSON.parse(text); const save = ['cafe-growth-backup-v16', 'cafe-growth-backup-v19c'].includes(value?.format) ? value.save : value; if (!validateGrowthSave(save))
    throw Error('올바른 카페 백업이 아니에요. 기존 저장은 보존됩니다.'); return structuredClone(save); }
export async function checkBackupRun(save) { const run = save.campaign?.run; if (!run)
    return; const pack = await questionCatalog.load(run.packId); if (!(await questionCatalog.selectable('growth')).some(p => p.packId === run.packId))
    throw Error('사용할 수 없는 문제팩이에요.'); restoreGrowthRun(run, pack.questions); }
