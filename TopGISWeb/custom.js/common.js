/**
 * Created by gs on 2017/7/10.
 * 封装一些可以使用到的常用方法
 */

define([
    "dojo/Deferred",
    "dojo/_base/lang",
    "jimu/MapManager",
    'jimu/ConfigManager',
    "esri/tasks/query",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/Color",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    'jimu/dijit/Message'
],

function(Deferred,lang,MapManager,ConfigManager,Query,SimpleMarkerSymbol,SimpleLineSymbol,SimpleFillSymbol,PictureMarkerSymbol,Color,TextSymbol,Font,
         Message
) {
    /* global method*/
    var mo = {};

    mo.getSymbol = function(geometryType,type){
        var symbol = null;
        switch (geometryType) {
            case "point":
            case "multipoint":
                symbol = mo.getPointSymbol();
                break;
            case "polyline":
                symbol = mo.getLineSymbol(type);
                break;
            default:
                symbol = mo.getFillSymbol(type);
                break;
        }
        return symbol;
    };
    mo.getPointSymbol = function(){
        return new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,12,
            new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_NULL,
                new Color([247, 34, 101, 0.9]),
                1),
            new Color([207, 34, 171, 0.5])
        );
    };
    mo.getLineSymbol = function(type){
        //0.4  0.8
        var symbol = null;
        if(type == 1){
            symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,111,43,0.4]), 3);
        }
        else{
            symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,111,43,0.8]), 3);
        }
        return symbol;
    };
    mo.getFillSymbol = function(type){
        //查询绘制区域样式
        if(type == 1){
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([70,60,251]), 2), //15,239,239
                new Color([121,172,215,0.5]));
        }
        //测量样式
        else if(type == 2){
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([255,83,83]), 2), //15,239,239
                new Color([250,123,62,0.2]));
        }
        //选中高亮要素
        else if(type == 3){
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([15,239,239]), 2), //15,239,239
                new Color([255,255,0,0.5]));
        }
        //连线单向邻区样式
        else if (type == 4) {
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 92, 230]), 1), //15,239,239
                new Color([0, 92, 230, 0.8]));
        }
        //连线源小区
        else if (type == 5) {
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([139, 26, 26]), 2), //15,239,239
                new Color([139, 26, 26,1]));
        }
        //连线单向邻区样式
        else if (type == 6) {
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                    new Color([0, 92, 230]), 1), //15,239,239
                new Color([0, 92, 230, 0.8]));
        }
        //连线双向邻区样式
        else if (type == 7) {
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 92, 230]), 1), //15,239,239
                new Color([173, 255, 47, 0.8]));
        }
        //连线双向邻区样式
        else if (type == 8) {
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                    new Color([0, 92, 230]), 1), //15,239,239
                new Color([173, 255, 47, 0.8]));
        }
            //模仿自带选择高亮样式
        else if (type == 9) {
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 255, 255]), 3), //15,239,239
                new Color([255, 255, 255, 0]));
        }
        //高亮要素
        else{
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([255,0,0]), 2), //15,239,239
                new Color([46,170,230,.4]));//.5
        }
        return symbol;
    };

    //获取查询 对象 query
    mo.getQuery = function(/*查询条件，默认1=1**//*geometry*/){
        //"1=1",null,"lin_zhong",false,true
        var strWhere = arguments[0]?arguments[0]:"1=1";
        var geo = arguments[1]?arguments[1]:null;
        var outField = arguments[2]?arguments[2]:"*";
        var returnGeo = arguments[3] == false ? arguments[3]:true;
        var returnDistinct = arguments[4] ? arguments[4] : false;

        var query = new Query();
        query.where = strWhere;
        if(mo.map.spatialReference) {
            query.outSpatialReference = {
                "wkid" : mo.map.spatialReference.wkid
            };
        }
        query.returnGeometry = returnGeo;
        query.returnDistinctValues = returnDistinct;
        query.outFields = [outField];
        if (geo != null)
            query.geometry = geo;
        return query;
    };

    //获取点线面中心点
    mo.getCenterPoint = function (geo, mapSpatialReference) {
        var centerPoint = null;
        var geoExtent = null;
        switch(geo.type){
            case "point":
                centerPoint = geo;
                break;
            case "polyline":
                centerPoint = geo.getPoint(0, Math.floor(geo.paths[0].length / 2));
                break;
            case "polygon":

                geoExtent = geo.getExtent();
                //geoExtent = geoExtent.offset(1000,-200)
                geoExtent.spatialReference = mapSpatialReference;
                centerPoint = geoExtent.getCenter();
                break;
        }
        centerPoint.spatialReference = mapSpatialReference;
        return centerPoint;
    };

    // 返回数组中fieldName值 与value值 相同的索引
    mo.searchArrayByFieldName = function(arr/*搜索数组*/,fieldName/*字段名称*/,value/* 对比值*/){
        var obj = null;
        for(var i=0;i<arr.length;i++) {
            if(arr[i]){
                if(fieldName == ""){
                    if(arr[i] == value) {
                        obj = arr[i];
                        break;
                        //i = arr.length;
                    }
                }
                else{
                    if(arr[i][fieldName].toString().indexOf(value) > -1) {
                        obj = arr[i];
                        break;
                    }
                }
            }
        }
        return obj;
    };
    mo.arrayRemoveById = function(arr/*数组*/,fieldName,value){
        for(var i=0;i<arr.length;i++) {
            if(arr[i][fieldName] == value) {
                arr.splice(i,1);
                break;
            }
        }
        return arr;
    };

    /* 异步延迟加载方法，返回回调函数 */
    mo.asyncLoadMethod = function(/* string  请求地址*/gUrl,/*请求参数json对象*/content){
        var handleType = arguments[2] ? arguments[2] : "json";
        var deferred = new Deferred();
        var xhrArgs = {
            url: gUrl,
            handleAs: handleType,
            headers: { "Content-Type": "application/json" },
            postData : dojo.toJson(content),
            load: function(_obj){
                //deferred.resolve(_obj);
                deferred.resolve({type:"result",info:_obj});
            },//成功后回调函数
            error: function(error){
                //deferred.resolve("error");
                deferred.resolve({type:"error",info:error});
            }//出错时回调函数
        };
        var def = dojo.xhrPost(xhrArgs);//dojo.xhrGet  xhrPost
        return deferred.promise;//调用延迟的方法（即结果可用的时候调用的方法）
    };
    mo.popupMessage = function(message,title) {
        var popup = new Message({
            titleLabel: title || "",
            message: message,
            buttons: [{
                label: "OK",
                onClick: lang.hitch(this, function() {
                    popup.close();
                })
            }]
        });
    };


    /*控制文本框只能输入数字*/
    mo.CheckInputNumber = function(event){
        //.为46,110  0-9:48-57
        //小数点　
        var numStr = "0123456789.";
        if(event.keyCode == 46 || event.keyCode == 110){
            if(event.srcElement.value.split(".").length >2){
                var send = event.srcElement.selectionEnd;
                event.srcElement.value = event.srcElement.value.substr(0,send-1) + event.srcElement.value.substr(send,event.srcElement.value.length);
            }
        }
        else{
            if(!((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105))){
                var a = event.srcElement.value.substring(event.srcElement.value.length-1,event.srcElement.value.length);
                if(numStr.indexOf(a) == -1){
                    event.srcElement.value = event.srcElement.value.substring(0,event.srcElement.value.length-1);
                }
            }
        }
    };
    /*判断 {} object 对象 是否为空*/
    mo.isEmptyObject = function( obj ) {
        var name;
        for ( name in obj ) {
            return false;
        }
        return true;
    };

    /**从字典配置文件中获取属性列表中代码对应的名称*/
    mo.getNameByCode = function(arr,attributes){
        //fieldName fieldCode
        //算法待优化
        var newAttr = lang.clone(attributes);
        for(var key in attributes){
            var _value = attributes[key];

            //判断是否为整数 ->判断长度是否为12
            var _isInt = /^[1-9]+[0-9]*]*$/.test(_value);
            //小数 保留两位
            var isNum = /^-?\d+\.\d+$/.test(_value);
            if(isNum){
                newAttr[key]  =parseFloat( _value).toFixed(4);
            }
            else if(_isInt && _value.toString().length == 13){
                newAttr[key]  = mo.getDateTime(_value);
            }

            for(var i = 0;i<arr.length;i++){
                if(arr[i].fieldCode.indexOf(key) > -1){//arr[i].fieldName.indexOf(key) > -1 ||
                    var attrValue = attributes[key];
                    if(attrValue){
                        if(attrValue.toString().substr(0,1) == 0){
                            attrValue = attrValue.toString().substring(1,attrValue.length);
                        }
                        newAttr[key]  =  arr[i].keyValue[attrValue];
                    }
                    break;
                }
            }
        }
        return newAttr;
    };
    mo.getDateTime = function(_time){
        var date= new Date(_time);
        var month = (date.getMonth()+1)>9 ? (date.getMonth()+1) : ("0" + (date.getMonth()+1));
        var day = date.getDate()>9 ? date.getDate() : ("0"+date.getDate());
        return date.getFullYear()+"-"+month+"-"+day;
    };
    //插入内容到当前光标位置
    mo.addTextAreaByPosition = function(ctrl,addText){
        var CaretPos = 0;	// IE Support
        if (document.selection) {
            ctrl.focus ();
            var Sel = document.selection.createRange ();
            Sel.moveStart ('character', -ctrl.value.length);
            CaretPos = Sel.text.length;
        }
        // Firefox support
        else if (ctrl.selectionStart || ctrl.selectionStart == '0')
            CaretPos = ctrl.selectionStart;
        if(CaretPos == 0){
            CaretPos = ctrl.value.length;
        }
        var s = ctrl.value;
        ctrl.value = s.substring(0, CaretPos)+ " "+ addText.trim() + " " +s.substring(CaretPos);
    };
    //根据url传递过来的sysid　控制图层显示的权限 格式为:  "displayLayerExpression":"2:ydzd_0,ydzd_1;9:ydzd_2;1:ydzd_3",
    mo.isDisplayLayer = function(layerId){
        var flag = false;
        var str = mo.getDisplayLayerConfig(layerId);
        if( str != null ){
            var arrLayerIds = str.split(",");
            for(var j=0;j<arrLayerIds.length;j++){
                //ed_0
                if(layerId.indexOf("_")>-1){
                    if(arrLayerIds[j] == layerId){
                        flag = true;
                        break;
                    }
                }
                //ed
                else{
                    if(arrLayerIds[j].indexOf(layerId)>-1){
                        flag = true;
                        break;
                    }
                }
            }
        }
        return flag;
    };
    mo.getDisplayLayerConfig = function(layerId){
        var params = ConfigManager.getInstance().getConfig().urlParams;
        //params.dqid 需要根据地区划分
        var exp = ConfigManager.getConfig().map.displayLayerExpression;
        var qxlayerIds = "ed,gyl,ldlj,lq";//特殊处理分区县数据
        if(params.hasOwnProperty("sysid")){
            var sysId = params.sysid;
            if(params.hasOwnProperty("dqid") && qxlayerIds.indexOf(layerId.split("_")[0])>-1){
                if(params.dqid != "1")
                    sysId = sysId + "_" + params.dqid;
            }
            var arrExp = exp.split(";");
            for(var i=0;i<arrExp.length;i++){
                var arrLayer = arrExp[i].split(":");
                if(arrLayer.length == 2){
                    if(arrLayer[0] == sysId){
                        return arrLayer[1];
                    }
                }
            }
        }
        return null;
    };
    mo.getDisplayLayerIds = function(layerId){
        var str = mo.getDisplayLayerConfig(layerId);
        var arrIds = [];
        if(str != null){
            var arrLayerIds = str.split(",");
            for(var j=0;j<arrLayerIds.length;j++){
                if(arrLayerIds[j].indexOf(layerId) > -1){
                    if(arrLayerIds[j].split("_").length > 1){
                        arrIds.push(arrLayerIds[j].split("_")[1]);
                    }
                }
            }
        }
        return arrIds;
    };
    //判断是否为数字或字母
    mo.checkNum = function(value){
        var Regx = /^[A-Za-z0-9]*$/;
        if (Regx.test(value)) {
            return true;
        }
        else {
            return false;
        }
    };

    mo.guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

    };
    mo.guid9 = function () {
        return 'xxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

    }
    return mo;
});

