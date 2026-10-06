# 정기안전점검 보고서 자동작성

건설공사 정기안전점검 보고서를 샘플 7종의 양식·목차·쪽수(평균 168쪽)대로 자동 작성하고
한글(.hwpx)·워드(.docx)로 내려받는 정적 웹사이트입니다. 서버·DB·빌드 과정이 없습니다.

## 파일 구성
| 파일 | 설명 |
|---|---|
| `index.html` | 사이트 전체 (입력창·미리보기·내보내기, 로고·직인·등록증 등 고정 이미지 포함) |
| `vendor/` | 외부 서버 없이 동작하도록 포함한 라이브러리 (JSZip, html2canvas) |
| `.github/workflows/pages.yml` | main 브랜치에 올리면 GitHub Pages로 자동 게시 |
| `vercel.json` | Vercel로 게시할 때의 설정 |

## GitHub에 올려서 웹에 게시하기

1. GitHub에서 **New repository** → 이름 입력(예: `safety-report`) → **빈 저장소**로 생성
   (README·.gitignore 추가 체크 해제)
2. 이 폴더에서 터미널을 열고 (주소는 본인 저장소로 바꿈)
   ```bash
   git remote add origin https://github.com/내아이디/safety-report.git
   git push -u origin main
   ```
3. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 선택
4. **Actions** 탭에서 "웹사이트 자동 게시"가 초록색으로 끝나면 주소가 열립니다.
   `https://내아이디.github.io/safety-report/`
5. 이후 `index.html`을 고쳐 `git push` 할 때마다 자동으로 다시 게시됩니다.

## Vercel로 게시하기 (선택)
Vercel 대시보드 → **Add New → Project → Import Git Repository** 에서 위 저장소를 선택하면 끝입니다.
Vercel은 비밀번호 보호(Deployment Protection)를 켤 수 있습니다.

## 반드시 알아둘 점
- **공개 주소로 게시하면 `index.html`에 들어 있는 직인·진단기관 등록증·교육수료증 이미지가
  주소를 아는 누구에게나 보입니다.** 저장소를 Private으로 만들어도 GitHub Pages로 게시된 사이트 자체는
  공개됩니다(Enterprise 요금제 제외). 외부 공개를 원치 않으면 Vercel 비밀번호 보호를 쓰거나,
  이미지를 뺀 버전으로 게시하거나, 내 컴퓨터에서 `index.html`만 열어 쓰세요.
- 입력 내용은 서버로 전송되지 않고 사용하는 브라우저에만 자동 저장됩니다.
- hwpx는 한컴 한글에서 열리는지 현장 파일로 먼저 확인하세요. 안 열리면 docx를 한글에서 열어 저장하세요.

## 사용 순서
1. 왼쪽 입력창에 현장별로 바뀌는 내용만 입력 (미리보기에 바로 반영)
2. 제3장 공종 선택 후 사진·도면 이미지를 올립니다 (안 올리면 공백으로 남음)
3. 본문은 클릭해서 바로 고칠 수 있습니다
4. **저장** → 입력 내용을 `.json`으로 보관, **샘플 불러오기**로 이어서 작업
5. **한글파일(hwpx) 받기 / 워드파일(docx) 받기** → 완성 보고서 내려받기
