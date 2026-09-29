document.addEventListener(
  "DOMContentLoaded",
  function () {

    const form =
      document.getElementById(
        "commentForm"
      );

    const nicknameInput =
      document.getElementById(
        "nickname"
      );

    const commentInput =
      document.getElementById(
        "comment"
      );

    const commentList =
      document.getElementById(
        "commentList"
      );

    const commentCount =
      document.getElementById(
        "commentCount"
      );

    const characterCount =
      document.getElementById(
        "characterCount"
      );


    let comments = [];


    /* ========================================
       CHARACTER COUNT
    ======================================== */

    commentInput.addEventListener(
      "input",
      function () {

        characterCount.textContent =
          commentInput.value.length;

      }
    );


    /* ========================================
       SUBMIT
    ======================================== */

    form.addEventListener(
      "submit",
      function (e) {

        e.preventDefault();


        const nickname =
          nicknameInput
            .value
            .trim();


        const content =
          commentInput
            .value
            .trim();


        if (!nickname) {

          alert(
            "닉네임을 입력해주세요."
          );

          return;

        }


        if (!content) {

          alert(
            "댓글을 입력해주세요."
          );

          return;

        }


        addComment(
          nickname,
          content
        );


        nicknameInput.value =
          "";

        commentInput.value =
          "";

        characterCount.textContent =
          "0";

      }
    );


    /* ========================================
       ADD COMMENT

       ★ 현재는 화면에만 추가됨.

       나중에 Firebase 연결하면
       여기에서 Firestore 저장.
    ======================================== */

    function addComment(
      nickname,
      content
    ) {

      const now =
        new Date();


      const comment = {

        nickname,

        content,

        date:
          formatDate(now)

      };


      comments.unshift(
        comment
      );


      renderComments();

    }


    /* ========================================
       RENDER COMMENTS
    ======================================== */

    function renderComments() {

      commentList.innerHTML =
        "";


      comments.forEach(
        function (comment) {

          const item =
            document.createElement(
              "article"
            );


          item.className =
            "comment-item";


          const info =
            document.createElement(
              "div"
            );

          info.className =
            "comment-info";


          const nickname =
            document.createElement(
              "span"
            );

          nickname.className =
            "comment-nickname";

          nickname.textContent =
            comment.nickname;


          const date =
            document.createElement(
              "span"
            );

          date.className =
            "comment-date";

          date.textContent =
            comment.date;


          const content =
            document.createElement(
              "p"
            );

          content.className =
            "comment-content";

          /*
            innerHTML 말고 textContent 사용
            → 사용자 입력 HTML 실행 방지
          */

          content.textContent =
            comment.content;


          info.appendChild(
            nickname
          );

          info.appendChild(
            date
          );


          item.appendChild(
            info
          );

          item.appendChild(
            content
          );


          commentList.appendChild(
            item
          );

        }
      );


      commentCount.textContent =
        String(
          comments.length
        ).padStart(
          2,
          "0"
        );

    }

    const backToTop =
  document.getElementById("backToTop");


window.addEventListener(
  "scroll",
  function () {

    if (window.scrollY > 500) {

      backToTop.classList.add("show");

    } else {

      backToTop.classList.remove("show");

    }

  }
);


backToTop.addEventListener(
  "click",
  function () {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
);

    /* ========================================
       DATE
    ======================================== */

    function formatDate(date) {

      const year =
        date.getFullYear();


      const month =
        String(
          date.getMonth() + 1
        ).padStart(
          2,
          "0"
        );


      const day =
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        );


      return (
        year +
        "." +
        month +
        "." +
        day
      );

    }

  }
);