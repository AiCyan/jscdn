$(function () {
  $('.flxedMenu li').click(function () {
    var index = $(this).index();
    switch (index) {
      case 0:
        $('body').css('background', 'transparent');
        break;
      case 1:
        $('body').css('background', `url("${'https://cdn.jsdelivr.net/gh/AiCyan/jscdn@1.0/img/themebg/little-monster.png'}")`)
        break;
      case 2:
        $('body').css('background', `url("${'https://cdn.jsdelivr.net/gh/AiCyan/jscdn@1.0/img/themebg/sakura.png'}")`)
        break;
      case 3:
        $('body').css('background', `url("${'https://cdn.jsdelivr.net/gh/AiCyan/jscdn@1.0/img/themebg/point.png'}")`)
        break;
      case 4:
        $('body').css('background', `url("${'https://cdn.jsdelivr.net/gh/AiCyan/jscdn@1.0/img/themebg/plaid.jpg'}")`)
        break;
      case 5:
        $('body').css('background', `url("${'https://cdn.jsdelivr.net/gh/AiCyan/jscdn@1.0/img/themebg/star.png'}")`)
    }
  })
  $(document).on('scroll', function () {
    var scroH = $(document).scrollTop();
    if (scroH >= 100) {
      $('#flxedNav').css({
        bottom: 10,
      }, 500)
    }
    if (scroH == 0) {
      $('#flxedNav').css({
        bottom: -500,
      }, 500)
    }
    if (scroH) {
      $('.flxedMenu').css({
        visibility: 'hidden',
        opacity: 0
      })
    }
  })
  var coun = 0;
  $(document).on('click', '#flxedNav', function () {
    coun++;
    if (coun % 2 == 0) {
      $('.flxedMenu').css({
        visibility: 'hidden',
        opacity: 0
      })
    } else {
      $('.flxedMenu').css({
        visibility: 'visible',
        opacity: 1
      })
    }
  })
})