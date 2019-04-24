/**
 * Created by huangfei on 2019/3/26.
 */


/**
 * 定义事件参数
 * 
 */

let EventManager = {};
/**
 * 左侧图层check box被点击触发的事件 
 * 参数说明: 
 *     param1：layerConfig  funjson生成的object ,
 *     param2：isChecked    checkbox是选中还是取消选中 true还是false
 */
EventManager.LAYER_CHECK = "layer_checked";
/**
 * 左侧搜索列表点击跳转到经纬度
 * 参数说明: 
 *     param1：lon   地址经度
 *     param2：lat   地址纬度
 */
EventManager.CENTER_AT = "map_centerAt";




/**
 * 触发事件
 * 参数说明:  
 *     params1:eventName    事件名称  对应上面的固定变量
 *     params2:...args      事件参数，参数个数等请参考上面的每类事件的参数说明
 */
EventManager.publish = function (eventName, ...args) {
  window.topic.publish(eventName, ...args);
}

/**
 * 添加事件监听
 * 参数说明:    
 *     params1:eventName     事件名称  对应上面的固定变量
 *     params2:handlefunction  事件触发回调函数
 */
EventManager.subscribe = function (eventName, handlefunction) {
  window.topic.subscribe(eventName, handlefunction);
}



export {
  EventManager
}