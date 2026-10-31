# RC 에셋 출처 확인 · 2026-10-07

| 구분 | 실제 사용 파일 | 출처/조건 | 확인 |
|---|---|---|---|
| BGM | assets/audio/bgm/bgm_cafe.wav | [OatCog Coffee House Bump](https://opengameart.org/content/coffee-house-bump), CC0 | 원작 게시의 저작자·CC0 표시, 로컬 RIFF, registry 및 production 파일 대응 |
| SFX | assets/audio/sfx/12개 OGG →25이벤트 | [Kenney Interface Sounds1.0](https://kenney.nl/assets/interface-sounds), CC0 | Kenney-CC0.txt 동봉, OggS 파일 및25이벤트 경로 확인 |
| Display | Jua-Regular.woff2 | [Jua OFL1.1](https://raw.githubusercontent.com/google/fonts/main/ofl/jua/OFL.txt) | Jua-OFL.txt와 저작권 표시 동봉, 원본 TTF 이름 Jua/Regular, 변환 검증 기록 유지 |
| Information | NanumGothic-Regular/Bold.woff2 | [Nanum Gothic OFL1.1](https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/OFL.txt) | NanumGothic-OFL.txt와 NHN/Reserved Font Name 표시 동봉, TTF Regular/Bold 이름 및 WOFF2 확인 |
| 카페/메뉴/손님/직원 PNG | assets/art 아래 승인된 원본 | 프로젝트에서 image_gen으로 생성한 아트, 외부 CC0 에셋으로 분류하지 않음 | VISUAL_REPLACEMENT_REPORT 및 poses/캐릭터 제작 기록, prompts.json과 채택 파일 registry 대응 |
| 문제 | fraction-addition-g4-s2.json | 사용자가 제공한 기존 mathdata 재사용 산출물 | Phase7 source audit·원본 해시·전체164개 수학 검증 |
| Compiler | vendor TypeScript / Windows x64 runtime | 동봉 LICENSE | clean copy에서 동일 도구로 build/typecheck, runtime 배포에는 vendor 폴더를 복사하지 않음 |

폰트의 기존 WOFF2 압축·원본 글리프/이름 보존 정책 및 source TTF/OFL 전문을 유지했다. 새 폰트나 외부 이미지·오디오를 가져오지 않았다. Last Order의 미준비 파일은 사용 파일로 잘못 기재하지 않으며 요청하지 않는다. 근거는 AUDIO_LICENSES.md, assets/fonts/README.md, conversion-validation.json, phase9-production-resources.json에 있다. 이 검증은 문서·저작권 표시·레지스트리·실파일 대응 확인이며 생성 아트의 외부 CC0 라이선스를 새로 주장하지 않는다.

v1.5.2 후보의 `assets/art/motion-v152/` PNG 22장은 기존 프로젝트 캐릭터를 참조하여 image_gen으로 제작한 포즈 시트다. 외부 에셋 사이트에서 가져온 이미지가 아니며 외부 CC0 라이선스를 부여한 것으로 표시하지 않는다. 참조·생성 경로는 `reports/v152/generation.json`, `bookworm-eat-generation.json`, 프레임·투명도 검사는 `image-audit.json`에 기록했다. 원본 파일은 보존하며 런타임은 픽셀 사각형과 앵커 메타데이터로 프레임을 선택한다.

v1.5.3 후보의 WebP는 기존 PNG로부터 만든 웹 전달용 파생 파일이다. 원본 102장의 바이트를 보존하며 외부 이미지·폰트·음원은 추가하지 않았다. 캐릭터·음식은 표시 크기를 고려해 해상도를 절반으로 만들고 WebP quality 92, 배경은 원래 해상도와 quality 94를 사용했다. WebP 인코딩 전후의 알파는 일치하며 RGB는 손실 압축이다. 변환 도구는 로컬 Pillow/libwebp이며 파생 이미지의 출처·권리는 기존 프로젝트 아트와 동일하게 추적한다. 절차와 해시·품질·제외 파일은 scripts/optimize-v153.py 및 reports/v153/에 기록했다.

## 사각형 학습 문제팩 (v1.5.3)
기존 사용자 승인 독립 창작 사각형 보완본의 고정 32문항과 유한 변형 158상태를 재사용합니다. 도형 SVG도 독립 창작 자료이며 출판사 원문·PDF·캡처를 포함하지 않습니다. 2026-10-22 사용자가 카페의 공개 학습 내용을 사각형 단원으로 교체하도록 요청했습니다. 이전 승인은 전체 파라미터 상태의 개인별 수동 검토를 뜻하지 않습니다.

## v1.7 local growth assets

`assets/art/long-growth/bakery.png` is a new project image generated with the built-in imagegen tool using the existing project cafe art as its style reference. The original is retained; the game loads `assets/web/long-growth/bakery.webp`. The eight decoration SVGs and two storefront SVGs in `assets/art/long-growth/` are project-authored vectors, with no externally downloaded art or font files. Existing character assets and their notices are unchanged.


## v1.7.2A growth branch backgrounds (2026-10-24)
Three original garden/bakery/dessert room illustrations were generated with the built-in OpenAI imagegen tool from project-authored prompts. No reference image, publisher PDF, external asset, or watermarked artwork was supplied to these generations. No new third-party asset license was introduced. Existing table/chair and character assets retain their previous provenance.
Original PNGs: assets/art/branches/ (workspace archival only). Optimized WebP and small selection previews: assets/web/branches/. Original PNGs are excluded from dist by web-delivery.mjs. Source imagegen outputs are also retained in the generated_images folder. See reports/v172a/ASSET_PROMPTS.txt and assets.json for prompts, dimensions and byte counts.

## v1.7.2B recruitment staff art (2026-10-24)
Seven original six-pose transparent character sheets (Nari, Mint, Sol, Yul, Taeo, Byeol, Moa) were generated with the built-in OpenAI imagegen tool using project-authored textual descriptions. No publisher images, external downloaded assets, copyrighted character references, or third-party stock were supplied. This adds no external asset-license dependency; generated assets are project assets under the applicable OpenAI output terms. Do not represent them as third-party licensed stock or guaranteed exclusive copyright.
Original RGBA PNGs are retained in assets/art/recruit-staff/ and excluded from dist. Web delivery uses assets/web/recruit-staff/staff-6.webp through staff-12.webp and seven portrait WebPs. Each sheet contains idle, left/right walk, pickup, carry, and serve; return reuses walk. reports/v172b/assets.json records exact sizes, alpha ranges, dimensions and generation provenance. Existing five staff sprites/serving art remain unchanged.

## v2.0 village visual stabilization (local candidate)
The town and lakeside ground underlays were generated with the built-in OpenAI imagegen tool from project-authored prompts, using the existing project village atlas as style reference. They add no downloaded third-party stock. Existing building, character, font and audio provenance remains unchanged. Original PNGs and a non-shipping concept are retained under assets/art/village-v20/; only the two optimized WebPs under assets/web/village-v20/ are used by the game. Do not claim guaranteed exclusive copyright. Generation prompts, dimensions, byte counts and visual QA are recorded in reports/v20/. No public deployment is authorized by this notice.
