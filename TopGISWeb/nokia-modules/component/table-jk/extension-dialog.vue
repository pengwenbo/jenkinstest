<template>
  <div class="extension-dialog">
    <el-dialog
      custom-class="extension-dialog-model"
      :visible.sync="showModel"
      :before-close="handleClose"
    >
      <el-tabs v-model="activeTabName" class="extension-dialog-tabs" type="border-card">
        <el-tab-pane name="xjs" v-if="isShowTab('ghjs', 'xjs')" label="建设关注">
          <newly-build-table :title-arr="newlyBuildTableTitles" :data="this.xjsData.data"/>
          <el-pagination
            small
            layout="prev, pager, next"
            :current-page.sync="xjsCurrentPage"
            @current-change="getXjsData"
            :total="this.xjsData.total"
          ></el-pagination>
        </el-tab-pane>
        <el-tab-pane name="xkr" v-if="isShowTab('ghjs', 'xkr')" label="扩容关注">
          <extension-table :title-arr="extensionTableTitles" :data="this.xkrData.data"/>
          <el-pagination
            small
            layout="prev, pager, next"
            :current-page.sync="xkrCurrentPage"
            @current-change="getXkrData"
            :total="this.xkrData.total"
          ></el-pagination>
        </el-tab-pane>
        <el-tab-pane name="xyx" v-if="isShowTab('scyx', 'xyx')" label="营销关注">
          <marketing-table :title-arr="marketingTableTitles" :data="this.xyxData.data"/>
          <el-pagination
            small
            layout="prev, pager, next"
            :current-page.sync="xyxCurrentPage"
            @current-change="getXyxData"
            :total="this.xyxData.total"
          ></el-pagination>
        </el-tab-pane>
        <el-tab-pane name="xzx" v-if="isShowTab('scyx', 'xzx')" label="建设关注">
          <consultation-table :title-arr="consultationTableTitles" :data="this.xzxData.data"/>
          <el-pagination
            small
            layout="prev, pager, next"
            :current-page.sync="xzxCurrentPage"
            @current-change="getXzxData"
            :total="this.xzxData.total"
          ></el-pagination>
        </el-tab-pane>
        <el-tab-pane name="xwh" v-if="isShowTab('wlwh', 'xwh')" label="维护关注">
          <maintain-table :title-arr="maintainTableTitles" :data="this.xwhData.data"/>
          <el-pagination
            small
            layout="prev, pager, next"
            :current-page.sync="xwhCurrentPage"
            @current-change="getXwhData"
            :total="this.xwhData.total"
          ></el-pagination>
        </el-tab-pane>
        <el-tab-pane name="xjc" v-if="isShowTab('wlwh', 'xjc')" label="覆盖待查">
          <find-out-table :title-arr="findOutTableTitles" :data="this.xcmData.data"/>
          <el-pagination
            small
            layout="prev, pager, next"
            :current-page.sync="xcmCurrentPage"
            @current-change="getXcmData"
            :total="this.xcmData.total"
          ></el-pagination>
        </el-tab-pane>
      </el-tabs>
      <el-button type="primary" class="download-file-btn" @click="handleDownloadFile">下载文件</el-button>
      <i class="icon-close" @click="handleClose"></i>
    </el-dialog>
  </div>
</template>

<script>
import Bus from '../utils/bus.js'
import api from '../../interface/jktable.js'
import NewlyBuildTable from './table/planning-construction/newly-build-table.vue'
import ExtensionTable from './table/planning-construction/extension-table.vue'
import MarketingTable from './table/marketing-management/marketing-table.vue'
import ConsultationTable from './table/marketing-management/consultation-table.vue'
import MaintainTable from './table/network-maintenance/maintain-table.vue'
import FindOutTable from './table/network-maintenance/find-out-table.vue'
export default {
  name: 'extension-list-dalog',
  components: {
    NewlyBuildTable,
    ExtensionTable,
    MarketingTable,
    ConsultationTable,
    MaintainTable,
    FindOutTable
  },
  data() {
    return {
      showModel: false,
      activeTabName: 'xkr',
      newlyBuildTableTitles: [
        '市县',
        '小区名称',
        '夜间常驻',
        '日间常驻',
        '潜在异网',
        '潜在本网',
        'ARPU',
        'DOU',
        '诉求用户',
        '建设规模'
      ],
      extensionTableTitles: [
        '市县',
        '小区名称',
        '夜间常驻',
        '日间常驻',
        'ARPU',
        'DOU',
        '总端口',
        '剩余端口',
        '需求用户',
        '扩容规模'
      ],
      marketingTableTitles: [
        '市县',
        '小区名称',
        '夜间常驻',
        '日间常驻',
        '潜在异网',
        '潜在本网',
        'ARPU',
        '诉求用户',
        '总端口',
        '剩余端口'
      ],
      consultationTableTitles: [
        '市县',
        '小区名称',
        '夜间常驻',
        '日间常驻',
        '潜在异网',
        '潜在本网',
        'ARPU',
        'DOU',
        '诉求用户'
      ],
      maintainTableTitles: [
        '市县',
        '小区名称',
        '用户投诉',
        '网络咨询',
        '质差',
        '家宽用户',
        '魔百和用户',
        '使用端口',
        '总端口'
      ],
      findOutTableTitles: [
        '市县',
        '小区名称',
        '未办理成功',
        '剩余端口',
        '总端口',
        '日间常驻',
        '潜在异网',
        '潜在本网',
        'ARPU'
      ],
      xjsData: {},
      xjsCurrentPage: 1,
      xkrData: {},
      xkrCurrentPage: 1,
      xyxData: {},
      xyxCurrentPage: 1,
      xzxData: {},
      xzxCurrentPage: 1,
      xwhData: {},
      xwhCurrentPage: 1,
      xcmData: {},
      xcmCurrentPage: 1,
      showTypeName: '',
      showTypeOne: '',
      rank: ''
    }
  },
  methods: {
    isShowTab(type, one) {
      if (type === this.showTypeName && this.showTypeOne === '') return true
      return this.showTypeOne === one
    },
    handleClose() {
      this.showModel = false
    },
    fetchData(type, rank) {
      this.rank = rank
      switch (type) {
        case 'xjs': {
          this.xjsCurrentPage = 1
          this.getXjsData(1, 10)
          break
        }
        case 'xkr': {
          this.xkrCurrentPage = 1
          this.getXkrData(1, 10)
          break
        }
        case 'xyx': {
          this.xyxCurrentPage = 1
          this.getXyxData(1, 10)
          break
        }
        case 'xzx': {
          this.xzxCurrentPage = 1
          this.getXzxData(1, 10)
          break
        }
        case 'xwh': {
          this.xwhCurrentPage = 1
          this.getXwhData(1, 10)
          break
        }
        case 'xjc': {
          this.xcmCurrentPage = 1
          this.getXcmData(1, 10)
          break
        }
      }
    },
    async getXjsData(index, total = 10) {
      var res = await api.fetchTable('xjs', index, total, this.rank)
      this.xjsData = res.data
    },
    async getXkrData(index, total = 10) {
      var res = await api.fetchTable('xkr', index, total, this.rank)
      this.xkrData = res.data
    },
    async getXyxData(index, total = 10) {
      var res = await api.fetchTable('xyx', index, total, this.rank)
      this.xyxData = res.data
    },
    async getXzxData(index, total = 10) {
      var res = await api.fetchTable('xzx', index, total, this.rank)
      this.xzxData = res.data
    },
    async getXwhData(index, total = 10) {
      var res = await api.fetchTable('xwh', index, total, this.rank)
      this.xwhData = res.data
    },
    async getXcmData(index, total = 10) {
      var res = await api.fetchTable('xjc', index, total, this.rank)
      this.xcmData = res.data
    },
    downloadUtils(data) {
      if (!data) return
      let url = window.URL.createObjectURL(new Blob([data]))
      let link = document.createElement('a')
      link.style.display = 'none'
      link.href = url
      link.setAttribute('download', '导出数据.xls')

      document.body.appendChild(link)
      link.click()
    },
    async handleDownloadFile() {
      let oneName = ''
      let twoName = ''
      var res = {}
      if (this.showTypeName === 'ghjs') {
        oneName = 'xkr'
        twoName = 'xjs'
      } else if (this.showTypeName === 'scyx') {
        oneName = 'xyx'
        twoName = 'xzx'
      } else if (this.showTypeName === 'wlwh') {
        oneName = 'xwh'
        twoName = 'xjc'
      }

      if (this.showTypeOne === '') {
        // 下载文件
        res = await api.downloadFile([oneName, twoName])
      } else {
        res = await api.downloadFile([this.activeTabName])
      }
      this.downloadUtils(res.data)
    }
  },
  mounted() {
    this.getXjsData(1)
    this.getXkrData(1)
    this.getXyxData(1)
    this.getXzxData(1)
    this.getXwhData(1)
    this.getXcmData(1)
  },
  created() {
    Bus.$on('show-extension', (activeName, rank, showTypeName, showTypeOne) => {
      this.showModel = true
      this.activeTabName = activeName
      this.showTypeName = showTypeName
      this.showTypeOne = showTypeOne
      this.fetchData(activeName, rank)
    })
  }
}
</script>

<style lang="less" scoped>
.extension-dialog-tabs {
  border: none;
  background: rgba(0, 0, 0, 0);
}

.icon-close {
  display: inline-block;
  position: absolute;
  width: 60px;
  height: 5vh;
  top: 0;
  right: 0;
  background-size: 60px 5vh;
  z-index: 11;
}

.download-file-btn {
  position: absolute;
  height: 5vh;
  top: 0;
  right: 80px;
  z-index: 11;
}
</style>

<style lang="less">
.extension-table {
  .title-cell {
    background: #1f262f;
    color: #c25d25;
  }

  table {
    border-collapse: separate;
    border-spacing: 2px;
  }

  td {
    width: 6vw;
    height: 3.5vh;
    line-height: 3.5vh;
    text-align: center;
    white-space: nowrap;
  }
}

.extension-dialog {
  .el-dialog {
    background: rgba(0, 0, 0, 0.5);
  }

  .el-dialog__header {
    display: none;
  }

  .el-tabs__header {
    color: #fff;
    background: rgba(0, 0, 0, 0.1);
    border: none;
  }

  .el-tabs__item {
    border: none !important;
    height: 5vh;
    line-height: 5vh;
    background: #000;
  }

  .el-tabs__nav {
    position: relative;

    &:after {
      position: absolute;
      width: 50vw;
      height: 100%;
      content: "";
      background: #000;
    }
  }

  .is-active {
    background: rgba(0, 0, 0, 0.1) !important;
    border: none !important;
    color: #fff !important;
    outline: none !important;
  }

  .el-dialog__body {
    color: #fff;
    padding: 0 !important;
  }

  .el-pagination {
    display: flex !important;
    justify-content: center !important;

    .el-pager {
      .active {
        color: #409eff !important;
      }

      li {
        background: rgba(0, 0, 0, 0.1) !important;
        color: #fff !important;
      }
    }

    .btn-prev {
      color: #fff;
    }

    .btn-next {
      color: #fff;
    }

    button {
      background: rgba(0, 0, 0, 0.1) !important;

      &:disabled {
        color: #90949c;
      }
    }
  }

  .extension-dialog-model {
    width: 60vw;
  }
}
</style>
