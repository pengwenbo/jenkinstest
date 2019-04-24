///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2016 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

var currentToolOptions = "";
define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/topic',
        'jimu/BaseWidget',
        'dijit/_WidgetsInTemplateMixin',
        'dojo/dom-construct',
        'dojo/_base/html',
        'dojo/on',
        'require',
        'dojo/aspect',
        'dojo/string',
        'esri/SpatialReference',
        './CustomFunctionToolManager',
        './DynamicFieldToolManager',
        './DynamicRenderToolManager',
        './DynamicToolManager',
        './HighLightToolManager',
        './QuerySQLToolManager',
        'esri/arcgis/LayerUtil',
        "esri/renderers/jsonUtils",
        "esri/tasks/QueryTask",
        "esri/tasks/query",
        'esri/layers/TableDataSource',
        'esri/layers/LayerDataSource',
        "esri/layers/GraphicsLayer",
        'jimu/dijit/SymbolChooser'
    ],
    function (declare, lang, array, topic, BaseWidget, _WidgetsInTemplateMixin, domConstruct, html, on, require, aspect, string,
              SpatialReference, CustomFunctionToolManager, DynamicFieldToolManager, DynamicRenderToolManager, DynamicToolManager, HighLightToolManager, QuerySQLToolManager, LayerUtil, jsonUtils,
              QueryTask, Query, TableDataSource, LayerDataSource,GraphicsLayer) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            //these two properties is defined in the BaseWidget
            baseClass: 'jimu-widget-layerTools',
            name: 'LayerTools',
            //保存上一个呈现的图层名称
            lastLayerName: "",
            //已经加载过的图层工具栏直接保存下来，下一次直接读取该工具栏，不需要再从新读取配置进行加载，而且可以保存用户改变后的状态
            layerToolsDict: {},
            //当前呈现的图层工具缓存
            currentTools: [],
            //四种类型的组件分别保存至下列的数组中
            dynamicTools: [], //动态图层
            querySQLTools: [], //图层要素过滤
            highLightTools: [], //图层高亮
            dynamicfieldTools: [], //图层渲染指标切换
            dynamicrenderTools: [], //图层渲染样式切换
            highlightLayer: new GraphicsLayer(),
            DEFAULT_POINT_RENDERER: {
                "type": "simple",
                "label": "",
                "description": "",
                "symbol": {
                    "color": [210, 105, 30, 191],
                    "size": 12,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "outline": {
                        "color": [0, 0, 128, 255],
                        "width": 0,
                        "type": "esriSLS",
                        "style": "esriSLSSolid"
                    }
                }

            },
            DEFAULT_POLYGON_RENDERER: {
                "type": "simple",
                "label": "",
                "description": "",
                "symbol": {
                    "type": "esriSFS",
                    "style": "esriSFSSolid",
                    "color": [115, 76, 0, 255],
                    "outline": {
                        "type": "esriSLS",
                        "style": "esriSLSSolid",
                        "color": [110, 110, 110, 255],
                        "width": 1
                    }
                }
            },
            DEFAULT_POLYLINE_RENDERER: {
                "type": "simple",
                "label": "",
                "description": "",
                "symbol": {
                    "type": "esriSLS",
                    "style": "esriSLSSolid",
                    "color": [115, 76, 0, 255],
                    "width": 3
                }
            },
            startup: function () {
                // summary:
                //    this function will be called when widget is started.
                // description:
                //    see dojo's dijit life cycle.
                this.inherited(arguments);
                //topic.subscribe("layer_checked", lang.hitch(this, this.onLayerChecked));

                if (this.lastLayerConfig != undefined && this.lastLayerConfig != null) {
                    var lastLayerConfig = this.lastLayerConfig;
                    this.createTools(lastLayerConfig);
                }
                this.map.addLayer(this.highlightLayer);
                topic.subscribe("tool_status_change", lang.hitch(this, this.toolChangeHandler));
                //mapSendMessageToWindow('statusChange', 'MapLoadFinish');
                console.log("Send Message GO GO GO !");
            },
            toolChangeHandler: function (currentToolDijit) {

                console.log("工具操作类型:" + currentToolDijit.options.optionType);
                //根据工具操作类型进行不同的操作
                var layer = currentToolDijit.options.layer;

                $(".attrBarL").css("height", "auto");
                if ($(".attrBarL").height() > 60 || layer.id == "FNTouSuTslb") {
                    $(".attrBarL a.moreA").fadeIn();
                } else {
                    $(".attrBarL a.moreA").fadeOut(0);
                }
                if($(".moreA i").hasClass("fa-chevron-down")){
                    $(".attrBarL").css("height", "45px");
                }

                var optionType = currentToolDijit.options.optionType;                
                var workspaceId = currentToolDijit.options.workspaceId;
                this.manageTools(layer, workspaceId, optionType, currentToolDijit);


            },
            manageTools: function (layer, workspaceId, optionType, currentToolDijit) {
                var currentToolResult = "";
                switch (optionType) {
                    case "dynamic":
                        if (this.dynamicTools.length > 0) {
                            currentToolResult = DynamicToolManager.getInstance().processTools(this.dynamicTools);
                            if (layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                                LayerUtil.changeLayerDynamicData(layer, currentToolResult, workspaceId,null,true);
                            } else if (layer.ClassName == "clusterLayer") {
                                var dataSource = new TableDataSource();
                                dataSource.workspaceId = workspaceId;
                                dataSource.dataSourceName = currentToolResult;
                                var layerSource = new LayerDataSource();
                                layerSource.dataSource = dataSource;

                                layer.setSource(layerSource);

                                topic.publish("tool_status_init", layer);
                            }
                            
                        }

                        break;
                    case "query":
                        if (this.querySQLTools.length > 0) {
                            var doNotAutoRefresh = false;
                            if (this.dynamicTools.length > 0 && (currentToolDijit == undefined || currentToolDijit == null)) {
                                doNotAutoRefresh = true;
                            }
                            currentToolResult = QuerySQLToolManager.getInstance().processTools(this.querySQLTools);
                            if (layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                                layer.setLayerDefinitions([currentToolResult], doNotAutoRefresh);
                            } else if (layer.declaredClass == "esri.layers.FeatureLayer") {
                                layer.setDefinitionExpression(currentToolResult);
                            } else if (layer.ClassName == "clusterLayer") {
                                layer._where = currentToolResult;
                                layer._visitedExtent = false;
                                layer.updateClusters();
                            }
                        }

                        break;
                    case "highlight":
                        this.highlightLayer.clear();
                        if (this.highLightTools > 0) {
                            currentToolResult = HighLightToolManager.getInstance().processTools(this.highLightTools);
                            var queryUrl = layer.url;
                            if (layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                                if (layer.dynamicLayerInfos != undefined && layer.dynamicLayerInfos.length != 0) {
                                    var dynamicSource = {source: layer.dynamicLayerInfos[0].source.toJson()};
                                    var layerSourceJson = JSON.stringify(dynamicSource);
                                    queryUrl = queryUrl + "/dynamicLayer?layer=" + layerSourceJson;
                                } else {
                                    queryUrl = queryUrl + "/0";
                                }


                            } else if (layer.declaredClass == "esri.layers.FeatureLayer") {
                                if (layer.source != undefined) {
                                    var layerSourceJson = JSON.stringify({source: layer.source});
                                    queryUrl = queryUrl.substring(0, queryUrl.length - 2) + "/dynamicLayer?layer=" + layerSourceJson;
                                }

                            }
                            console.log(queryUrl);
                            var highlightQueryTask = new QueryTask(queryUrl);
                            var highlightQuery = new Query();
                            highlightQuery.geometry = this.map.extent;
                            highlightQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                            highlightQuery.where = currentToolResult;
                            highlightQuery.outFields = ["*"];
                            highlightQuery.returnGeometry = true;
                            highlightQueryTask.execute(highlightQuery).then(lang.hitch(this, function (results) {
                                if (currentToolDijit && (currentToolDijit.options.optionType == "submit" || currentToolDijit.options.optionType == "highlight")) {
                                    //this.highlightLayer.graphics = results.features;
                                    for (var x = 0; x < results.features.length; x++) {
                                        this.highlightLayer.add(results.features[x]);
                                    }
                                    var renderer = {};
                                    if (currentToolDijit.options.highlightrenderer != undefined) {
                                        var renderJson = currentToolDijit.options.highlightrenderer;
                                        renderer = jsonUtils.fromJson(renderJson);
                                    } else {
                                        if (results.geometryType == "esriGeometryPoint") {
                                            renderer = jsonUtils.fromJson(this.DEFAULT_POINT_RENDERER);
                                        }
                                        else if (results.geometryType == "esriGeometryPolygon") {
                                            renderer = jsonUtils.fromJson(this.DEFAULT_POLYGON_RENDERER);
                                        }
                                        else if (results.geometryType == "esriGeometryPolyline") {
                                            renderer = jsonUtils.fromJson(this.DEFAULT_POLYLINE_RENDERER);
                                        }

                                    }
                                    this.highlightLayer.setRenderer(renderer);
                                    this.highlightLayer.redraw();




                                }

                                console.log(results.features);
                            }));
                        }




                        break;
                    case "dynamicfield":
                        //currentToolResult = DynamicFieldToolManager.getInstance().processTools(this.dynamicfieldTools);
                        //动态字段只针对当前操作的字段，submit按钮对此类工具无效。只有工具被触发事件时才有效。
                        DynamicFieldToolManager.getInstance().processTools(currentToolDijit);

                        break;
                    case "custom":
                        //currentToolResult = DynamicFieldToolManager.getInstance().processTools(this.dynamicfieldTools);
                        //动态字段只针对当前操作的字段，submit按钮对此类工具无效。只有工具被触发事件时才有效。
                        CustomFunctionToolManager.getInstance().processTools(this.currentTools, currentToolDijit, this.map, this.lastLayerName);
                        currentToolOptions = this.currentTools;

                        break;
                    case "dynamicrender":
                        currentToolResult = DynamicRenderToolManager.getInstance().processTools(this.dynamicrenderTools);
                        break;
                    case "submit":
                        console.log("submit click");

                        var doOptionTypes = ["dynamic", "query", "highlight"];

                        for (var m = 0; m < doOptionTypes.length; m++) {
                            var optionType = doOptionTypes[m];
                            if (this.dynamicTools.length > 0) {
                                workspaceId = this.dynamicTools[0].options.workspaceId;
                            }
                            this.manageTools(layer, workspaceId, optionType, currentToolDijit);

                        }
                        break;
                }

            },

            onOpen: function () {

            },

            onClose: function () {

            },
            onMinimize: function () {
                this.resize();
            },

            onMaximize: function () {
                this.resize();
            },

            resize: function () {

            },

            destroy: function () {
                this.inherited(arguments);
            },
            onLayerChecked: function (layerConfig, layerVisible) {
                this.highlightLayer.clear();
                //console.log("onLayerChecked::"+layerConfig.label+"===>"+layerVisible);
                this.createTools(layerConfig, layerVisible);

                var layerToolsConfig = layerConfig.layerTools;
            },
            //清除图层分类工具缓存
            clearCacheTools: function () {

                this.dynamicTools = [];
                this.querySQLTools = [];
                this.highLightTools = []; //图层高亮
                this.dynamicfieldTools = []; //图层渲染指标切换
                this.dynamicrenderTools = []; //图层渲染样式切换
            },
            //创建工具
            createTools: function (layerConfig, layerVisible) {
                /**
                 当工具缓存中不存在当前操作图层的缓存，且图层状态为显示时。并且查看前一个操作图层是否已经缓存了，如果没有缓存则将前一个图层的工具栏也进行缓存。
                 当当前操作图层的工具栏已经缓存时，直接读取当前图层的缓存工具进行呈现，并且查看前一个操作图层是否已经缓存了，如果没有缓存则将前一个图层的工具栏也进行缓存。
                 当操作图层未缓存工具栏，且图层状态为隐藏时，添加此图层的缓存。且如果当前隐藏图层为最后 的操作显示图层时，将工具栏组件进行清空，否则为隐藏非活动图层，则不清空工具栏
                 */
                if (this.layerToolsDict[layerConfig.label] == undefined && layerConfig.layerTools != undefined && layerConfig.layerTools != null && layerVisible) {
                    console.log("createTools::" + layerConfig.label);

                    if (this.lastLayerName != "" && this.lastLayerName != layerConfig.label && this.layerToolsDict[this.lastLayerName] == undefined) {

                        //缓存前一个操作图层的工具栏信息
                        this.layerToolsDict[this.lastLayerName] = this.currentTools;

                    }
                    //保存前一个操作图层的图层名称
                    this.lastLayerName = layerConfig.label;
                    //清空当前工具栏工具控件集合
                    this.currentTools = [];
                    //读取图层配置文件中的工具栏配置
                    var layerToolsConfig = layerConfig.layerTools;

                    this.clearCacheTools();
                    //清除当前控件之前需要先保存，历史控件
                    domConstruct.empty(this.layerToolsBox);
                    //先判断是否有提交按钮，如果有则将所有组件的hasSubmit属性设置为true
                    var hasSubmit = false;

                    for (var i = 0; i < layerToolsConfig.length; i++) {
                        var layerTool1 = layerToolsConfig[i];
                        if (layerTool1.type == "SubmitButtonTool" && !layerTool1.toChangeState) {
                            hasSubmit = true;
                            break;
                        }
                    }
                    for (var i = 0; i < layerToolsConfig.length; i++) {
                        var layerTool = layerToolsConfig[i];//由于下面的请求APi的方法是异步加载，顾此处会造成layerTool.options只读取了最后一个组件的参数
                        var toolHitchObj = {
                            "layerTool": layerTool,
                            "map": this.map,
                            "visible": layerVisible,
                            "layerConfig": layerConfig,
                            "createTool": this.createTool,
                            "hasSubmit": hasSubmit,
                            "highlightLayer": this.highlightLayer,
                            "manageTools": this.manageTools,
                            "layerToolsBox": this.layerToolsBox,
                            "currentTools": this.currentTools,
                            "totalToolNum": layerToolsConfig.length,
                            "dynamicTools": this.dynamicTools,
                            "querySQLTools": this.querySQLTools,
                            "highLightTools": this.highLightTools,
                            "dynamicfieldTools": this.dynamicfieldTools,
                            "dynamicrenderTools": this.dynamicrenderTools
                        };
                        if (this.map.getLayer(layerConfig.label) != undefined) {

                            toolHitchObj.layer = this.map.getLayer(layerConfig.label);
                           
                            this.createTool(layerTool, toolHitchObj);
                        } else {

                            on.once(this.map, "layer-add-result", lang.hitch(toolHitchObj, function (toollayer) {
                                this.layer = toollayer.layer;
                                this.createTool(this.layerTool, this);
                            }));

                        }


                    }
                        //遍历所有图层工具，生成组件
                    /**
                     array.forEach(layerToolsConfig, lang.hitch(this, function (layerTool) {
                     require(['./tools/' + layerTool.type], lang.hitch(this, function (toolClass) {
                         var layerOpts = layerTool.options;
                         layerOpts.map = this.map;
                         layerOpts.visible = layerVisible;
                         layerOpts.layer = this.map.getLayer(layerConfig.label);
                         layerOpts.toolBox = this.layerToolsBox;
                         var toolDijit = new toolClass(layerOpts);
                         toolDijit.startup();
                         //根据组件的类型进行缓存，保存以备后续使用
                         if (layerOpts.optionType == "dynamic") {
                             this.dynamicTools.push(toolDijit);
                         } else if (layerOpts.optionType == "query") {
                             this.querySQLTools.push(toolDijit);
                         } else if (layerOpts.optionType == "highlight") {
                             this.highLightTools.push(toolDijit);
                         } else if (layerOpts.optionType == "dynamicfield") {
                             this.dynamicfieldTools.push(toolDijit);
                         } else if (layerOpts.optionType == "dynamicrender") {
                             this.dynamicrenderTools.push(toolDijit);
                         }

                     }));

                 })); **/

                    //var lastToolDivs = dojo.query("div", this.layerToolsBox);




                } else if (this.layerToolsDict[layerConfig.label] != undefined && layerVisible) {

                    if (this.lastLayerName != layerConfig.label && this.layerToolsDict[this.lastLayerName] == undefined) {

                        //缓存前一个操作图层的工具栏信息
                        this.layerToolsDict[this.lastLayerName] = this.currentTools;

                    }

                    this.lastLayerName = layerConfig.label;
                    //清空工具栏
                    domConstruct.empty(this.layerToolsBox);

                    this.clearCacheTools();

                    //读取缓存的工具栏控件
                    var lastToolDijits = this.layerToolsDict[layerConfig.label];

                    //this.layerToolsBox.innerHTML = lastToolDivs;
                    array.forEach(lastToolDijits, lang.hitch(this, function (lastToolDijit) {
                        //html.place(lastToolDijit, this.layerToolsBox);
                        //启用缓存控件
                        lastToolDijit.startup();
                        //获取缓存控件的参数
                        var layerOpts = lastToolDijit.options;
                        //根据组件的类型进行缓存，保存以备后续使用
                        if (layerOpts.optionType == "dynamic") {
                            this.dynamicTools.push(lastToolDijit);
                        } else if (layerOpts.optionType == "query") {
                            this.querySQLTools.push(lastToolDijit);
                        } else if (layerOpts.optionType == "highlight") {
                            this.highLightTools.push(lastToolDijit);
                        } else if (layerOpts.optionType == "dynamicfield") {
                            this.dynamicfieldTools.push(lastToolDijit);
                        } else if (layerOpts.optionType == "dynamicrender") {
                            this.dynamicrenderTools.push(lastToolDijit);
                        }

                    }));
                    this.currentTools = lastToolDijits;
                } else if (layerConfig.layerTools != undefined && layerConfig.layerTools != null && !layerVisible && this.lastLayerName == layerConfig.label) {
                    if (this.layerToolsDict[layerConfig.label] == undefined) {
                        this.layerToolsDict[layerConfig.label] = this.currentTools;
                    }
                    //清空工具栏
                    domConstruct.empty(this.layerToolsBox);
                }



            },
            createTool: function (layerTool, toolHitchObj) {

                require(['./tools/' + layerTool.type], lang.hitch(toolHitchObj, function (toolClass) {
                    var layerOpts = this.layerTool.options;
                    layerOpts.map = this.map;
                    layerOpts.toolid = this.layerTool.toolid;
                    if ((layerOpts.optionType == "dynamic" || layerOpts.optionType == "query" || layerOpts == "highlight")) {
                        layerOpts.hasSubmit = this.hasSubmit;
                    }

                    layerOpts.visible = this.visible;
                    //var dijitLayer = this.map.getLayer(layerConfig.label);
                    layerOpts.layer = this.layer;
                    layerOpts.toolBox = this.layerToolsBox;
                    var toolDijit = new toolClass(layerOpts);
                    //toolDijit.startup();
                    //根据组件的类型进行缓存，保存以备后续使用
                    if (layerOpts.optionType == "dynamic") {
                        this.dynamicTools.push(toolDijit);
                    } else if (layerOpts.optionType == "query") {
                        this.querySQLTools.push(toolDijit);
                    } else if (layerOpts.optionType == "highlight") {
                        this.highLightTools.push(toolDijit);
                    } else if (layerOpts.optionType == "dynamicfield") {
                        this.dynamicfieldTools.push(toolDijit);
                    } else if (layerOpts.optionType == "dynamicrender") {
                        this.dynamicrenderTools.push(toolDijit);
                    }

                    this.currentTools.push(toolDijit);


                    if (this.totalToolNum == this.currentTools.length) {

                        this.currentTools = this.currentTools.sort(function (atool, btool) {
                            var atoolid = -1;
                            var btoolid = -1;
                            if (atool.options.toolid != undefined) {
                                atoolid = atool.options.toolid;
                            }
                            if (btool.options.toolid != undefined) {
                                btoolid = btool.options.toolid;
                            }

                            return atoolid - btoolid;

                        });

                        for (var j = 0; j < this.currentTools.length; j++) {
                            var currentToolDijit = this.currentTools[j];
                            currentToolDijit.startup();
                        }

                        var doOptionTypes = ["dynamic", "query"];

                        for (var m = 0; m < doOptionTypes.length; m++) {
                            var optionType = doOptionTypes[m];
                            var layer = this.layer;
                            var workspaceId = "";
                            if (this.dynamicTools.length > 0) {
                                workspaceId = this.dynamicTools[0].options.workspaceId;
                            }
                            this.manageTools(layer, workspaceId, optionType);
                        }



                    }


                }));
            }
        });
    });