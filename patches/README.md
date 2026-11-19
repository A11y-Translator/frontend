# PR #4 전체 캡처 좌표 수정

현재 geonwoo에는 PR #4의 Django 서버 연동 코드가 아직 병합되지 않았습니다.
현재 브랜치의 공통 캡처 UI는 전체 이미지·아래쪽 좌표·댓글 핀을 지원합니다.

`pr-4-full-capture.patch`는 PR #4의 서버 응답 변환에서 첫 화면 밖 좌표를 버리는 조건을 제거합니다.
기준 커밋: `498f72a6cd432fd7c87b6e4cfd40e71a93c30633`.
현재 PR #4 머리 커밋 `df22262bf3825c6044c8a0ad1bf606fdf3ed4851`의 http.ts에도 패치 적용 및 좌표 변환 검증을 통과했습니다.

PR #4의 서버 연동을 병합한 뒤 적용합니다:

```powershell
git apply --check patches/pr-4-full-capture.patch
git apply patches/pr-4-full-capture.patch
```

`node scripts/check-pr4-capture.mjs`는 기준 코드의 복사본에 패치를 적용해 4000px 아래 요소의 좌표가 유지되는지 확인합니다.
`node scripts/check-issues.mjs`는 서버 형태의 5364px 캡처를 사용해 화면·스크롤·핀을 검증합니다.
실제 백엔드 인증·통신 검증은 PR #4 병합 후 필요합니다.

서버가 16000px에서 캡처를 자르는 제한은 유지되며, 서버가 좌표를 주지 않은 요소는 표시할 수 없습니다.
