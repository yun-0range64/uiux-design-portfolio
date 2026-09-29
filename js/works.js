import * as THREE from "three";

console.log("Three.js 연결:", THREE.REVISION);

$(document).ready(function () {

  const $viewport = $(".gallery-viewport");
  const $cards = $(".project-card");
  const total = $cards.length;


  /* =========================================================
     SETTINGS
  ========================================================= */

  const CARD_GAP = 70;
  const DRAG_SENSITIVITY = 1;

  const BEND_AREA = 650;
  const MAX_BEND = 1.8;
  const BEND_SENSITIVITY = 90;

  const SNAP_DURATION = 600;

  const CENTER_SCALE = 1.12;

  // ★ 900px 이하 = 세로 모드
  const isVertical = () =>
    window.innerWidth <= 900;


  /* =========================================================
     STATE
  ========================================================= */

  let dragging = false;
  let snapping = false;

  let clickedCard = null;

  let dragStartX = 0;
  let previousX = 0;

  let dragStartY = 0;
  let previousY = 0;

  let dragStartOffset = 0;

  let currentOffset = 0;
  let targetOffset = 0;

  let bendStrength = 0;
  let targetBendStrength = 0;

  let centerScale = 1;
  let targetCenterScale = 1;


  /* =========================================================
     THREE.JS
  ========================================================= */

  const threeItems = [];


  $(".three-thumbnail").each(function () {

    const container = this;
    const imagePath =
      container.dataset.image;


    /* SCENE */

    const scene =
      new THREE.Scene();


    /* CAMERA */

    const camera =
      new THREE.PerspectiveCamera(
        45,
        16 / 9,
        0.1,
        100
      );

    camera.position.set(
      0,
      0,
      3.8
    );


    /* RENDERER */

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


    /* TEXTURE */

    const loader =
      new THREE.TextureLoader();

    const texture =
      loader.load(imagePath);

    texture.colorSpace =
      THREE.SRGBColorSpace;


    /* GEOMETRY */

    const geometry =
      new THREE.PlaneGeometry(
        4,
        2.25,
        100,
        40
      );

    const originalPositions =
      geometry.attributes.position
        .array.slice();


    /* MATERIAL */

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true
      });


    /* PLANE */

    const plane =
      new THREE.Mesh(
        geometry,
        material
      );

    scene.add(plane);


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

    return $cards.first()[0]
      .offsetWidth;

  }


  function getCardHeight() {

    if (!$cards.length) {
      return 250;
    }

    return $cards.first()[0]
      .offsetHeight;

  }


  function getHorizontalStep() {

    return (
      getCardWidth() +
      CARD_GAP
    );

  }


  function getVerticalStep() {

    return (
      getCardHeight() +
      CARD_GAP
    );

  }


  function getStep() {

    return isVertical()
      ? getVerticalStep()
      : getHorizontalStep();

  }


  /* =========================================================
     INFINITE POSITION
  ========================================================= */

  function getWrappedPosition(index) {

    const step =
      getStep();

    const loopSize =
      step * total;

    let position =
      index * step +
      currentOffset;

    position =
      THREE.MathUtils.euclideanModulo(
        position +
        loopSize / 2,
        loopSize
      ) -
      loopSize / 2;

    return position;

  }


  /* =========================================================
     CARD POSITION
  ========================================================= */

  function updateCards() {

    const vertical =
      isVertical();

    const step =
      getStep();


    /* -------------------------
       CENTER CARD 찾기
    ------------------------- */

    let centerIndex = 0;
    let smallestDistance =
      Infinity;


    $cards.each(function (index) {

      const position =
        getWrappedPosition(index);

      const distance =
        Math.abs(position);

      if (
        distance <
        smallestDistance
      ) {

        smallestDistance =
          distance;

        centerIndex =
          index;

      }

    });


    /* -------------------------
       CARD 배치
    ------------------------- */

    $cards.each(function (index) {

      let position =
        getWrappedPosition(index);


      /* 곡률에 따른 간격 보정 */

      let spacingScale;

      if (bendStrength >= 0) {

        const bendRatio =
          bendStrength /
          MAX_BEND;

        spacingScale =
          1 +
          bendRatio * 0.40;

      } else {

        const bendRatio =
          Math.abs(
            bendStrength
          ) /
          MAX_BEND;

        spacingScale =
          1 -
          bendRatio * 0.25;

      }

      position *=
        spacingScale;


      const distance =
        Math.abs(position);


      const viewportSize =
        vertical
          ? window.innerHeight
          : window.innerWidth;


      const normalizedDistance =
        Math.min(
          distance /
          (
            viewportSize *
            (vertical
              ? 0.65
              : 0.72)
          ),
          1
        );


      const brightness =
        vertical
          ? 1 -
            normalizedDistance *
            0.45
          : 1 -
            normalizedDistance *
            0.58;


      const opacity =
        vertical
          ? 1 -
            normalizedDistance *
            0.30
          : 1 -
            normalizedDistance *
            0.42;


      const isCenter =
        index ===
        centerIndex;


      const isFlat =
        Math.abs(
          bendStrength
        ) < 0.03;


      const scale =
        !dragging &&
        !snapping &&
        isFlat &&
        isCenter

          ? centerScale

          : 1;


      /* -------------------------
         DESKTOP / MOBILE POSITION
      ------------------------- */

      if (vertical) {

        $(this).css({

          transform: `
            translate3d(
              -50%,
              calc(-50% + ${position}px),
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
              normalizedDistance *
              50
            )

        });

      } else {

        $(this).css({

          transform: `
            translate3d(
              calc(-50% + ${position}px),
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
              normalizedDistance *
              50
            )

        });

      }


      if (
        distance <
        step * 0.45
      ) {

        $(this)
          .addClass("active");

      } else {

        $(this)
          .removeClass("active");

      }

    });

  }


  /* =========================================================
     SCREEN CENTER BEND

     DESKTOP:
     화면 중앙 X축 기준

     <= 900px:
     화면 중앙 Y축 기준
  ========================================================= */

  function updateBend() {

    const vertical =
      isVertical();


    const screenCenter =
      vertical
        ? window.innerHeight / 2
        : window.innerWidth / 2;


    threeItems.forEach(
      function (item) {

        const rect =
          item.container
            .getBoundingClientRect();


        const positions =
          item.geometry
            .attributes
            .position;


        const original =
          item.originalPositions;


        const halfPlaneWidth =
          2;

        const halfPlaneHeight =
          1.125;


        for (
          let i = 0;
          i < positions.count;
          i++
        ) {

          const arrayIndex =
            i * 3;


          const originalX =
            original[
              arrayIndex
            ];


          const originalY =
            original[
              arrayIndex + 1
            ];


          let localPercent;
          let vertexScreenPosition;


          /* =========================
             MOBILE / NARROW WEB
             Y축 계산
          ========================= */

          if (vertical) {

            /*
              PlaneGeometry의 Y축은
              위쪽이 +값.

              DOM 화면 Y는
              아래쪽이 +값이므로
              방향을 뒤집어준다.
            */

            localPercent =
              (
                halfPlaneHeight -
                originalY
              ) /
              (
                halfPlaneHeight *
                2
              );


            vertexScreenPosition =
              rect.top +
              rect.height *
              localPercent;

          }


          /* =========================
             DESKTOP
             X축 계산
          ========================= */

          else {

            localPercent =
              (
                originalX +
                halfPlaneWidth
              ) /
              (
                halfPlaneWidth *
                2
              );


            vertexScreenPosition =
              rect.left +
              rect.width *
              localPercent;

          }


          const distance =
            vertexScreenPosition -
            screenCenter;


          const absDistance =
            Math.abs(
              distance
            );


          /*
            모바일은 화면이 짧으므로
            영역도 화면 높이에 맞춰 제한
          */

          const bendArea =
            vertical
              ? Math.min(
                  BEND_AREA,
                  window.innerHeight *
                  0.60
                )
              : BEND_AREA;


          let influence = 0;


          if (
            absDistance <
            bendArea
          ) {

            const t =
              absDistance /
              bendArea;


            influence =
              (
                Math.cos(
                  t *
                  Math.PI
                ) +
                1
              ) / 2;

          }


          /* Z 깊이 */

          const z =
            influence *
            bendStrength;


          /*
            중앙으로 살짝 당겨서
            말리는 느낌 강화
          */

          const centerPull =
            influence *
            bendStrength *
            0.10;


          let x =
            originalX;

          let y =
            originalY;


          /* MOBILE = Y축 압축 */

          if (vertical) {

            /*
              화면 위쪽 vertex:
              Three 좌표에서는 +Y.

              중앙 방향으로 당김.
            */

            if (distance < 0) {

              y -=
                centerPull;

            } else {

              y +=
                centerPull;

            }

          }


          /* DESKTOP = 기존 X축 압축 */

          else {

            if (distance < 0) {

              x +=
                centerPull;

            } else {

              x -=
                centerPull;

            }

          }


          positions.setXYZ(
            i,
            x,
            y,
            z
          );

        }


        positions.needsUpdate =
          true;

      }
    );

  }


  /* =========================================================
     POINTER DOWN
  ========================================================= */

  $viewport.on(
    "pointerdown",
    function (e) {

      if (snapping) {
        return;
      }


      clickedCard =
        $(e.target)
          .closest(
            ".project-card"
          )[0] ||
        null;


      dragging = true;


      $viewport.addClass(
        "dragging"
      );


      dragStartX =
        e.clientX;

      previousX =
        e.clientX;


      dragStartY =
        e.clientY;

      previousY =
        e.clientY;


      dragStartOffset =
        currentOffset;


      targetOffset =
        currentOffset;


      try {

        this.setPointerCapture(
          e.originalEvent
            .pointerId
        );

      } catch (error) {

        // 일부 브라우저에서는
        // pointer capture가 실패할 수 있음

      }

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


      const vertical =
        isVertical();


      const dragDistance =
        vertical

          ? e.clientY -
            dragStartY

          : e.clientX -
            dragStartX;


      targetOffset =
        dragStartOffset +
        dragDistance *
        DRAG_SENSITIVITY;


      /*
        현재 움직이는 방향을 이용해서
        곡률 방향 결정
      */

      let delta;


      if (vertical) {

        delta =
          e.clientY -
          previousY;

        previousY =
          e.clientY;

      } else {

        delta =
          e.clientX -
          previousX;

        previousX =
          e.clientX;

      }


      targetBendStrength =
        THREE.MathUtils.clamp(

          delta /
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


    const vertical =
      isVertical();


    const moved =
      vertical

        ? Math.abs(
            e.clientY -
            dragStartY
          )

        : Math.abs(
            e.clientX -
            dragStartX
          );


    dragging = false;


    $viewport.removeClass(
      "dragging"
    );


    targetBendStrength = 0;


    /* -------------------------
       CLICK / TAP
    ------------------------- */

    if (moved < 6) {

      if (
        clickedCard &&
        clickedCard.dataset.link
      ) {

        window.location.href =
          clickedCard
            .dataset
            .link;

        return;

      }

    }


    /* -------------------------
       SNAP
    ------------------------- */

    const step =
      getStep();


    const destination =
      Math.round(
        targetOffset /
        step
      ) *
      step;


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


      targetBendStrength =
        0;


      if (progress < 1) {

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


    /* 위치 */

    if (dragging) {

      currentOffset +=
        (
          targetOffset -
          currentOffset
        ) *
        0.24;

    }


    /* 곡률 */

    bendStrength +=
      (
        targetBendStrength -
        bendStrength
      ) *
      0.18;


    /* 중앙 카드 확대 */

    const isFlat =
      Math.abs(
        bendStrength
      ) < 0.03;


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


    centerScale +=
      (
        targetCenterScale -
        centerScale
      ) *
      0.08;


    /*
      드래그를 잠깐 멈추면
      곡률도 서서히 평평해짐
    */

    if (dragging) {

      targetBendStrength *=
        0.94;

    }


    updateCards();
    updateBend();


    /* Three render */

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

  let previousVerticalMode =
    isVertical();


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
        900px 경계를 넘어가면
        가로/세로 모드가 바뀌므로
        첫 프로젝트를 다시 중앙에 둠.
      */

      const currentVerticalMode =
        isVertical();


      if (
        currentVerticalMode !==
        previousVerticalMode
      ) {

        currentOffset = 0;
        targetOffset = 0;

        bendStrength = 0;
        targetBendStrength = 0;

        previousVerticalMode =
          currentVerticalMode;

      }


      /*
        현재 모드의 step 기준으로
        가장 가까운 카드에 다시 정렬
      */

      const step =
        getStep();


      const destination =
        Math.round(
          currentOffset /
          step
        ) *
        step;


      currentOffset =
        destination;


      targetOffset =
        destination;


      updateCards();
      updateBend();

    }
  );


  /* =========================================================
     START
  ========================================================= */

  updateCards();
  updateBend();
  animate();

});