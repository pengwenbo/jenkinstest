<template>
  <div class="wrapbox">
    <div class="model-border line-1">
      <div class="model-title">
        <p>小区总体分析结果</p>
      </div>
      <div class="mytable">
        <table class="line-1-table">
          <thead class="header-table">
            <tr>
              <th rowspan="2"></th>
              <th
                colspan="2"
                :class="[view === '1' ? 'current' : '']"
                @click="handleShowDialog('xjs', '', 'ghjs', '')"
              >规划建设</th>
              <th
                colspan="2"
                :class="[view === '2' ? 'current' : '']"
                @click="handleShowDialog('xyx', '', 'scyx', '')"
              >市场营销</th>
              <th
                colspan="2"
                :class="view === '3' ? 'current' : ''"
                @click="handleShowDialog('xwh', '', 'wlwh', '')"
              >网络维护</th>
            </tr>
            <tr>
              <th
                width="15%"
                :class="[view === '1' ? 'current' : '']"
                @click="handleEmit('xjs', '', 'ghjs', 'xjs', '需新建小区')"
              >建设关注</th>
              <th
                width="15%"
                :class="[view === '1' ? 'current' : '']"
                @click="handleEmit('xkr', '', 'ghjs', 'xkr', '需扩容小区')"
              >扩容关注</th>
              <th
                width="15%"
                :class="[view === '2' ? 'current' : '']"
                @click="handleEmit('xyx', '', 'scyx', 'xyx', '需营销小区')"
              >营销关注</th>
              <th
                width="15%"
                :class="[view === '2' ? 'current' : '']"
                @click="handleEmit('xzx', '', 'scyx', 'xzx', '需咨询小区')"
              >建设关注</th>
              <th
                width="15%"
                :class="[view === '3' ? 'current' : '']"
                @click="handleEmit('xwh', '', 'wlwh', 'xwh', '需维护小区')"
              >维护关注</th>
              <th
                width="15%"
                :class="[view === '3' ? 'current' : '']"
                @click="handleEmit('xjc', '', 'wlwh', 'xjc', '需维护小区')"
              >覆盖待查</th>
            </tr>
          </thead>
          <tbody v-if="firstTable">
            <tr
              v-for="(level, levelIndex) in levels"
              :key="level"
              :class="'level-' + (levelIndex + 1)"
            >
              <td>{{ level }}</td>
              <td
                class="font-digit"
                v-for="(item, index) in columns"
                :key="index"
                @click="handleClickFirstTable(columns[index], levelIndex + 1)"
              >{{ firstTable | tableValue(index, levelIndex + 1, columnsName, columns) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="line-2">
      <div class="model-border" v-if="view === '1' && xjs">
        <div class="model-title">
          <p>建设关注小区（未覆盖）</p>
        </div>
        <div class="mytable">
          <table class="xjs">
            <thead>
              <tr>
                <th>市县</th>
                <th>小区名称</th>
                <th>夜间常驻</th>
                <th>日间常驻</th>
                <th>潜在异网</th>
                <th>潜在本网</th>
                <th>ARPU</th>
                <th>DOU</th>
                <th>诉求用户</th>
                <th>建设规模</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in xjs" :key="index">
                <td>{{ item.CITY_NAME }}</td>
                <td class="nowrap">
                  <span>{{ item.cell_name }}</span>
                </td>
                <td class="font-digit">{{ item.USER_NUM_CHANGZHU }}</td>
                <td class="font-digit">{{ item.USER_NUM_OFFICE }}</td>
                <td class="font-digit">{{ item.USER_NUM_QIANZAI_WY }}</td>
                <td class="font-digit">{{ item.USER_NUM_QIANZAI }}</td>
                <td class="font-digit" style="color: #167db0">{{ formatFixed(item.USER_ARPU) }}</td>
                <td class="font-digit" style="color: #167db0">{{ formatFixed(item.USER_DOU) }}</td>
                <td class="font-digit">{{ item.USER_NUM_SUQIU }}</td>
                <td class="font-digit">{{ item.XJ_SIZE }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="model-border" v-if="view === '2' && xyx">
        <div class="model-title">
          <p>营销关注（已覆盖）</p>
        </div>
        <div class="mytable">
          <table class="xyx">
            <thead>
              <tr>
                <th>市县</th>
                <th>小区名称</th>
                <th>夜间常驻</th>
                <th>日间常驻</th>
                <th>潜在异网</th>
                <th>潜在本网</th>
                <th>ARPU</th>
                <th>诉求用户</th>
                <th>总端口</th>
                <th>剩余端口</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in xyx" :key="index">
                <td>{{ item.CITY_NAME }}</td>
                <td class="nowrap">
                  <span>{{ item.cell_name }}</span>
                </td>
                <td class="font-digit">{{ item.USER_NUM_CHANGZHU }}</td>
                <td class="font-digit">{{ item.USER_NUM_OFFICE }}</td>
                <td class="font-digit" style="color: #167db0">{{ item.USER_NUM_QIANZAI_WY }}</td>
                <td class="font-digit">{{ item.USER_NUM_QIANZAI }}</td>
                <td class="font-digit" style="color: #167db0">{{ formatFixed(item.USER_ARPU) }}</td>
                <td class="font-digit">{{ item.USER_NUM_SUQIU }}</td>
                <td class="font-digit">{{ item.port_total }}</td>
                <td class="font-digit">{{ item.port_NoUse }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="model-border" v-if="view === '3' && xwh">
        <div class="model-title">
          <p>维护关注小区</p>
        </div>
        <div class="mytable">
          <table class="xwh">
            <thead>
              <tr>
                <th>市县</th>
                <th>小区名称</th>
                <th>用户投诉</th>
                <th>网络咨询</th>
                <th>质差</th>
                <th>家宽用户</th>
                <th>魔百和用户</th>
                <th>使用端口</th>
                <th>总端口</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in xwh" :key="index">
                <td>{{ item.CITY_NAME }}</td>
                <td class="nowrap">
                  <span>{{ item.cell_name }}</span>
                </td>
                <td class="font-digit">{{ item.Complaint_Users }}</td>
                <td class="font-digit">{{ item.ZX_USER_NUM }}</td>
                <td class="font-digit">{{ item.FAIL_Users }}</td>
                <td class="font-digit">{{ item.jk_userSum }}</td>
                <td class="font-digit" style="color: #167db0">{{ item.TV_userSum }}</td>
                <td class="font-digit" style="color: #167db0">{{ item.port_use }}</td>
                <td class="font-digit">{{ item.port_total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="line-3">
      <div class="model-border" v-if="view === '1' && xkr">
        <div class="model-title">
          <p>扩容关注小区（已覆盖）</p>
        </div>
        <div class="mytable">
          <table class="xkr">
            <thead>
              <tr>
                <th>市县</th>
                <th>小区名称</th>
                <th>夜间常驻</th>
                <th>日间常驻</th>
                <th>ARPU</th>
                <th>DOU</th>
                <th>总端口</th>
                <th>剩余端口</th>
                <th>需求用户</th>
                <th>扩容规模</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in xkr" :key="index">
                <td>{{ item.CITY_NAME }}</td>
                <td class="nowrap">
                  <span>{{ item.cell_name }}</span>
                </td>
                <td class="font-digit">{{ item.USER_NUM_CHANGZHU }}</td>
                <td class="font-digit">{{ item.USER_NUM_OFFICE }}</td>
                <td class="font-digit" style="color: #167db0">{{ formatFixed(item.USER_ARPU) }}</td>
                <td class="font-digit" style="color: #167db0">{{ formatFixed(item.USER_DOU) }}</td>
                <td class="font-digit">{{ item.port_total }}</td>
                <td class="font-digit">{{ item.port_NoUse }}</td>
                <td class="font-digit">{{ item.USER_NUM_SUQIU }}</td>
                <td class="font-digit">{{ item.KR_SIZE }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="model-border" v-if="view === '2' && xzx">
        <div class="model-title">
          <p>建设关注（未覆盖）</p>
        </div>
        <div class="mytable">
          <table class="xzx">
            <thead>
              <tr>
                <th>市县</th>
                <th>小区名称</th>
                <th>夜间常驻</th>
                <th>日间常驻</th>
                <th>潜在异网</th>
                <th>潜在本网</th>
                <th>ARPU</th>
                <th>DOU</th>
                <th>诉求用户</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in xzx" :key="index">
                <td>{{ item.CITY_NAME }}</td>
                <td class="nowrap">
                  <span>{{ item.cell_name }}</span>
                </td>
                <td class="font-digit">{{ item.USER_NUM_CHANGZHU }}</td>
                <td class="font-digit">{{ item.USER_NUM_OFFICE }}</td>
                <td class="font-digit">{{ item.USER_NUM_QIANZAI_WY }}</td>
                <td class="font-digit">{{ item.USER_NUM_QIANZAI }}</td>
                <td class="font-digit" style="color: #167db0">{{ formatFixed(item.USER_ARPU) }}</td>
                <td class="font-digit" style="color: #167db0">{{ formatFixed(item.USER_DOU) }}</td>
                <td class="font-digit">{{ item.USER_NUM_SUQIU }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="model-border" v-if="view === '3' && xjc">
        <div class="model-title">
          <p>覆盖情况待查小区</p>
        </div>
        <div class="mytable">
          <table class="xjc">
            <thead>
              <tr>
                <th>市县</th>
                <th>小区名称</th>
                <th>未办理成功</th>
                <th>剩余端口</th>
                <th>总端口</th>
                <th>日间常驻</th>
                <th>潜在异网</th>
                <th>潜在本网</th>
                <th>ARPU</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in xjc" :key="index">
                <td>{{ item.CITY_NAME }}</td>
                <td class="nowrap">
                  <span>{{ item.cell_name }}</span>
                </td>
                <td class="font-digit">{{ item.SQ_WCG }}</td>
                <td class="font-digit">{{ item.port_NoUse }}</td>
                <td class="font-digit">{{ item.port_total }}</td>
                <td class="font-digit">{{ item.USER_NUM_OFFICE }}</td>
                <td class="font-digit" style="color: #167db0">{{ item.USER_NUM_QIANZAI_WY }}</td>
                <td class="font-digit" style="color: #167db0">{{ item.USER_NUM_QIANZAI }}</td>
                <td class="font-digit" style="color: #167db0">{{ formatFixed(item.USER_ARPU) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <extension-dialog/>
  </div>
</template>
<script>
import api from '../../interface/jktable.js'
import Bus from '../utils/bus.js'
import ExtensionDialog from './extension-dialog.vue'
export default {
  data() {
    return {
      firstTable: null,
      columns: ['xjs', 'xkr', 'xyx', 'xzx', 'xwh', 'xjc'],
      columnsName: ['需新建', '需扩容', '需营销', '需咨询', '需维护', '需检查'], // 与columns对应，懒得合并，并非显示的字段，sql字段只供过滤数据
      levels: ['一级', '二级', '三级'],
      map: {
        '1': ['xjs', 'xkr'],
        '2': ['xyx', 'xzx'],
        '3': ['xwh', 'xjc']
      },
      toolbar: {
        tools: [
          { label: '点选择', key: 'POINT' },
          { label: '折线选择', key: 'POLYLINE' },
          { label: '曲线选择', key: 'FREEHAND_POLYLINE' },
          { label: '框选区', key: 'EXTENT' },
          { label: '圈选区', key: 'CIRCLE' },
          { label: '椭圆选区', key: 'ELLIPSE' },
          { label: '多边形选区', key: 'POLYGON' },
          { label: '不规则图形选区', key: 'FREEHAND_POLYGON' },
          { label: '清除', key: 'CLEAR' }
        ]
      },
      xjs: null,
      xkr: null,
      xyx: null,
      xzx: null,
      xwh: null,
      xjc: null
    }
  },
  components: { ExtensionDialog },
  model: {
    prop: 'open',
    event: 'open-change'
  },
  props: {
    view: String,
    open: {
      type: Boolean
    }
  },
  methods: {
    formatFixed(num) {
      return num === null ? 0 : num.toFixed(2)
    },
    handleShowDialog(type, rank, showTypeName, showTypeOne = '') {
      Bus.$emit('show-extension', type, rank, showTypeName, showTypeOne)
    },
    handleEmit(type = 'xjs', rank, showTypeName, showTypeOne = '', msg) {
      this.$emit('callGis', 'showSingleLayer', msg)
      this.handleShowDialog(type, rank, showTypeName, showTypeOne)
    },
    handleMove() {
      this.$emit('open-change', !this.open)
    },
    handleClickFirstTable(type, level) {
      if (type === 'xkr' || type === 'xjs') {
        this.handleShowDialog(type, level, 'ghjs', type)
      } else if (type === 'xyx' || type === 'xzx') {
        this.handleShowDialog(type, level, 'scyx', type)
      } else if (type === 'xwh' || type === 'xjc') {
        this.handleShowDialog(type, level, 'wlwh', type)
      }
      if (this.map[this.view].indexOf(type) === -1) return
      api.getLonLats(type, level)
        .then(res => {
          // 传给地图
          this.$emit('callGis', 'renderByType', { 'data': res, 'type': type })
        })
    },
    handleCommand(command) {
      this.$emit('callGis', 'activateTool', command)
    },
    init() {
      let map = this.map
      let currentTableMap = map[this.view]

      currentTableMap.forEach(item => {
        api.otherTable(item, 1, 5)
          .then(res => {
            this[item] = res
          })
      })
    }
  },
  filters: {
    tableValue(table, index, level, names) {
      let flag = table.find(t => t.XJS === level && t.result_type === names[index])
      return flag === undefined ? 0 : flag['小区数']
    }
  },
  watch: {
    view(n) {
      if (n !== '4') {
        this.init()
      }
    }
  },
  mounted() {
    this.init()
    var that = this
    api.firstTable()
      .then(res => {
        that.firstTable = res
      })
  }

}
</script>
<style scoped src="../comm/index.css"></style>

<style scoped lang="less">
.mytable {
  width: 100%;
  margin-top: 20px;
}
table {
  text-align: center;
}
.line-1-table {
  width: 100%;
  td {
    text-align: center;
    cursor: pointer;
    &:hover {
      opacity: 0.3;
    }
  }
  .current {
    color: #167db0;
    font-weight: bold;
    cursor: pointer;
  }
  th {
    background: #222b35;
    //border: 2px solid #000;
    color: #fff;
    text-align: center;
  }
  .level-1 {
    td {
      color: #167db0;
    }
  }
  .level-2 {
    td {
      color: #167db0;
    }
  }
  .level-3 {
    td {
      color: #167db0;
    }
  }
}
.line-2,
.line-3 {
  width: 100%;
  margin-top: 20px;
  table {
    width: 100%;
  }
  th {
    color: #fa7b27;
    text-align: center;
    background: #222b35;
  }
  td {
    color: #fff;
  }
}
</style>


