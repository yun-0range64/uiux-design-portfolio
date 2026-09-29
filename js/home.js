$(document).ready(function () {

  /*
    INTRO INTERACTION
  */

  $(".circle-1")
    .delay(100)
    .animate(
      {
        opacity: 1
      },
      {
        duration: 700,
        step: function (now) {

          $(this).css(
            "transform",
            `scale(${0.2 + now * 0.8})`
          );

        }
      }
    );


  $(".circle-2")
    .delay(250)
    .animate(
      {
        opacity: 0.7
      },
      {
        duration: 900,
        step: function (now) {

          $(this).css(
            "transform",
            `scale(${0.2 + now})`
          );

        }
      }
    );


  $(".circle-3")
    .delay(400)
    .animate(
      {
        opacity: 0.4
      },
      {
        duration: 1100,
        step: function (now) {

          $(this).css(
            "transform",
            `scale(${0.2 + now * 2})`
          );

        }
      }
    );


  /*
    TEXT
  */

  setTimeout(function () {

    $(".intro-label").css({
      opacity: 0.5,
      transform: "translateY(0)"
    });

  }, 500);


  setTimeout(function () {

    $(".intro-title").css({
      opacity: 1,
      transform: "translateY(0)"
    });

  }, 700);


  setTimeout(function () {

    $(".intro-description").css({
      opacity: 0.5,
      transform: "translateY(0)"
    });

  }, 900);


  /*
    BUTTON
  */

  setTimeout(function () {

    $(".works-button").css({
      opacity: 1,
      transform: "translateY(0)"
    });

  }, 1200);


  /*
    FOOTER
  */

  setTimeout(function () {

    $(".intro-footer").css({
      opacity: 0.35
    });

  }, 1400);


  /*
    VIEW WORKS
  */

  $(".works-button").on(
    "click",
    function () {

      $("body").addClass(
        "page-leaving"
      );


      setTimeout(function () {

        window.location.href =
          "./works.html";

      }, 600);

    }
  );

});