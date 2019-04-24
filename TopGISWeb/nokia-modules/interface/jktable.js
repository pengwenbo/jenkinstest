import axios from 'axios'
const rootUrl = window.SERVER_ROOT + '/api/jkzy'
const jkwl = `${window.SERVER_ROOT}/api/jkwl`
let request = (api, params, methods = 'get') => {
  return axios[methods](api, methods === 'get' ? { params: params } : params)
          .then(res => {
            if (res.status === 200) {
              return res.data.data
            } else {
              alert('请求数据失败，请稍后再试')
              return false
            }
          })
}

export default {
  GetHouniaoCityW (cityname) {
    return axios.get(`${rootUrl}/GetHouniaoCityW`, {
      params: {
        cityname
      }
    }).then(res => Promise.resolve(res.data))
  },
  GetHouniaoCityWArea (cityname, pageIndex, pageSize, orderKey, orderAsc) {
    return axios.get(`${rootUrl}/GetHouniaoCityWArea`, {
      params: {
        cityname,
        pageIndex,
        pageSize,
        orderKey,
        orderAsc
      }
    }).then(res => Promise.resolve(res.data))
  },
  Get4GnightUser (mapCode, pageIndex) {
    return axios.get(`${window.SERVER_ROOT}/api/jksg/Get4GnightUser`, {
      params: {
        mapCode: mapCode,
        pageIndex: pageIndex,
        pageSize: 20
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  Get4GqianzaiUser (mapCode, pageIndex) {
    return axios.get(`${window.SERVER_ROOT}/api/jksg/Get4GqianzaiUser`, {
      params: {
        mapCode: mapCode,
        pageIndex: pageIndex,
        pageSize: 20
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  Export4GnightUser (mapCode) {
    return axios.get(`${window.SERVER_ROOT}/api/jksg/Export4GnightUser`, {
      params: {
        mapCode: mapCode
      },
      responseType: 'blob'
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  Export4GqianzaiUser (mapCode) {
    return axios.get(`${window.SERVER_ROOT}/api/jksg/Export4GqianzaiUser`, {
      params: {
        mapCode: mapCode
      },
      responseType: 'blob'
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  GetCellByMapCode (mapCode) {
    return axios.get(`${window.SERVER_ROOT}/api/jksg/GetCellByMapCode`, {
      params: {
        mapCode: mapCode
      }
    }).then(res => Promise.resolve(res.data))
  },
  fetchGZDataByName (area, gridname, time, nameType) {
    return axios.get(`${jkwl}/GZDatabyname`, {
      params: {
        area: area,
        gridname: gridname,
        time: time,
        nameType: nameType
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchRightcity (cityname) {
    return axios.get(`${jkwl}/Rightcity`, {
      params: {
        cityname: cityname
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchCityList () {
    return axios.get(`${jkwl}/getcity`).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchQuxianbyGis (area, gridname, time, nametype) {
    return axios.get(`${jkwl}/QuxianbyGis`, {
      params: {
        area: area,
        gridname: gridname,
        time: time,
        nametype: nametype
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchRightUser () {
    return axios.get(`${jkwl}/RightUser`).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchONUEvent (gridname, time, nametype) {
    return axios.get(`${jkwl}/ONUEvent`, {
      params: {
        gridname: gridname,
        time: time,
        nametype: nametype
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchOLTEvent (gridname, time, nametype) {
    return axios.get(`${jkwl}/OLTEvent`, {
      params: {
        gridname: gridname,
        time: time,
        nametype: nametype
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchOLTPONEvent (gridname, time, nametype) {
    return axios.get(`${jkwl}/OLTPONEvent`, {
      params: {
        gridname: gridname,
        time: time,
        nametype: nametype
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchDatabyGis (area, gridname, time, nameType) {
    return axios.get(`${jkwl}/DatabyGis`, {
      params: {
        area: area,
        gridname: gridname,
        time: time,
        nameType: nameType
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  fetchRightList (cityname) {
    return axios.get(`${jkwl}/RightList`, {
      params: {
        cityname: cityname
      }
    }).then((res) => {
      return Promise.resolve(res.data)
    })
  },
  // 顶部表格
  firstTable () {
    let url = rootUrl + '/JkzyFirstTable'
    return request(url)
  },
  getCityName (userCode) {
    return axios.get(`${rootUrl}/GetCityName`, {
      params: {
        userCode: userCode
      }
    }).then(res => Promise.resolve(res.data))
  },
  fetchTable (type, index, total, level = '') {
    let url = rootUrl + '/GetAllLonLatByType?cellname=&sort1=' + type + '&level=' + level + '&rownum=' + index + '&count=' + total
    return axios.get(url)
  },
  serarchData (name) {
    let url = rootUrl + '/GetAllLonLatByname?cellname=' + name
    return axios.get(url)
  },
  ExporthouniaoGrid () {
    let where = window.cityName === '省公司' ? '' : `?city=${window.cityName}`
    return axios.get(rootUrl + '/ExporthouniaoGrid' + where, {
      responseType: 'blob'
    })
  },
  downloadFile (filename) {
    let where = window.cityName === '省公司' ? '' : `&CITY_NAME=${window.cityName}`
    let downloadName = filename.join(',')
    return axios.get(rootUrl + '/ExportAllLonLatByType?sort1=' + downloadName + where, {
      responseType: 'blob'
    })
  },
  downloadBirdFile () {
    let where = window.cityName === '省公司' ? '' : `CITY_NAME=${window.cityName}`
    return axios.get(rootUrl + '/Exporthouniao?' + where, {
      responseType: 'blob'
    })
  },
  downloadGridFile () {
    let where = window.cityName === '省公司' ? '' : `?city=${window.cityName}`
    return axios.get(rootUrl + '/ExportAllNocoverbyCity' + where, {
      responseType: 'blob'
    })
  },
  // 其它表格
  otherTable (type, index, total) {
    let url = rootUrl + '/GetAllLonLatByType?cellname=&sort1=' + type + '&level=&rownum=' + index + '&count=' + total
    // let url = rootUrl + '/JkzysecondTable?sort1=' + field + '&sort2=&count=5'
    return request(url)
  },

  // 根据类型和级别获取经纬度们
  getLonLats (type, level) {
    let url = rootUrl + '/GetLonLatByTypeAndLevel?type=' + type + '&level=' + level
    return request(url)
  },

  // 框选地图
  boxSelected (wkt) {
    let url = rootUrl + '/BobSelected?wkt=' + wkt
    return request(url)
  }
}
