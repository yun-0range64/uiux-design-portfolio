
import * as THREE from "three";

console.log("Three.js 연결:", THREE.REVISION);



$(document).ready(function () {

  const $viewport = $(".gallery-viewport");
  const $cards = $(".project-card");

  const total = $cards.length;


  /* =========================================================
     SETTINGS getWrappedX(index);
  ========================================================= */

  // 이미지 사이 간격
  const CARD_GAP = 70;

  // 드래그 감도
  const DRAG_SENSITIVITY = 1;

  // 화면 중앙에서 휘는 영역의 폭(px)
  const BEND_AREA = 650;

  // 실제 Z축으로 들어가고 나오는 깊이
  const MAX_BEND = 1.8;

  // 드래그 방향 반응 속도
  const BEND_SENSITIVITY = 90;

  // 스냅 속도
  const SNAP_DURATION = 600;


  /* =========================================================
     STATEpointerdown
  ========================================================= */

  let dragging = false;
  let snapping = false;

  let clickedCard = null;

  let dragStartX = 0;
  let previousX = 0;

  let dragStartOffset = 0;

  let currentOffset = 0;
  let targetOffset = 0;

  // 실제 현재 곡률
  let bendStrength = 0;

  // 목표 곡률
  let targetBendStrength = 0;
// 가운데 카드 확대
let centerScale = 1;
let targetCenterScale = 1;

const CENTER_SCALE = 1.12;

  /* =========================================================
     THREE.JS
  ========================================================= */

  const threeItems = [];


  $(".three-thumbnail").each(function () {

    const container = this;

    const imagePath =
      container.dataset.image;


    /* -------------------------
       SCENE
    ------------------------- */

    const scene =
      new THREE.Scene();


    /* -------------------------
       PERSPECTIVE CAMERA

       ★ 이번 변경 핵심
    ------------------------- */

    const camera =
      new THREE.PerspectiveCamera(
        45,
        16 / 9,
        0.1,
        100
      );

    /*
      4 × 2.25 Plane이
      canvas를 거의 꽉 채우는 거리
    */
    camera.position.set(
      0,
      0,
      3.8
    );


    /* -------------------------
       RENDERER
    ------------------------- */

    const renderer =
      new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
      });


    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );


    renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );


    renderer.setClearColor(
      0x000000,
      0
    );


    container.appendChild(
      renderer.domElement
    );


    /* -------------------------
       TEXTURE
    ------------------------- */

    const loader =
      new THREE.TextureLoader();


    const texture =
      loader.load(imagePath);


    texture.colorSpace =
      THREE.SRGBColorSpace;


    /* -------------------------
       GEOMETRY

       가로 segment를 많이 나눠서
       중앙 굴곡을 부드럽게 만듦
    ------------------------- */

    const geometry =
      new THREE.PlaneGeometry(
        4,
        2.25,
        100,
        20
      );


    /*
      원본 vertex 위치 저장
    */

    const originalPositions =
      geometry.attributes.position
        .array.slice();


    /* -------------------------
       MATERIAL
    ------------------------- */

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true
      });


    /* -------------------------
       PLANE
    ------------------------- */

    const plane =
      new THREE.Mesh(
        geometry,
        material
      );


    scene.add(plane);


    /* -------------------------
       SAVE
    ------------------------- */

    threeItems.push({

      container,

      card:
        container.closest(
          ".project-card"
        ),

      scene,

      camera,

      renderer,

      geometry,

      originalPositions,

      plane

    });

  });


  /* =========================================================
     CARD SIZE
  ========================================================= */

  function getCardWidth() {

  if (!$cards.length) {
    return 400;
  }

  // scale() 영향을 받지 않는 원래 CSS 너비
  return $cards.first()[0].offsetWidth;
}

  function getStep() {

    return (
      getCardWidth() +
      CARD_GAP
    );

  }


  /* =========================================================
     CARD POSITION
  ========================================================= */

  function getWrappedX(index) {

  const step = getStep();
  const loopWidth = step * total;

  let x =
    index * step +
    currentOffset;

  /*
    화면 중앙을 기준으로
    가장 가까운 반복 위치로 재배치

    06 다음에 01
    01 이전에 06
  */
  x =
    THREE.MathUtils.euclideanModulo(
      x + loopWidth / 2,
      loopWidth
    ) -
    loopWidth / 2;

  return x;
}


function updateCards() {

  const step = getStep();


  /*
    =========================================
    화면 중앙에 가장 가까운 카드 딱 1개 찾기
    =========================================
  */

  let centerIndex = 0;
  let smallestDistance = Infinity;


  $cards.each(function (index) {

    const cardX =
      getWrappedX(index);

      

    const distance =
      Math.abs(cardX);


    if (distance < smallestDistance) {

      smallestDistance =
        distance;

      centerIndex =
        index;

    }

  });


  /*
    =========================================
    실제 카드 배치
    =========================================
  */

  $cards.each(function (index) {

   let x =
  getWrappedX(index);

  // 곡률에 따라 카드 간격도 같이 보정

let spacingScale;

if (bendStrength >= 0) {

  // 커질 때 → 간격 넓힘
  const bendRatio =
    bendStrength / MAX_BEND;

  spacingScale =
    1 + bendRatio * 0.40;

} else {

  // 줄어들 때 → 간격 좁힘
  const bendRatio =
    Math.abs(bendStrength) / MAX_BEND;

  spacingScale =
    1 - bendRatio * 0.25;
}

x *= spacingScale;
/*
  =========================================
  곡률에 따른 카드 간격 보정
  =========================================

  이미지가 앞으로 나오면서 커질수록
  카드 중심도 서로 멀어짐.

  이미지가 뒤로 들어가면서 작아질수록
  카드 중심도 서로 가까워짐.
*/

    const distance =
      Math.abs(x);


    const normalizedDistance =
      Math.min(
        distance /
        (window.innerWidth * 0.72),
        1
      );


    const brightness =
      1 -
      normalizedDistance * 0.58;


    const opacity =
      1 -
      normalizedDistance * 0.42;


    /*
  중앙에 가장 가까운 카드인지 확인
*/
const isCenter =
  index === centerIndex;


/*
  드래그 중에는 전부 1배.

  드래그가 끝난 뒤
  중앙 카드만 centerScale 적용.
*/
const isFlat =
  Math.abs(bendStrength) < 0.03;

const scale =
  !dragging &&
  !snapping &&
  isFlat &&
  isCenter
    ? centerScale
    : 1;

$(this).css({

  transform: `
    translate3d(
      calc(-50% + ${x}px),
      -50%,
      0
    )
    scale(${scale})
  `,

      filter:
        `brightness(${brightness})`,

      opacity,

      zIndex:
        Math.round(
          100 -
          normalizedDistance * 50
        )

    });


    if (
      distance <
      step * 0.45
    ) {

      $(this).addClass("active");

    } else {

      $(this).removeClass("active");

    }

  });

}


  /* =========================================================
     ★ SCREEN CENTER BEND
  ========================================================= */

  function updateBend() {

    /*
      화면 전체의 정확한 중앙

              ↓

      ────────╲____╱────────
    */

    const screenCenterX =
      window.innerWidth / 2;


    threeItems.forEach(function (item) {

      const rect =
        item.container
          .getBoundingClientRect();


      const positions =
        item.geometry
          .attributes
          .position;


      const original =
        item.originalPositions;


      /*
        Plane 좌표 범위

        -2 -------- 0 -------- +2
      */

      const halfPlaneWidth = 2;


      for (
        let i = 0;
        i < positions.count;
        i++
      ) {

        const arrayIndex =
          i * 3;


        const originalX =
          original[arrayIndex];


        const originalY =
          original[arrayIndex + 1];


        /*
          Three.js vertex 위치를

          0 ~ 1 로 변환
        */

        const localPercent =
          (
            originalX +
            halfPlaneWidth
          ) /
          (
            halfPlaneWidth * 2
          );


        /*
          해당 vertex가 실제 화면에서
          몇 px 위치인지 계산
        */

        const vertexScreenX =
          rect.left +
          rect.width *
          localPercent;


        /*
          화면 중앙으로부터 거리

          중앙 = 0
        */

        const distance =
          vertexScreenX -
          screenCenterX;


        const absDistance =
          Math.abs(distance);


        /*
          중앙 ± BEND_AREA 안쪽만
          휘게 함
        */

        let influence = 0;


        if (
          absDistance <
          BEND_AREA
        ) {

          /*
            0 ~ 1

            중앙에서:
            1

            BEND_AREA 끝에서:
            0
          */

          const t =
            absDistance /
            BEND_AREA;


          /*
            부드러운 Cosine Curve

                    1
                   ╭╮
                 ╱    ╲
               ╱        ╲
            0 ─            ─ 0
          */

          influence =
            (
              Math.cos(
                t *
                Math.PI
              ) +
              1
            ) / 2;

        }


        /*
          ★ 핵심

          PerspectiveCamera이므로
          Z가 움직이면 실제 화면에서
          확대/축소되어 곡면으로 보임.

          +Z = 카메라 방향
          -Z = 화면 안쪽
        */

        const z =
          influence *
          bendStrength;


        /*
          ★ 아주 약한 X 압축까지 추가

          Z만 움직였을 때보다
          띠가 실제로 말리는 느낌을 줌.
        */

        const centerPull =
          influence *
          bendStrength *
          0.10;


        let x =
          originalX;


        /*
          화면 중앙의 왼쪽 vertex면
          오른쪽으로 조금 당기고,

          오른쪽 vertex면
          왼쪽으로 조금 당김.
        */

        if (
          distance < 0
        ) {

          x += centerPull;

        } else {

          x -= centerPull;

        }


        positions.setXYZ(
          i,
          x,
          originalY,
          z
        );

      }


      positions.needsUpdate =
        true;

    });

  }


  /* =========================================================
     EDGE RESISTANCEpointermove
  ========================================================= */




  /* =========================================================
     POINTER DOWN
  ========================================================= */

  $viewport.on(
    "pointerdown",
    function (e) {

      if (snapping) {
        return;
      }

// ★ 처음 누른 카드 기억
    clickedCard =
      $(e.target).closest(".project-card")[0] || null;


dragging = true;



      $viewport.addClass(
        "dragging"
      );


      dragStartX =
        e.clientX;


      previousX =
        e.clientX;


      dragStartOffset =
        currentOffset;


      targetOffset =
        currentOffset;


      this.setPointerCapture(
        e.originalEvent.pointerId
      );

    }
  );


  /* =========================================================
     POINTER MOVE
  ========================================================= */

  $viewport.on(
    "pointermove",
    function (e) {

      if (!dragging) {
        return;
      }


      const dragDistance =
        e.clientX -
        dragStartX;


      /*
        캐러셀 좌우 이동
      */

      let nextOffset =
        dragStartOffset +
        dragDistance *
        DRAG_SENSITIVITY;


     targetOffset = nextOffset;


      /* =========================================
         ★ 휘어지는 방향let nearestIndex =

         이번에는 전체 드래그 거리보다
         "현재 마우스 움직임 방향" 사용.

         그래서 방향을 바꾸면
         즉시 반대로 휨.
      ========================================= */

      const deltaX =
        e.clientX -
        previousX;


      previousX =
        e.clientX;


      targetBendStrength =
        THREE.MathUtils.clamp(
          deltaX /
          BEND_SENSITIVITY,
          -1,
          1
        ) *
        MAX_BEND;

    }
  );


  /* =========================================================
     RELEASE
  ========================================================= */

  function releaseDrag(e) {

  if (!dragging) {
    return;
  }

  // 처음 누른 위치와 뗀 위치 차이
  const moved =
    Math.abs(e.clientX - dragStartX);


  dragging = false;

  $viewport.removeClass(
    "dragging"
  );

  targetBendStrength = 0;

  /*
    =========================================
    ★ 거의 움직이지 않았으면 = 클릭
    =========================================
  */

if (moved < 6) {

  targetBendStrength = 0;

  if (
    clickedCard &&
    clickedCard.dataset.link
  ) {

    window.location.href =
      clickedCard.dataset.link;

    return;
  }
}


  /*
    =========================================
    실제로 움직였으면 = 드래그
    =========================================
  */

  targetBendStrength = 0;

  const step =
    getStep();

  const destination =
    Math.round(
      targetOffset / step
    ) * step;

  startSnap(
    destination
  );

}

  $viewport.on(
    "pointerup pointercancel",
    releaseDrag
  );


  /* =========================================================
     SNAP
  ========================================================= */

  function startSnap(
    destination
  ) {

    snapping = true;


    const start =
      currentOffset;


    const difference =
      destination -
      start;


    const startTime =
      performance.now();


    function snapFrame(time) {

      const progress =
        Math.min(
          (
            time -
            startTime
          ) /
          SNAP_DURATION,
          1
        );


      /*
        easeOutQuart
      */

      const eased =
        1 -
        Math.pow(
          1 - progress,
          4
        );


      currentOffset =
        start +
        difference *
        eased;


      targetOffset =
        currentOffset;


      /*
        스냅되는 동안
        굴곡은 평평하게 복귀
      */

      targetBendStrength = 0;


      if (
        progress < 1
      ) {

        requestAnimationFrame(
          snapFrame
        );

      } else {

        currentOffset =
          destination;


        targetOffset =
          destination;


        snapping = false;

      }

    }


    requestAnimationFrame(
      snapFrame
    );

  }


  /* =========================================================
     MAIN LOOP
  ========================================================= */

  function animate() {

    requestAnimationFrame(
      animate
    );


    /*
      캐러셀 위치
    */

    if (dragging) {

      currentOffset +=
        (
          targetOffset -
          currentOffset
        ) *
        0.24;

    }


    /*
      곡률도 부드럽게 따라옴
    */

    bendStrength +=
    
      (
        targetBendStrength -
        bendStrength
      ) *
      0.18;

      /*
  =========================================
  가운데 카드 확대 애니메이션
  =========================================

  드래그 중 / 스냅 중
  → 원래 크기

  가운데 정렬 완료
  → 1.12배로 부드럽게 확대
*/

/*
  곡률까지 거의 완전히 풀린 다음에만
  중앙 카드 확대 시작
*/

const isFlat =
  Math.abs(bendStrength) < 0.03;


if (
  !dragging &&
  !snapping &&
  isFlat
) {

  targetCenterScale =
    CENTER_SCALE;

} else {

  targetCenterScale =
    1;

}


/*
  스르륵 확대 / 축소
*/

centerScale +=
  (
    targetCenterScale -
    centerScale
  ) *
  0.08;

    /*
      손을 멈추고 있는 동안에도
      곡률이 너무 오래 유지되지 않도록
      살짝 감소
    */

    if (dragging) {

      targetBendStrength *=
        0.94;

    }


    updateCards();

    updateBend();


    /*
      Three 렌더링
    */

    threeItems.forEach(
      function (item) {

        item.renderer.render(
          item.scene,
          item.camera
        );

      }
    );

  }


  /* =========================================================
     RESIZE
  ========================================================= */

  $(window).on(
    "resize",
    function () {

      threeItems.forEach(
        function (item) {

          const width =
            item.container
              .clientWidth;


          const height =
            item.container
              .clientHeight;


          item.renderer.setSize(
            width,
            height
          );


          item.camera.aspect =
            width /
            height;


          item.camera
            .updateProjectionMatrix();

        }
      );


      /*
        가장 가까운 프로젝트를
        다시 중앙 정렬
      */

     const step =
  getStep();

const destination =
  Math.round(
    currentOffset / step
  ) * step;

currentOffset =
  destination;

targetOffset =
  destination;

    }
  );

 

/* =========================================================
   START
========================================================= */

updateCards();

animate();

});