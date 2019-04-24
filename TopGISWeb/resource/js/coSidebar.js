$(function () {
  gisAutoFrame();
  $(window).resize(function () {
    gisAutoFrame()
  })
});
$(function () {
  $(".showSidebar").live("click", function () {
    $(".popUp").animate({
      left: "0px"
    }, 500)
  });
  $(".hideSidebar").live("click", function () {
    $(".popUp").animate({
      left: "-400px"
    }, 500)
  });
  $(".mainList li").eq(0).find(".subList").slideDown();
  $(".mainList li a").live("click", function () {
    if ($(this).next(".subList").is(":visible")) {
      $(this).find("i").removeClass("fa-angle-up").addClass("fa-angle-right");
      $(this).next(".subList").slideUp()
    } else {
      $(this).next(".subList").slideDown();
      $(this).find("i").removeClass("fa-angle-right").addClass("fa-angle-up")
    }
  });
  $('.tabBar ul li').live("click", function () {
    $(this).addClass("on").siblings().removeClass("on");
    $('.childTabBox > div').eq($(this).index()).show().siblings().hide()
  });
  $(".subList li a.riChMenu").live("click", function () {
    $(".coPoptip").slideUp(0);
    $(this).next(".coPoptip").slideDown()
  });
  var obj = $(".subList li a");
  obj.hover(function () {
    $('body').unbind('mousedown')
  }, function () {
    $('body').bind('mousedown', function () {
      $(".coPoptip").slideUp(100)
    })
  });
  $(".coPoptip dd a").live("click", function () {
    $(this).parents(".coPoptip").slideUp(100)
  })
});

function gisAutoFrame() {
  var winW = $(window).width(),
    winH = $(window).height();
  $(".popUp").height(winH);
  $(".popUp .popBody").height(winH - 96);
  $(".mainList").height(winH - 132)
};