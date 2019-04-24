import {
  tree
} from "./component/treemenu/index.js"
import {
  search
} from "./component/searchbox/index.js"
import {
  get_tree_menu
} from "./interface/index"


window.onload = async function () {
  let tcbox = $(".popUp");
  tcbox.find(".fa-close").on("click", function () {
    tcbox.hide()
  })
  $(".mainbody").prepend(search.product())
  let treedata = await get_tree_menu(window.usercode)
  if (treedata) {
    $(".childTabBox").css({
      "padding": "0"
    })
    $(".treetabtitle").append(tree.tproduct(treedata.data.funList, ".childTabBox"))
  }
}
window.SERVER_ROOT = '/dp_common_webapi'
window.test_menutool = async function (name, data) {
  let moud = await import( /* webpackChunkName: "[request]"*/ './component/table-jk/' + name + ".js")
  console.log(moud.test.getdom(data))
  return moud.test.getdom(data)
}
window.test_menutool('index', "albert").then(function (result) {
  document.getElementById("table-test").appendChild(result)
})