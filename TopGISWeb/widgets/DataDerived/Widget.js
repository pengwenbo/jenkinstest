/**
 * Created by GaoSong on 2017/10/23.
 */
define([
        'dojo/_base/declare',
        'jimu/BaseWidget',
        'dojo/on',
        'dojo/topic',
        'esri/toolbars/draw',
        'dojo/_base/lang',
        'esri/graphic',
        'esri/layers/GraphicsLayer',
        'custom/common',
        'esri/geometry/Polygon',
        'esri/tasks/query',
        'esri/tasks/QueryTask',
        'jimu/WidgetManager',
        'jimu/ConfigManager',
        'jimu/LayerInfos/LayerInfos',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'dojo/i18n!./nls/strings',
        'jimu/dijit/Message'
    ],
    function (declare, BaseWidget, on, topic, Draw, lang, Graphic, GraphicsLayer, common, Polygon,
              Query, QueryTask,WidgetManager, ConfigManager,LayerInfos,ArcGISDynamicMapServiceLayer, nls, Message) {
        return declare([BaseWidget], {
            nls: nls,
            //将画出来的图斑添加到地图上
            graphicLayer: null,
            //记录画出来的图斑的geometry
            queryGeometry: "",
            //记录所有可见图层
            getlayers: "",
            //用于保存config里面的serverUrl的名字，也就是说就是基础图层的ID
            allBaseFeatureIDs: [],
            //用于保存config里面的基础图层的图层信息
            allBaseFeatureLayers: [],
            //记录所有的查询相关的信息
            allfeatureAttribute: [],
            //查询记录值
            number: 0,
            //保存查询基础图层出来的信息
            queryBaseFeatures: [],
            //记录可查询的数据图层id（不包括基础图层）
            idsLayers: [],
            //保存查询结果用于导出到表格中
            queryResult: [],
            
            regionLayer: null,
            //用于保存工具的类型type
            ctype: "",

            postCreate: function () {
                if (this.allBaseFeatureIDs.length==0) {
                    for (var i in this.config.serverUrl) {
                        this.allBaseFeatureIDs.push(i);
                    }
                }
                this.graphicLayer = new GraphicsLayer();
                this.map.addLayer(this.graphicLayer);
                this.toolbar_Derived = new Draw(this.map, {showTooltips: true});
                topic.subscribe("deactivateDerived", lang.hitch(this, function () {
                    if (this.toolbar_Derived)
                        this.toolbar_Derived.deactivate();
                    if (this.toolbarComplete)
                        this.toolbarComplete.remove();
                }));
                topic.subscribe("event_clearGraphicLayer", lang.hitch(this, function () {
                    if (this.graphicLayer) {
                        if (this.graphicLayer.graphics.length > 0) {
                            this.graphicLayer.clear();
                        }
                    }
                }));
                var config = this.config;
                //var clickevent = config.clickevent;
                //var clicktype = config.type;
                //this[clickevent](clicktype);
            },
            startup: function () {
                this.inherited(arguments);

            }, destroy: function () {
                this.inherited(arguments);
            },

            onOpen: function () {
                console.log('dataDerived::onOpen');
                var config = this.config;
                var clickevent = config.clickevent;
                var clicktype = config.type;
                if (clicktype=="") {
                    this[clickevent]();
                } else {
                    this[clickevent](clicktype);
                }
               
            },

            onClose: function () {
                console.log('dataDerived::onClose');
                this.getlayers = [];
                if (this.regionLayer!=undefined&&this.regionLayer != null) {
                    this.regionLayer.setVisibility(false);
                }
           
                //this.__clearGraphics();
            },
            __clearGraphics: function () {
                this.map.graphics.clear();
                if (this.graphicLayer) {
                    if (this.graphicLayer.graphics.length > 0) {
                        this.graphicLayer.clear();
                    }
                }
            },
            _clearEvent: function () {
                if ($("#draw_btnClear").length > 0) {
                    $("#draw_btnClear").click();
                }
                var _layerId =  arguments[1] ? arguments[1] : "";
                if (_layerId != "") {
                    this.map.getLayer(_layerId).clear();
                }
                else {
                    for (var i = 0; i < this.map.graphicsLayerIds.length; i++) {
                        this.map.getLayer(this.map.graphicsLayerIds[i]).clear();
                    }
                }
                this.map.graphics.clear();
                this.map.infoWindow.hide();
            },
            clearGraphics: function () {
                this._clearEvent();
                topic.publish("event_clearGraphicLayer");
                this.setState('closed');
                this.onClose();
            },
            activateDrawTool: function (type) {
                topic.publish("deactivateDerived");
                ctype = type;
                if (type == "polygon_lte") {
                    this.toolbar_Derived.activate("extent", { showTooltips: true });
                    this.toolbarComplete = this.toolbar_Derived.on("draw-complete", lang.hitch(this, this._onDrawComplete));
                }
                else {
                    this.toolbar_Derived.activate(type, { showTooltips: true });
                    this.toolbarComplete = this.toolbar_Derived.on("draw-complete", lang.hitch(this, this._onDrawComplete));
                }
            },
            _onDrawComplete: function (graphic) {
                this.getlayers=[];
                this.__clearGraphics();
                this.toolbar_Derived.deactivate();
                this.toolbarComplete.remove();
                //添加上画上去的图形
                var symbol = common.getFillSymbol(1);
                var queryGeometry = graphic.geometry;
                var gra = new Graphic(queryGeometry, symbol);
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ['*'];
                query.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                //文字为query.where="***"
                //图层则为query.geometry=queryGeometry;
                query.geometry = queryGeometry;
                this.graphicLayer.add(gra);
                //获取当前图层中显示的图层
                this.getlayers = this._getMapVisibleLayers();
                this.queryLayerTask(query);
            },
            queryLayerTask: function (query) {
                this.allfeatureAttribute = [];
                //记录所有的可见图层中的相关查询属性
                for (var i in this.getlayers) {
                    //if (this.getlayers[i].layerInfos) {
                    var url = this.getlayers[i].url;
                    if (!url.split("MapServer")[1]) {
                        url += "/0";
                    }
                    if (!this.getlayers[i].label) {
                        this.getlayers[i].label = this.getlayers[i].id;
                    }
                    if (this.map.getLayer(this.getlayers[i].id).layerDefinitions && this.map.getLayer(this.getlayers[i].id).dynamicLayerInfos) {
                        this.allfeatureAttribute.push(
                            {
                                layerUrl: url,
                                layer:this.getlayers[i],
                                layerName: this.getlayers[i].label,
                                layerCode: this.getlayers[i].id + "_g",
                                layerDefinitions: this.map.getLayer(this.getlayers[i].id).layerDefinitions[0],
                                source: this.map.getLayer(this.getlayers[i].id).dynamicLayerInfos[0].source
                            }
                        );
                    }
                    else if (this.map.getLayer(this.getlayers[i].id).layerDefinitions) {
                        this.allfeatureAttribute.push(
                        {
                            layerUrl: url,
                            layer:this.getlayers[i],
                            layerName: this.getlayers[i].label,
                            layerCode: this.getlayers[i].id + "_g",
                            layerDefinitions: this.map.getLayer(this.getlayers[i].id).layerDefinitions[0]
                        }
                    );
                    } else if (this.map.getLayer(this.getlayers[i].id).dynamicLayerInfos) {
                        this.allfeatureAttribute.push(
                        {
                            layerUrl: url,
                            layer:this.getlayers[i],
                            layerName: this.getlayers[i].label,
                            layerCode: this.getlayers[i].id + "_g",
                            source: this.map.getLayer(this.getlayers[i].id).dynamicLayerInfos[0].source
                        }
                    );
                    } else if (this.map.getLayer(this.getlayers[i].id).source) {
                        this.allfeatureAttribute.push(
                            {
                                layerUrl: url,
                                layer:this.getlayers[i],
                                layerName: this.getlayers[i].label,
                                layerCode: this.getlayers[i].id + "_g",
                                source: this.map.getLayer(this.getlayers[i].id).source
                            });
                    }
                    else {
                        this.allfeatureAttribute.push(
                        {
                            layerUrl: url,
                            layer:this.getlayers[i],
                            layerName: this.getlayers[i].label,
                            layerCode: this.getlayers[i].id + "_g"
                        });
                    }
                }
                if (this.allfeatureAttribute.length > 0) {
                    var ltelabel = "LTE小区";
                    var i = 0; n = 0;
                    if (ctype == "polygon_lte") {
                        for (var i in this.allfeatureAttribute) {
                            if (this.allfeatureAttribute[i].layerName == ltelabel) {
                                layerDefinition = this.allfeatureAttribute[i].layerDefinitions;
                                query.where = layerDefinition;
                                layerid = this.allfeatureAttribute[i].layerCode.replace(/_g/,"");
                                var options =
                                {
                                    source: this.map.getLayer(layerid).dynamicLayerInfos[0].source
                                };
                                var querytask = new QueryTask(this.allfeatureAttribute[i].layerUrl.replace("/0","/dynamicLayer"),options);
                                querytask.execute(query, lang.hitch(this, function (fset) {
                                    var length = fset.features.length
                                    var numavg = 0;
                                    var fwjavg = 0;
                                    for (var i in fset.features) {
                                        numavg = numavg + fset.features[i].attributes.SITE_DISTANCE_FW;
                                        fwjavg = fwjavg + fset.features[i].attributes.ANT_DIRCT_ANGLE;
                                    }
                                    numavg = (numavg / length).toFixed(2);
                                    fwjavg = (fwjavg / length).toFixed(2);
                                    var info = "所选LTE小区平均站间距：" + numavg + "m,平均方位角：" + fwjavg;
                                    Message({
                                        message: info
                                    });
                                }))
                            n = n + 1;
                            }
                            else {
                                i += 1;
                            }    
                        }
                        if (n==0 && i > 0) {
                            Message({
                                message: "lte站间距框选只针对“网络配置-LTE小区”起作用!"
                            });
                        }
                        this.setState('closed');
                        this.onClose();
                    }
                    else {
                        //topic.publish("createTab", this.allfeatureAttribute, query);
                        this._getLayersDataViewInAttributeTable(this.allfeatureAttribute, query);
                        $(".jimu-widget-attributetablecustom-main").click();
                        this.setState('closed');
                        this.onClose();
                    }
                }
                else {
                    common.popupMessage(nls.nullDate, nls.watchOut);
                    this.setState('closed');
                    this.onClose();
                }
            },
            _getAvailableWidget: function(widgetName) {
                var appConfig = ConfigManager.getInstance().getAppConfig();
                var attributeTableWidget = appConfig.getConfigElementsByName(widgetName)[0];
                if (attributeTableWidget && attributeTableWidget.visible) {
                  return attributeTableWidget;
                }
                return null;
              },
            _getLayersDataViewInAttributeTable:function(allfeatureAttribute,query){
                var layerInfos = LayerInfos.getInstanceSync();
                //把所有可见图层都query一遍
                for (var i = 0; i < allfeatureAttribute.length; i++) {
                       
                    var featureQueryInfo = allfeatureAttribute[i];
                    var _url = featureQueryInfo.layerUrl;
                    var options = [];
                    this.allfeatures = [];
                    if (featureQueryInfo.source) {
                        _url = _url.split("/0")[0] + "/dynamicLayer";
                        options = {
                            source: value.source
                        }
                    }
                    query.where =  featureQueryInfo.layerDefinitions;
                    var queryTask = new QueryTask(_url, options);
                    var isOut = true;
                    queryTask.execute(query, lang.hitch(this, function (fset) {
                        
                        var attributeTableWidget = this._getAvailableWidget("AttributeTable");

                        if (!attributeTableWidget) {
                          return;
                        }
                    
                        var layerInfo = layerInfos.getLayerOrTableInfoById(featureQueryInfo.layer.id);
                        fset.displayFieldName = featureQueryInfo.layer.objectIdField;
                  
                        WidgetManager.getInstance().triggerWidgetOpen(attributeTableWidget.id)
                        .then(function(attrWidget) {
                          attrWidget.onReceiveData(null, null, {
                            target: "AttributeTable",
                            layerInfo: layerInfo,
                            featureSet: fset
                          });
                        });

                    }));
                }

            },
            //获取当前可见图层
            _getMapVisibleLayers: function () {
                var layerOrder = [];
                var layerOrder_List=[];
                for (var i in this.map.layerIds) {
                    if (i > 0) {
                        if (this.map.getLayer(this.map.layerIds[i]).visible && this.map.getLayer(this.map.layerIds[i]).id != "usa" && this.map.getLayer(this.map.layerIds[i]).id != "POI") {
                            layerOrder.push(this.map.getLayer(this.map.layerIds[i]));
                        }
                    }
                }
                for (var i in this.map.graphicsLayerIds) {
                    if (i > 0) {
                        if (this.map.getLayer(this.map.graphicsLayerIds[i]).visible && this.map.getLayer(this.map.graphicsLayerIds[i]).url) {
                            layerOrder.push(this.map.getLayer(this.map.graphicsLayerIds[i]));
                        }
                    }
                }
                for (var i = 0; i < layerOrder.length; i++) {
                    var k = 0;
                    for (var j = 0; j < this.allBaseFeatureIDs.length; j++) {
                        if (layerOrder[i].id != this.allBaseFeatureIDs[j]) {
                            k++;
                            if (k == this.allBaseFeatureIDs.length) {
                                layerOrder_List.push(layerOrder[i]);
                            }
                        }
                    }
                }
                return layerOrder_List;
            },
            //将数据显示出来
            activateDrawToolRegion: function (type) {
                //var _target = evt.currentTarget;
                var url = this.config.serverUrl[type];
                var curip = window.location.host;
                if (curip.indexOf("localhost") > -1) {
                    revUrl = revUrl.replace(new RegExp("10.209.180.203:6080/", 'g'), "221.182.241.179:85/");
                    revUrl = revUrl.replace(new RegExp("10.209.239.1:8081/arcgis/", 'g'), "221.182.241.179:85/arcgis_digitalmap/");
                    revUrl = revUrl.replace(new RegExp("10.209.180.1:18083/", 'g'), "221.182.241.179:85/");
                  }
         
                    if (this.map.getLayer(type)) {
                        this.regionLayer = this.map.getLayer(type);
                        this.regionLayer.setVisibility(true);
                    } else {
                        this.regionLayer = new ArcGISDynamicMapServiceLayer(url, { "id": type });
                        this.map.addLayer(this.regionLayer);
                    }
            },
            exportRegions: function (type) {
                topic.publish("deactivateDerived");
                this.toolbar_Derived.activate(type, { showTooltips: true });
                this.toolbarComplete = this.toolbar_Derived.on("draw-complete", lang.hitch(this, this.onPointComplete));
            },
            onPointComplete: function (graphic) {
                this.__clearGraphics();
                this.toolbar_Derived.deactivate();
                this.toolbarComplete.remove();
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ['*'];
                query.geometry = graphic.geometry;
                //第一步：先查出点击后该处的所有基础地图有多少个
                this.getBaseLayersInfo(query);
            },
            getBaseLayersInfo: function (query) {
                this.allBaseFeatureLayers = [];
                for (var i in this.allBaseFeatureIDs) {
                    var j = this.map.getLayer(this.allBaseFeatureIDs[i]);
                    if (j) {
                        if (j.visible == true) {
                            this.allBaseFeatureLayers.push(j);
                        }
                    }
                }
                if (this.allBaseFeatureLayers.length == 0) {
                    common.popupMessage(nls.nullDate, nls.watchOut);
                    this.setState('closed');
                    this.onClose();
                    return;
                }
                this.xunhuanQuery(query);
            },
            xunhuanQuery: function (query) {
                //先把一个的情况写好
                this.queryLayers(query);

            },
            queryLayers: function (query) {
                var queryBaseMap = query;
                var url = this.allBaseFeatureLayers[this.number].url;
                var curip = window.location.host;
                if (curip.indexOf("10.53.160.88") > -1) {
                    url = url.replace(new RegExp("10.48.186.92/", 'g'), "10.53.160.88:8999/");
                } else if (curip.indexOf("10.53.160.65") > -1) {
                    url = url.replace(new RegExp("10.48.186.92/", 'g'), "10.53.160.65/jzyh_online/");
                } else if (curip.indexOf("10.46.0.1") > -1) {
                    url = url.replace(new RegExp("10.48.186.92/", 'g'), "10.46.0.1/jzyh_online/");
                } else if (curip.indexOf("10.46.0.2") > -1) {
                    url = url.replace(new RegExp("10.48.186.92/", 'g'), "10.46.0.2/jzyh_online/");
                }
                var _querytask = new QueryTask(url + "/0");
                _querytask.execute(queryBaseMap, lang.hitch(this, function (fset) {
                    if (fset.features.length > 0) {
                        //queryBaseFeatures保存查询基础图层出来的信息
                        this.queryBaseFeatures.push(fset.features[0]);
                    }
                    this.number++;
                    if (this.number < this.allBaseFeatureLayers.length) {
                        this.xunhuanQuery(queryBaseMap);
                    }
                    else if (this.queryBaseFeatures.length == 0) {
                        this.number = 0;
                        common.popupMessage(nls.nullDate, nls.watchOut);
                        this.setState('closed');
                        this.onClose();
                    } else {
                        this.number = 0;
                        this.queryLayersInfos();
                    }
                }));
            },
            //获取可操作图层
            queryLayersInfos: function () {
                //获取所有可见图层信息
                this.idsLayers = this._getMapVisibleLayers();
                if (this.idsLayers.length > 0) {
                    //用于循环基础图层图斑使用
                    this.i_number = 0;
                    //用于循环可操作图层使用
                    this.j_number = 0;
                    this.queryGeometryInfos();
                }
                else {
                    common.popupMessage(nls.nullDate, nls.watchOut);
                    this.setState('closed');
                    this.onClose();
                }
            },
            //用于查询的基础图层图斑：this.queryBaseFeatures    多值
            //可操作图层：this.idsLayers  多值
            queryGeometryInfos: function () {
                /**
                 * 这里循环会有很多
                 * */
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ['*'];
                query.geometry = this.queryBaseFeatures[this.i_number].geometry;
                this.queryBaseFeaturesLayers(query);
            },
            queryBaseFeaturesLayers: function (query) {
                var url = this.idsLayers[this.j_number].url;
                if (url.split("MapServer")[1] == "/dynamicLayer") {
                    common.popupMessage(nls.onlyDynamicLayerDate, nls.watchOut);
                    this.j_number++;
                    if (this.j_number < this.idsLayers.length) {
                        this.queryBaseFeaturesLayers(query);
                    } else {
                        this.tiaozhuan();
                    }
                }
                else {
                    if (!url.split("MapServer")[1]) {
                        url += "/0";
                    }
                    var _querytask = new QueryTask(url);
                    _querytask.execute(query, lang.hitch(this, function (fset) {
                        if (fset.features.length > 0) {
                            this.queryResult.push({
                                "id": this.idsLayers[this.j_number].id + "!" + this.allBaseFeatureLayers[this.i_number].id,
                                "features": fset.features
                            });
                            this.j_number++;
                            if (this.j_number < this.idsLayers.length) {
                                this.queryBaseFeaturesLayers(query);
                            } else {
                                this.tiaozhuan();
                            }
                        }
                        else {
                            common.popupMessage("（" + this.idsLayers.id + "）" + nls.nullDate, nls.watchOut);
                            this.setState('closed');
                            this.onClose();
                        }
                    }));
                }
            },
            tiaozhuan: function () {
                this.i_number++;
                if (this.i_number < this.queryBaseFeatures.length) {
                    this.j_number = 0;
                    this.queryGeometryInfos();
                } else {
                    this.i_number = 0;
                    this.j_number = 0;
                    //到结束的时候别忘记这个了
                    this.queryBaseFeatures = [];
                    this.idsLayers = [];
                    this.readyExportCSV();
                }
            },
            readyExportCSV: function () {
                //已经保存了所有的结果数据
                for (var i = 0; i < this.queryResult.length; i++) {
                    topic.publish("exportTab", this.queryResult[i]);
                    this.setState('closed');
                    this.onClose();
                }
                //别忘记了将queryResul 信息清除
                this.queryResult=[];
            }
        });
    });
