<template>
  <div class="extension-table">
    <table>
      <tr>
        <td v-for="item in titleArr" :key="item" class="title-cell">{{item}}</td>
      </tr>
      <tr v-for="(item,index) in data" :key="index" @click="handleShowVillage(item)">
        <td>{{ item.CITY_NAME }}</td>
        <td>{{ item.cell_name }}</td>
        <td>{{ item.Complaint_Users }}</td>
        <td>{{ item.ZX_USER_NUM }}</td>
        <td>{{ item.FAIL_Users }}</td>
        <td>{{ item.jk_userSum }}</td>
        <td>{{ item.TV_userSum }}</td>
        <td>{{ item.port_use }}</td>
        <td>{{ item.port_total }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
import Bus from '../../../utils/bus.js'
export default {
  name: 'maintain-table',
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
    handleShowVillage(data) {
      Bus.$emit('show-village', data)
    }
  }
}
</script>
