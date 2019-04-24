import "./index.css"
import $ from 'jquery'
import {
  get_search_result
} from "../../interface/index.js"
import {
  EventManager
} from "../../gisinterface/index.js"

let search = {}
search.data = {
  moreradios: [
    "POI", "小区", "基站", "资源", "栅格"
  ],
  chooseradios: null
}
search.myinit = function () {}
search.product = function () {
  let $wrapbox = $(`<div class="nokia-ml-searchbar"></div>`)
  $wrapbox.append(search.sbox()).append(search.smorebox().hide())
  return $wrapbox
}
//搜索box
search.sbox = function () {
  var sbox = $("<div class='nokia-ml-search-box'></div>"),
    stitle = $("<ul class='mnul'></ul>"),
    sopentc = $(`<i class="fa fa-navicon btni"></i>`),
    sbtnsc = $(`<li>
                <i class="fa fa-search"></i>
             </li>`),
    sbtnmore = $(`<li>
                    <i class="fa fa-search-plus i3"></i>
                </li>`),
    sinput = $(`<input class="sinput" placeholder="请输入关键字搜索" type="text" />`),
    sli = $(`<li></li>`);
  sinput.on("input", search.debounce(search.soninput, 1000))
  //sinput.on("input", search.soninput)
  sbtnmore.on("click", search.opensmorebox)
  sopentc.on("click", search.opentcmenu)
  sbtnsc.on("click", search.sbtnsc)
  sli.append(sinput)
  stitle.append(sli).append(sbtnsc).append(sbtnmore)
  sbox.append(sopentc)
  sbox.append(stitle)
  return sbox
}
//打开图层菜单
search.opentcmenu = function (event) {
  $(".popUp").show()
}
search.sbtnsc = function (event) {
  let $target = $(event.target),
    sinput = $target.parent().prev().children();
  search.soninput(null, sinput)
}
//打开高级搜索
search.opensmorebox = function (event) {
  $(event.target).parents(".nokia-ml-search-box").hide().next().show()
}
//防抖
search.debounce = function (func, wait) {
  var timeout;
  return function () {
    var context = this;
    var args = arguments;
    clearTimeout(timeout)
    timeout = setTimeout(function () {
      func.apply(context, args)
    }, wait);
  }
}
//输入关键字时模糊搜索
search.soninput = async function (event, target) {
  let $target = target ? target : $(event.target),
    keyword = $target.val()
  let sresult = await get_search_result(keyword, 20, search.data.chooseradios) //POI接口
  if (keyword === $target.val()) {
    if (sresult) {
      let sbox = $(".nokia-ml-search-box")
      if (sbox.find(".list-ul").length > 0) {
        sbox.find(".list-ul").empty()
      } else {
        let btnbox = $(`<div class="result-btn">
                      <i class="fa fa-angle-up "></i>                    
                  </div>`),
          btninput = $(`<input type="button" value="隐藏" />`),
          listul = $(`<ul class="list-ul"></ul>`);
        btninput.on("click", search.slist_sh)
        btnbox.append(btninput)
        sbox.append(listul).append(btnbox)
      }
      let listli_title = $(`<li class="li-search1">
    搜索结果
    <div>
      <span>${sresult.length}</span>
      <span>条相关信息</span>
    </div>`),
        listul = sbox.find(".list-ul");
      listul.append(listli_title)
      for (let item of sresult) {
        let $li = $("<li></li>")
        $li.text(`${item.name}(${item.city})`).data("lon", item.lon).data("lat", item.lat)
        $li.on("click", search.slist_btn)
        listul.append($li)
      }
    }
  }
}
//模糊搜索结果框，每条结果单击
search.slist_btn = function (event) {
  event.stopPropagation()
  var $target = $(event.target),
    $input = $target.parent().prev().find("input"),
    $text = $target.text();
  $input.val($text.substr(0, $text.indexOf("(")))
  EventManager.publish(EventManager.CENTER_AT, $target.data("lon"), $target.data("lat"))
  //GIS
}
//展开或隐藏搜索结果
search.slist_sh = function (event) {
  event.stopPropagation()
  var $target = $(event.target).parent(),
    idom = $target.find("i"),
    itext = $target.find("input");
  if (idom.hasClass("fa-angle-up")) {
    idom.removeClass("fa-angle-up").addClass("fa-angle-down")
    itext.val("展开搜索结果")
  } else {
    idom.removeClass("fa-angle-down").addClass("fa-angle-up")
    itext.val("隐藏")
  }
  $target.prev().slideToggle().css("overflow", "scroll")
}

//高级搜索框
search.smorebox = function () {
  var $box = $(`<div class="nokia-ml-search-box-more"></div>`),
    $mul = $("<ul></ul>"),
    $lititle = $(`<li class="li-title">
    高级搜索</li>`),
    $close = $(`<i class="fa fa-close"></i>`),
    $li = $("<li></li>");
  $close.on("click", search.smoreboxclose)
  for (let [index, item] of search.data.moreradios.entries()) {
    let $radios = $(`<input type="radio" value="${index+1}" name="searchmore">`);
    let $label = $(`<label></label>`);
    $radios.on("change", this.radiohander)
    $label.text(item).prepend($radios)
    $li.append($label)
  }
  $lititle.append($close)
  $mul.append($lititle).append($li)
  $box.append($mul)
  return $box
}
//单选框事件
search.radiohander = function (event) {
  // search.data.chooseradios = $(event.target).parent().text()
  let radio = $(event.target)
  search.data.chooseradios = radio.val()
  let sinput = radio.parents(".nokia-ml-search-box-more").prev().find(".sinput")
  if (sinput.val() !== "") {
    search.soninput(null, sinput)
  }
}

search.smoreboxclose = function (event) {
  $(event.target).parents(".nokia-ml-search-box-more").hide().prev().show();
}
export {
  search
}