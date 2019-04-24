define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/topic',
  'dojo/on',
  'dojo/string',
  'esri/arcgis/LayerUtil',
],
function (declare, lang, array, topic, on, string, LayerUtil) {
    var instance = null,
        clazz = declare(null, {

            constructor: function (/*Object*/ options) {


            },
            processTools: function (toolDijits) {

                console.log("动态工具处理类，正在处理...");
                /**
                   遍历所有动态图层工具，获取图层工具的结果字符串，将字符串进行拼接，
                   除了时间的拼接为直接拼接外，其他字符串的拼接都采用"_"进行拼接。
                   读取所有结果时，判断workspaceID是否一致，如果不一致则只计算与当前用户操作的工具workspaceID一致的工具结果
                   参数列表：
                   workspaceId    数据库workspaceId
                   groupid        分组id(可选，如果没有这个参数，则默认为所有没有该参数的工具)
                   orderid        顺序(可选，如果没有这个参数或者只有一个动态工具时，都是直接只处理当前操作的工具返回结果即可)
                */
                var tableName = "";
                var workspaceId = toolDijits[0].options.workspaceId;
              
                tableName = this.processToolsOut(toolDijits, workspaceId);
                
                return tableName;

            },
            processToolsOut: function (toolDijits, workspaceId) {
                var tableName = "";
                if (workspaceId == undefined || workspaceId == null || workspaceId.replace(/(^\s*)|(\s*$)/g, '') == "") {
                    console.error("workspaceId是必须的参数，不能缺失，请检查工具栏配置.");
                    return;
                }

               
                    //var cloneToolDijits = dojo.clone(toolDijits);
                    var cloneToolDijits = toolDijits.filter(function (element, index, self) {

                        if (element.options.workspaceId == workspaceId) {
                            return true;
                        }
                        return false;
                    });
                    cloneToolDijits = cloneToolDijits.sort(function (a, b) {

                        var agroupid = -1;
                        var bgroupid = -1;
                        if (a.options.orderid != undefined) {
                            agroupid = a.options.orderid;
                        }

                        if (b.options.orderid != undefined) {
                            bgroupid = b.options.orderid;
                        }

                        return agroupid - bgroupid;


                    });

                    for (var i = 0; i < cloneToolDijits.length; i++) {
                        layerTool = cloneToolDijits[i];
                        if (layerTool.options.type != "DateChooserTool") {
                            tableName = (tableName == "" ? layerTool.getResult() : tableName + "_" + layerTool.getResult());
                        } else {
                            tableName = (tableName == "" ? layerTool.getResult() : tableName + layerTool.getResult());
                        }

                    }
                    //LayerUtil.changeLayerDynamicData(layer, tableName, workspaceId);

                return tableName;



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
