define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/topic',
  'dojo/on',
  'dojo/string',
],
function (declare, lang, array, topic, on, string) {
    var instance = null,
        clazz = declare(null, {


            constructor: function (/*Object*/ options) {


            },
            processTools: function (toolDijits, currentToolDijit) {
                console.log("动态图层数据过滤工具处理类，正在处理...");
                /**
                  遍历所有数据过滤工具，获取图层工具的结果字符串，将查询结果 进行拼接。
                  参数列表：
                  groupid        分组id(可选，如果没有这个参数，则默认为所有没有该参数的工具)
                  orderid        顺序(可选，)

                  组之内参数用 and 连接，组之间参数用or连接
               */
                var querySql = "";
               
                    var cloneToolDijits = toolDijits.sort(function (a, b) {
                        var agroupid = -1;
                        var bgroupid = -1;
                        if (a.options.groupid != undefined) {
                            agroupid = a.options.groupid;
                        }
                        if (b.options.groupid != undefined) {
                            bgroupid = b.options.groupid;
                        }
                        if (a.options.groupid != b.options.groupid) {

                            return agroupid - bgroupid;

                        } else {

                            if (a.options.orderid != undefined ) {
                                agroupid = a.options.orderid;
                            }

                            if (b.options.orderid != undefined) {
                                bgroupid = b.options.orderid;
                            }

                            return agroupid - bgroupid;

                        }
                        
                        return 0;

                    });

                    var lastGroupId = -1;
                    if (cloneToolDijits.length == 1) {
                        querySql = cloneToolDijits[0].getResult();
                    } else {
                        for (var i = 0; i < cloneToolDijits.length; i++) {
                            layerTool = cloneToolDijits[i];
                            var currentGroupId = layerTool.options.groupid;
                            if (i == 0) {

                                querySql += "( " + layerTool.getResult();

                            } else if (i != (cloneToolDijits.length - 1) && currentGroupId != lastGroupId) {

                                querySql += " ) or ( " + layerTool.getResult();

                            } else if (i == (cloneToolDijits.length - 1) && currentGroupId != lastGroupId) {

                                querySql += " ) or ( " + layerTool.getResult() + " )";

                            } else if (i == (cloneToolDijits.length - 1) && currentGroupId == lastGroupId) {

                                querySql += " ) and ( " + layerTool.getResult() + " )";

                            } else {
                                querySql += ") and (" + layerTool.getResult();
                            }

                            lastGroupId = currentGroupId;

                        }
                    }

                   
                console.log(querySql);
                return querySql;


            }




        });
    clazz.getInstance = function (options) {
        if (instance === null) {
            instance = new clazz(options);
        }
        return instance;
    };

    return clazz;


});
