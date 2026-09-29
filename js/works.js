$(document).ready(function () {

  const $cards = $(".project-card");
  const total = $cards.length;

  let currentIndex = 0;
  let currentRotation = 0;
  let targetRotation = 0;

  let isAnimating = false;
  let canTrigger = true;

  const angleStep = 360 / total;


  // 화면에 맞는 캐러셀 가로 범위 const z
  function getRadius() {
    return window.innerWidth * 0.34;
  }


  // 부드러운 ease   
 function smoothWhip(t) {
  return 1 - Math.pow(1 - t, 4);
}


  // 카드 위치 업데이트
  function updateCarousel(rotation) {

    const radius = getRadius();

    $cards.each(function (index) {

      const $card = $(this);

      const angle =
        index * angleStep + rotation;

      const rad =
        angle * Math.PI / 180;


      // 좌우 이동
      const x =
        Math.sin(rad) * radius;


      // 앞뒤 깊이는 아주 약하게
      const z =
        Math.cos(rad) * 80;


      // 중앙에 얼마나 가까운지
      // 1 = 완전 중앙
      // 0 = 뒤쪽

const focus =
  (Math.cos(rad) + 1) / 2;


// 중앙 근처에서 확대가 더 강하게 느껴지도록 easeInOutCubic(t
const focusScale =
  Math.pow(focus, 2);


// ★ 중앙으로 이동하면서 점점 커짐
const scale =
  0.70 + focusScale * 0.40;

      /*
        중앙 작품 밝게
        양옆은 살짝 어둡게
      */

      const brightness =
        0.45 + focus * 0.55;


      const opacity =
        0.35 + focus * 0.65;


      $card.css({

  transform: `
    translate3d(
      calc(-50% + ${x}px),
      -50%,
      ${z}px
    )
    scale(${scale})
  `,

  filter:
    `brightness(${brightness})`,

  opacity: opacity,

  zIndex:
    Math.round(focus * 100)

});

      // 현재 중앙 작품
      if (focus > 0.95) {

        $card.addClass("active");

      } else {

        $card.removeClass("active");

      }

    });

  }


  // 특정 프로젝트로 이동
  function goToProject(direction) {

    if (isAnimating) return;

    isAnimating = true;


    /*
      direction

      1  = 다음 작품
      -1 = 이전 작품
    */

    currentIndex += direction;


    // 무한 순환
    if (currentIndex >= total) {
      currentIndex = 0;
    }

    if (currentIndex < 0) {
      currentIndex = total - 1;
    }


    const startRotation =
      currentRotation;


    /*
      오른쪽에 마우스 →
      다음 작품이 중앙으로 오도록
    */

    targetRotation =
      currentRotation -
      direction * angleStep;


    const startTime =
      performance.now();


    // 이동 시간
    const duration = 850;


    function animate(time) {

      const elapsed =
        time - startTime;


      const progress =
        Math.min(
          elapsed / duration,
          1
        );


      const eased =
  smoothWhip(progress);


      const rotation =
        startRotation +
        (targetRotation - startRotation)
        * eased;


      updateCarousel(rotation);


      if (progress < 1) {

        requestAnimationFrame(animate);

      } else {

        currentRotation =
          targetRotation;

        isAnimating = false;

      }

    }


    requestAnimationFrame(animate);

  }

  let mouseZone = "center";
  let autoTimer = null;


  // 마우스 위치 감지
$(window).on("mousemove", function (e) {

  const ratio =
    e.clientX / window.innerWidth;


  // 왼쪽
  if (ratio <= 0.35) {

    if (mouseZone !== "left") {

      mouseZone = "left";

      startAutoMove(-1);

    }

  }


  // 오른쪽
  else if (ratio >= 0.65) {

    if (mouseZone !== "right") {

      mouseZone = "right";

      startAutoMove(1);

    }

  }


  // 가운데
  else {

    mouseZone = "center";

    stopAutoMove();

  }

});

function startAutoMove(direction) {

  stopAutoMove();


  // 들어가자마자 바로 한 번 이동
  if (!isAnimating) {

    goToProject(direction);

  }


  /*
    마우스가 계속 해당 영역에 있으면
    반복 이동
  */

  autoTimer = setInterval(function () {

    if (
      mouseZone !== "center" &&
      !isAnimating
    ) {

      goToProject(direction);

    }

  }, 1200);

}


function stopAutoMove() {

  if (autoTimer) {

    clearInterval(autoTimer);

    autoTimer = null;

  }

}


$(window).on("mouseleave", function () {

  mouseZone = "center";

  stopAutoMove();

});

/* =========================
   MOBILE SWIPE
========================= */

let touchStartX = 0;
let touchStartY = 0;

const swipeThreshold = 50;


/* 손가락 터치 시작 */
$(".gallery-viewport").on("touchstart", function (e) {

  const touch = e.originalEvent.touches[0];

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;

});


/* 손가락 뗐을 때 */
$(".gallery-viewport").on("touchend", function (e) {

  const touch = e.originalEvent.changedTouches[0];

  const touchEndX = touch.clientX;
  const touchEndY = touch.clientY;


  const diffX =
    touchEndX - touchStartX;

  const diffY =
    touchEndY - touchStartY;


  /*
    세로 스크롤보다
    가로 움직임이 클 때만 스와이프로 판단
  */
  if (Math.abs(diffX) <= Math.abs(diffY)) {
    return;
  }


  /*
    너무 짧게 움직인 건 무시
  */
  if (Math.abs(diffX) < swipeThreshold) {
    return;
  }


  /*
    ← 왼쪽으로 밀기
    다음 작품
  */
  if (diffX < 0) {

    goToProject(1);

  }


  /*
    → 오른쪽으로 밀기
    이전 작품
  */
  else {

    goToProject(-1);

  }

});

  // 처음 상태
  updateCarousel(0);

});

