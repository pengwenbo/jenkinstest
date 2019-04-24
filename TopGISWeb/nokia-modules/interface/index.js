import axios from "axios"
let ip = "/Nokia_TopGis_Api",
  test_ip = "/TEST_API",
  POI_ip = "";
async function get_tree_menu(userid) {
  let info = await axios.get(ip + "/api/authority/getGisAuthority", {
    params: {
      userCode: userid
    }
  })
  if (info.status !== 200 || info.statusText !== 'OK') {
    return null
    //throw new Error('出错了')
  }
  return info.data
}

async function get_tree_menu_test(userid) {
  let info = await axios.get(test_ip + "/api/UserMenu/GetUserMenu", {
    params: {
      userid: userid
    }
  })

  if (info.status !== 200 || info.statusText !== 'OK') {
    return null
    //throw new Error('出错了')
  }
  return info.data
}

async function get_search_result(keyword, rows, cellId) {
  let info = await axios.get(POI_ip + "/gissearch/search", {
    params: {
      keyword: keyword,
      rows: rows,
      cellId: cellId
    }
  })

  if (info.status !== 200 || info.statusText !== 'OK') {
    return null
    //throw new Error('出错了')
  }
  return info.data
}
export {
  get_tree_menu,
  get_search_result,
  get_tree_menu_test
}
//return topjsinterface = interface