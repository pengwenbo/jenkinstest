<template>
  <div class="extension-table">
    <table>
      <tr>
        <td v-for="item in titleArr" :key="item" class="title-cell">{{item}}</td>
      </tr>
      <tr v-for="(item,index) in data" :key="index" @click="handleShowVillage(item)">
        <td>{{ item.CITY_NAME }}</td>
        <td>{{ item.cell_name }}</td>
        <td>{{ item.USER_NUM_CHANGZHU }}</td>
        <td>{{ item.USER_NUM_OFFICE }}</td>
        <td>{{ formatFixed(item.USER_ARPU) }}</td>
        <td>{{ formatFixed(item.USER_DOU) }}</td>
        <td>{{ item.port_total }}</td>
        <td>{{ item.port_NoUse }}</td>
        <td>{{ item.USER_NUM_SUQIU }}</td>
        <td>{{ item.KR_SIZE }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
import Bus from '../../../utils/bus.js'
export default {
  name: 'extension-table',
  props: {
    titleArr: {
      type: Array,
      default: []
    },
    data: {
      type: Array,
      default() {
        return []
      }
    }
  },
  methods: {
    formatFixed(num) {
      return num === null ? 0 : num.toFixed(2)
    },
    handleShowVillage(data) {
      Bus.$emit('show-village', data)
    }
  }
}
</script>
