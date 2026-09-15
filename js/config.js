export const GUESTBOOK_CONFIG = {
  // Google Apps Script 웹 앱 배포 URL(/exec)을 입력하세요.
  webAppUrl: "https://script.google.com/macros/s/AKfycbxJARhWep9Ra5xas5uPu8yZo5HFkN8zDD_A-ypYtSg_EFvTw9ctWkxTOr5NMZL_ltJT/exec",

  // 상단 타이틀
  title: "희망의 과학싹잔치 20주년 방명록",

  /*
   ============================================================
   방명록 배경 이미지
   ============================================================

   GitHub 저장소에 이미지를 업로드한 뒤 src에 경로를 적으면 됩니다.

   예시 1) 이 프로젝트 안에 업로드
   src: "./assets/background/background.jpg"

   예시 2) GitHub 등에 있는 직접 이미지 URL
   src: "https://.../background.jpg"

   enabled:
   true  = 배경 이미지 사용
   false = 기존 기본 배경 사용

   overlayOpacity:
   0     = 배경 이미지 원본이 그대로 보임
   1     = 밝은 오버레이가 완전히 덮음
   글자/카드 가독성을 위해 0.30~0.55 정도를 권장합니다.
  */
  backgroundImage: {
    enabled: false,
    src: "./assets/background/background0.jpg",
    size: "cover",
    position: "center center",
    repeat: "no-repeat",
    attachment: "fixed",
    overlayOpacity: 0.42
  },

  // "desc" = 최신 사진부터, "asc" = 1번 사진부터 순서대로
  order: "desc",

  pageSize: 24,

  // 새로운 사진 확인 주기. 0이면 자동 새로고침을 끕니다.
  refreshIntervalMs: 10000
};
