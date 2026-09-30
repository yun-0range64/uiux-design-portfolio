//enterWorks

import * as THREE from "three";

import {
  CSS3DRenderer,
  CSS3DObject
} from "three/addons/renderers/CSS3DRenderer.js";

import {
  TrackballControls
} from "three/addons/controls/TrackballControls.js";


/* =========================================================
   DOM
========================================================= */

const intro = document.querySelector("#intro");
const cssContainer = document.querySelector("#introScene");
const webglContainer = document.querySelector("#introWebGL");


/* =========================================================
   SCENES
========================================================= */

const cssScene = new THREE.Scene();
const webglScene = new THREE.Scene();


/* =========================================================
   CAMERA
========================================================= */

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  10000
);


function getPixelPerfectCameraZ() {

  const fov =
    THREE.MathUtils.degToRad(camera.fov);

  return (
    window.innerHeight /
    (2 * Math.tan(fov / 2))
  );
}


camera.position.set(
  0,
  0,
  getPixelPerfectCameraZ()
);


/* =========================================================
   CSS3D RENDERER
========================================================= */

const cssRenderer =
  new CSS3DRenderer();

cssRenderer.setSize(
  window.innerWidth,
  window.innerHeight
);

cssRenderer.domElement.style.position = "absolute";
cssRenderer.domElement.style.inset = "0";
cssRenderer.domElement.style.background = "transparent";

cssContainer.appendChild(
  cssRenderer.domElement
);


/* =========================================================
   WEBGL RENDERER
========================================================= */

const webglRenderer =
  new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });

webglRenderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

webglRenderer.setSize(
  window.innerWidth,
  window.innerHeight
);

webglRenderer.setClearColor(
  0x000000,
  1
);

webglContainer.appendChild(
  webglRenderer.domElement
);


/* =========================================================
   CONTROLS
========================================================= */

const controls =
  new TrackballControls(
    camera,
    cssRenderer.domElement
  );

controls.rotateSpeed = 1.8;
controls.zoomSpeed = 1.1;
controls.panSpeed = 0.8;

controls.noRotate = false;
controls.noZoom = false;
controls.noPan = true;

controls.staticMoving = false;
controls.dynamicDampingFactor = 0.08;


const initialCameraZ =
  getPixelPerfectCameraZ();

controls.minDistance =
  initialCameraZ * 0.45;

controls.maxDistance =
  initialCameraZ * 2.2;


/* =========================================================
   LIGHT
========================================================= */

const ambientLight =
  new THREE.AmbientLight(
    0xffffff,
    1.6
  );

webglScene.add(
  ambientLight
);


const directionalLight =
  new THREE.DirectionalLight(
    0xffffff,
    3.5
  );

directionalLight.position.set(
  -600,
  800,
  1200
);

webglScene.add(
  directionalLight
);


/* =========================================================
   SETTINGS
========================================================= */

const PROJECT_COUNT = 6;

const SPHERE_COUNT = 220;
const SPHERE_RADIUS = 6;


/* 3D FIELD */

const FIELD_X = 1250;
const FIELD_Y = 620;
const FIELD_Z = 700;


/* =========================================================
   WORKS CARD SETTINGS

   ★ 여기서 카드 자체 크기를 강제로 지정하지 않음.
   CSS의 .intro-project 크기를 그대로 사용.

   중앙 PROJECT 01만 1.12배.
========================================================= */

const CENTER_SCALE = 1.12;


/*
  ★ 사진 사이 간격

  이것만 바꾸면 됨.

  60 = 가까움
  80 = 현재
  100 = 더 멀어짐
*/

const CARD_GAP = 80;


/* =========================================================
   YUNJU.
========================================================= */

/*
  아주 살짝 작게 조정
*/

const LOGO_WIDTH = 56;
const LOGO_HEIGHT = 18.85;


/*
  WORKS HEADER
*/

const HEADER_HEIGHT = 80;
const HEADER_LOGO_LEFT = 48;


/* =========================================================
   TRANSITION
========================================================= */

const TRANSITION_DURATION = 1800;
const LOGO_MOVE_DURATION = 900;


/* =========================================================
   PROJECT IMAGES.position.set
========================================================= */

const projectImages = [

  "./assets/images/project01.png",

  "./assets/images/project02.png",

  "./assets/images/project03.png",

  "./assets/images/project04.png",

  "./assets/images/project05.png",

  "./assets/images/project04.png"

];


/* =========================================================
   ARRAYS
========================================================= */

const projectObjects = [];
const projectTargets = [];

const spheres = [];
const sphereOriginalScales = [];

const logoTargets = [];


/* =========================================================
   STATE
========================================================= */

let transitioning = false;

let pointerDownX = 0;
let pointerDownY = 0;

let pointerMoved = false;


/* =========================================================
   HELPERS
========================================================= */

function random(min, max) {

  return (
    Math.random() *
    (max - min) +
    min
  );
}


function easeInOutCubic(t) {

  return t < 0.5
    ? 4 * t * t * t
    : 1 -
      Math.pow(
        -2 * t + 2,
        3
      ) / 2;
}


/* =========================================================
   CREATE PROJECTS
========================================================= */

function createProjects() {

  const placedPositions = [];

  // 카드끼리 화면상 너무 붙지 않도록 하는 최소 간격
  const MIN_DISTANCE_X = 500;
  const MIN_DISTANCE_Y = 280;

  for (let i = 0; i < PROJECT_COUNT; i++) {

    const element = document.createElement("div");
    element.className = "intro-project";

    const image = document.createElement("img");

    // ★ 기존 projectImages 배열 그대로 사용
    image.src = projectImages[i];
    image.alt = `Project ${i + 1}`;

    element.appendChild(image);

    const object = new CSS3DObject(element);


    /* =========================================
       초기 위치 생성
    ========================================= */

    let position = new THREE.Vector3();
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 300) {

      position.set(
        random(-FIELD_X * 0.72, FIELD_X * 0.72),
        random(-FIELD_Y * 0.65, FIELD_Y * 0.65),
        random(-FIELD_Z * 0.45, FIELD_Z * 0.45)
      );

      valid = true;

      for (const existing of placedPositions) {

        const diffX = Math.abs(
          position.x - existing.x
        );

        const diffY = Math.abs(
          position.y - existing.y
        );

        // X/Y가 동시에 가까우면 다시 뽑기
        if (
          diffX < MIN_DISTANCE_X &&
          diffY < MIN_DISTANCE_Y
        ) {
          valid = false;
          break;
        }
      }

      attempts++;
    }


    object.position.copy(position);

    placedPositions.push(
      position.clone()
    );


    /* 처음에는 모든 이미지 정면 */

    object.rotation.set(
      0,
      0,
      0
    );

    object.scale.set(
      1,
      1,
      1
    );


    cssScene.add(object);

    projectObjects.push(object);
  }
}
/* =========================================================
   CREATE SPHERES
========================================================= */

function createSpheres() {

  const geometry =
    new THREE.SphereGeometry(
      SPHERE_RADIUS,
      20,
      20
    );


  const material =
    new THREE.MeshStandardMaterial({

      color: 0xffffff,

      roughness: 0.4,

      metalness: 0

    });


  for (
    let i = 0;
    i < SPHERE_COUNT;
    i++
  ) {

    const sphere =
      new THREE.Mesh(
        geometry,
        material
      );


    sphere.position.set(

      random(
        -FIELD_X,
        FIELD_X
      ),

      random(
        -FIELD_Y,
        FIELD_Y
      ),

      random(
        -FIELD_Z,
        FIELD_Z
      )

    );


    const scale =
      random(
        0.75,
        1.25
      );


    sphere.scale.setScalar(
      scale
    );


    webglScene.add(
      sphere
    );


    spheres.push(
      sphere
    );

    sphereOriginalScales.push(
      scale
    );
  }
}


/* =========================================================
   PROJECT TARGETS

   ★ 중요

   CSS 카드 원본 크기 그대로 사용.

   06      01      02
   1x     1.12x     1x

   JS에서 322 / 288로 강제 변환하지 않음.
========================================================= */

function createProjectTargets() {

  projectTargets.length = 0;


  const firstCard =
    document.querySelector(
      ".intro-project"
    );

  if (!firstCard) {
    return;
  }


  /*
    ★ transform 영향 안 받는
    CSS 원본 크기
  */

  const cardWidth =
    firstCard.offsetWidth;

  const cardHeight =
    firstCard.offsetHeight;


  const isVertical =
    window.innerWidth <= 900;


  /* =======================================================
     DESKTOP
  ======================================================= */

  if (!isVertical) {


    /*
      카드 중심 ↔ 중심

      원본 카드 width
      +
      우리가 정한 gap
    */

    const spacing =
      cardWidth +
      CARD_GAP;


    /*
      WORKS gallery
      top: 54%
    */

    const targetScreenY =
      window.innerHeight * 0.54;


    const screenCenterY =
      window.innerHeight / 2;


    const worldY =
      -(
        targetScreenY -
        screenCenterY
      );


    for (
      let i = 0;
      i < PROJECT_COUNT;
      i++
    ) {

      let x = 0;
      let scale = 1;


      /* ========================
         PROJECT 01
         CENTER
      ======================== */

      if (i === 0) {

        x = 0;

        scale =
          CENTER_SCALE;

      }


      /* ========================
         PROJECT 02
         RIGHT
      ======================== */

      else if (i === 1) {

        x =
          spacing;

        scale =
          1;

      }


      /* ========================
         PROJECT 06
         LEFT
      ======================== */

      else if (i === 5) {

        x =
          -spacing;

        scale =
          1;

      }


      /* ========================
         PROJECT 03 / 04 / 05
         OUT
      ======================== */

      else {

        x =
          i % 2 === 0

            ? window.innerWidth + 1200 + i * 250

            : -(window.innerWidth + 1200 + i * 250);


        scale =
          1;

      }


      projectTargets.push({

        position:
          new THREE.Vector3(
            x,
            worldY,
            0
          ),

        scale

      });
    }
  }


  /* =======================================================
     MOBILE
  ======================================================= */

  else {


    const spacing =
      cardHeight +
      CARD_GAP;


    for (
      let i = 0;
      i < PROJECT_COUNT;
      i++
    ) {

      let y = 0;
      let scale = 1;


      /* PROJECT 01 */

      if (i === 0) {

        y = 0;

        scale =
          CENTER_SCALE;

      }


      /* PROJECT 02 */

      else if (i === 1) {

        y =
          -spacing;

        scale =
          1;

      }


      /* PROJECT 06 */

      else if (i === 5) {

        y =
          spacing;

        scale =
          1;

      }


      /* PROJECT 03 / 04 / 05 */

      else {

        y =
          i % 2 === 0

            ? -(window.innerHeight + 1200 + i * 250)

            : window.innerHeight + 1200 + i * 250;


        scale =
          1;

      }


      projectTargets.push({

        position:
          new THREE.Vector3(
            0,
            y,
            0
          ),

        scale

      });
    }
  }
}


/* =========================================================
   CREATE YUNJU.
========================================================= */

function createLogoTargets() {

  logoTargets.length = 0;


  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 1000;
  canvas.height = 300;


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 210px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";


  ctx.fillText(
    "YUNJU.",
    canvas.width / 2,
    canvas.height / 2
  );


  /* =======================================================
     READ PIXELS
  ======================================================= */

  const imageData =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );


  const pixels = [];

  const STEP = 8;


  for (
    let y = 0;
    y < canvas.height;
    y += STEP
  ) {

    for (
      let x = 0;
      x < canvas.width;
      x += STEP
    ) {

      const index =
        (
          y *
          canvas.width +
          x
        ) * 4;


      const alpha =
        imageData.data[
          index + 3
        ];


      if (alpha > 100) {

        pixels.push({
          x,
          y
        });
      }
    }
  }


  /* =======================================================
     RAW LOGO TARGETS
  ======================================================= */

  for (
    let i = 0;
    i < spheres.length;
    i++
  ) {

    const pixelIndex =
      Math.floor(
        i *
        pixels.length /
        spheres.length
      );


    const pixel =
      pixels[pixelIndex];


    if (!pixel) {

      logoTargets.push(
        new THREE.Vector3(
          0,
          0,
          0
        )
      );

      continue;
    }


    const x =
      pixel.x -
      canvas.width / 2;


    const y =
      canvas.height / 2 -
      pixel.y;


    logoTargets.push(
      new THREE.Vector3(
        x,
        y,
        0
      )
    );
  }


  /* =======================================================
     BOUNDS
  ======================================================= */

  const minX =
    Math.min(
      ...logoTargets.map(
        point => point.x
      )
    );


  const maxX =
    Math.max(
      ...logoTargets.map(
        point => point.x
      )
    );


  const minY =
    Math.min(
      ...logoTargets.map(
        point => point.y
      )
    );


  const maxY =
    Math.max(
      ...logoTargets.map(
        point => point.y
      )
    );


  const currentWidth =
    maxX - minX;


  const currentHeight =
    maxY - minY;


  /* =======================================================
     LOGO SIZE

     56 × 18.85 안에 맞춤
  ======================================================= */

  const logoScale =
    Math.min(

      LOGO_WIDTH /
      currentWidth,

      LOGO_HEIGHT /
      currentHeight

    );


  const centerX =
    (
      minX +
      maxX
    ) / 2;


  const centerY =
    (
      minY +
      maxY
    ) / 2;


  logoTargets.forEach(
    point => {


      point.x =
        (
          point.x -
          centerX
        ) *
        logoScale;


      point.y =
        (
          point.y -
          centerY
        ) *
        logoScale;


      point.z = 0;

    }
  );
}


/* =========================================================
   RESET CAMERA
========================================================= */

function resetCamera(
  duration
) {

  const startPosition =
    camera.position.clone();


  const startQuaternion =
    camera.quaternion.clone();


  const targetPosition =
    new THREE.Vector3(
      0,
      0,
      getPixelPerfectCameraZ()
    );


  const dummyCamera =
    camera.clone();


  dummyCamera.position.copy(
    targetPosition
  );


  dummyCamera.up.set(
    0,
    1,
    0
  );


  dummyCamera.lookAt(
    0,
    0,
    0
  );


  const targetQuaternion =
    dummyCamera.quaternion.clone();


  const startTime =
    performance.now();


  return new Promise(
    resolve => {


      function update(now) {

        const progress =
          Math.min(
            (
              now -
              startTime
            ) /
            duration,
            1
          );


        const eased =
          easeInOutCubic(
            progress
          );


        camera.position
          .lerpVectors(
            startPosition,
            targetPosition,
            eased
          );


        camera.quaternion
          .slerpQuaternions(
            startQuaternion,
            targetQuaternion,
            eased
          );


        if (progress < 1) {

          requestAnimationFrame(
            update
          );

        } else {

          camera.position.copy(
            targetPosition
          );


          camera.quaternion.copy(
            targetQuaternion
          );


          resolve();
        }
      }


      requestAnimationFrame(
        update
      );
    }
  );
}


/* =========================================================
   PROJECTS → WORKS
========================================================= */

function animateProjects(
  duration
) {

  createProjectTargets();


  const startPositions =
    projectObjects.map(
      object =>
        object.position.clone()
    );


  const startRotations =
    projectObjects.map(
      object =>
        object.quaternion.clone()
    );


  const startScales =
    projectObjects.map(
      object =>
        object.scale.x
    );


  /*
    최종 정면
  */

  const targetQuaternion =
    new THREE.Quaternion();


  const startTime =
    performance.now();


  return new Promise(
    resolve => {


      function update(now) {

        const progress =
          Math.min(
            (
              now -
              startTime
            ) /
            duration,
            1
          );


        const eased =
          easeInOutCubic(
            progress
          );


        projectObjects.forEach(
          (
            object,
            index
          ) => {


            const target =
              projectTargets[index];


            if (!target) {
              return;
            }


            /* POSITION */

            object.position
              .lerpVectors(
                startPositions[index],
                target.position,
                eased
              );


            /* ROTATION */

            object.quaternion
              .slerpQuaternions(
                startRotations[index],
                targetQuaternion,
                eased
              );


            /* SCALE */

            const scale =
              THREE.MathUtils.lerp(
                startScales[index],
                target.scale,
                eased
              );


            object.scale.set(
              scale,
              scale,
              scale
            );
          }
        );


        if (progress < 1) {

          requestAnimationFrame(
            update
          );

        } else {

          resolve();
        }
      }


      requestAnimationFrame(
        update
      );
    }
  );
}


/* =========================================================
   SPHERES → YUNJU.
========================================================= */

function spheresToLogo(duration) {

  const startPositions =
    spheres.map(
      sphere => sphere.position.clone()
    );

  const startScales =
    spheres.map(
      sphere => sphere.scale.x
    );


  /* =========================================
     최종 YUNJU. 위치 = 처음부터 HEADER
  ========================================= */

  const logoScreenCenterX =
    HEADER_LOGO_LEFT +
    LOGO_WIDTH / 2;

  const logoScreenCenterY =
    HEADER_HEIGHT / 2;


  /* SCREEN → WORLD */

  const logoWorldX =
    logoScreenCenterX -
    window.innerWidth / 2;

  const logoWorldY =
    window.innerHeight / 2 -
    logoScreenCenterY;


  const logoOffset =
    new THREE.Vector3(
      logoWorldX,
      logoWorldY,
      0
    );


  const startTime =
    performance.now();


  return new Promise(resolve => {

    function update(now) {

      const progress =
        Math.min(
          (now - startTime) /
          duration,
          1
        );


      const eased =
        easeInOutCubic(progress);


      spheres.forEach(
        (sphere, index) => {


          /*
            ★ 중앙이 아니라

            처음부터 HEADER 위치의
            YUNJU. 형태를 목표로 함
          */

          const target =
            logoTargets[index]
              .clone()
              .add(logoOffset);


          sphere.position.lerpVectors(
            startPositions[index],
            target,
            eased
          );


          const scale =
            THREE.MathUtils.lerp(
              startScales[index],
              0.18,
              eased
            );


          sphere.scale.setScalar(scale);

        }
      );


      if (progress < 1) {

        requestAnimationFrame(update);

      } else {

        resolve();

      }
    }


    requestAnimationFrame(update);

  });
}


/* =========================================================
   YUNJU. → HEADER

   LEFT = 48px

   HEADER HEIGHT = 80px

   CENTER Y = 40px
========================================================= */

function moveLogoToHeader(
  duration
) {

  const startPositions =
    spheres.map(
      sphere =>
        sphere.position.clone()
    );


  const startScales =
    spheres.map(
      sphere =>
        sphere.scale.x
    );


  /* =======================================================
     LOGO CENTER POSITION
  ======================================================= */

  const logoScreenCenterX =
    HEADER_LOGO_LEFT +
    LOGO_WIDTH / 2;


  const logoScreenCenterY =
    HEADER_HEIGHT / 2;


  /* =======================================================
     SCREEN → WORLD
  ======================================================= */

  const logoWorldX =
    logoScreenCenterX -
    window.innerWidth / 2;


  const logoWorldY =
    window.innerHeight / 2 -
    logoScreenCenterY;


  const logoOffset =
    new THREE.Vector3(
      logoWorldX,
      logoWorldY,
      0
    );


  const startTime =
    performance.now();


  return new Promise(
    resolve => {


      function update(now) {

        const progress =
          Math.min(
            (
              now -
              startTime
            ) /
            duration,
            1
          );


        const eased =
          easeInOutCubic(
            progress
          );


        spheres.forEach(
          (
            sphere,
            index
          ) => {


            const target =
              logoTargets[index]
                .clone()
                .add(
                  logoOffset
                );


            sphere.position
              .lerpVectors(
                startPositions[index],
                target,
                eased
              );


            const scale =
              THREE.MathUtils.lerp(
                startScales[index],
                0.18,
                eased
              );


            sphere.scale.setScalar(
              scale
            );
          }
        );


        if (progress < 1) {

          requestAnimationFrame(
            update
          );

        } else {

          resolve();
        }
      }


      requestAnimationFrame(
        update
      );
    }
  );
}


/* =========================================================
   ENTER WORKS
========================================================= */

async function enterWorks() {

  if (transitioning) {
    return;
  }


  transitioning = true;


  intro.classList.add(
    "transitioning"
  );


  controls.enabled = false;


  /* =======================================================
     1.

     CAMERA → FRONT
     PROJECTS → WORKS
     SPHERES → YUNJU.

     동시에 실행
  ======================================================= */

  await Promise.all([

    resetCamera(
      TRANSITION_DURATION
    ),

    animateProjects(
      TRANSITION_DURATION
    ),

    spheresToLogo(
      TRANSITION_DURATION
    )

  ]);


  /* =======================================================
     2.

     YUNJU. → HEADER
  ======================================================= */



  /* =======================================================
     3.

     WORKS 이동
  ======================================================= */

  setTimeout(
    () => {

      window.location.href =
        "./works.html";

    },
    300
  );
}


/* =========================================================
   POINTER
========================================================= */

cssRenderer.domElement.addEventListener(
  "pointerdown",
  event => {

    if (transitioning) {
      return;
    }


    pointerDownX =
      event.clientX;

    pointerDownY =
      event.clientY;

    pointerMoved =
      false;
  }
);


cssRenderer.domElement.addEventListener(
  "pointermove",
  event => {

    if (transitioning) {
      return;
    }


    const moveX =
      Math.abs(
        event.clientX -
        pointerDownX
      );


    const moveY =
      Math.abs(
        event.clientY -
        pointerDownY
      );


    if (
      moveX > 6 ||
      moveY > 6
    ) {

      pointerMoved = true;
    }
  }
);


cssRenderer.domElement.addEventListener(
  "pointerup",
  event => {

    if (transitioning) {
      return;
    }


    const moveX =
      Math.abs(
        event.clientX -
        pointerDownX
      );


    const moveY =
      Math.abs(
        event.clientY -
        pointerDownY
      );


    if (
      !pointerMoved &&
      moveX < 6 &&
      moveY < 6
    ) {

      enterWorks();
    }
  }
);


/* =========================================================
   CONTEXT MENU OFF
========================================================= */

cssRenderer.domElement.addEventListener(
  "contextmenu",
  event => {

    event.preventDefault();
  }
);


/* =========================================================
   RESIZE06
========================================================= */

window.addEventListener(
  "resize",
  () => {


    camera.aspect =
      window.innerWidth /
      window.innerHeight;


    camera.updateProjectionMatrix();


    cssRenderer.setSize(
      window.innerWidth,
      window.innerHeight
    );


    webglRenderer.setSize(
      window.innerWidth,
      window.innerHeight
    );


    controls.handleResize();


    createProjectTargets();
  }
);


/* =========================================================
   ANIMATION LOOP
========================================================= */

function animate() {

  requestAnimationFrame(
    animate
  );


  if (!transitioning) {

    controls.update();
  }


  webglRenderer.render(
    webglScene,
    camera
  );


  cssRenderer.render(
    cssScene,
    camera
  );
}


/* =========================================================
   INIT
========================================================= */

createProjects();

createSpheres();

createLogoTargets();

createProjectTargets();

animate();