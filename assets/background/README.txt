방명록 배경 이미지 폴더

1. 사용할 배경 이미지를 이 폴더에 넣습니다.
   예: background.jpg

2. js/config.js에서 아래처럼 설정합니다.

backgroundImage: {
  enabled: true,
  src: "./assets/background/background.jpg",
  size: "cover",
  position: "center center",
  repeat: "no-repeat",
  attachment: "fixed",
  overlayOpacity: 0.42
},

GitHub에 있는 다른 이미지의 직접 URL(https://...)도 src에 사용할 수 있습니다.
