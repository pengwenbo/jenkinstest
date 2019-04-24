import "./index.css"
import $ from 'jquery'
import {
  EventManager
} from "../../gisinterface/index.js"
let tree = {}
tree.obj = [{
    funName: '测试1',
    funJson: '',
    childrenList: [{
        funName: '测试11',
        funJson: 'hhe'
      },
      {
        funName: '测试12',
        funJson: 'hhe12',
        childrenList: [{
            funName: '测试111',
            funJson: 'hhe111'
          },
          {
            funName: '测试112',
            funJson: 'hhe112'
          },
        ]
      },
    ]
  },
  {
    funName: '测试2',
    childrenList: [{
        funName: '测试22',
        funJson: 'hhe111'
      },
      {
        funName: '测试22',
        funJson: 'hhe112'
      }
    ]
  },
  {
    funName: '测试3',
    funJson: ''
  }
] //目录数据

tree.colors = ["#50b5e0", "#507cdf", "#5d50df", "#9650df", "#cf50df", "#e050b5", "#e0507c", "#e05d50"]
tree.icon = ["fa-rocket", "fa-paper-plane", "fa-folder-open", ]
tree.myinit = function () {
  this.cj = -1 //循环到的目录级别
  this.left = 20 //首级目录左偏移
  this.font = 14 //首级目录字号
  this.first = true //默认显示的菜单（fulljson）
  this.ddom = $("<div class='tree-box'></div>") //整个tree
}
//生成tree //树形菜单
tree.product = function (obj = tree.obj, id, hide, animate) {
  this.myinit()
  this.ddom.append(this.each(obj))
  if (id) {
    this.ddom.attr("id", id)
  }
  if (hide) {
    this.ddom.hide()
  }
  if (animate) {
    this.ddom.addClass(`animated  ${animate}`)
  }
  return this.ddom
}
//目录点击
tree.hander = function (event) {
  var $target = $(event.target).parent(), //a标签(选择框和标题)
    isfather = $target.data("father"),
    fulljson = $target.data("fulljson"),
    nextdom = null,
    idom = null,
    domhrs = $("<hr class='hr-s'>"),
    $li = $target.parent(); //获取li
  //判断是否是父菜单
  if (isfather) {
    idom = $target.children("i")
    if (idom.hasClass("fa-plus-square-o")) {
      idom.removeClass("fa-plus-square-o").addClass("fa-minus-square-o")
    } else {
      idom.removeClass("fa-minus-square-o").addClass("fa-plus-square-o")
    }
    nextdom = $target.next();
    if ($li.hasClass('child-li') && $li.next().length > 0 && nextdom.children("hr").length < 1) {
      nextdom.prepend(domhrs.css({
        "height": "100%",
        "left": "-18px"
      }))
    }
    nextdom.slideToggle(function () {
      nextdom.css("overflow", '')
    })
  } else if (fulljson) {
    $target.parents(".tree-box").find(".active").removeClass("active")
    $target.addClass("active")
    //调用GIS并传参 
    // GIS(fulljson)
  }
}
//子菜单checkbox选中事件

tree.checkhander = function (event) {
  var $target = $(event.target),
    isselect = false,
    $a = $target.parent().parent(),
    fulljson = $a.data("fulljson"),
    tooljson = $a.data("tool"),
    color;
  if ($target.is(":checked")) {
    isselect = true
    color = $target.parents(".tre-first-father").data("color")
    $target.next().addClass("icheckd").css("background", color).removeClass("i-border")
  } else {
    $target.next().removeClass("icheckd").css("background", "#efefef").addClass("i-border")
  }
  let gisjson = JSON.parse(fulljson)
  if (tooljson) {
    let gogisjson = Array.of()
    for (let item of tooljson[0].childrenList) {
      gogisjson.push(JSON.parse(item.funJson))
    }
    gisjson.layerTools = gogisjson
  }
  EventManager.publish(EventManager.LAYER_CHECK, gisjson, isselect)
}
//根据数据生成目录
tree.each = function (obj) {
  var myfont = this.font - (2 * this.cj),
    myleft = this.left + (10 * this.cj),
    treeList = $("<ul class='tree-list'></ul>"),
    time = 0;
  if (this.cj === -1) {
    treeList.css("display", "block")
  }
  /*   else if (this.first) {
      treeList.css("display", "block")
      this.first = false
    } */
  this.cj += 1
  for (let item of obj) {
    var domli = $("<li></li>"),
      domi = $("<i class='fa  fa-plus-square-o'></i>"),
      domck = $("<input type='checkbox'>"),
      domlb = $(`<label class="checkbox">
       </label>`),
      doma = $("<a></a>"),
      domhrh = $("<hr class='hr-h'>"),
      domhrs = $("<hr class='hr-s'>");
    time += 1
    /*  if (item.funName === "工具栏") {
       continue
     } */
    doma.text(item.funName).css({
      "font-size": myfont + 'px',
      //"padding-left": myleft + 'px'
    })
    //一级菜单的颜色..左边框
    if (this.cj === 0) {
      domli.css("border-left", `7px solid ${tree.colors[time-1]}`).addClass("tre-first-father").data("color", tree.colors[time - 1])
    } else {
      domli.addClass("child-li").append(domhrs).append(domhrh)
    }
    if (item.funJson) {
      //子菜单加入选择框，选择事件
      domck.on("change", this.checkhander)
      domlb.append(domck).append($("<i class='i-border'></i>"))
      doma.data("fulljson", item.funJson).prepend(domlb)
      if (time === 1 && this.first) {
        //默认菜单触发
        //domck.attr("checked", "checked")
        //doma.addClass("active")
        this.first = false
      }
    }
    //是否有子元素
    if (item.childrenList && item.childrenList.length > 0) {
      if (time === 1 && this.cj === 0) { //显示第一个子级，箭头修改
        domi.removeClass("fa-plus-square-o").addClass("fa-minus-square-o")
      }
      //只有父级有点击事件
      if (item.childrenList.length === 1 && item.childrenList[0].funName === "工具栏") {
        doma.data("tool", item.childrenList)
      } else {
        domi.on("click", this.hander)
        doma.prepend(domi).data("father", 1).addClass('father')
      }
    }
    domli.append(doma);
    if (item.childrenList && item.childrenList.length > 0) {
      //递归 //总是显示第一个子菜单
      if (item.childrenList.length === 1 && item.childrenList[0].funName === "工具栏") {} else {
        domli.append(time === 1 && this.cj === 0 ? tree.each(item.childrenList).css("display", "block") : this.each(item.childrenList))
      }
    }
    treeList.append(domli)
    if (this.cj === 1) {
      //treeList.prepend(domhrs.css("height", "100%"))
    }
  }
  if (this.cj > 1) {
    treeList.css('margin-left', '18px')
  }
  this.cj -= 1
  return treeList
}

//上方三个横菜单 //和下方二级菜单目前耦合在一起。 后续有新需求，重新定义新方法(内聚)
tree.teach = function (obj, jqchoose) {
  var treeList = $("<ul class='tree-title'></ul>")
  for (let [index, item] of obj.entries()) {
    var domli = $("<li></li>"),
      domi = $("<i class='fa'></i>").addClass(tree.icon[index]),
      doma = $("<a></a>");
    doma.text(item.funName).data("id", index) //data为了点击时候确定是哪个树形菜单
    doma.prepend(domi)
    if (index === 0) {
      doma.addClass("active")
    }
    doma.on("click", this.titlehander)
    domli.append(doma)
    treeList.append(domli)
    //有二级菜单直接调用树形菜单
    if (item.childrenList && item.childrenList.length > 0) {
      $(jqchoose).append(tree.product(item.childrenList, "tree-list-" + index, index === 0 ? false : true, "bounceInLeft")) //第一个树形菜单显示，其他隐藏
    }
  }
  return treeList
}
//横向tab菜单(t开头)
tree.tproduct = function (obj = tree.obj, jqchoose) {
  return this.teach(obj, jqchoose)
}
tree.titlehander = function (event) {
  var $target = $(event.target);
  $target.parent().siblings().find(".active").removeClass("active")
  $target.addClass("active")
  $target.parents(".treetabtitle").siblings().find(".tree-box").hide()
  $("#tree-list-" + $target.data("id")).show()
}
export {
  tree
}