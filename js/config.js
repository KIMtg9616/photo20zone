export const GUESTBOOK_CONFIG = {
  // Google Apps Script 웹 앱 배포 URL(/exec)을 입력하세요.
  webAppUrl: "script.google.com/macros/s/AKfycbxJARhWep9Ra5xas5uPu8yZo5HFkN8zDD_A-ypYtSg_EFvTw9ctWkxTOr5NMZL_ltJT/exec",

  title: "PHOTO GUESTBOOK",

  // "desc" = 최신 사진부터, "asc" = 1번 사진부터 순서대로
  order: "desc",

  pageSize: 24,

  // 새로운 사진 확인 주기. 0이면 자동 새로고침을 끕니다.
  refreshIntervalMs: 10000
};
