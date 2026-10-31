import { webAssets } from './webAssetCatalog.js';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
