var now = new Date(); //当前日期
var nowDayOfWeek = now.getDay(); //今天本周的第几天
var nowDay = now.getDate(); //当前日
var nowMonth = now.getMonth(); //当前月
var nowYear = now.getYear(); //当前年
nowYear += (nowYear < 2000) ? 1900 : 0; //

var lastMonthDate = new Date(); //上月日期
lastMonthDate.setDate(1);
lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
var lastYear = lastMonthDate.getYear();
var lastMonth = lastMonthDate.getMonth();
var pdhighlightLayer;
var no_roadState = false;
function urlRoute(sourceUrl) {
    var revUrl = sourceUrl;
    var curip = window.location.host;
    if (curip.indexOf("10.53.160.88") > -1) {
        revUrl = revUrl.replace(new RegExp("10.48.186.92/", 'g'), "10.53.160.88:8999/");
    } else if (curip.indexOf("10.53.160.65") > -1) {
        revUrl = revUrl.replace(new RegExp("10.48.186.92/", 'g'), "10.53.160.65/jzyh_online/");
    } else if (curip.indexOf("10.46.0.1") > -1) {
        revUrl = revUrl.replace(new RegExp("10.48.186.92/", 'g'), "10.46.0.1/jzyh_online/");
    } else if (curip.indexOf("10.46.0.2") > -1) {
        revUrl = revUrl.replace(new RegExp("10.48.186.92/", 'g'), "10.46.0.2/jzyh_online/");
    }
    return revUrl;
}
// 判断是否为对象
function isObject(o) {
    return (typeof o === 'object' || typeof o === 'function') && o !== null
}
// 迭代递归法：深拷贝对象与数组
function deepClone(obj) {
    if (!isObject(obj)) {
        throw new Error('obj 不是一个对象！')
    }
    let isArray = Array.isArray(obj)
    let cloneObj = isArray ? [] : {}
    for (let key in obj) {
        cloneObj[key] = isObject(obj[key]) ? deepClone(obj[key]) : obj[key]
    }
    return cloneObj
}
define([
        "jimu/MapManager",
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/topic',
        'dojo/on',
        'dojo/string',
        "esri/layers/DynamicLayerInfo",
        "esri/layers/QueryDataSource",
        'esri/layers/TableDataSource',
        "esri/layers/LayerDataSource",
        'esri/layers/FeatureLayer',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/tasks/QueryTask',
        'esri/tasks/query',
        'custom/common',
        'widgets/GridOverlay/lib/mgrs',
        'esri/renderers/HeatmapRenderer',
        'esri/renderers/UniqueValueRenderer',
        'esri/renderers/SimpleRenderer',
        'esri/layers/GraphicsLayer',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/graphic',
        'esri/Color',
        "esri/toolbars/draw",
        "esri/toolbars/edit",
        "esri/geometry/geometryEngine",
        "dojo/_base/event",
        'esri/arcgis/LayerUtil',
        'jimu/LayerInfos/LayerInfos'
],
    function (MapManager, declare, lang, array, topic, on, string, DynamicLayerInfo, QueryDataSource, TableDataSource,
        LayerDataSource, FeatureLayer, ArcGISDynamicMapServiceLayer, QueryTask, Query, common, MGRS, HeatmapRenderer,
        UniqueValueRenderer, SimpleRenderer, GraphicsLayer, SimpleFillSymbol, SimpleLineSymbol, PictureMarkerSymbol,
        Graphic, Color, Draw, Edit, geometryEngine,event, LayerUtil, LayerInfos) {
        var instance = null,
            clazz = declare(null, {
                _mapmanager:null,
                _yqjklayer:null,
                constructor: function (/*Object*/ options) {
                    if (!this._mapmanager) {
                        this._mapmanager = MapManager.getInstance();
                    }
                    this._yqjklayer = this._mapmanager.map.getLayer("舆情监控");
                    if (this._yqjklayer) {
                        this._mapmanager.editstatusmanager._editlayer.on('click', (evt) => {
                            if (this._mapmanager.editstatusmanager._edit==2) {
                                event.stop(evt);
                                var status = this._mapmanager.edittoolbar.getCurrentState();
                                if (!status.graphic) {
                                    this._mapmanager.edittoolbar.activate(Edit.EDIT_VERTICES, evt.graphic);
                                }
                                //this._mapmanager.editstatusmanager._checkedfeature = evt.graphic;
                                
                            }
                            if (this._mapmanager.editstatusmanager._delete == 2) {
                                var sfs = new SimpleFillSymbol();
                                sfs.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2));
                                var newgraphic = new Graphic(evt.graphic.geometry,sfs);
                                this._mapmanager.editstatusmanager._editlayer.add(newgraphic);
                                setTimeout(() => {
                                    var msg = "确认删除？"
                                    if (confirm(msg)) {
                                        $("#layerToolsBox .button:eq(2)").val('删除')
                                        this._mapmanager.editstatusmanager._delete = 1;
                                        this._yqjklayer.applyEdits(null, null, [evt.graphic], (event) => {
                                            this._mapmanager.editstatusmanager._editlayer.remove(evt.graphic);
                                            alert('删除成功');
                                        }, (error) => {
                                            alert('删除失败');
                                        });
                                    }
                                    this._mapmanager.editstatusmanager._editlayer.remove(newgraphic)
                                }, 500)
                                
                            }
                        })
                        this._mapmanager.map.on('click', (evt) => {
                            if (this._mapmanager.editstatusmanager._edit == 2 && !evt.graphic) {
                                var status = this._mapmanager.edittoolbar.getCurrentState();
                                if (status.graphic) {
                                    if (status.isModified) {
                                        this.saveEdit(status.graphic);
                                    }
                                    this._mapmanager.edittoolbar.deactivate();
                                    this._mapmanager.editstatusmanager._edit = 1
                                    $("#layerToolsBox .button:eq(1)").val('编辑');
                                }
                            }
                        })
                        //this._mapmanager.edittoolbar.on('deactivate', (evt) =>{
                           // this._mapmanager.editstatusmanager._edit = 1
                           // $("#layerToolsBox .button:eq(1)").val('编辑');
                        //})
                    }
                },
                saveEdit: function (graphic) {
                    var msg = "确认保存修改？"
                    if (confirm(msg)) {
                        var extent = graphic.geometry.getExtent();
                        graphic.attributes.M_LON = extent.xmin;
                        graphic.attributes.M_LAT = extent.ymin;
                        graphic.attributes.X_LON = extent.xmax;
                        graphic.attributes.X_LAT = extent.ymax;

                        this._yqjklayer.applyEdits(null, [graphic], null, (evt) => {
                            alert('保存成功');
                        }, (error) => {
                            this._mapmanager.queryYQJK(this._yqjklayer);
                            alert('保存失败');
                        });
                    } else {
                        this._mapmanager.queryYQJK(this._yqjklayer);
                        this._yqjklayer.refresh();
                    }
                },
                processTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数...");
                    console.log("执行自定义函数::" + currentToolDijit.options.customFunction);
                    if (currentToolDijit.options.customFunction) {
                        this[currentToolDijit.options.customFunction](toolDijits, currentToolDijit, mapParent, lastLayerName);
                    }
                },
                changeGSMSxDate: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeGSMSxDate执行成功！");
                },
                changeNBSxMod3: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeNBSxMod3执行成功！");
                    var nbDateId = $("#nbDateId").val().replace(/-/g, "");
                    var nbDateIdSql = "DATE_ID=" + nbDateId;

                    var checkBoxSelect = $("#nbCoverType").find("input[type=\"checkbox\"]:checked");
                    var timesType3 = true;
                    var definitionExpression3 = "";

                    $.each(checkBoxSelect, function () {
                        definitionExpression3 += (timesType3 ? "" : " or ") + $(this).val();
                        timesType3 = false;
                    });
                    if (definitionExpression3 == "") {
                        definitionExpression3 = "1=2";
                    }

                    var nbPdsql = "1=2";
                    var nbPdSelect = $("#nbPdType").val();
                    if (nbPdSelect) {
                        if (nbPdSelect.length == 1) {
                            nbPdsql = nbPdSelect[0];
                        } else {
                            nbPdsql = "(" + nbPdSelect[0] + ")";
                            for (var num = 1; num < nbPdSelect.length; num++) {
                                nbPdsql = nbPdsql + " or (" + nbPdSelect[num] + ")";
                            }
                        }
                    }

                    var nbSelectsql = "1=2";
                    if (nbSelectPci != "未选择小区") {
                        nbSelectsql = "PCI = " + nbSelectPci.PCI + " and REGION_NAME = '" + nbSelectPci.REGION_NAME+"'";
                    }

                    if ($("#nbMod3Bnt")[0].value=="MOD3") {
                        $("#nbMod3Bnt")[0].value = "返回";
                        var doSql = "(" + nbDateIdSql + ") and (" + definitionExpression3 + ") and (" + nbPdsql + ") and (" + nbSelectsql + ")";
                        var nbCellLayer = mapParent.getLayer("NB小区");
                        nbCellLayer.setLayerDefinitions([doSql]);
                    } else {
                        $("#nbMod3Bnt")[0].value = "MOD3";
                        var doSql = "(" + nbDateIdSql + ") and (" + definitionExpression3 + ") and (" + nbPdsql + ")";
                        var nbCellLayer = mapParent.getLayer("NB小区");
                        nbCellLayer.setLayerDefinitions([doSql]);
                    }
                    

                },
                changeCranGjzPdTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeCranGjzPdTools执行成功！");
                    var timesType3 = true;
                    var definitionExpression3 = "";

                    $.each($("input[type=\"checkbox\"][name=\"GjzPdBox\"]:checked"), function () {
                        definitionExpression3 += (timesType3 ? "" : " or") + " PD_FLAG = '" + $(this).val() + "'";
                        timesType3 = false;
                    });
                    if (definitionExpression3 == "") {
                        definitionExpression3 = "1=2";
                    }
                    var cjCellJkLayer = mapParent.getLayer("高价值区域5G规划");
                    cjCellJkLayer.setLayerDefinitions([definitionExpression3,"1=1","1=1"]);
                },
                changeCranZcqPdTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeCranZcqPdTools执行成功！");
                    var timesType3 = true;
                    var definitionExpression3 = "";

                    $.each($("input[type=\"checkbox\"][name=\"ZcqPdBox\"]:checked"), function () {
                        definitionExpression3 += (timesType3 ? "" : " or") + " PD_FLAG = '" + $(this).val() + "'";
                        timesType3 = false;
                    });
                    if (definitionExpression3 == "") {
                        definitionExpression3 = "1=2";
                    }
                    var cjCellJkLayer = mapParent.getLayer("主城区5G规划");
                    cjCellJkLayer.setLayerDefinitions([definitionExpression3]);
                },
                changeFgwsdQyCenter: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeFgwsdQyCenter执行成功！");
                    var qyValue = $("#fgwsdQy").find("input[type=\"radio\"]:checked").val();
                    if (qyValue == "闽侯试点区域") {
                            mapParent.setLevel(8);
                        topic.publish("centerAtNoSymbol", 119.17870, 26.06882);
                    } else {
                            mapParent.setLevel(7);
                        topic.publish("centerAtNoSymbol", 119.74064, 25.51554);
                    }
                },
                changeJCTXComplaintDate: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeJCTXComplaintDate执行成功！");
                    var dateSelect = $("#jctxDateSelect").val();
                    var time_value = $("#jctxDateRadio").find("input[type=\"radio\"]:checked").val();
                    var tsMgrsLayer = mapParent.getLayer("投诉热点栅格");
                    var tsPntLayer = mapParent.getLayer("基础通信投诉点");
                    var layerIdValue = [];

                    $.each($("input[type=\"checkbox\"][name=\"jctxSourceBox\"]:checked"), function () {
                        layerIdValue.push($(this).val());
                    });

                    var countSql = "1=1";
                    var qjSelect = $("#jctxCountSelect").val();
                    if (qjSelect) {
                        if (qjSelect.length == 1) {
                            countSql = qjSelect[0];
                        } else {
                            countSql = "(" + qjSelect[0] + ")";
                            for (var num = 1; num < qjSelect.length; num++) {
                                countSql = countSql + " or (" + qjSelect[num] + ")";
                            }
                        }
                    }

                    if (time_value == "month") {
                        var timeDef = "E_COMPLAINT_TIME >= Date'" + this.getLastMonthStartDate() + " 00:00:00' and E_COMPLAINT_TIME <= Date'" + this.getLastMonthEndDate() + " 23:59:59'";
                        var tableFirst = "GIS_TS_MGRS_MONTH";
                        LayerUtil.changeLayerDynamicData(tsMgrsLayer, tableFirst, "GISDB238", null, true);
                        tsMgrsLayer.setLayerDefinitions([countSql]);
                        tsPntLayer.setLayerDefinitions([timeDef, timeDef]);
                        
                    } else if (time_value == "week") {
                        var timeDef = "E_COMPLAINT_TIME >= Date'" + this.getLastWeekStartDateFormat() + " 00:00:00' and E_COMPLAINT_TIME <= Date'" + this.getLastWeekEndDateFormat() + " 23:59:59'";
                        var tableFirst = "GIS_TS_MGRS_WEEK";
                        LayerUtil.changeLayerDynamicData(tsMgrsLayer, tableFirst, "GISDB238", null, true);
                        tsMgrsLayer.setLayerDefinitions([countSql]);
                        tsPntLayer.setLayerDefinitions([timeDef, timeDef]);
                        
                    } else {
                        var tableFirst = "GIS_TS_MGRS_DAY_ALL";
                        var pntTimeDef = "E_COMPLAINT_TIME >= Date'" + dateSelect + " 00:00:00' and E_COMPLAINT_TIME <= Date'" + dateSelect + " 23:59:59' ";
                        var mgrsTimeDef = "TIME ='" + dateSelect.replace(/-/g, "")+"'";
                        LayerUtil.changeLayerDynamicData(tsMgrsLayer, tableFirst, "GISDB238", null, true);
                        tsMgrsLayer.setLayerDefinitions(["(" + countSql+") and ("+mgrsTimeDef+")"]);
                        tsPntLayer.setLayerDefinitions([pntTimeDef, pntTimeDef]);

                    }

                    if (layerIdValue.length > 0) {
                        tsPntLayer.setVisibleLayers(layerIdValue);
                        tsPntLayer.setVisibility(true);
                    } else {
                        tsPntLayer.setVisibility(false);
                    }
                },
                changeJxghSceneSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeJxghSceneSelect执行成功！");
                    var toolsArray = $("#layerToolsBox").find("div[class=\"attrRow\"]");
                    var dateSelect = $("#jxghSceneDate").val().replace(/-/g, "");
                    var zbSelectType = $("#JxghSceneZbTypeSelect").val();
                    if (zbSelectType == "精确规划场景覆盖指标") {
                        $("#" + toolsArray[7].id).css("display", "block");
                        $("#" + toolsArray[5].id).css("display", "none");
                        $("#" + toolsArray[6].id).css("display", "none");
                        $("#" + toolsArray[4].id).css("display", "none");

                        jxghFgLayer = mapParent.getLayer("精确规划场景覆盖指标");
                        jxghJdLayer = mapParent.getLayer("精确规划场景竞对指标");
                        jxghJzLayer = mapParent.getLayer("精确规划场景价值指标");
                        jxghTsLayer = mapParent.getLayer("精确规划场景投诉指标");

                        jxghFgLayer.setVisibility(true);
                        layerIdValue = parseInt($("#jzghSceneFGRadios").find("input[type=\"radio\"]:checked").val());
                        jxghFgLayer.setVisibleLayers([layerIdValue]);

                        var dlTypeSelect = $("#jxghSceneTypeSelect").val();
                        var sql = "1=1";
                        if (dlTypeSelect) {
                            if (dlTypeSelect.length == 1) {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                            } else {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                                for (var num = 1; num < dlTypeSelect.length; num++) {
                                    sql = sql + " or SCENE_TYPE = '" + dlTypeSelect[num] + "'";
                                }
                            }
                        }
                        var sqlArray = [];
                        sqlArray[layerIdValue] = "("+sql + ") and DATE_ID = " + dateSelect;
                        jxghFgLayer.setLayerDefinitions(sqlArray);

                        jxghJdLayer.setVisibility(false);
                        jxghJzLayer.setVisibility(false);
                        jxghTsLayer.setVisibility(false);

                    } else if (zbSelectType == "精确规划场景竞对指标") {
                        $("#" + toolsArray[7].id).css("display", "none");
                        $("#" + toolsArray[5].id).css("display", "block");
                        $("#" + toolsArray[6].id).css("display", "none");
                        $("#" + toolsArray[4].id).css("display", "none");

                        jxghFgLayer.setVisibility(false);
                        jxghJdLayer.setVisibility(true);
                        layerIdValue = parseInt($("#jzghSceneJDRadios").find("input[type=\"radio\"]:checked").val());

                        jxghJdLayer.setVisibleLayers([layerIdValue]);

                        var dlTypeSelect = $("#jxghSceneTypeSelect").val();
                        var sql = "1=1";
                        if (dlTypeSelect) {
                            if (dlTypeSelect.length == 1) {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                            } else {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                                for (var num = 1; num < dlTypeSelect.length; num++) {
                                    sql = sql + " or SCENE_TYPE = '" + dlTypeSelect[num] + "'";
                                }
                            }
                        }
                        var sqlArray = [];
                        sqlArray[layerIdValue] = "(" + sql + ") and DATE_ID = " + dateSelect;
                        jxghJdLayer.setLayerDefinitions(sqlArray);

                        jxghJzLayer.setVisibility(false);
                        jxghTsLayer.setVisibility(false);
                    } else if (zbSelectType == "精确规划场景价值指标") {
                        $("#" + toolsArray[7].id).css("display", "none");
                        $("#" + toolsArray[5].id).css("display", "none");
                        $("#" + toolsArray[6].id).css("display", "block");
                        $("#" + toolsArray[4].id).css("display", "none");

                        jxghFgLayer.setVisibility(false);
                        jxghJdLayer.setVisibility(false);
                        jxghJzLayer.setVisibility(true);
                        layerIdValue = parseInt($("#jzghSceneJZRadios").find("input[type=\"radio\"]:checked").val());

                        jxghJzLayer.setVisibleLayers([layerIdValue]);

                        var dlTypeSelect = $("#jxghSceneTypeSelect").val();
                        var sql = "1=1";
                        if (dlTypeSelect) {
                            if (dlTypeSelect.length == 1) {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                            } else {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                                for (var num = 1; num < dlTypeSelect.length; num++) {
                                    sql = sql + " or SCENE_TYPE = '" + dlTypeSelect[num] + "'";
                                }
                            }
                        }
                        var sqlArray = [];
                        sqlArray[layerIdValue] = "(" + sql + ") and DATE_ID = " + dateSelect;
                        jxghJzLayer.setLayerDefinitions(sqlArray);

                        jxghTsLayer.setVisibility(false);
                    } else if (zbSelectType == "精确规划场景投诉指标") {
                        $("#" + toolsArray[7].id).css("display", "none");
                        $("#" + toolsArray[5].id).css("display", "none");
                        $("#" + toolsArray[6].id).css("display", "none");
                        $("#" + toolsArray[4].id).css("display", "block");

                        jxghFgLayer.setVisibility(false);
                        jxghJdLayer.setVisibility(false);
                        jxghJzLayer.setVisibility(false);
                        jxghTsLayer.setVisibility(true);
                        layerIdValue = parseInt($("#jzghSceneTSRadios").find("input[type=\"radio\"]:checked").val());

                        jxghTsLayer.setVisibleLayers([layerIdValue]);

                        var dlTypeSelect = $("#jxghSceneTypeSelect").val();
                        var sql = "1=1";
                        if (dlTypeSelect) {
                            if (dlTypeSelect.length == 1) {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                            } else {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                                for (var num = 1; num < dlTypeSelect.length; num++) {
                                    sql = sql + " or SCENE_TYPE = '" + dlTypeSelect[num] + "'";
                                }
                            }
                        }
                        var sqlArray = [];
                        sqlArray[layerIdValue] = "(" + sql + ") and DATE_ID = " + dateSelect;
                        jxghTsLayer.setLayerDefinitions(sqlArray);

                    }
                },
                changeJzSceneSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeJzSceneSelect执行成功！");
                    var dateSelect = $("#sceneJzDate").val().replace(/-/g, "");
                    var dlTypeSelect = $("#sceneJzTypeSelect").val();
                    jxghFgLayer = mapParent.getLayer("场景价值专题");
                        
                        var sql = "1=1";
                        if (dlTypeSelect) {
                            if (dlTypeSelect.length == 1) {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                            } else {
                                sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                                for (var num = 1; num < dlTypeSelect.length; num++) {
                                    sql = sql + " or SCENE_TYPE = '" + dlTypeSelect[num] + "'";
                                }
                            }
                        }
                        var sqlLayer = "(" + sql + ") and DATE_ID = " + dateSelect;
                        jxghFgLayer.setLayerDefinitions([sqlLayer]);
                },
                changRoadReturnBtn: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changRoadReturnBtn执行成功！");
                    $("#ROADReturn").css("display", "none");
                    var sgCellLayer = mapParent.getLayer("城区道路关联小区");
                    var xwcell_sx = mapParent.getLayer("栅格覆盖现网小区");

                    var layerIdValue = 0;
                    var gxSgLayer;
                    if (lastLayerName == "道路栅格覆盖指标") {
                        layerIdValue = parseInt($("#gxFgzbZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格覆盖指标");
                    } else if (lastLayerName == "道路栅格语音指标") {
                        layerIdValue = parseInt($("#gxVolteZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格语音指标");
                    } else if (lastLayerName == "道路栅格数据指标") {
                        layerIdValue = parseInt($("#gxDataZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格数据指标");
                    } else if (lastLayerName == "道路栅格业务指标") {
                        layerIdValue = parseInt($("#gxBusinessZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格业务指标");
                    } else if (lastLayerName == "道路栅格事件类型") {
                        layerIdValue = parseInt($("#gxEventZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格事件类型");
                    } else if (lastLayerName == "道路栅格场景得分") {
                        layerIdValue = parseInt($("#gxSocreZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格场景得分");
                    }

                    sgCellLayer.setVisibility(false);
                    xwcell_sx.setVisibility(false);
                    var dlTypeSelect = $("#gxRoadTypeSelect").val();
                    var sql = "1=1";
                    if (dlTypeSelect) {
                        if (dlTypeSelect.length == 1) {
                            sql = "DL_TYPE = '" + dlTypeSelect[0] + "'";
                        } else {
                            sql = "DL_TYPE = '" + dlTypeSelect[0] + "'";
                            for (var num = 1; num < dlTypeSelect.length; num++) {
                                sql = sql + " or DL_TYPE = '" + dlTypeSelect[num] + "'";
                            }
                        }
                    }
                    var sqlArray = [];
                    sqlArray[layerIdValue] = sql;
                    gxSgLayer.setLayerDefinitions(sqlArray);
                },
                changeGxSearchValue: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeGxSearchValue执行成功！");
                    var querySearchUrl = "../proxy_to_92/GIS_SERVICE82/arcgis/rest/services/CITYROAD/ROAD_QUERY_SEARCH/MapServer";
                    var searchKey = $("#gxSearchInput").val();
                    var layerTypeValue = $("#gxXrfsRadio").find("input[type=\"radio\"]:checked").val();

                    var gxSgLayer;
                    var gxCjLayer;
                    if (lastLayerName == "道路覆盖指标") {
                        gxSgLayer = mapParent.getLayer("道路栅格覆盖指标");
                        gxCjLayer = mapParent.getLayer("道路场景覆盖指标");
                    } else if (lastLayerName == "道路语音指标") {
                        gxSgLayer = mapParent.getLayer("道路栅格语音指标");
                        gxCjLayer = mapParent.getLayer("道路场景语音指标");
                    } else if (lastLayerName == "道路数据指标") {
                        gxSgLayer = mapParent.getLayer("道路栅格数据指标");
                        gxCjLayer = mapParent.getLayer("道路场景数据指标");
                    } else if (lastLayerName == "道路业务指标") {
                        gxSgLayer = mapParent.getLayer("道路栅格业务指标");
                        gxCjLayer = mapParent.getLayer("道路场景业务指标");
                    } else if (lastLayerName == "道路事件类型") {
                        gxSgLayer = mapParent.getLayer("道路栅格事件类型");
                        gxCjLayer = mapParent.getLayer("道路场景事件类型");
                    } else if (lastLayerName == "道路场景得分") {
                        gxSgLayer = mapParent.getLayer("道路栅格场景得分");
                        gxCjLayer = mapParent.getLayer("道路场景场景得分");
                    }

                    if (searchKey) {
                        if (layerTypeValue == "SG") {
                            var sql = "CLIP_ID = '" +searchKey+"'";
                            var querytask = new QueryTask(urlRoute(querySearchUrl) + "/0");

                            var query = new Query();
                            query.where = sql;
                            query.outFields = ["*"];
                            query.returnGeometry = true;

                            querytask.execute(query, lang.hitch(mapParent, function (fset) {
                                if (fset.features.length > 0) {
                                    //进行缩放工作
                                    var extent = fset.features[0].geometry.getCentroid();
                                    mapParent.centerAt(extent);
                                    var simplePictureMarkerSymbol = new PictureMarkerSymbol('./widgets/Location/images/locate.gif', 30, 30);
                                    var graphic = new Graphic(extent, simplePictureMarkerSymbol);
                                    mapParent.graphics.clear();
                                    mapParent.graphics.add(graphic);
                                }
                                else {
                                    common.popupMessage("未查到此栅格，无法跳转！", "提示");
                                }
                            }))
                        } else {
                            var sql = "ROAD_ID = " + searchKey;
                            var querytask = new QueryTask(urlRoute(querySearchUrl) + "/1");

                            var query = new Query();
                            query.where = sql;
                            query.outFields = ["*"];
                            query.returnGeometry = true;

                            querytask.execute(query, lang.hitch(mapParent, function (fset) {
                                if (fset.features.length > 0) {
                                    //进行缩放工作
                                    var extent = fset.features[0].geometry.getCentroid();
                                    mapParent.centerAt(extent);
                                    var simplePictureMarkerSymbol = new PictureMarkerSymbol('./widgets/Location/images/locate.gif', 30, 30);
                                    var graphic = new Graphic(extent, simplePictureMarkerSymbol);
                                    mapParent.graphics.clear();
                                    mapParent.graphics.add(graphic);
                                }
                                else {
                                    common.popupMessage("未查到此道路，无法跳转！", "提示");
                                }
                            }))
                        }
                    }
                },
                clickGxJZTSBtn: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::clickGxJZTSBtn执行成功！");
                    var jztsLayer = mapParent.getLayer("城区道路集中投诉");
                    if (jztsLayer) {
                        if (jztsLayer.visible) {
                            jztsLayer.setVisibility(false);
                        } else {
                            jztsLayer.setVisibility(true);
                        }
                    }
                },
                changeGxZbfgSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeGxZbfgSelect执行成功！");
                    var toolsArray = $("#layerToolsBox").find("div[class=\"attrRow\"]");
                    var time_value = $("#gxSjld").find("input[type=\"radio\"]:checked").val()
                    var date = $("#gxDate").val().split("-");
                    var creatTimeSql = "1=2";
                    if (time_value == "day") {
                        $("#" + toolsArray[1].id).css("display", "block");
                        $("#" + toolsArray[2].id).css("display", "none");
                        $("#" + toolsArray[3].id).css("display", "none");

                        var selectTime = new Date(date[0] + "/" + date[1] + "/" + date[2]);
                        var selectTime1 = this.format(selectTime.getTime() + 1 * 24 * 60 * 60 * 1000, "yyyy-MM-dd");
                        creatTimeSql = "E_WO_CREATE_TIME > Date'" + date[0] + "-" + date[1] + "-" + date[2] + "' and E_WO_CREATE_TIME < Date'" + selectTime1 + "'";

                        date = date.join("");
                    } else if (time_value == "week") {
                        $("#" + toolsArray[1].id).css("display", "none");
                        $("#" + toolsArray[2].id).css("display", "block");
                        $("#" + toolsArray[3].id).css("display", "none");

                        var selectDate = $("#gxWDate").val().split("-");
                        var selectTime = new Date(selectDate[0].substring(0, 4) + "/" + selectDate[0].substring(4, 6) + "/" + selectDate[0].substring(6, 8));
                        selectTime = this.format(selectTime, "yyyy-MM-dd");

                        var selectTime1 = new Date(selectDate[1].substring(0, 4) + "/" + selectDate[1].substring(4, 6) + "/" + selectDate[1].substring(6, 8));
                        selectTime1 = this.format(selectTime1.getTime() + 1 * 24 * 60 * 60 * 1000, "yyyy-MM-dd");

                        creatTimeSql = "E_WO_CREATE_TIME > Date'" + selectTime + "' and E_WO_CREATE_TIME < Date'" + selectTime1 + "'";

                        date = "_W" + selectDate[0];
                    } else if (time_value == "month") {
                        $("#" + toolsArray[1].id).css("display", "none");
                        $("#" + toolsArray[2].id).css("display", "none");
                        $("#" + toolsArray[3].id).css("display", "block");

                        var selectDate = $("#gxMDate").val();

                        var selectTime = new Date(selectDate.substring(0, 4) + "/" + selectDate.substring(4, 6) + "/01");
                        var selectTime1 = this.format(selectTime.getTime() + (this.getMonthDays(selectTime.getMonth())) * 24 * 60 * 60 * 1000, "yyyy-MM-dd");

                        selectTime = this.format(selectTime, "yyyy-MM-dd");
                        creatTimeSql = "E_WO_CREATE_TIME > Date'" + selectTime + "' and E_WO_CREATE_TIME < Date'" + selectTime1 + "'";

                        date = "_M" + selectDate;
                    }

                    var layerIdValue = 0;
                    var gxSgLayer;
                    var gxCjLayer;
                    if (lastLayerName == "道路覆盖指标") {
                        layerIdValue = parseInt($("#gxFgzbZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格覆盖指标");
                        gxCjLayer = mapParent.getLayer("道路场景覆盖指标");
                    } else if (lastLayerName == "道路语音指标") {
                        layerIdValue = parseInt($("#gxVolteZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格语音指标");
                        gxCjLayer = mapParent.getLayer("道路场景语音指标");
                    } else if (lastLayerName == "道路数据指标") {
                        layerIdValue = parseInt($("#gxDataZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格数据指标");
                        gxCjLayer = mapParent.getLayer("道路场景数据指标");
                    } else if (lastLayerName == "道路业务指标") {
                        layerIdValue = parseInt($("#gxBusinessZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格业务指标");
                        gxCjLayer = mapParent.getLayer("道路场景业务指标");
                    } else if (lastLayerName == "道路事件类型") {
                        layerIdValue = parseInt($("#gxEventZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格事件类型");
                        gxCjLayer = mapParent.getLayer("道路场景事件类型");
                    } else if (lastLayerName == "道路场景得分") {
                        layerIdValue = parseInt($("#gxSocreZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("道路栅格场景得分");
                        gxCjLayer = mapParent.getLayer("道路场景场景得分");
                    }

                    var layerTypeValue = $("#gxXrfsRadio").find("input[type=\"radio\"]:checked").val()
                    var qxSgTableName = "GIS_DL_POI_KPI" + date;
                    var qxCjTableName = "GIS_DL_SCENE_KPI" + date;
                    var sgCellTableName = "GIS_DL_GRID_CELL" + date;
                    var sgCellLayer = mapParent.getLayer("城区道路关联小区");
                    var xwcell_sx = mapParent.getLayer("栅格覆盖现网小区");
                    var jztsLayer = mapParent.getLayer("城区道路集中投诉");

                    LayerUtil.changeLayerDynamicData(gxSgLayer, qxSgTableName, "GISDB238", null, true, layerIdValue);
                    LayerUtil.changeLayerDynamicData(gxCjLayer, qxCjTableName, "GISDB238", null, true, layerIdValue);
                    LayerUtil.changeLayerDynamicData(sgCellLayer, sgCellTableName, "GISDB238", null, true);
                    LayerUtil.changeLayerDynamicData(xwcell_sx, "GIS_OBJECT_LTESX" + $("#gxDate").val().replace(/-/g, ""), "CellThiess99", null, true);
                    jztsLayer.setLayerDefinitions([creatTimeSql]);

                    if (layerTypeValue == "SG") {
                        gxSgLayer.setVisibility(true);
                        gxCjLayer.setVisibility(false);
                        jztsLayer.setVisibility(false);
                        gxSgLayer.setVisibleLayers([layerIdValue]);
                        $("#" + toolsArray[7].id).css("display", "none");
                    } else {
                        gxSgLayer.setVisibility(false);
                        gxCjLayer.setVisibility(true);
                        gxCjLayer.setVisibleLayers([layerIdValue]);
                        $("#" + toolsArray[7].id).css("display", "block");
                    }

                    var dlTypeSelect = $("#gxRoadTypeSelect").val();
                    var sql = "1=1";
                    if (dlTypeSelect) {
                        if (dlTypeSelect.length == 1) {
                            sql = "DL_TYPE = '"+dlTypeSelect[0]+"'";
                        } else {
                            sql = "DL_TYPE = '" + dlTypeSelect[0] + "'";
                            for (var num = 1; num < dlTypeSelect.length; num++) {
                                sql = sql + " or DL_TYPE = '" + dlTypeSelect[num] + "'";
                            }
                        }
                    }
                    var sqlArray = [];
                    sqlArray[layerIdValue] = sql;
                    gxSgLayer.setLayerDefinitions(sqlArray);
                    gxCjLayer.setLayerDefinitions(sqlArray);

                },
                changCjpgReturnBtn: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changCjpgReturnBtn执行成功！");
                    $("#CjpgReturn").css("display", "none");
                    var sgCellLayer = mapParent.getLayer("场景评估关联小区");
                    var xwcell_sx = mapParent.getLayer("场景评估现网小区");

                    var layerIdValue = 0;
                    var gxSgLayer;
                    if (lastLayerName.indexOf("覆盖指标")>-1) {
                        layerIdValue = parseInt($("#cjpgFgzbZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("场景栅格覆盖指标");
                    } else if (lastLayerName.indexOf("语音指标") > -1) {
                        layerIdValue = parseInt($("#cjpgVolteZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("场景栅格语音指标");
                    } else if (lastLayerName.indexOf("数据指标") > -1) {
                        layerIdValue = parseInt($("#cjpgDataZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("场景栅格数据指标");
                    } else if (lastLayerName.indexOf("业务指标") > -1) {
                        layerIdValue = parseInt($("#cjpgBusinessZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("场景栅格业务指标");
                    }

                    sgCellLayer.setVisibility(false);
                    xwcell_sx.setVisibility(false);
                    var dlTypeSelect = $("#CjpgSceneTypeSelect").val();
                    var sql = "1=1";
                    if (dlTypeSelect) {
                        if (dlTypeSelect.length == 1) {
                            sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                        } else {
                            sql = "SCENE_TYPE = '" + dlTypeSelect[0] + "'";
                            for (var num = 1; num < dlTypeSelect.length; num++) {
                                sql = sql + " or SCENE_TYPE = '" + dlTypeSelect[num] + "'";
                            }
                        }
                    }
                    var sqlArray = [];
                    sqlArray[layerIdValue] = sql;
                    gxSgLayer.setLayerDefinitions(sqlArray);
                },
                changeCjpgSearchValue: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeCjpgSearchValue执行成功！");
                    var querySearchUrl = "../proxy_to_92/GIS_SERVICE82/arcgis/rest/services/CITYROAD/ROAD_QUERY_SEARCH/MapServer";
                    var searchKey = $("#cjpgSearchInput").val();
                    var layerTypeValue = $("#cjpgXrfsRadio").find("input[type=\"radio\"]:checked").val();

                    if (searchKey) {
                        if (layerTypeValue == "SG") {
                            var mgrs_Value = MGRS.USNGtoLL(searchKey);
                            topic.publish("map_centerAt", mgrs_Value[1]+0.00025, mgrs_Value[0]+0.00025);
                        } else {
                            var sql = "BM = " + searchKey;
                            var querytask = new QueryTask(urlRoute(querySearchUrl) + "/2");

                            var query = new Query();
                            query.where = sql;
                            query.outFields = ["*"];
                            query.returnGeometry = true;

                            querytask.execute(query, lang.hitch(mapParent, function (fset) {
                                if (fset.features.length > 0) {
                                    //进行缩放工作
                                    var extent = fset.features[0].geometry.getCentroid();
                                    mapParent.centerAt(extent);
                                    var simplePictureMarkerSymbol = new PictureMarkerSymbol('./widgets/Location/images/locate.gif', 30, 30);
                                    var graphic = new Graphic(extent, simplePictureMarkerSymbol);
                                    mapParent.graphics.clear();
                                    mapParent.graphics.add(graphic);
                                }
                                else {
                                    common.popupMessage("未查到此道路，无法跳转！", "提示");
                                }
                            }))
                        }
                    }
                },
                changeCjpgZbSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeCjpgZbSelect执行成功！");
                    var toolsArray = $("#layerToolsBox").find("div[class=\"attrRow\"]");
                    var time_value = $("#cjpgSjld").find("input[type=\"radio\"]:checked").val()
                    var date = $("#cjpgDate").val().split("-");
                    if (time_value == "day") {
                        $("#" + toolsArray[1].id).css("display", "block");
                        $("#" + toolsArray[2].id).css("display", "none");
                        $("#" + toolsArray[3].id).css("display", "none");
                        date = date.join("");
                    } else if (time_value == "week") {
                        $("#" + toolsArray[1].id).css("display", "none");
                        $("#" + toolsArray[2].id).css("display", "block");
                        $("#" + toolsArray[3].id).css("display", "none");
                        var selectDate = $("#cjpgWDate").val().split("-");
                        date = "_W" + selectDate[0];
                    } else if (time_value == "month") {
                        $("#" + toolsArray[1].id).css("display", "none");
                        $("#" + toolsArray[2].id).css("display", "none");
                        $("#" + toolsArray[3].id).css("display", "block");
                        var selectDate = $("#cjpgMDate").val();
                        date = "_M" + selectDate;
                    }

                    var layerIdValue = 0;
                    var eventTypeSql = "VLOTE_CON_FAIL_CNT>3";
                    var gxSgLayer;
                    var gxLyLayer;
                    var gxCjLayer;
                    if (lastLayerName == "场景覆盖指标") {
                        layerIdValue = parseInt($("#cjpgFgzbZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("场景栅格覆盖指标");
                        gxLyLayer = mapParent.getLayer("场景楼宇覆盖指标");
                        gxCjLayer = mapParent.getLayer("场景区域覆盖指标");
                    } else if (lastLayerName == "场景语音指标") {
                        layerIdValue = parseInt($("#cjpgVolteZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("场景栅格语音指标");
                        gxLyLayer = mapParent.getLayer("场景楼宇语音指标");
                        gxCjLayer = mapParent.getLayer("场景区域语音指标");
                    } else if (lastLayerName == "场景数据指标") {
                        layerIdValue = parseInt($("#cjpgDataZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("场景栅格数据指标");
                        gxLyLayer = mapParent.getLayer("场景楼宇数据指标");
                        gxCjLayer = mapParent.getLayer("场景区域数据指标");
                    } else if (lastLayerName == "场景业务指标") {
                        layerIdValue = parseInt($("#cjpgBusinessZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxSgLayer = mapParent.getLayer("场景栅格业务指标");
                        gxLyLayer = mapParent.getLayer("场景楼宇业务指标");
                        gxCjLayer = mapParent.getLayer("场景区域业务指标");
                    } else if (lastLayerName == "场景事件类型") {
                        eventTypeSql = $("#cjpgEventZbRadios").find("input[type=\"radio\"]:checked").val();
                        layerIdValue = 0;
                        gxSgLayer = mapParent.getLayer("场景栅格事件类型");
                        gxLyLayer = mapParent.getLayer("场景楼宇事件类型");
                    } else if (lastLayerName == "场景区域得分") {
                        layerIdValue = parseInt($("#cjpgScoreZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxCjLayer = mapParent.getLayer("场景区域得分评估");
                    } else if (lastLayerName == "场景价值评估") {
                        layerIdValue = parseInt($("#cjpgValueZbRadios").find("input[type=\"radio\"]:checked").val());
                        gxCjLayer = mapParent.getLayer("场景区域价值评估");
                    }

                    var layerTypeValue = $("#cjpgXrfsRadio").find("input[type=\"radio\"]:checked").val()
                    var qxSgTableName = "GIS_SCENE_EVA_GRID" + date;
                    var qxLyTableName = "GIS_SCENE_EVA_BUILD" + date;
                    var qxSgPntTableName = "GIS_SCENE_GRID_PNT" + date;
                    var qxLyPntTableName = "GIS_SCENE_BUILD_PNT" + date;
                    var qxCjTableName = "GIS_SCENE_EVA_SCENE" + date;
                    var sgCellTableName = "GIS_SCENE_EVA_CELL" + date;                    
                    var sgCellLayer = mapParent.getLayer("场景评估关联小区");
                    var xwcell_sx = mapParent.getLayer("场景评估现网小区");

                    if (lastLayerName == "场景事件类型") {
                        var dataSource = new TableDataSource();
                        dataSource.workspaceId = "GISDB238";
                        dataSource.dataSourceName = qxSgPntTableName;
                        var layerSource = new LayerDataSource();
                        layerSource.dataSource = dataSource;

                        gxSgLayer.setSource(layerSource);

                        var dataSource1 = new TableDataSource();
                        dataSource1.workspaceId = "GISDB238";
                        dataSource1.dataSourceName = qxLyPntTableName;
                        var layerSource1 = new LayerDataSource();
                        layerSource1.dataSource = dataSource1;

                        gxLyLayer.setSource(layerSource1);


                        topic.publish("tool_status_init", gxSgLayer);
                        topic.publish("tool_status_init", gxLyLayer);

                        //LayerUtil.changeLayerDynamicData(gxSgLayer, qxSgPntTableName, "GISDB238", null, true);
                        //LayerUtil.changeLayerDynamicData(gxLyLayer, qxLyPntTableName, "GISDB238", null, true);
                    }else if (lastLayerName != "场景区域得分" && lastLayerName != "场景价值评估") {
                        LayerUtil.changeLayerDynamicData(gxSgLayer, qxSgTableName, "GISDB238", null, true, layerIdValue);
                        LayerUtil.changeLayerDynamicData(gxLyLayer, qxLyTableName, "GISDB238", null, true, layerIdValue);
                    }
                    if (lastLayerName != "场景事件类型") {
                        LayerUtil.changeLayerDynamicData(gxCjLayer, qxCjTableName, "GISDB238", null, true, layerIdValue);
                    }
                    LayerUtil.changeLayerDynamicData(sgCellLayer, sgCellTableName, "GISDB238", null, true);
                    LayerUtil.changeLayerDynamicData(xwcell_sx, "GIS_OBJECT_LTESX" + $("#cjpgDate").val().replace(/-/g, ""), "CellThiess99", null, true);

                    if (layerTypeValue == "SG") {
                        if (lastLayerName == "场景事件类型") {
                            gxSgLayer.setVisibility(true);
                            gxLyLayer.setVisibility(false);
                        }else if (lastLayerName != "场景区域得分" && lastLayerName != "场景价值评估") {
                            gxSgLayer.setVisibility(true);
                            gxSgLayer.setVisibleLayers([layerIdValue]);
                            gxLyLayer.setVisibility(false);
                        }
                        if (lastLayerName != "场景事件类型") {
                            gxCjLayer.setVisibility(false);
                        }
                    } else if (layerTypeValue == "LY") {
                        if (lastLayerName == "场景事件类型") {
                            gxSgLayer.setVisibility(false);
                            gxLyLayer.setVisibility(true);
                        }else if (lastLayerName != "场景区域得分" && lastLayerName != "场景价值评估") {
                            gxSgLayer.setVisibility(false);
                            gxLyLayer.setVisibility(true);
                            gxLyLayer.setVisibleLayers([layerIdValue]);
                        }
                        if (lastLayerName != "场景事件类型") {
                            gxCjLayer.setVisibility(false);
                        }
                    } else {
                        if (lastLayerName != "场景区域得分" && lastLayerName != "场景价值评估") {
                            gxSgLayer.setVisibility(false);
                            gxLyLayer.setVisibility(false);
                        }
                        if(lastLayerName != "场景事件类型"){
                            gxCjLayer.setVisibility(true);
                            gxCjLayer.setVisibleLayers([layerIdValue]);
                        }
                    }

                    var sceneTypeSelect = $("#CjpgSceneTypeSelect").val();
                    var sql = "1=1";
                    if (sceneTypeSelect) {
                        if (sceneTypeSelect.length == 1) {
                            sql = "SCENE_TYPE = '" + sceneTypeSelect[0] + "'";
                        } else {
                            sql = "SCENE_TYPE = '" + sceneTypeSelect[0] + "'";
                            for (var num = 1; num < sceneTypeSelect.length; num++) {
                                sql = sql + " or SCENE_TYPE = '" + sceneTypeSelect[num] + "'";
                            }
                        }
                    }
                    var sqlArray = [];
                    sqlArray[layerIdValue] = sql;
                    var layerSql = "(" + eventTypeSql + ") and (" + sql + ")";
                    if (lastLayerName == "场景事件类型") {
                        if (layerTypeValue == "SG") {
                            gxSgLayer._where = layerSql;
                            gxSgLayer._visitedExtent = false;
                            gxSgLayer.updateClusters();
                        }else{
                            gxLyLayer._where = layerSql;
                            gxLyLayer._visitedExtent = false;
                            gxLyLayer.updateClusters();
                        }
                    }else if (lastLayerName != "场景区域得分" && lastLayerName != "场景价值评估") {
                        gxSgLayer.setLayerDefinitions(sqlArray);
                        gxLyLayer.setLayerDefinitions(sqlArray);
                    }                    
                    if (lastLayerName != "场景事件类型") {
                        gxCjLayer.setLayerDefinitions(sqlArray);
                    }

                },
                //价值地图--用户价值
                changeYhjzXuan: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeYhjzXuan执行成功！");
                    var toolsArray = $("#layerToolsBox").find("div[class=\"attrRow\"]");
                    var layerTypeValue = $("#yhjzXuanRanType").find("input[type=\"radio\"]:checked").val()
                    if (layerTypeValue == "用户价值栅格" || layerTypeValue == "用户价值楼宇") {
                        $("#" + toolsArray[4].id).css("display", "none");
                        $("#" + toolsArray[5].id).css("display", "block");
                    } else if (layerTypeValue == "用户价值场景" || layerTypeValue == "用户价值小区") {
                        $("#" + toolsArray[4].id).css("display", "block");
                        $("#" + toolsArray[5].id).css("display", "none");
                    }

                    var selectDate = $("#yhjzTimeSelect").val();
                    var sceneTypeSelect = $("#yhjzSceneTypeSelect").val();
                    var layerIdValue = 0;
                    var sql = "";
                    var sqlArray = [];
                    var tableName = "";
                    var jzSgLayer = mapParent.getLayer("用户价值栅格");
                    var jzLyLayer = mapParent.getLayer("用户价值楼宇");
                    var jzCjLayer = mapParent.getLayer("用户价值场景");
                    var jzXqLayer = mapParent.getLayer("用户价值小区");

                    jzSgLayer.setVisibility(false);
                    jzLyLayer.setVisibility(false);
                    jzCjLayer.setVisibility(false);
                    jzXqLayer.setVisibility(false);

                    if (layerTypeValue == "用户价值栅格") {
                        $("#yhjzTcdlCB").attr("disabled", false);
                        layerIdValue = parseInt($("#yhjzYhzdRadios").find("input[type=\"radio\"]:checked").val());

                        var tcdlVisible = $("#yhjzTcdlCB").attr("checked");
                        if (tcdlVisible) {
                            no_roadState = true;
                            tableName = "F_NO_ROAD_GRID_UTERMINAL_GIS";
                        } else {
                            tableName = "F_PREC_PLAN_GRID_UTERMINAL_GIS";
                        }

                        if (no_roadState) {
                            LayerUtil.changeLayerDynamicData(jzSgLayer, tableName, "sde238", null, true, layerIdValue);
                        }

                        sql = "DATE_ID=" + selectDate;
                        sqlArray[layerIdValue] = sql;
                        jzSgLayer.setLayerDefinitions(sqlArray);
                        jzSgLayer.setVisibility(true);
                        jzSgLayer.setVisibleLayers([layerIdValue]);
                    } else if (layerTypeValue == "用户价值楼宇") {
                        $("#yhjzTcdlCB").attr("disabled", true);
                        $("#yhjzTcdlCB").removeAttr("checked");
                        layerIdValue = parseInt($("#yhjzYhzdRadios").find("input[type=\"radio\"]:checked").val());
                        sql = "DATE_ID=" + selectDate;
                        sqlArray[layerIdValue] = sql;
                        jzLyLayer.setLayerDefinitions(sqlArray);
                        jzLyLayer.setVisibility(true);
                        jzLyLayer.setVisibleLayers([layerIdValue]);
                    } else if (layerTypeValue == "用户价值场景") {
                        $("#yhjzTcdlCB").attr("disabled", true);
                        $("#yhjzTcdlCB").removeAttr("checked");
                        layerIdValue = parseInt($("#yhjzYhsRadios").find("input[type=\"radio\"]:checked").val());
                        sql = "SCENE_TYPE='" + sceneTypeSelect + "' AND DATE_ID=" + selectDate;
                        sqlArray[layerIdValue] = sql;
                        jzCjLayer.setLayerDefinitions(sqlArray);
                        jzCjLayer.setVisibility(true);
                        jzCjLayer.setVisibleLayers([layerIdValue]);
                    } else if (layerTypeValue == "用户价值小区") {
                        $("#yhjzTcdlCB").attr("disabled", true);
                        $("#yhjzTcdlCB").removeAttr("checked");
                        layerIdValue = parseInt($("#yhjzYhsRadios").find("input[type=\"radio\"]:checked").val());
                        sql = "TIME=" + selectDate;
                        sqlArray[layerIdValue] = sql;
                        jzXqLayer.setLayerDefinitions(sqlArray);
                        jzXqLayer.setVisibility(true);
                        jzXqLayer.setVisibleLayers([layerIdValue]);
                    }

                },
                //价值地图--综合价值
                changeZhjzXuan: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeZhjzXuan执行成功！");
                    var layerTypeValue = $("#zhjzXuanRanType").find("input[type=\"radio\"]:checked").val()
                    var selectDate = $("#zhjzTimeSelect").val();
                    var sceneTypeSelect = $("#zhjzSceneTypeSelect").val();
                    var layerIdValue = 0;
                    var sql = "";
                    var sqlArray = [];
                    var tableName = "";
                    var jzSgLayer = mapParent.getLayer("综合价值栅格");
                    var jzLyLayer = mapParent.getLayer("综合价值楼宇");
                    var jzCjLayer = mapParent.getLayer("综合价值场景");
                    var jzXqLayer = mapParent.getLayer("综合价值小区");

                    jzSgLayer.setVisibility(false);
                    jzLyLayer.setVisibility(false);
                    jzCjLayer.setVisibility(false);
                    jzXqLayer.setVisibility(false);

                    if (layerTypeValue == "综合价值栅格") {
                        $("#zhjzRadio1").attr("disabled", false);
                        $("#zhjzRadio2").attr("disabled", false);
                        $("#zhjzRadio3").attr("disabled", false);
                        $("#zhjzRadio4").attr("disabled", false);
                        $("#zhjzTcdlCB").attr("disabled", false);
                        layerIdValue = parseInt($("#zhjzXuanRanRadios").find("input[type=\"radio\"]:checked").val());

                        var tcdlVisible = $("#zhjzTcdlCB").attr("checked");
                        if (tcdlVisible) {
                            no_roadState = true;
                            tableName = "F_NO_ROAD_GRID_HIGH_GIS";
                        } else {
                            tableName = "F_PREC_PLAN_GRID_HIGH_GIS";
                        }

                        if (no_roadState) {
                            LayerUtil.changeLayerDynamicData(jzSgLayer, tableName, "sde238", null, true, layerIdValue);
                        }

                        sql = "DATE_ID=" + selectDate;
                        sqlArray[layerIdValue] = sql;
                        jzSgLayer.setLayerDefinitions(sqlArray);
                        jzSgLayer.setVisibility(true);
                        jzSgLayer.setVisibleLayers([layerIdValue]);
                    } else if (layerTypeValue == "综合价值楼宇") {
                        $("#zhjzRadio1").attr("disabled", false);
                        $("#zhjzRadio2").attr("disabled", false);
                        $("#zhjzRadio3").attr("disabled", false);
                        $("#zhjzRadio4").attr("disabled", false);
                        $("#zhjzTcdlCB").attr("disabled", true);
                        $("#zhjzTcdlCB").removeAttr("checked");
                        layerIdValue = parseInt($("#zhjzXuanRanRadios").find("input[type=\"radio\"]:checked").val());
                        sql = "DATE_ID=" + selectDate;
                        sqlArray[layerIdValue] = sql;
                        jzLyLayer.setLayerDefinitions(sqlArray);
                        jzLyLayer.setVisibility(true);
                        jzLyLayer.setVisibleLayers([layerIdValue]);
                    } else if (layerTypeValue == "综合价值场景") {
                        $("#zhjzRadio0").attr("checked", "checked");
                        $("#zhjzRadio1").attr("disabled", true);
                        $("#zhjzRadio2").attr("disabled", true);
                        $("#zhjzRadio3").attr("disabled", true);
                        $("#zhjzRadio4").attr("disabled", true);
                        $("#zhjzTcdlCB").attr("disabled", true);
                        $("#zhjzTcdlCB").removeAttr("checked");
                        layerIdValue = parseInt($("#zhjzXuanRanRadios").find("input[type=\"radio\"]:checked").val());
                        sql = "SCENE_TYPE='" + sceneTypeSelect + "' AND DATE_ID=" + selectDate;
                        sqlArray[layerIdValue] = sql;
                        jzCjLayer.setLayerDefinitions(sqlArray);
                        jzCjLayer.setVisibility(true);
                        jzCjLayer.setVisibleLayers([layerIdValue]);
                    } else if (layerTypeValue == "综合价值小区") {
                        $("#zhjzRadio0").attr("checked", "checked");
                        $("#zhjzRadio1").attr("disabled", true);
                        $("#zhjzRadio2").attr("disabled", true);
                        $("#zhjzRadio3").attr("disabled", true);
                        $("#zhjzRadio4").attr("disabled", true);
                        $("#zhjzTcdlCB").attr("disabled", true);
                        $("#zhjzTcdlCB").removeAttr("checked");
                        layerIdValue = parseInt($("#zhjzXuanRanRadios").find("input[type=\"radio\"]:checked").val());
                        sql = "TIME=" + selectDate;
                        sqlArray[layerIdValue] = sql;
                        jzXqLayer.setLayerDefinitions(sqlArray);
                        jzXqLayer.setVisibility(true);
                        jzXqLayer.setVisibleLayers([layerIdValue]);
                    }                    
                },
                gsmPdSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::gsmPdSelect执行成功！");
                    var value = $("#gsmPdRadioBtn").find("input[type=\"radio\"]:checked").val()
                    var gsmPdDate = $("#gsmPdDate").val();
                    var gsmPdLayer = mapParent.getLayer("GSM频点专题");
                    var pdTable = "";

                    if (value=="SX") {
                        pdTable = "GIS_OBJECT_GSMSX" + gsmPdDate.replace(/-/g, "");
                    }else{
                        pdTable = "GIS_CELL_TSSPOLY_GSM" + gsmPdDate.replace(/-/g, "");
                    }
                    LayerUtil.changeLayerDynamicData(gsmPdLayer, pdTable, "Thiess99", null, true);

                    var selectPd = parseInt($("#gsmPdInput").val());
                    var selectSql = "( BCCH=" + (selectPd - 1) + " or BCCH=" + selectPd + " or BCCH=" + (selectPd + 1) + ") or (','+TCH+',' like '%," + (selectPd - 1) + ",%' or ','+TCH+',' like '%," + selectPd + ",%' or ','+TCH+',' like '%," + (selectPd + 1) + ",%')";
                    
                    if (mapParent.getLayer("gsmPdhighlightLayer")) {
                        mapParent.removeLayer(mapParent.getLayer("gsmPdhighlightLayer"));
                    }
                    if (mapParent.getLayer("gsm频点专题渲染")) {
                        mapParent.removeLayer(mapParent.getLayer("gsm频点专题渲染"));
                    }

                    var featureCollection = {
                        "layerDefinition": {
                            "geometryType": "esriGeometryPolygon",
                            "objectIdField": "ObjectID",
                            "fields": [{
                                "name": "ObjectID",
                                "alias": "ObjectID",
                                "type": "esriFieldTypeOID"
                            }, {
                                "name": "grid",
                                "alias": "grid",
                                "type": "esriFieldTypeString"
                            }]
                        }
                    };

                    pdhighlightLayer1 = new FeatureLayer(featureCollection, {
                        id: "gsm频点专题渲染",
                        outFields: ["*"]
                    });
                    pdhighlightLayer = new GraphicsLayer({ "id": "gsmPdhighlightLayer" });

                    var defaultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([178, 178, 178, 255]));
                    var Symbol1 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([255, 0, 0, 255]));
                    var Symbol2 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([255, 255, 0, 255]));
                    var Symbol3 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([0, 0, 255, 255]));
                    var Symbol4 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([255, 69, 0, 255]));
                    var Symbol5 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([255, 215, 0, 255]));
                    var Symbol6 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([0, 191, 255, 255]));
                    var selectRenderer = new UniqueValueRenderer(defaultSymbol, "BCCH");
                    selectRenderer.addValue({ value: "2", symbol: Symbol2, label: "BCCH=" + (selectPd - 1), description: "" });
                    selectRenderer.addValue({ value: "1", symbol: Symbol1, label: "BCCH=" + (selectPd), description: "" });
                    selectRenderer.addValue({ value: "3", symbol: Symbol3, label: "BCCH=" + (selectPd + 1), description: "" });
                    selectRenderer.addValue({ value: "4", symbol: Symbol4, label: "TCH=" + (selectPd - 1), description: "" });
                    selectRenderer.addValue({ value: "5", symbol: Symbol5, label: "TCH=" + (selectPd), description: "" });
                    selectRenderer.addValue({ value: "6", symbol: Symbol6, label: "TCH=" + (selectPd + 1), description: "" });
                    pdhighlightLayer1.setRenderer(selectRenderer);
                    var jimuLayerInfos = LayerInfos.getInstanceSync();
                    var jimuLayerInfoArray = jimuLayerInfos.getLayerInfoArray();
                    for (var i = 0; i < jimuLayerInfoArray.length; i++) {
                        if (jimuLayerInfoArray[i].id == "gsm频点专题渲染") {
                            jimuLayerInfos._finalLayerInfos[i].layerObject.setRenderer(selectRenderer);
                            jimuLayerInfos._finalLayerInfos[i].layerObject.setVisibility(true);
                            break;
                        }
                    }

                    var query = new Query();
                    query.where = selectSql;
                    query.outFields = ["*"];
                    query.returnGeometry = true;
                    query.geometry = mapParent.extent;
                    query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;

                    var options =
                    {
                        source: gsmPdLayer.dynamicLayerInfos[0].source
                    };
                    var querytask = new QueryTask(urlRoute(gsmPdLayer.url) + "/dynamicLayer", options);

                    if (gsmPdLayer && $("#gsmPdInput").val()) {
                        var mapDiv = document.getElementById("map_layers");
                        mapDiv.style.cursor = "wait";
                        topic.publish("load_Changed_start");
                        querytask.execute(query, lang.hitch(mapParent, function (fset) {
                            if (fset.features.length > 0 && gsmPdLayer.visible) {
                                for (var i= 0; i < fset.features.length; i++) {
                                    if (fset.features[i].attributes.BCCH == selectPd - 1) {
                                        fset.features[i].setSymbol(Symbol2);
                                    } else if (fset.features[i].attributes.BCCH == selectPd) {
                                        fset.features[i].setSymbol(Symbol1);
                                    } else if (fset.features[i].attributes.BCCH == selectPd + 1) {
                                        fset.features[i].setSymbol(Symbol3);
                                    } else if (fset.features[i].attributes.TCH == selectPd - 1) {
                                        fset.features[i].setSymbol(Symbol4);
                                    } else if (fset.features[i].attributes.TCH == selectPd) {
                                        fset.features[i].setSymbol(Symbol5);
                                    } else if (fset.features[i].attributes.TCH == selectPd + 1) {
                                        fset.features[i].setSymbol(Symbol6);
                                    }
                                    pdhighlightLayer.add(fset.features[i]);
                                }
                                if (!mapParent.getLayer("gsmPdhighlightLayer")) {
                                    mapParent.addLayer(pdhighlightLayer);
                                }
                                if (!mapParent.getLayer("gsm频点专题渲染")) {
                                    mapParent.addLayer(pdhighlightLayer1);
                                }
                            }
                            var mapDiv = document.getElementById("map_layers");
                            mapDiv.style.cursor = "default";
                            topic.publish("load_Changed_end");
                        }))
                    }
                },
                changTDPdXrzbSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changTDPdXrzbSelect执行成功！");
                    var tdPdXrzb = $("#tdPdXrzb").val();
                    var td_pds = ['9405', '9413', '9421', '9427', '9429', '9437', '9445', '9453', '9455', '9463', '9471', '9479', '9487', '9495', '9505', '9513', '9521', '9529', '9530', '9537', '9538', '9545', '9553', '9555', '9561', '9563', '9569', '9571', '10054', '10055', '10060', '10062', '10063', '10066', '10070', '10071', '10072', '10077', '10079', '10080', '10082', '10084', '10088', '10092', '10096', '10100', '10102', '10104', '10107', '10112', '10114', '10120', '10121'];
                    var td_zrms = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '123', '124', '125', '126', '127'];

                    if (tdPdXrzb == "RNCAG04#equal#unique#query") {
                        $("#tdPdInput").autocomplete({
                            source: td_pds
                        });
                    } else if (tdPdXrzb == "PRIMARYSCRAMBLINGCODE#equal#unique#query") {
                        $("#tdPdInput").autocomplete({
                            source: td_zrms
                        });
                    } else if (tdPdXrzb == "SUBCARRIER#like#array#query#/") {
                        $("#tdPdInput").autocomplete({
                            source: td_pds
                        });
                    }
                },
                tdPdSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::tdPdSelect执行成功！");
                    var value = $("#tdPdRadioBtn").find("input[type=\"radio\"]:checked").val()
                    var tdPdDate = $("#tdPdDate").val();
                    var tdPdLayer = mapParent.getLayer("TD频点专题");
                    var tdPdXrzb = $("#tdPdXrzb").val();
                    var pdTable = "";

                    if (value == "SX") {
                        pdTable = "GIS_OBJECT_TDSX" + tdPdDate.replace(/-/g, "");
                    } else {
                        pdTable = "GIS_CELL_TSSPOLY_TD" + tdPdDate.replace(/-/g, "");
                    }
                    LayerUtil.changeLayerDynamicData(tdPdLayer, pdTable, "Thiess99", null, true);

                    var selectPd = parseInt($("#tdPdInput").val());
                    var selectSql = "";
                    if (tdPdXrzb == "RNCAG04#equal#unique#query") {
                        selectSql = "RNCAG04 = " + selectPd;
                    } else if (tdPdXrzb == "PRIMARYSCRAMBLINGCODE#equal#unique#query") {
                        selectSql = "PRIMARYSCRAMBLINGCODE = " + selectPd;
                    } else if (tdPdXrzb == "SUBCARRIER#like#array#query#/") {
                        selectSql = "'/'+SUBCARRIER+'/' like '%/" + selectPd + "/%'";
                    }

                    if (mapParent.getLayer("td频点专题渲染")) {
                        mapParent.removeLayer(mapParent.getLayer("td频点专题渲染"));
                    }

                    var featureCollection = {
                        "layerDefinition": {
                            "geometryType": "esriGeometryPolygon",
                            "objectIdField": "ObjectID",
                            "fields": [{
                                "name": "ObjectID",
                                "alias": "ObjectID",
                                "type": "esriFieldTypeOID"
                            }, {
                                "name": "grid",
                                "alias": "grid",
                                "type": "esriFieldTypeString"
                            }]
                        }
                    };

                    pdhighlightLayer = new FeatureLayer(featureCollection, {
                        id: "td频点专题渲染",
                        outFields: ["*"]
                    });

                    //pdhighlightLayer = new GraphicsLayer({ "id": "tdPdhighlightLayer" });

                    var defaultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([178, 178, 178, 255]));
                    var Symbol1 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([255, 0, 0, 255]));
                    var selectRenderer = new SimpleRenderer(Symbol1);
                    var jimuLayerInfos = LayerInfos.getInstanceSync();
                    var jimuLayerInfoArray = jimuLayerInfos.getLayerInfoArray();
                    for (var i = 0; i < jimuLayerInfoArray.length; i++) {
                        if (jimuLayerInfoArray[i].id == "td频点专题渲染") {
                            //jimuLayerInfos._finalLayerInfos[i].layerObject.setRenderer(selectRenderer);
                            jimuLayerInfos._finalLayerInfos[i].layerObject.setVisibility(true);
                            break;
                        }
                    }

                    var query = new Query();
                    query.where = selectSql;
                    query.outFields = ["*"];
                    query.returnGeometry = true;
                    query.geometry = mapParent.extent;
                    query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;

                    var options =
                    {
                        source: tdPdLayer.dynamicLayerInfos[0].source
                    };
                    var querytask = new QueryTask(urlRoute(tdPdLayer.url) + "/dynamicLayer", options);

                    if (tdPdLayer && $("#tdPdInput").val()) {
                        var mapDiv = document.getElementById("map_layers");
                        mapDiv.style.cursor = "wait";
                        topic.publish("load_Changed_start");
                        querytask.execute(query, lang.hitch(mapParent, function (fset) {
                            if (fset.features.length > 0 && tdPdLayer.visible) {
                                var drawFeatures = [];
                                var attr = {};
                                for (var i = 0; i < fset.features.length; i++) {
                                    var graphic = new Graphic(fset.features[i].geometry);
                                    attr["ObjectID"] = fset.features[i].attributes.OBJECTID;
                                    attr["grid"] = fset.features[i].attributes.RNCAG04.toString();
                                    graphic.setAttributes(attr);
                                    drawFeatures.push(graphic);
                                }
                                pdhighlightLayer.setRenderer(selectRenderer);
                                if (!mapParent.getLayer("td频点专题渲染")) {
                                    mapParent.addLayer(pdhighlightLayer);
                                }
                                pdhighlightLayer.applyEdits(drawFeatures, null, null);                                
                            }
                            var mapDiv = document.getElementById("map_layers");
                            mapDiv.style.cursor = "default";
                            topic.publish("load_Changed_end");
                        }))
                    }
                },
                changLtePdXrzbSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changLtePdXrzbSelect执行成功！");
                    var ltePdXrzb = $("#ltePdXrzb").val();
                    var lte_wlxqsbms = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '123', '124', '125', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144', '145', '146', '147', '148', '149', '150', '151', '152', '153', '154', '155', '156', '157', '158', '159', '160', '161', '162', '163', '164', '165', '166', '167', '168', '169', '170', '171', '172', '173', '174', '175', '176', '177', '178', '179', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '190', '191', '192', '193', '194', '195', '196', '197', '198', '199', '200', '201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212', '213', '214', '215', '216', '217', '218', '219', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '259', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '270', '271', '272', '273', '274', '275', '276', '277', '278', '279', '280', '281', '282', '283', '284', '285', '286', '287', '288', '289', '290', '291', '292', '293', '294', '295', '296', '297', '298', '299', '300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324', '325', '326', '327', '328', '329', '330', '331', '332', '333', '334', '335', '336', '337', '338', '339', '340', '341', '342', '343', '344', '345', '346', '347', '348', '349', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '360', '361', '362', '363', '364', '365', '366', '367', '368', '369', '370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '384', '385', '386', '387', '388', '389', '390', '391', '392', '393', '394', '395', '396', '397', '398', '399', '400', '401', '402', '403', '404', '405', '406', '407', '408', '409', '410', '411', '412', '413', '414', '415', '416', '417', '418', '419', '420', '421', '422', '423', '424', '425', '426', '427', '428', '429', '430', '431', '432', '433', '434', '435', '436', '437', '438', '439', '440', '441', '442', '443', '444', '445', '446', '447', '448', '449', '450', '451', '452', '453', '454', '455', '456', '457', '458', '459', '460', '461', '462', '463', '464', '465', '466', '467', '468', '469', '470', '471', '472', '473', '474', '475', '476', '477', '478', '479', '480', '481', '482', '483', '484', '485', '486', '487', '488', '489', '490', '491', '492', '493', '494', '495', '496', '497', '498', '499', '500', '501', '502', '503'];
                    var lte_zxzpxdh = ['38098', '38496', '38544', '38550', '38950', '39148', '39292', '40540', '40738', '40936'];

                    if (ltePdXrzb == "ENBAJ09#equal#unique#query##isMod") {
                        $("#ltePdInput").autocomplete({
                            source: lte_wlxqsbms
                        });
                    } else if (ltePdXrzb == "ENBAJ18#equal#unique#query##isExtent") {
                        $("#ltePdInput").autocomplete({
                            source: lte_zxzpxdh
                        });
                    }
                },
                ltePdSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::ltePdSelect执行成功！");
                    var value = $("#ltePdRadioBtn").find("input[type=\"radio\"]:checked").val()
                    var ltePdDate = $("#ltePdDate").val();
                    var ltePdLayer = mapParent.getLayer("LTE频点专题");
                    var ltePdXrzb = $("#ltePdXrzb").val();
                    var lteTable = "";

                    if (value == "SX") {
                        lteTable = "GIS_OBJECT_LTESX" + ltePdDate.replace(/-/g, "");
                    } else {
                        lteTable = "GIS_CELL_TSSPOLY_LTE" + ltePdDate.replace(/-/g, "");
                    }
                    LayerUtil.changeLayerDynamicData(ltePdLayer, lteTable, "Thiess99", null, true);

                    var selectPd = parseInt($("#ltePdInput").val());
                    var mod3 = parseInt(selectPd) % 3;
                    var mod6 = parseInt(selectPd) % 6;
                    var mod30 = parseInt(selectPd) % 30;
                    var selectSql = "";
                    if (ltePdXrzb == "ENBAJ09#equal#unique#query##isMod") {
                        selectSql = "(ENBAJ09%3=" + mod3 + ") or (ENBAJ09%6=" + mod6 + ") or (ENBAJ09%30=" + mod30+")";
                    } else if (ltePdXrzb == "ENBAJ18#equal#unique#query##isExtent") {
                        selectSql = "ENBAJ18 = " + selectPd;
                    }

                    var definitionExpression1 = "";
                    var timesType1 = true;

                    $.each($("input[type=\"checkbox\"][name=\"ltePdCheck\"]:checked"), function () {
                        definitionExpression1 += (timesType1 ? "(" : " or(") + $(this).val()+")";
                        timesType1 = false;
                    });

                    if (definitionExpression1=="") {
                        definitionExpression1 = "1=2"
                    }

                    if (mapParent.getLayer("ltePdhighlightLayer")) {
                        mapParent.removeLayer(mapParent.getLayer("ltePdhighlightLayer"));
                    }
                    if (mapParent.getLayer("lte频点专题渲染")) {
                        mapParent.removeLayer(mapParent.getLayer("lte频点专题渲染"));
                    }

                    var featureCollection = {
                        "layerDefinition": {
                            "geometryType": "esriGeometryPolygon",
                            "objectIdField": "ObjectID",
                            "fields": [{
                                "name": "ObjectID",
                                "alias": "ObjectID",
                                "type": "esriFieldTypeOID"
                            }, {
                                "name": "grid",
                                "alias": "grid",
                                "type": "esriFieldTypeString"
                            }]
                        }
                    };

                    pdhighlightLayer1 = new FeatureLayer(featureCollection, {
                        id: "lte频点专题渲染",
                        outFields: ["*"]
                    });
                    pdhighlightLayer = new GraphicsLayer({ "id": "ltePdhighlightLayer" });

                    var defaultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([178, 178, 178, 255]));
                    var Symbol1 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([255, 0, 0, 255]));
                    var Symbol2 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([255, 215, 0, 255]));
                    var Symbol3 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([0, 0, 255, 255]));
                    var Symbol4 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 255]), 1), new Color([255, 0, 255, 255]));

                    var query = new Query();
                    query.where = "(" + selectSql + ") and (" + definitionExpression1+")";
                    query.outFields = ["*"];
                    query.returnGeometry = true;
                    query.geometry = mapParent.extent;
                    query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;

                    var options =
                    {
                        source: ltePdLayer.dynamicLayerInfos[0].source
                    };
                    var querytask = new QueryTask(urlRoute(ltePdLayer.url) + "/dynamicLayer", options);

                    if (ltePdLayer && $("#ltePdInput").val()) {
                        var mapDiv = document.getElementById("map_layers");
                        mapDiv.style.cursor = "wait";
                        topic.publish("load_Changed_start");
                        querytask.execute(query, lang.hitch(mapParent, function (fset) {
                            if (fset.features.length > 0 && ltePdLayer.visible) {
                                if (ltePdXrzb == "ENBAJ09#equal#unique#query##isMod") {
                                    var selectRenderer = new UniqueValueRenderer(defaultSymbol, "ENBAJ09");
                                    selectRenderer.addValue({ value: "1", symbol: Symbol1, label: ""+selectPd, description: "" });
                                    selectRenderer.addValue({ value: "4", symbol: Symbol4, label: "MOD3", description: "" });
                                    selectRenderer.addValue({ value: "3", symbol: Symbol3, label: "MOD6", description: "" });
                                    selectRenderer.addValue({ value: "2", symbol: Symbol2, label: "MOD30", description: "" });
                                    pdhighlightLayer1.setRenderer(selectRenderer);
                                    var jimuLayerInfos = LayerInfos.getInstanceSync();
                                    var jimuLayerInfoArray = jimuLayerInfos.getLayerInfoArray();
                                    for (var i = 0; i < jimuLayerInfoArray.length;i++){
                                        if (jimuLayerInfoArray[i].id == "lte频点专题渲染") {
                                            jimuLayerInfos._finalLayerInfos[i].layerObject.setRenderer(selectRenderer);
                                            jimuLayerInfos._finalLayerInfos[i].layerObject.setVisibility(true);
                                            break;
                                        }
                                    }
                                    for (var i = 0; i < fset.features.length; i++) {
                                        var ENBAJ09 = fset.features[i].attributes.ENBAJ09;
                                        if (ENBAJ09 == selectPd) {
                                            fset.features[i].setSymbol(Symbol1);
                                        } else {
                                            if (ENBAJ09 % 3 == mod3) {
                                                fset.features[i].setSymbol(Symbol4);
                                            }
                                            if (ENBAJ09 % 6 == mod6) {
                                                fset.features[i].setSymbol(Symbol3);
                                            }
                                            if (ENBAJ09 % 30 == mod30) {
                                                fset.features[i].setSymbol(Symbol2);
                                            }
                                        }
                                        pdhighlightLayer.add(fset.features[i]);
                                    }
                                }else{
                                    for (var i = 0; i < fset.features.length; i++) {
                                        fset.features[i].setSymbol(Symbol1);
                                        pdhighlightLayer.add(fset.features[i]);
                                    }
                                    var selectRenderer = new SimpleRenderer(Symbol1);
                                    pdhighlightLayer1.setRenderer(selectRenderer);
                                    var jimuLayerInfos = LayerInfos.getInstanceSync();
                                    var jimuLayerInfoArray = jimuLayerInfos.getLayerInfoArray();
                                    for (var i = 0; i < jimuLayerInfoArray.length; i++) {
                                        if (jimuLayerInfoArray[i].id == "lte频点专题渲染") {
                                            jimuLayerInfos._finalLayerInfos[i].layerObject.setRenderer(selectRenderer);
                                            jimuLayerInfos._finalLayerInfos[i].layerObject.setVisibility(true);
                                            break;
                                        }
                                    }
                                }
                                if (!mapParent.getLayer("ltePdhighlightLayer")) {
                                    mapParent.addLayer(pdhighlightLayer);
                                }
                                if (!mapParent.getLayer("lte频点专题渲染")) {
                                    mapParent.addLayer(pdhighlightLayer1);
                                }
                            }
                            var mapDiv = document.getElementById("map_layers");
                            mapDiv.style.cursor = "default";
                            topic.publish("load_Changed_end");
                        }))
                    }
                },
                changeRegionSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeRegionSelect执行成功！");
                    var cityName = $("#layerCitySelect").val();
                    var countyName = $("#layerCountySelect").val();
                    topic.publish("XZQH_Nacigation", cityName, countyName);
                },
                changeRLYCSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeRLYCSelect执行成功！");
                    var rlycDate = $("#xqrlycSelect").val();
                    var rlycZB = $("#rlycZbSelect").val();
                    var value = $("#rlycRadio").find("input[type=\"radio\"]:checked").val()
                    var rlyc_krLayer = mapParent.getLayer("容量预测_扩容");
                    var rlyc_xqLayer = mapParent.getLayer("容量预测_需求");


                    var tableName = value + rlycDate;
                    LayerUtil.changeLayerDynamicData(rlyc_krLayer, tableName, "GISDB238", null, true);
                    LayerUtil.changeLayerDynamicData(rlyc_xqLayer, tableName, "GISDB238", null, true);

                    if (rlycZB == "容量预测_扩容") {
                        rlyc_krLayer.setVisibility(true);
                        rlyc_xqLayer.setVisibility(false);
                    } else {
                        rlyc_krLayer.setVisibility(false);
                        rlyc_xqLayer.setVisibility(true);
                    }

                },
                changCRANLineState: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changCRANLineState执行成功！");

                    var cranLineVisible = $("#cranLineCB").attr("checked");
                    var cranJfVisible = $("#cranJfCB").attr("checked");
                    var cranCellVisible = $("#cranCellCB").attr("checked");
                    var cranJfLayer = mapParent.getLayer("CRAN机房点");
                    var cranCellLayer = mapParent.getLayer("CRAN基站点");

                    if (cranLineVisible) {
                        cranJfLayer.setVisibility(true);
                        cranCellLayer.setVisibility(true);
                        cranJfLayer.setImageFormat("png8|true", false);
                    } else if (!cranLineVisible && cranJfVisible && cranCellVisible) {
                        cranJfLayer.setVisibility(true);
                        cranCellLayer.setVisibility(true);
                        cranJfLayer.setImageFormat("png8", false);
                    } else if (!cranLineVisible && cranJfVisible) {
                        cranJfLayer.setVisibility(true);
                        cranCellLayer.setVisibility(false);
                        cranJfLayer.setImageFormat("png8", false);
                    } else if (!cranLineVisible && cranCellVisible) {
                        cranJfLayer.setVisibility(false);
                        cranCellLayer.setVisibility(true);
                        cranJfLayer.setImageFormat("png8", false);
                    } else {
                        cranJfLayer.setVisibility(false);
                        cranCellLayer.setVisibility(false);
                        cranJfLayer.setImageFormat("png8", false);
                    }
                },
                chang5GCRANLineState: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::chang5GCRANLineState执行成功！");

                    var cranLineVisible = $("#5gcranLineCB").attr("checked");
                    var cranJfVisible = $("#5gcranJfCB").attr("checked");
                    var cranCellVisible = $("#5gcranCellCB").attr("checked");
                    var cranJfLayer = mapParent.getLayer("5GCRAN机房点");
                    var cranCellLayer = mapParent.getLayer("5GCRAN基站点");
                    var cranAllLayer = mapParent.getLayer("CRAN覆盖图层");

                    if (cranLineVisible) {
                        cranJfLayer.setVisibility(true);
                        cranCellLayer.setVisibility(true);
                        cranJfLayer.setImageFormat("png8|true", false);
                    } else if (!cranLineVisible && cranJfVisible && cranCellVisible) {
                        cranJfLayer.setVisibility(true);
                        cranCellLayer.setVisibility(true);
                        cranJfLayer.setImageFormat("png8", false);
                    } else if (!cranLineVisible && cranJfVisible) {
                        cranJfLayer.setVisibility(true);
                        cranCellLayer.setVisibility(false);
                        cranJfLayer.setImageFormat("png8", false);
                    } else if (!cranLineVisible && cranCellVisible) {
                        cranJfLayer.setVisibility(false);
                        cranCellLayer.setVisibility(true);
                        cranJfLayer.setImageFormat("png8", false);
                    } else {
                        cranJfLayer.setVisibility(false);
                        cranCellLayer.setVisibility(false);
                        cranJfLayer.setImageFormat("png8", false);
                    }

                    var layerIdValue = [];
                    $.each($("input[type=\"checkbox\"][name=\"cranAllCB\"]:checked"), function () {
                        layerIdValue.push($(this).val());
                    });
                    if (layerIdValue.length > 0) {
                        cranAllLayer.setVisibleLayers(layerIdValue);
                        cranAllLayer.setVisibility(true);
                    } else {
                        cranAllLayer.setVisibility(false);
                    }
                },
                chang5GCSLayerState: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::chang5GCSLayerState执行成功！");

                    var cranAllLayer = mapParent.getLayer("传输图层");

                    var layerIdValue = [];
                    $.each($("input[type=\"checkbox\"][name=\"csAllCB\"]:checked"), function () {
                        layerIdValue.push($(this).val());
                    });
                    if (layerIdValue.length > 0) {
                        cranAllLayer.setVisibleLayers(layerIdValue);
                        cranAllLayer.setVisibility(true);
                    } else {
                        cranAllLayer.setVisibility(false);
                    }
                },
                changeSSJKSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeSSJKSelect执行成功！");

                    var lszdjkLayer = mapParent.getLayer("流失站点");
                    var gzzdjkLayer = mapParent.getLayer("故障站点");
                    var celltfLayer = mapParent.getLayer("小区退服");
                    var zbjzLayer = mapParent.getLayer("重保基站");
                    var tdjzLayer = mapParent.getLayer("停电基站");
                    var timesType1 = true;
                    var definitionExpression1 = "";
                    var timesType2 = true;
                    var definitionExpression2 = "";


                    $.each($("input[type=\"checkbox\"][name=\"ssjkNetType\"]:checked"), function () {
                        definitionExpression1 += (timesType1 ? "" : " or") + " NET_TYPE = '" + $(this).val() + "'";
                        timesType1 = false;
                    });

                    $.each($("input[type=\"checkbox\"][name=\"zbjzFalutType\"]:checked"), function () {
                        definitionExpression2 += (timesType2 ? "" : " or ")  + $(this).val();
                        timesType2 = false;
                    });

                    if (definitionExpression1 == "") {
                        definitionExpression1 = "1=2";
                    }

                    if (definitionExpression2 == "") {
                        definitionExpression2 = "1=2";
                    }

                    var value = $("#ssjkTypeRadios").find("input[type=\"radio\"]:checked").val()
                    if (value == "流失站点") {
                        lszdjkLayer.setLayerDefinitions(["(" + definitionExpression1 + ") and TF_STATE<3"]);
                        lszdjkLayer.setVisibility(true);
                        gzzdjkLayer.setVisibility(false);
                        celltfLayer.setVisibility(false);
                        zbjzLayer.setVisibility(false);
                        tdjzLayer.setVisibility(false);
                    } else if (value == "故障站点") {
                        gzzdjkLayer.setLayerDefinitions(["(" + definitionExpression1 + ") and TF_STATE>2"]);
                        lszdjkLayer.setVisibility(false);
                        gzzdjkLayer.setVisibility(true);
                        celltfLayer.setVisibility(false);
                        zbjzLayer.setVisibility(false);
                        tdjzLayer.setVisibility(false);
                    } else if (value == "重保基站") {
                        zbjzLayer.setLayerDefinitions(["(" + definitionExpression1 + ") and (" + definitionExpression2+ ")"]);
                        lszdjkLayer.setVisibility(false);
                        gzzdjkLayer.setVisibility(false);
                        celltfLayer.setVisibility(false);
                        zbjzLayer.setVisibility(true);
                        tdjzLayer.setVisibility(false);
                    } else if (value == "停电基站") {
                        tdjzLayer.setLayerDefinitions([definitionExpression1]);
                        lszdjkLayer.setVisibility(false);
                        gzzdjkLayer.setVisibility(false);
                        celltfLayer.setVisibility(false);
                        zbjzLayer.setVisibility(false);
                        tdjzLayer.setVisibility(true);
                    } else {
                        celltfLayer.setLayerDefinitions([definitionExpression1]);
                        lszdjkLayer.setVisibility(false);
                        gzzdjkLayer.setVisibility(false);
                        celltfLayer.setVisibility(true);
                        zbjzLayer.setVisibility(false);
                        tdjzLayer.setVisibility(false);
                    }

                },
                changZDLCLineState: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changZDLCLineState执行成功！");
                    var zdlcLineVisible = $("#zdlcLineCB").attr("checked");
                    var zdlcValue = $("#zdluceSelect").val();
                    var wtldSql = "WTLD_TYPE like '%" + zdlcValue + "%'";
                    var zcldSql = "WTLD_TYPE not like '%" + zdlcValue + "%' or WTLD_TYPE is null";
                    var zdlcTime = lastLayerName.substring(4);

                    var zdlcCellLayer = mapParent.getLayer("ZDLUCE关联小区");
                    var nowTime = new Date();
                    var dateTable = this.format(nowTime.getTime() - 2 * 24 * 60 * 60 * 1000, "yyyyMMdd");
                    LayerUtil.changeLayerDynamicData(zdlcCellLayer, "GIS_OBJECT_LTESX" + dateTable, "CellThiess99", null, true);

                    var rsrpZdlcLayer = mapParent.getLayer("路测RSRP|RXLEV分析" + zdlcTime);
                    var sinrZdlcLayer = mapParent.getLayer("路测SINR|RXQUAL分析" + zdlcTime);
                    var wtldZdlcLayer = mapParent.getLayer("路测问题路段分析" + zdlcTime);
                    var zcldZdlcLayer = mapParent.getLayer("路测正常路段分析" + zdlcTime);

                    if (zdlcValue == "RSRP_RXLEV") {
                        rsrpZdlcLayer.setVisibility(true);
                        sinrZdlcLayer.setVisibility(false);
                        wtldZdlcLayer.setVisibility(false);
                        zcldZdlcLayer.setVisibility(false);
                        if (zdlcLineVisible) {
                            zdlcCellLayer.setVisibility(true);
                            rsrpZdlcLayer.setImageFormat("png8|true", false);
                        } else {
                            zdlcCellLayer.setVisibility(false);
                            rsrpZdlcLayer.setImageFormat("png8", false);
                        }                        
                    }else if(zdlcValue == "SINR_RXQUAL"){
                        rsrpZdlcLayer.setVisibility(false);
                        sinrZdlcLayer.setVisibility(true);
                        wtldZdlcLayer.setVisibility(false);
                        zcldZdlcLayer.setVisibility(false);
                        if (zdlcLineVisible) {
                            zdlcCellLayer.setVisibility(true);
                            sinrZdlcLayer.setImageFormat("png8|true", false);
                        } else {
                            zdlcCellLayer.setVisibility(false);
                            sinrZdlcLayer.setImageFormat("png8", false);
                        }
                    }else{
                        rsrpZdlcLayer.setVisibility(false);
                        sinrZdlcLayer.setVisibility(false);

                        zcldZdlcLayer.setLayerDefinitions([zcldSql]);
                        zcldZdlcLayer.setVisibility(true);
                        wtldZdlcLayer.setLayerDefinitions([wtldSql]);
                        wtldZdlcLayer.setVisibility(true);

                        if (zdlcLineVisible) {
                            zdlcCellLayer.setVisibility(true);
                            wtldZdlcLayer.setImageFormat("png8|true", false);
                        } else {
                            zdlcCellLayer.setVisibility(false);
                            wtldZdlcLayer.setImageFormat("png8", false);
                        }
                    }
                },
                changRRULineState: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changRRULineState执行成功！");
                    var rruLineVisible = $("#rruLineCB").attr("checked");
                    var rruDate = $("#zgRRUDate").val().replace(/-/g, "");
                    var zgRRULayer = mapParent.getLayer("资管RRU点");
                    var zgRRUCellLayer = mapParent.getLayer("资管RRU关联小区");

                    zgRRUCellLayer.setVisibility(true);

                    LayerUtil.changeLayerDynamicData(zgRRUCellLayer, "GIS_LTE_ENODEB" + rruDate, "site15", null, true);
                    LayerUtil.changeLayerDynamicData(zgRRULayer, "GIS_RRU_CM_ZG" + rruDate, "PDB_PMSDB", null, true);

                    if (rruLineVisible) {
                        zgRRULayer.setLayerDefinitions(["1=1"]);
                        zgRRULayer.setImageFormat("png8|true",false);
                    } else {
                        //zgRRUCellLayer.setVisibility(false);
                        zgRRULayer.setLayerDefinitions(["REMOTE='否'"]);
                        zgRRULayer.setImageFormat("png8", false);
                    }                    
                    //zgRRULayer.refresh();

                },
                changEquipmentBzTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changEquipmentBzTools执行成功！");
                    var timesType1 = true;
                    var timesType3 = true;
                    var definitionExpression1 = "";
                    var definitionExpression3 = "";
                    var layerArray = [];

                    $.each($("input[type=\"checkbox\"][name=\"equipmentStateBox\"]:checked"), function () {
                        definitionExpression1 += (timesType1 ? "" : " or ") + $(this).val();
                        timesType1 = false;
                    });

                    $.each($("input[type=\"checkbox\"][name=\"equipmentTypeBox\"]:checked"), function () {
                        definitionExpression3 += (timesType3 ? "" : " or ") + $(this).val();
                        timesType3 = false;
                    });

                    $.each($("input[type=\"checkbox\"][name=\"equipmentTypeBox1\"]:checked"), function () {
                        layerArray.push($(this).val());
                    });

                    if (definitionExpression1 == "") {
                        definitionExpression1 = "1=2";
                    }
                    if (definitionExpression3 == "") {
                        definitionExpression3 = "1=2";
                    }

                    var definitionExpression = "(" + definitionExpression1 + ") and (" + definitionExpression3 + ")";
                    var equipmentBzLayer = mapParent.getLayer("应急设备保障（车,宝）");
                    var equipmentBzLayer1 = mapParent.getLayer("应急设备保障（盒）");
                    
                    equipmentBzLayer.setLayerDefinitions([definitionExpression]);
                    equipmentBzLayer1.setVisibleLayers(layerArray);
                },
                changeCjCellJkTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeCjCellJkTools执行成功！");
                    var timesType1 = true;
                    //var timesType2 = true;
                    var timesType3 = true;
                    var definitionExpression1 = "";
                    var definitionExpression2 = "";
                    var definitionExpression3 = "";
                    $.each($("input[type=\"checkbox\"][name=\"cjCellNetBox\"]:checked"), function () {
                        definitionExpression1 += (timesType1 ? "" : " or") + " NET_TYPE = '" + $(this).val() + "'";
                        timesType1 = false;
                    });

                    var cjNameValue = $("#cjCellJkSceneType").val();
                    if (cjNameValue == "全部场景") {
                        definitionExpression2 = "1=1";
                    }else{
                        definitionExpression2 = "CJ_NAME='" + $("#cjCellJkSceneType").val() + "'";
                    }                    
                    //$.each($("input[type=\"checkbox\"][name=\"cjCellCjBox\"]:checked"), function () {
                    //    definitionExpression2 += (timesType2 ? "" : " or") + " CJ_NAME = '" + $(this).val() + "'";
                    //    timesType2 = false;
                    //});

                    $.each($("input[type=\"checkbox\"][name=\"cjCellLhBox\"]:checked"), function () {
                        definitionExpression3 += (timesType3 ? "" : " or") + " XR_LEVEL = " + $(this).val();
                        timesType3 = false;
                    });

                    var ylwtTypeSelect = $("#cjCellJkYlwtTypeSelect").val();
                    var ylwtSql = "1=2";
                    if (ylwtTypeSelect) {
                        if (ylwtTypeSelect.length == 1) {
                            ylwtSql = "LONG_LEGACY_TYPE = '" + ylwtTypeSelect[0] + "'";
                        } else {
                            ylwtSql = "LONG_LEGACY_TYPE = '" + ylwtTypeSelect[0] + "'";
                            for (var num = 1; num < ylwtTypeSelect.length; num++) {
                                ylwtSql = ylwtSql + " or LONG_LEGACY_TYPE = '" + ylwtTypeSelect[num] + "'";
                            }
                        }

                        if (definitionExpression3 == "") {
                            definitionExpression3 += "XR_LEVEL = 7 and (" + ylwtSql+")";
                        } else {
                            definitionExpression3 += " or (XR_LEVEL = 7 and (" + ylwtSql+"))";
                        }
                    }

                    if (definitionExpression1 == "") {
                        definitionExpression1 = "1=2";
                    }
                    //if (definitionExpression2 == "") {
                    //    definitionExpression2 = "1=2";
                    //}
                    if (definitionExpression3 == "") {
                        definitionExpression3 = "1=2";
                    }

                    var definitionExpression = "(" + definitionExpression1 + ") and (" + definitionExpression2 + ") and (" + definitionExpression3 + ")";
                    //var definitionExpression = "(" + definitionExpression1 + ") and (" + definitionExpression3 + ")";
                    var cjCellJkLayer = mapParent.getLayer("春节监控");
                    cjCellJkLayer.setLayerDefinitions([definitionExpression]);
                },
                changeGhwTownTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeGhwTownTools执行成功！");
                    var layerValue = [];
                    $.each($("input[type=\"checkbox\"][name=\"cjTownBox\"]:checked"), function () {
                        layerValue.push($(this).val());
                    });
                    var ghwTownLayer = mapParent.getLayer("春节高话务乡镇");
                    ghwTownLayer.setVisibleLayers(layerValue);
                },
                changeGhwSceneTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeGhwSceneTools执行成功！");
                    var layerValue = [];
                    $.each($("input[type=\"checkbox\"][name=\"cjSceneTownBox\"]:checked"), function () {
                        layerValue.push($(this).val());
                    });
                    var ghwSceneLayer = mapParent.getLayer("春节高话务场景");
                    ghwSceneLayer.setVisibleLayers(layerValue);
                },
                changeCjSceneBzTypeSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeCjSceneBzTypeSelect执行成功！");
                    var cjTypeValue = $("#cjSceneBzType").val();
                    ghwSceneLayer = mapParent.getLayer("春节高话务场景");
                    ghwSceneLayer.setLayerDefinitions(["1=1", "1=1", "1=1", "1=1", "1=1", "SCENE_TYPE='" + cjTypeValue + "'"]);
                },
                changeZnjcSfxssg: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeZnjcSfxssg执行成功！");
                    var sfxssgVisible = $("#znjcXssgCB").attr("checked")

                    var znjcSgLayer = mapParent.getLayer("智能决策栅格");
                    znjcSgLayer.setVisibility(sfxssgVisible);

                },
                changeZnjcDefinition: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeZnjcDefinition执行成功！");
                    var timesType = true;
                    var inOutTimes = true;
                    var definitionExpression = "";
                    var inOutDefExpress = "";
                    $.each($("input[type=\"checkbox\"][name=\"znjcTypeCB\"]:checked"), function () {
                        definitionExpression += (timesType ? "" : " or") + " ZNGH_TYPE = '" + $(this).val() + "'";
                        timesType = false;
                    });

                    $.each($("input[type=\"checkbox\"][name=\"znjcStateCB\"]:checked"), function () {
                        inOutDefExpress += (inOutTimes ? "" : " or") + " JS_TYPE = '" + $(this).val() + "'";
                        inOutTimes = false;
                    });
                    if (definitionExpression == "") {
                        definitionExpression = "1=2";
                    }
                    if (inOutDefExpress == "") {
                        inOutDefExpress = "1=2";
                    }

                    var totalExpression = "(" + definitionExpression + " )  and (" + inOutDefExpress + ")";

                    if (totalExpression.indexOf("优化") > -1) {
                        totalExpression = "(" + totalExpression + " )  or (ZNGH_TYPE ='优化')";
                    }

                    var znjcPntLayer = mapParent.getLayer("智能决策点");
                    znjcPntLayer.setLayerDefinitions([totalExpression]);

                },
                changeJxghTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeJxghTools执行成功！");
                    var jxghTime = $("#JxghTimeSelect").val();
                    var jxghCoverMx = $("#jxghMxSelect").val();
                    var jxghCoverType = $("#jxghDataTypeSelect").val();
                    var jxghCity = $("#layerCitySelect").val();
                    var jxghNcVisible = $("#jxghNcCB").attr("checked");

                    var lySelect = false;
                    var sgSelect = false;

                    $.each($("input[type=\"checkbox\"][name=\"jxghFS\"]:checked"), function () {
                        if ($(this).val() == "sg") {
                            sgSelect = true;
                        } else {
                            lySelect = true;
                        }
                    });

                    var queryData = {};
                    queryData.city = jxghCity;
                    queryData.date_id = jxghTime;

                    var dataUrl = urlRoute("../proxy_to_92/WG_JZXN_JXGH11/Gis/getWeakCoverDataSourceDate");
                    $.ajax({
                        type: 'GET',
                        url: dataUrl,
                        data: queryData,
                        success: function (data) {
                            if (data != "") {
                                var optionsHtml = "<option  value='" + data + "' >" + data + "</option>";
                                document.getElementById("cjTimeSelect").innerHTML = optionsHtml;
                            } else {
                                document.getElementById("cjTimeSelect").innerHTML = "<option  value='' >暂无数据</option>";
                            }

                        }

                    });

                    var coverLayer10 = mapParent.getLayer("栅格弱覆盖10_relaControl");
                    var coverLayer20 = mapParent.getLayer("栅格弱覆盖20_relaControl");
                    var clipLayer10 = mapParent.getLayer("hiddenLayer_栅格弱覆盖_clip10");
                    var clipLayer20 = mapParent.getLayer("hiddenLayer_栅格弱覆盖_clip20");
                    var sfLayer10 = mapParent.getLayer("室分楼宇级别4");
                    var sfLayer20 = mapParent.getLayer("室分楼宇级别1");

                    var coverTable = "GIS_COVER_GRIDS_COUNT" + jxghTime;
                    if (jxghNcVisible) {
                        coverTable += "NC";
                    }
                    if (jxghCoverType != "TDD") {
                        coverTable += jxghCoverType;
                    }

                    LayerUtil.changeLayerDynamicData(coverLayer10, coverTable, "JZXNGis82", null, true);
                    LayerUtil.changeLayerDynamicData(coverLayer20, coverTable, "JZXNGis82", null, true);

                    clipLayer10.setLayerDefinitions(["JZXN_GIS.DBO.GIS_ZNGH_WEAKCOVER_CLUSTER10.VDATE_D='" + jxghTime + "'and JZXN_GIS.DBO.GIS_ZNGH_WEAKCOVER_CLUSTER10.DUAL='" + jxghCoverType + "'"]);
                    clipLayer20.setLayerDefinitions(["JZXN_GIS.DBO.GIS_ZNGH_WEAKCOVER_CLUSTER2.VDATE_D='" + jxghTime + "'and JZXN_GIS.DBO.GIS_ZNGH_WEAKCOVER_CLUSTER2.DUAL='" + jxghCoverType + "'"]);
                    sfLayer10.setLayerDefinitions(["SDE.F_GIS_WEAK_FLOOR_10_LIST.VTIME='" + jxghTime + "'and SDE.F_GIS_WEAK_FLOOR_10_LIST.DUAL='" + jxghCoverType + "'"]);
                    sfLayer20.setLayerDefinitions(["SDE.F_GIS_WEAK_FLOOR_20_LIST.VTIME='" + jxghTime + "'and SDE.F_GIS_WEAK_FLOOR_20_LIST.DUAL='" + jxghCoverType + "'"]);

                    if (jxghNcVisible) {
                        if (jxghCoverMx == "栅格弱覆盖10_relaControl") {
                            coverLayer10.setVisibility(sgSelect);

                            sfLayer10.setVisibility(false);
                            clipLayer10.setVisibility(false);
                            coverLayer20.setVisibility(false);
                            sfLayer20.setVisibility(false);
                            clipLayer20.setVisibility(false);
                        } else if (jxghCoverMx == "栅格弱覆盖20_relaControl") {
                            coverLayer10.setVisibility(false);
                            sfLayer10.setVisibility(false);
                            clipLayer10.setVisibility(false);
                            sfLayer20.setVisibility(false);
                            clipLayer20.setVisibility(false);

                            coverLayer20.setVisibility(sgSelect);                            
                        }
                    }else{
                        if (jxghCoverMx == "栅格弱覆盖10_relaControl") {
                            coverLayer10.setVisibility(sgSelect);
                            sfLayer10.setVisibility(lySelect);
                            clipLayer10.setVisibility(sgSelect);

                            coverLayer20.setVisibility(false);
                            sfLayer20.setVisibility(false);
                            clipLayer20.setVisibility(false);
                        } else if (jxghCoverMx == "栅格弱覆盖20_relaControl") {
                            coverLayer10.setVisibility(false);
                            sfLayer10.setVisibility(false);
                            clipLayer10.setVisibility(false);

                            coverLayer20.setVisibility(sgSelect);
                            sfLayer20.setVisibility(lySelect);
                            clipLayer20.setVisibility(sgSelect);
                        }
                    }
                },
                changeZnghDefinition: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeZnghDefinition执行成功！");

                    var znghLayer = mapParent.getLayer("智能规划");
                    var znghTimeSelect = $("#znghTimeSelect").val();
                    var znghDataTypeSelect = $("#znghDataTypeSelect").val();
                    var visibleLayers = [];
                    $.each($("input[type=\"checkbox\"][name=\"znghTypeCB\"]:checked"), function () {
                        visibleLayers.push($(this).val());
                    });

                    var znghSqlstr0 = "1=2";
                    var znghSqlstr1 = "1=2";
                    var znghSqlstr2 = "1=2";
                    var znghSqlstr3 = "1=2";

                    for (var i = 0; i < visibleLayers.length; i++) {
                        if (visibleLayers[i] == 0) {
                            znghSqlstr0 = "VTIME='" + znghTimeSelect + "'AND DUAL ='" + znghDataTypeSelect + "'";
                        } else if (visibleLayers[i] == 1) {
                            znghSqlstr1 = "VTIME='" + znghTimeSelect + "'AND DUAL ='" + znghDataTypeSelect + "'";
                        } else if (visibleLayers[i] == 2) {
                            znghSqlstr2 = "VTIME='" + znghTimeSelect + "'AND DUAL ='" + znghDataTypeSelect + "'";
                        } else if (visibleLayers[i] == 3) {
                            znghSqlstr3 = "SDE.F_GIS_ZNGH_FLOOR_POINT.VTIME='" + znghTimeSelect + "'AND SDE.F_GIS_ZNGH_FLOOR_POINT.DUAL ='" + znghDataTypeSelect + "'";
                        }
                    }

                    znghLayer.setLayerDefinitions([znghSqlstr0, znghSqlstr1, znghSqlstr2, znghSqlstr3]);
                },
                changeMrJdTools: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeMrJdTools执行成功！");
                    var mrJdSelect = $("#MrJdSelect").val();

                    var jdSglayer = mapParent.getLayer("MR竞对分析栅格");
                    var tableName = "GIS_MRO_GRID_JD_STAT" + mrJdSelect;
                    LayerUtil.changeLayerDynamicData(jdSglayer, tableName, "PDB_PMSDB", null, true);

                    var jdCulayer = mapParent.getLayer("MR竞对栅格簇");
                    var jdSqlstr = "VTIME=" + mrJdSelect;
                    jdCulayer.setLayerDefinitions([jdSqlstr]);

                },
                changReturnBtn: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("自定义函数::changReturnBtn执行成功！");
                    var popLayer1 = mapParent.getLayer("栅格覆盖_GuanLian");
                    var popLayer2 = mapParent.getLayer("小区覆盖_GuanLian");
                    var popLayer3 = mapParent.getLayer("场景边界_GuanLian");
                    var popLayer4 = mapParent.getLayer("小区场景_GuanLian");

                    var timeDate = $("#fgDate").val().replace(/-/g, "");

                    if (popLayer1 && popLayer1.visible) {
                        var qjSelect = $("#fgmgrs_qjSelect").val();
                        var sql = "1=1";
                        if (qjSelect) {
                            if (qjSelect.length == 1) {
                                sql = qjSelect[0];
                            } else {
                                sql = "(" + qjSelect[0] + ")";
                                for (var num = 1; num < qjSelect.length; num++) {
                                    sql = sql + " or (" + qjSelect[num] + ")";
                                }
                            }
                        }
                        var popSql1 = "TIME='" + timeDate + "' and (" + sql + ")";
                        popLayer1.setLayerDefinitions([popSql1]);
                        var glLayer1 = mapParent.getLayer("栅格关联小区");
                        var xwcell_sx = mapParent.getLayer("栅格覆盖现网小区");
                        glLayer1.setVisibility(false);
                        xwcell_sx.setVisibility(false);
                    }
                    if (popLayer3 && popLayer3.visible) {
                        var qjSelect = $("#fgcj_qjSelect").val();
                        var qjsql = "1=1";
                        if (qjSelect) {
                            if (qjSelect.length == 1) {
                                qjsql = qjSelect[0];
                            } else {
                                qjsql = "(" + qjSelect[0] + ")";
                                for (var num = 1; num < qjSelect.length; num++) {
                                    qjsql = qjsql + " or (" + qjSelect[num] + ")";
                                }
                            }
                        }

                        var cjTypes = $("#cjTypeSelect").val();
                        var sql = "";
                        if (cjTypes != null) {
                            if (cjTypes.length == 1) {

                                sql = "TYPE='" + cjTypes[0] + "'";

                            } else {

                                sql = "(TYPE='" + cjTypes[0] + "'";

                                for (var num = 1; num < cjTypes.length; num++) {

                                    sql = sql + " or TYPE='" + cjTypes[num] + "'";

                                }

                                sql = sql + ")";
                            }
                            sql = sql + " and TIME='" + timeDate + "' and (" + qjsql + ")";
                        } else {
                            sql = "TIME='" + timeDate + "' and (" + qjsql + ")";
                        }
                        var popSql3 = sql;
                        popLayer3.setLayerDefinitions([popSql3]);
                        var glLayer3 = mapParent.getLayer("场景关联小区");
                        var xwcell_sx = mapParent.getLayer("场景覆盖现网小区");
                        glLayer3.setVisibility(false);
                        xwcell_sx.setVisibility(false);
                    }
                    if (popLayer2 && popLayer2.visible) {
                        var popSql2 = "1=1";
                        popLayer2.setLayerDefinitions([popSql2]);
                        var glLayer2 = mapParent.getLayer("小区关联栅格");
                        glLayer2.setVisibility(false);
                    }
                    if (popLayer4 && popLayer4.visible) {
                        var popSql4 = "1=1";
                        popLayer4.setLayerDefinitions([popSql4]);
                        var glLayer4 = mapParent.getLayer("小区关联场景");
                        glLayer4.setVisibility(false);
                    }

                    $("#FGReturn").css("display", "none");
                },
                changeGlFgDate: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeGlFgDate执行成功！");
                    var timeDate = $("#fgDate").val().replace(/-/g, "");
                    var tableName = "GIS_OBJECT_LTESX" + timeDate;

                    if (lastLayerName == "小区覆盖栅格") {
                        var layerOp = mapParent.getLayer("小区覆盖_GuanLian");
                        LayerUtil.changeLayerDynamicData(layerOp, tableName, "CellThiess99", null, true);

                    } else if (lastLayerName == "小区覆盖场景") {
                        var layerOp = mapParent.getLayer("小区场景_GuanLian");
                        LayerUtil.changeLayerDynamicData(layerOp, tableName, "CellThiess99", null, true);

                    } else if (lastLayerName == "栅格覆盖小区") {
                        var xwcell_sx = mapParent.getLayer("栅格覆盖现网小区");
                        LayerUtil.changeLayerDynamicData(xwcell_sx, tableName, "CellThiess99", null, true);

                        var qjSelect = $("#fgmgrs_qjSelect").val();
                        var sql = "1=1";
                        if (qjSelect) {
                            if (qjSelect.length == 1) {
                                sql = qjSelect[0];
                            } else {
                                sql = "(" + qjSelect[0] + ")";
                                for (var num = 1; num < qjSelect.length; num++) {
                                    sql = sql + " or (" + qjSelect[num] + ")";
                                }
                            }
                        }

                        var layerOp = mapParent.getLayer("栅格覆盖_GuanLian");
                        var sqlStr = "TIME='" + timeDate + "' and ("+sql+")";
                        layerOp.setLayerDefinitions([sqlStr]);

                    } else {
                        var xwcell_sx = mapParent.getLayer("场景覆盖现网小区");
                        LayerUtil.changeLayerDynamicData(xwcell_sx, tableName, "CellThiess99", null, true);

                        var qjSelect = $("#fgcj_qjSelect").val();
                        var qjsql = "1=1";
                        if (qjSelect) {
                            if (qjSelect.length == 1) {
                                qjsql = qjSelect[0];
                            } else {
                                qjsql = "(" + qjSelect[0] + ")";
                                for (var num = 1; num < qjSelect.length; num++) {
                                    qjsql = qjsql + " or (" + qjSelect[num] + ")";
                                }
                            }
                        }

                        var cjTypes = $("#cjTypeSelect").val();
                        var sql = "";
                        if (cjTypes != null) {
                            if (cjTypes.length == 1) {

                                sql = "TYPE='" + cjTypes[0] + "'";

                            } else {

                                sql = "(TYPE='" + cjTypes[0] + "'";

                                for (var num = 1; num < cjTypes.length; num++) {

                                    sql = sql + " or TYPE='" + cjTypes[num] + "'";

                                }

                                sql = sql + ")";
                            }
                            sql = sql + " and TIME='" + timeDate + "' and (" + qjsql + ")";
                        } else {
                            sql = "TIME='" + timeDate + "' and (" + qjsql + ")";
                        }
                        var layerOp = mapParent.getLayer("场景边界_GuanLian");
                        layerOp.setLayerDefinitions([sql]);
                    }
                },
                changeAcMapShow: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeAcMapShow执行成功！");
                    var heatVisible = $("#xqkdHeatCB").attr("checked");
                    var timeDate = $("#acMapDate").val();
                    var cellKdHeatLayer = mapParent.getLayer("小区宽带热力图");
                    var acTsLayer = mapParent.getLayer("LTE_频段_泰森");
                    var acPntLayer = mapParent.getLayer("LTE_频段_点");

                    if (heatVisible && lastLayerName == "LTE频段") {
                        acTsLayer.setVisibility(false);
                        acPntLayer.setVisibility(false);

                        if (heatVisible) {
                            var heatcolor = ["rgba(0,0,0,0.05)", "#E8F0FE", "#D2E1FE", "#BBD2FD", "#A5C3FC", "#8FB4FB", "#79A5FB", "#6296FA", "#4C87F9", "#3578F9", "#1F69F8", "#3578F9", "#1F69F8", "#3E87BF", "#4390C2", "#3E87BF", "#4390C2", "#4799C5", "#4CA1C8", "#51AACB", "#57B3CD", "#5CBBCE", "#63C3CF", "#64C2C3", "#65C1B7", "#66C0A9", "#67BF9C", "#68BE8F", "#69BD81", "#6ABC73", "#6BBC66", "#6BBB58", "#6BBA49", "#6CB93A", "#85C139", "#9CC939", "#B1D139", "#C4D839", "#D6E03B", "#E7E73D", "#EADA38", "#ECCC33", "#EEBC2E", "#EFAC2A", "#F09926", "#F08622", "#EE7922", "#ED6C23", "#EB5E23", "#EA5023", "#E83F23", "#E72A22"];
                            var heatmapRenderer = new HeatmapRenderer({
                                field:"ENBAJ19",
                                colors: heatcolor,
                                blurRadius: 10,
                                maxPixelIntensity: 200,
                                minPixelIntensity: 0
                            });
                            cellKdHeatLayer.setRenderer(heatmapRenderer);
                            cellKdHeatLayer.setVisibility(true);
                        }
                    } else {
                        var acTsCheck = $("#acRadio1:checked").val();
                        var tablePreTs = "GIS_CELL_TSSPOLY_LTE" + timeDate.replace(/-/g, "");

                        if (acTsCheck == "thiess") {
                            if (lastLayerName.indexOf("LTE") > -1 || lastLayerName.indexOf("TAC") > -1) {
                                tablePreTs = "GIS_CELL_TSSPOLY_LTE" + timeDate.replace(/-/g, "");
                            } else if (lastLayerName.indexOf("TD") > -1) {
                                tablePreTs = "GIS_CELL_TSSPOLY_TD" + timeDate.replace(/-/g, "");
                            } else if (lastLayerName.indexOf("LAC") > -1) {
                                tablePreTs = "GIS_CELL_TSSPOLY_GSM" + timeDate.replace(/-/g, "");
                            }
                        } else {
                            if (lastLayerName.indexOf("LTE") > -1 || lastLayerName.indexOf("TAC") > -1) {
                                tablePreTs = "GIS_OBJECT_LTESX" + timeDate.replace(/-/g, "");
                            } else if (lastLayerName.indexOf("TD") > -1) {
                                tablePreTs = "GIS_OBJECT_TDSX" + timeDate.replace(/-/g, "");
                            } else if (lastLayerName.indexOf("LAC") > -1) {
                                tablePreTs = "GIS_OBJECT_GSMSX" + timeDate.replace(/-/g, "");
                            }
                        }

                        var tablePrePnt = "LTE_TAC_PNT" + timeDate.replace(/-/g, "");
                        var layerTs = mapParent.getLayer("LTE_TAC_泰森");
                        var layerPnt = mapParent.getLayer("LTE_TAC_点");

                        if (lastLayerName == "TAC专题") {
                            tablePrePnt = "LTE_TAC_PNT" + timeDate.replace(/-/g, "");
                            layerTs = mapParent.getLayer("LTE_TAC_泰森");
                            layerPnt = mapParent.getLayer("LTE_TAC_点");
                        } else if (lastLayerName == "LAC专题") {
                            tablePrePnt = "GSM_LAC_POINT" + timeDate.replace(/-/g, "");
                            layerTs = mapParent.getLayer("GSM_LAC_泰森");
                            layerPnt = mapParent.getLayer("GSM_LAC_点");
                        } else if (lastLayerName == "LTE频段") {
                            if (cellKdHeatLayer.visible) {
                                cellKdHeatLayer.setVisibility(false);
                            }                            
                            if (!acTsLayer.visible) {
                                acTsLayer.setVisibility(true);
                                acPntLayer.setVisibility(true);
                            }
                            tablePrePnt = "LTE_WORK_FRQBAND_PNT" + timeDate.replace(/-/g, "");
                            layerTs = mapParent.getLayer("LTE_频段_泰森");
                            layerPnt = mapParent.getLayer("LTE_频段_点");
                        } else if (lastLayerName == "LTE厂家") {
                            tablePrePnt = "LTE_VENDOR_NAME_PNT" + timeDate.replace(/-/g, "");
                            layerTs = mapParent.getLayer("LTE_厂家_泰森");
                            layerPnt = mapParent.getLayer("LTE_厂家_点");
                        } else if (lastLayerName == "LTE参考信号功率") {
                            layerTs = mapParent.getLayer("LTE参考信号功率");
                        } else if (lastLayerName == "TD厂家") {
                            tablePrePnt = "TD_VENDOR_NAME_PNT" + timeDate.replace(/-/g, "");
                            layerTs = mapParent.getLayer("TD_厂家_泰森");
                            layerPnt = mapParent.getLayer("TD_厂家_点");
                        } else if (lastLayerName == "TD频段") {
                            tablePrePnt = "TD_WORK_FRQBAND_PNT" + timeDate.replace(/-/g, "");
                            layerTs = mapParent.getLayer("TD_频段_泰森");
                            layerPnt = mapParent.getLayer("TD_频段_点");
                        }


                        LayerUtil.changeLayerDynamicData(layerTs, tablePreTs, "Thiess99", null, true);
                        if (lastLayerName != "LTE参考信号功率") {
                            LayerUtil.changeLayerDynamicData(layerPnt, tablePrePnt, "site5", null, true);
                        }
                        if (lastLayerName == "LTE频段") {
                            var qjSelect = $("#ltepd_Select").val();
                            var qjsql = "1=1";
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    qjsql = "WORK_FRQBAND='"+qjSelect[0]+"'";
                                } else {
                                    qjsql = "( WORK_FRQBAND='" + qjSelect[0] + "')";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        qjsql = qjsql + " or ( WORK_FRQBAND='" + qjSelect[num] + "')";
                                    }
                                }
                            }

                            layerTs.setLayerDefinitions([qjsql]);
                            layerPnt.setLayerDefinitions([qjsql]);
                        }
                    }
                },
                changeVolteZTSelect: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeVolteZTSelect执行成功！");
                    if (lastLayerName == "空口上行MR丢包率") {
                        var kksxqci1 = mapParent.getLayer("空口上行MR丢包率");
                        kksxqci1.setVisibility(false);
                        var kksxqci5 = mapParent.getLayer("空口上行MR丢包率QCI5");
                        kksxqci5.setVisibility(false);
                        var kksxqci9 = mapParent.getLayer("空口上行MR丢包率QCI9");
                        kksxqci9.setVisibility(false);
                    } else {
                        var kksxqci1 = mapParent.getLayer("空口下行MR丢包率");
                        kksxqci1.setVisibility(false);
                        var kksxqci5 = mapParent.getLayer("空口下行MR丢包率QCI5");
                        kksxqci5.setVisibility(false);
                        var kksxqci9 = mapParent.getLayer("空口下行MR丢包率QCI9");
                        kksxqci9.setVisibility(false);
                    }

                    var valueSelect = $("#volteUPSelect").val();
                    var ckLayer = mapParent.getLayer(valueSelect);
                    ckLayer.setVisibility(true);
                },
                changeVolteZtDate: function (toolDijits, currentToolDijit, mapParent, lastLayerName) {
                    console.log("自定义函数::changeVolteZtDate执行成功！");
                    var timeDate = $("#volteZtDate").val();
                    var currentToolResult = "GIS_VOLTE_EVENT_" + timeDate.replace(/-/g, "");
                    if (lastLayerName == "空口上行MR丢包率") {
                        var kksxqci1 = mapParent.getLayer("空口上行MR丢包率");
                        LayerUtil.changeLayerDynamicData(kksxqci1, currentToolResult, "PDB_PMSDB", null, true);
                        var kksxqci5 = mapParent.getLayer("空口上行MR丢包率QCI5");
                        LayerUtil.changeLayerDynamicData(kksxqci5, currentToolResult, "PDB_PMSDB", null, true);
                        var kksxqci9 = mapParent.getLayer("空口上行MR丢包率QCI9");
                        LayerUtil.changeLayerDynamicData(kksxqci9, currentToolResult, "PDB_PMSDB", null, true);
                    } else {
                        var kksxqci1 = mapParent.getLayer("空口下行MR丢包率");
                        LayerUtil.changeLayerDynamicData(kksxqci1, currentToolResult, "PDB_PMSDB", null, true);
                        var kksxqci5 = mapParent.getLayer("空口下行MR丢包率QCI5");
                        LayerUtil.changeLayerDynamicData(kksxqci5, currentToolResult, "PDB_PMSDB", null, true);
                        var kksxqci9 = mapParent.getLayer("空口下行MR丢包率QCI9");
                        LayerUtil.changeLayerDynamicData(kksxqci9, currentToolResult, "PDB_PMSDB", null, true);
                    }
                },
                changeSX_THIESSDate: function (toolDijits, currentToolDijit) {
                    var checkedValue = "", tabName_dynamic = "";
                    var nowdate = "", date = "", date_split_table_pre = "";
                    for (var i = 0; i < currentToolDijit.domNode.children[1].children.length; i++) {
                        if (currentToolDijit.domNode.children[1].children[i].checked) {
                            checkedValue = currentToolDijit.domNode.children[1].children[i].value;
                        }
                    }
                    if (checkedValue == "") {
                        return;
                    }
                    var boolean_dateLayerChooser = false;
                    for (var i = 0; i < currentToolDijit.toolBox.children.length; i++) {
                        if (currentToolDijit.toolBox.children[i].id.indexOf("DateChooserTool") > -1) {
                            boolean_dateLayerChooser = true;
                        }
                    }
                    if (currentToolDijit.table_pre != undefined && (currentToolDijit.orderid == undefined || currentToolDijit.orderid == 0)) {
                        if (boolean_dateLayerChooser) {
                            //GIS_CELL_TSSPOLY_LTE
                            //泰森多边形和扇形的工具出现的时候如果要是有时间的话,数据会随着时间变化
                            date_split_table_pre = currentToolDijit.table_pre.split("_");
                            date = $(this.dateLayerChooser).val();
                            if (!date) {
                                if ($("#SWYW_DateChooser").length) {
                                    date=$("#SWYW_DateChooser").val().split("-").join("")
                                }
                            }
                            if (!date) {
                                //要是没有时间获取当前时间-2
                                nowdate = new Date();
                                date = this.format(nowdate.getTime() - 2 * 24 * 60 * 60 * 1000, "yyyy-MM-dd");
                                date = date.split("-").join("");
                            }
                            if (checkedValue == "TSSPOLY") {
                                //GIS_CELL_TSSPOLY_LTE20171222
                                tabName_dynamic = currentToolDijit.table_pre + date;
                            }
                            else if (checkedValue == "SX") {
                                //GIS_OBJECT_LTESX20171222
                                tabName_dynamic = date_split_table_pre[0] + "_OBJECT_" + date_split_table_pre[date_split_table_pre.length - 1] + checkedValue + date;
                            }
                            //tabName_dynamic = currentToolDijit.table_pre + "_" + checkedValue + date;
                        }
                        else {
                            //GIS_THIESS_ZZYW_GSM201709
                            //泰森多边形和扇形的工具出现的时候没有时间的话，数据不会随着时间变化，也就是说为固定值,固定时间
                            date_split_table_pre = currentToolDijit.table_pre.split("THIESS");
                            nowdate = new Date();
                            if (nowdate.getDate() > 10) {
                                nowdate.setMonth(nowdate.getMonth() - 1);
                            } else {
                                nowdate.setMonth(nowdate.getMonth() - 2);
                            }
                            var date = this.format(nowdate.getTime(), "yyyy-MM");
                            date = date.split("-").join("");
                            if (checkedValue == "THIESS") {
                                //GIS_THIESS_ZZYW_GSM201709
                                tabName_dynamic = currentToolDijit.table_pre + date;
                            }
                            else if (checkedValue == "SX") {
                                //GIS_THIESS_ZZYW_GSM201709
                                tabName_dynamic = date_split_table_pre[0] + checkedValue + date_split_table_pre[date_split_table_pre.length - 1] + date;
                            }
                        }
                    } else {
                        tabName_dynamic = currentToolDijit.table_pre + date;
                    }
                    LayerUtil.changeLayerDynamicData(currentToolDijit.layer, tabName_dynamic, currentToolDijit.workspaceId, null, true);
                },
                changeDate_SWYW: function (toolDijits, currentToolDijit) {
                    var tabName_dynamic = "";
                    var date_split_table_pre = currentToolDijit.table_pre.split("_");
                    var layer_type = "TSSPOLY";
                    //时间，精确到日期
                    var day_time = $("#SWYW_DateChooser").val().split("-").join("");
                    //根据下面渲染类型获取当前的显然样式
                    if ($("#SWYW_MutiRadioBtn").length > 0) {
                        layer_type = $("#SWYW_MutiRadioBtn").find("input[type=\"radio\"]:checked").val();
                    }
                    if (layer_type == "TSSPOLY") {
                        //GIS_CELL_TSSPOLY_LTE20171222
                        tabName_dynamic = currentToolDijit.table_pre + day_time;
                    }
                    else if (layer_type == "SX") {
                        //GIS_OBJECT_LTESX20171222
                        tabName_dynamic = date_split_table_pre[0] + "_OBJECT_" + date_split_table_pre[date_split_table_pre.length - 1] + layer_type + day_time;
                    }
                    LayerUtil.changeLayerDynamicData(currentToolDijit.layer, tabName_dynamic, currentToolDijit.workspaceId, null, true);
                },
                format: function (time, format) {
                    var t = new Date(time);
                    var tf = function (i) {
                        return (i < 10 ? '0' : '') + i
                    };
                    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
                        switch (a) {
                            case 'yyyy':
                                return tf(t.getFullYear());
                                break;
                            case 'MM':
                                return tf(t.getMonth() + 1);
                                break;
                            case 'mm':
                                return tf(t.getMinutes());
                                break;
                            case 'dd':
                                return tf(t.getDate());
                                break;
                            case 'HH':
                                return tf(t.getHours());
                                break;
                            case 'ss':
                                return tf(t.getSeconds());
                                break;
                        }
                    })
                },

                /**投诉*/
                changeDataOfComplain: function (toolDijits, currentToolDijit, mapParent) {
                    var mutiCheckBoxTool, mutiRadioBtnTool, dateChooserTool;
                    for (var i = 0; i < toolDijits.length; i++) {
                        if (toolDijits[i].id.indexOf("MutiCheckBoxTool") > -1) {
                            mutiCheckBoxTool = toolDijits[i];
                        }
                        if (toolDijits[i].id.indexOf("MutiRadioBtnTool") > -1) {
                            mutiRadioBtnTool = toolDijits[i];
                        }
                        if (toolDijits[i].id.indexOf("DateChooserTool") > -1) {
                            dateChooserTool = toolDijits[i];
                        }
                    }
                    //投诉类型
                    var net = "", neyTypeDef = "(1=2";
                    var type_GTL = {
                        "2G": 0,
                        "3G": 1,
                        "4G": 2,
                        "公告": 3
                    };
                    for (var i = 0; i < mutiCheckBoxTool.domNode.children[1].childNodes.length; i++) {
                        if (mutiCheckBoxTool.domNode.children[1].childNodes[i].type && mutiCheckBoxTool.domNode.children[1].childNodes[i].type == "checkbox" && mutiCheckBoxTool.domNode.children[1].childNodes[i].checked) {
                            neyTypeDef += " or " + mutiCheckBoxTool.domNode.children[1].childNodes[i].value;
                            net += type_GTL[mutiCheckBoxTool.chksContent.children[i].textContent];
                        }
                    }
                    neyTypeDef += ")";
                    //时间粒度
                    var tmType = "";
                    for (var i = 0; i < mutiRadioBtnTool.domNode.children[1].children.length; i++) {
                        if (mutiRadioBtnTool.domNode.children[1].children[i].type && mutiRadioBtnTool.domNode.children[1].children[i].type == "radio" && mutiRadioBtnTool.domNode.children[1].children[i].checked) {
                            tmType = mutiRadioBtnTool.domNode.children[1].children[i].value;
                        }
                    }
                    var timeDef = "";
                    var tableFirst = "COMPLAIN_RASTER_MONTH_";
                    var yesterday = this.format(new Date().getTime() - 24 * 60 * 60 * 1000, "yyyy-MM-dd");
                    var complainDataVal = dateChooserTool.domNode.children[1].firstChild.value;
                    if (complainDataVal == "" || complainDataVal.indexOf("2014") > -1) {
                        complainDataVal = yesterday;
                    }
                    if (complainDataVal > yesterday) {
                        console.log("时间超出已有数据。");
                        return;
                    }
                    if (tmType == "month") {
                        timeDef = "ACCEPT_TIME >= '" + this.getLastMonthStartDate() + " 00:00:00' and ACCEPT_TIME<='" + this.getLastMonthEndDate() + " 23:59:59'";
                        tableFirst = "COMPLAIN_RASTER_MONTH_";
                        if (net == "") {
                            net = "0123";
                        }
                    } else if (tmType == "week") {
                        timeDef = "ACCEPT_TIME >= '" + this.getLastWeekStartDateFormat() + " 00:00:00' and ACCEPT_TIME<='" + this.getLastWeekEndDateFormat() + " 23:59:59'";
                        tableFirst = "COMPLAIN_RASTER_WEEK_";
                        if (net == "") {
                            net = "0123";
                        }
                    } else {
                        tableFirst = "COMPLAIN_RASTER_" + complainDataVal.replace(/-/g, "") + "_";
                        timeDef = "( ACCEPT_TIME >= '" + complainDataVal + " 00:00:00' and ACCEPT_TIME<='" + complainDataVal + " 23:59:59' )";
                        if (net == "") {
                            net = "all";
                        }
                    }
                    //切换数据源，用于切换栅格数据源使用
                    var layer = mapParent.getLayer("投诉网格");
                    LayerUtil.changeLayerDynamicData(layer, tableFirst + net, "DynamicComplainWangGeWID", null, true);
                    //查询条件，用于点数据查询，使用查询条件
                    layer = mapParent.getLayer("投诉点");
                    var currentToolResult = timeDef + " and " + neyTypeDef;
                    this.sql_refreshLayers(layer, currentToolResult);
                },
                sql_refreshLayers: function (layer, currentToolResult) {
                    if (layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                        layer.setLayerDefinitions([currentToolResult]);
                    } else if (layer.declaredClass == "esri.layers.FeatureLayer") {
                        layer.setDefinitionExpression(currentToolResult);
                    }
                },
                //网优投诉--渲染指标
                changeFnTouSuSelect: function (toolDijits, currentToolDijit, mapParent) {
                    var tslbLayerId = "FNTouSuTslb";
                    var tscjLayerId = "FNTouSuTscj";
                    var jjcdLayerId = "FNTouSuJjcd";
                    var tsyyLayerId = "FNTouSuTsyy";
                    var tsxxLayerId = "FNTouSuTsxx";
                    var sgLayerId = "FnTouSuShanGe";
                    
                    var ckLayer = null;
                    var layerInfos = [tslbLayerId, tscjLayerId, jjcdLayerId, tsyyLayerId, tsxxLayerId, sgLayerId];
                    for (var i in layerInfos) {
                        ckLayer = mapParent.getLayer(layerInfos[i]);
                        ckLayer.setVisibility(false);
                    }
                    var value = $("#fnType").val();
                    mapParent.getLayer(value).setVisibility(true);

                    //var fnSyVisible = $("#fnSyTouSu").find("input[type=\"checkbox\"]").attr("checked");
                    //if (fnSyVisible) {
                    //    mapParent.getLayer(sgLayerId).setVisibility(true);
                    //}
                    this.changeFnTouSuLayer(mapParent);
                },
                //网优投诉
                reSetStartTime: function () {
                    var lastmonth_days = this.getMonthDays(lastMonth);
                    var fnDaysAgo = this.format(new Date().getTime() - lastmonth_days * 24 * 60 * 60 * 1000, "yyyy-MM-dd");
                    $("#fnStartMapDate").val(fnDaysAgo);
                },
                changeFnTouSuLayer: function (mapParent) {
                    var monthStartDate = this.format(new Date(nowYear, lastMonth, 1), "yyyy-MM-dd");
                    var monthEndDate = this.format(new Date(nowYear, nowMonth, 1), "yyyy-MM-dd");

                    var lastmonth_days = this.getMonthDays(lastMonth);
                    var fnDaysAgo = this.format(new Date().getTime() - lastmonth_days * 24 * 60 * 60 * 1000, "yyyy-MM-dd");

                    var fnStartTime = $("#fnStartMapDate").val();
                    if (!fnStartTime) {
                        fnStartTime = fnDaysAgo;
                    }
                    var fnEndTime = $("#fnEndMapDate").val();
                    if (!fnEndTime) {
                        fnEndTime = this.format(new Date().getTime(), "yyyy-MM-dd");
                    }

                    var fnType = $("#fnType").val();
                    //var fnPhoneNum = $("#fnPhoneNum").val();
                    var fnWorkId = $("#fnWorkId").val();
                    var fnJjcd = $("#fnJjcd").val();
                    //var fnTslb = $("#fnTslb").val();
                    var fnTsyyType = $("#fnTsyyType").val();
                    var fnWllx = $("#fnWllx").val();
                    var fnSyVisible = $("#fnSyTouSu_div").find("input[type=\"checkbox\"]").attr("checked");
                    var sql = "1=1";

                    if (!fnSyVisible) {
                        if (fnStartTime) {
                            sql = sql + " and E_COMPLAINT_TIME>=DATE'" + fnStartTime + "'";
                        }
                        if (fnEndTime) {
                            sql = sql + " and E_COMPLAINT_TIME<DATE'" + fnEndTime + "'";
                        }
                    } else {
                        sql = sql + " and E_COMPLAINT_TIME>=DATE'" + monthStartDate + "' and E_COMPLAINT_TIME<DATE'" + monthEndDate + "'";
                    }

                    //if (fnPhoneNum) {
                    //    sql = sql + " and YHHM='" + fnPhoneNum + "'";
                    //}

                    if (fnWorkId) {
                        sql = sql + " and E_WO_SERIAL_NO='" + fnWorkId + "'";
                    }

                    if (fnJjcd) {
                        if (fnJjcd.length == 1) {
                            sql = sql + " and " + fnJjcd[0];
                        } else {
                            sql = sql + " and (" + fnJjcd[0];
                            for (var num = 1; num < fnJjcd.length; num++) {
                                sql = sql + " or " + fnJjcd[num];
                            }
                            sql = sql + ")";
                        }
                    }

                    //if (fnTslb) {
                    //    if (fnTslb.length == 1) {
                    //        sql = sql + " and TSLB_ID='" + fnTslb[0] + "'";
                    //    } else {
                    //        sql = sql + " and (TSLB_ID='" + fnTslb[0] + "'";
                    //        for (var num = 1; num < fnTslb.length; num++) {
                    //            sql = sql + " or TSLB_ID='" + fnTslb[num] + "'";
                    //        }
                    //        sql = sql + ")";
                    //    }
                    //}

                    if (fnWllx) {
                        if (fnWllx.length == 1) {
                            sql = sql + " and " + fnWllx[0];
                        } else {
                            sql = sql + " and (" + fnWllx[0];
                            for (var num = 1; num < fnWllx.length; num++) {
                                sql = sql + " or " + fnWllx[num];
                            }
                            sql = sql + ")";
                        }
                    }

                    if (fnTsyyType) {
                        if (fnTsyyType.length == 1) {
                            sql = sql + " and " + fnTsyyType[0];
                        } else {
                            sql = sql + " and (" + fnTsyyType[0];
                            for (var num = 1; num < fnTsyyType.length; num++) {
                                sql = sql + " or " + fnTsyyType[num];
                            }
                            sql = sql + ")";
                        }
                    }

                    this.sql_refreshLayers(mapParent.getLayer(fnType), sql);
                    if (fnWorkId) {
                        var querytask = new QueryTask(urlRoute(mapParent.getLayer(fnType).url) + "/0");

                        var query = new Query();
                        query.where = sql;
                        query.outFields = ["*"];
                        query.returnGeometry = true;

                        querytask.execute(query, lang.hitch(mapParent, function (fset) {
                            if (fset.features.length > 0) {
                                //进行缩放工作
                                var extent = fset.features[0].geometry;
                                mapParent.centerAt(extent)
                            }
                            else {
                                common.popupMessage("未查到此工单号，无法跳转！", "提示");
                            }
                        }))
                    }
                    
                },


                //获得上月开端时候
                getLastMonthStartDate: function () {
                    var lastMonthStartDate = new Date(nowYear, lastMonth, 1);
                    return this.formatDate(lastMonthStartDate);
                },
                //获得上月停止时候
                getLastMonthEndDate: function () {
                    var lastMonthEndDate = new Date(nowYear, lastMonth, this.getMonthDays(lastMonth));
                    return this.formatDate(lastMonthEndDate);
                },
                getLastWeekStartDateFormat: function () {
                    //上周的第一天
                    var millisecond = 1000 * 60 * 60 * 24;
                    var priorWeekFirstDay = new Date(this.getLastWeekLastDate().getTime() - (millisecond * 6));
                    return this.formatDate(priorWeekFirstDay);
                },
                getLastWeekEndDateFormat: function () {
                    return this.formatDate(this.getLastWeekLastDate());
                },
                getLastWeekLastDate: function () {
                    //起止日期数组
                    var startStop = new Array();
                    //获取当前时间

                    //返回date是一周中的某一天
                    var week = now.getDay();
                    //返回date是一个月中的某一天
                    var month = now.getDate();
                    //一天的毫秒数
                    var millisecond = 1000 * 60 * 60 * 24;
                    //减去的天数
                    var minusDay = week != 0 ? week - 1 : 6;
                    //获得当前周的第一天
                    var currentWeekDayOne = new Date(now.getTime() - (millisecond * minusDay));
                    //上周最后一天即本周开始的前一天
                    var priorWeekLastDay = new Date(currentWeekDayOne.getTime() - millisecond);

                    return priorWeekLastDay;
                },
                //获得某月的天数
                getMonthDays: function (myMonth) {
                    var monthStartDate = new Date(nowYear, myMonth, 1);
                    var monthEndDate = new Date(nowYear, myMonth + 1, 1);
                    var days = (monthEndDate - monthStartDate) / (1000 * 60 * 60 * 24);
                    return days;
                },
                //格局化日期：yyyy-MM-dd
                formatDate: function (date) {
                    var myyear = date.getFullYear();
                    var mymonth = date.getMonth() + 1;
                    var myweekday = date.getDate();

                    if (mymonth < 10) {
                        mymonth = "0" + mymonth;
                    }
                    if (myweekday < 10) {
                        myweekday = "0" + myweekday;
                    }
                    return (myyear + "-" + mymonth + "-" + myweekday);
                },
                //需求进度跟踪
                changeGZXQType: function (toolDijits, currentToolDijit, mapParent) {
                    var timesType1 = true;
                    var timesType2 = true;
                    var definitionExpression = "";
                    var definitionExpression1 = "";
                    var definitionExpression2 = "";

                    $.each($("#GZXQTypeCB").find("input"), function () {
                        if (this.checked) {
                            definitionExpression1 += (timesType1 ? "" : " or") + " TYPE_DEL = '" + this.value + "'";
                            timesType1 = false;
                        }
                    });
                    $.each($("#GZXQStateCB").find("input"), function () {
                        if (this.checked) {
                            definitionExpression2 += (timesType2 ? "" : " or") + " STATE = '" + this.value + "'";
                            timesType2 = false;
                        }
                    });


                    if (definitionExpression1 == "") {
                        definitionExpression1 = "1=2";
                    }
                    if (definitionExpression2 == "") {
                        definitionExpression2 = "1=2";
                    }

                    definitionExpression = "(" + definitionExpression1 + ") and (" + definitionExpression2 + ")";
                    //查询条件，用于点数据查询，使用查询条件
                    var layer = mapParent.getLayer("需求跟踪需求点_WJJ");
                    this.sql_refreshLayers(layer, definitionExpression);
                },
                changeGZZDType: function (toolDijits, currentToolDijit, mapParent) {
                    var timesType1 = true;
                    var timesType2 = true;
                    var definitionExpression = "";
                    var definitionExpression1 = "";
                    var definitionExpression2 = "";
                    $.each($("#GZZDTypeCB").find("input"), function () {
                        if (this.checked) {
                            definitionExpression1 += (timesType1 ? "" : " or") + " SITE_TYPE = '" + this.value + "'";
                            timesType1 = false;
                        }
                    });
                    $.each($("#GZZDStateCB").find("input"), function () {
                        if (this.checked) {
                            definitionExpression2 += (timesType2 ? "" : " or") + " SITE_POSITION = '" + this.value + "'";
                            timesType2 = false;
                        }
                    });


                    if (definitionExpression1 == "") {
                        definitionExpression1 = "1=2";
                    }
                    if (definitionExpression2 == "") {
                        definitionExpression2 = "1=2";
                    }

                    definitionExpression = "(" + definitionExpression1 + ") and (" + definitionExpression2 + ")";
                    //查询条件，用于点数据查询，使用查询条件
                    var layer = mapParent.getLayer("需求跟踪站点_WJJ");
                    this.sql_refreshLayers(layer, definitionExpression);
                },
                changeGZXQType_YJJ: function (toolDijits, currentToolDijit, mapParent) {
                    var timesType1 = true;
                    var definitionExpression = "";
                    var definitionExpression1 = "";
                    $.each($("#GZXQTypeCB").find("input"), function () {
                        if (this.checked) {
                            definitionExpression1 += (timesType1 ? "" : " or") + " TYPE_DEL = '" + this.value + "'";
                            timesType1 = false;
                        }
                    });
                    if (definitionExpression1 == "") {
                        definitionExpression1 = "1=2";
                    }
                    definitionExpression = "(" + definitionExpression1 + ")";
                    //查询条件，用于点数据查询，使用查询条件
                    var layer = mapParent.getLayer("需求跟踪需求点_YJJ");
                    this.sql_refreshLayers(layer, definitionExpression);
                },
                changeGZZDType_YJJ: function (toolDijits, currentToolDijit, mapParent) {
                    var timesType1 = true;
                    var timesType2 = true;
                    var definitionExpression = "";
                    var definitionExpression1 = "";
                    var definitionExpression2 = "";
                    $.each($("#GZZDTypeCB").find("input"), function () {
                        if (this.checked) {
                            definitionExpression1 += (timesType1 ? "" : " or") + " SITE_TYPE = '" + this.value + "'";
                            timesType1 = false;
                        }
                    });
                    if (definitionExpression1 == "") {
                        definitionExpression1 = "1=2";
                    }
                    definitionExpression = "(" + definitionExpression1 + ")";
                    //查询条件，用于点数据查询，使用查询条件
                    var layer = mapParent.getLayer("需求跟踪站点_YJJ");
                    this.sql_refreshLayers(layer, definitionExpression);
                },
                //后评估
                changeHpgType: function (toolDijits, currentToolDijit, mapParent) {
                    var hpgDataTypeSelect = $("#hpgDataTypeSelect").val();
                    var timesType1 = true;
                    var timesType3 = true;
                    var definitionExpression = "";
                    var definitionExpression1 = "";
                    var definitionExpression3 = "";
                    var definitionExpression2 = "";
                    var definitionExpression4 = "";
                    
                    $.each($("#hpgXqTypeCB").find("input"), function () {
                        if (this.checked) {
                            definitionExpression1 += (timesType1 ? "" : " or") + " PRO_TYPE = '" + this.value + "'";
                            timesType1 = false;
                        }
                    });
                    $.each($("#hpgPgLevelCB").find("input"), function () {
                        if (this.checked) {
                            definitionExpression3 += (timesType3 ? "" : " or") + " PRO_STATE = '" + this.value + "'";
                            timesType3 = false;
                        }
                    });
                    definitionExpression2 = "CP_DATE = '" + $("#cur_monid").val() + "'";
                    definitionExpression4 = "SOU_DATE = '" + $("#cmp_monid").val() + "'";
                    if (definitionExpression1 == "") {
                        definitionExpression1 = "1=2";
                    }
                    if (definitionExpression3 == "") {
                        definitionExpression3 = "1=2";
                    }
                    
                    //definitionExpression5 = "DUAL = '" + hpgDataTypeSelect + "'";
                    definitionExpression = "(" + definitionExpression1 + ") and (" + definitionExpression3 + ") and (" + definitionExpression2 + ") and (" + definitionExpression4 + ")";
                    //查询条件，用于点数据查询，使用查询条件
                    var layer = mapParent.getLayer("后评估");
                    var layer_all = mapParent.getLayer("后评估_ALL");
                    var layer_fdd = mapParent.getLayer("后评估_FDD");
                    if (hpgDataTypeSelect == 'TDD') {
                        layer.setVisibility(true);
                        layer_all.setVisibility(false);
                        layer_fdd.setVisibility(false);
                        //this.sql_refreshLayers(layer, definitionExpression);
                        layer.setLayerDefinitions([definitionExpression]);
                    }
                    if (hpgDataTypeSelect == 'ALL') {
                        layer.setVisibility(false);
                        layer_all.setVisibility(true);
                        layer_fdd.setVisibility(false);
                        layer_all.setLayerDefinitions([definitionExpression]);
                    }
                    if (hpgDataTypeSelect == 'FDD') {
                        layer.setVisibility(false);
                        layer_all.setVisibility(false);
                        layer_fdd.setVisibility(true);
                        layer_fdd.setLayerDefinitions([definitionExpression]);
                    }
                    
                },
                //用户与业务--用户密集度
                changeYhmdXuan: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("Success changeYhmdXuan");
                    this._changeDyLayerDate($("#YhywXuanRanRadios"), "用户终端栅格", "用户终端楼宇", mapParent);
                    this._showDyLayer($("#YhywXuanRanCheckBoxs"), $("#YhywXuanRanRadios"), "用户终端栅格", "用户终端楼宇", mapParent);
                },
                //用户与业务--业务密集度
                changeYwmdXuan: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("Success changeYhmdXuan");
                    this._changeDyLayerDate($("#YwmdXuanRanRadios"), "业务密集度栅格", "业务密集度楼宇", mapParent);
                    this._showDyLayer($("#YwmdXuanRanCheckBoxs"), $("#YwmdXuanRanRadios"), "业务密集度栅格", "业务密集度楼宇", mapParent);
                },

                //用户与业务--高价值分析
                changeGjzXuan: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("Success changeGjzXuan");
                    this._changeDyLayerDate($("#GjzXuanRanRadios"), "高价值栅格", "高价值楼宇", mapParent);
                    this._showDyLayer($("#GjzXuanRanCheckBoxs"), $("#GjzXuanRanRadios"), "高价值栅格", "高价值楼宇", mapParent);
                },
                
                //动态更换ArcDynamicLayer时间--为查询条件下，利用属性进行的处理过程
                _changeDyLayerDate: function (randios, id_grid, id_build, mapParent) {
                    var layer_grid = mapParent.getLayer(id_grid);
                    var layer_build = mapParent.getLayer(id_build);
                    var layerDefinitions = [];
                    var time = $("#YhywTimeSelect").val();
                    if (!time) {
                        time = $("#YwmdTimeSelect").val();
                    }
                    if (!time) {
                        time = $("#GjzTimeSelect").val();
                    }
                    if (!time) {
                        time = this.format(new Date().getTime() - 3 * 24 * 60 * 60 * 1000, "yyyy-MM-dd");
                    }
                    var value = parseInt(randios.find("input[type=\"radio\"]:checked").val());
                    var tableName = "";
                    if(id_grid=="用户终端栅格"){
                        var tcdlVisible = $("#yhjzTcdlCB").attr("checked");
                        if (tcdlVisible) {
                            no_roadState = true;
                            tableName = "F_NO_ROAD_GRID_UTERMINAL_GIS";
                        } else {
                            tableName = "F_PREC_PLAN_GRID_UTERMINAL_GIS";
                        }
                    } else if (id_grid == "业务密集度栅格") {
                        var tcdlVisible = $("#ywjzTcdlCB").attr("checked");
                        if (tcdlVisible) {
                            no_roadState = true;
                            tableName = "F_NO_ROAD_GRID_BUSINESS_GIS";
                        }else{
                            tableName = "F_PREC_PLAN_GRID_BUSINESS_GIS";
                        }
                    } else if (id_grid == "高价值栅格") {
                        var tcdlVisible = $("#gjzTcdlCB").attr("checked");
                        if (tcdlVisible) {
                            no_roadState = true;
                            tableName = "F_NO_ROAD_GRID_HIGH_GIS";
                        } else {
                            tableName = "F_PREC_PLAN_GRID_HIGH_GIS";
                        }
                    }
                    //定义时间，以及查询条件
                    //for (var i in layer_grid.layerInfos) {
                    //    layerDefinitions[i] = "DATE_ID = " + time;
                    //}
                    layerDefinitions[value] = "DATE_ID = " + time.replace(/-/g, "");
                    if(no_roadState){
                        LayerUtil.changeLayerDynamicData(layer_grid, tableName, "sde238", null, true, value);
                    }
                    layer_grid.setLayerDefinitions(layerDefinitions);
                    layer_build.setLayerDefinitions(layerDefinitions);
                },
                //更换ArcDynamicLayer的图层显示与隐藏
                _showDyLayer: function (checkboxs, randios, id_grid, id_build, mapParent) {
                    var layer_Grid = mapParent.getLayer(id_grid);
                    var layer_Build = mapParent.getLayer(id_build);

                    var layer_checked = checkboxs.find("input[type=\"checkbox\"]:checked");
                    var value = parseInt(randios.find("input[type=\"radio\"]:checked").val());

                    if (layer_checked.length == 2) {
                        layer_Grid.setVisibility(true);
                        layer_Build.setVisibility(true);
                        layer_Grid.setVisibleLayers([value]);
                        layer_Build.setVisibleLayers([value]);
                    } else if (layer_checked.length == 1) {
                        if (layer_checked.val() == id_grid) {
                            layer_Grid.setVisibility(true);
                            layer_Build.setVisibility(false);
                            layer_Grid.setVisibleLayers([value]);
                        } else {
                            layer_Grid.setVisibility(false);
                            layer_Build.setVisibility(true);
                            layer_Build.setVisibleLayers([value]);
                        }
                    } else {
                        layer_Grid.setVisibility(false);
                        layer_Build.setVisibility(false);
                    }
                },
                changeSX_XQ: function (toolDijits, currentToolDijit, mapParent) {
                    var data = $("#Near_SX_Data").val().split("-").join("");
                    var table_pre = currentToolDijit.options.table_pre + data;
                    var table_relation = currentToolDijit.options.table_relation + data;
                    // var layer_pre = mapParent.getLayer(currentToolDijit.layer.id.split("- ")[0]);
                    var layer_pre = mapParent.getLayer(currentToolDijit.layer.id);
                    var layer_relation = mapParent.getLayer(currentToolDijit.layer.id.split("-")[currentToolDijit.layer.id.split("-").length - 1] + "小区扇形");
                    LayerUtil.changeLayerDynamicData(layer_pre, table_pre, currentToolDijit.workspaceId, null, true);
                    LayerUtil.changeLayerDynamicData(layer_relation, table_relation, currentToolDijit.workspaceId, null, true);
                    this.sql_refreshLayers(currentToolDijit.layer, "1=1");
                },
                _reback_LTE_GSM: function (toolDijits, currentToolDijit, mapParent) {
                    mapParent.getLayer("GSM小区扇形").setVisibility(false);
                    this.sql_refreshLayers( mapParent.getLayer("GSM小区扇形"), "1=1")
                    this._linetoOther_use(currentToolDijit, mapParent);
                },
                _reback_LTE_TD: function (toolDijits, currentToolDijit, mapParent) {
                    mapParent.getLayer("TD小区扇形").setVisibility(false);
                    this.sql_refreshLayers(mapParent.getLayer("TD小区扇形"), "1=1")
                    this._linetoOther_use(currentToolDijit, mapParent);
                },
                _reback_TD_LTE: function (toolDijits, currentToolDijit, mapParent) {
                    mapParent.getLayer("LTE小区扇形").setVisibility(false);
                    this.sql_refreshLayers(mapParent.getLayer("LTE小区扇形"), "1=1")
                    this._linetoOther_use(currentToolDijit, mapParent);
                },
                _linetoOther_use: function (currentToolDijit, mapParent) {
                    mapParent.getLayer("_graphicsLayerPolygonExtent_").clear();
                    mapParent.graphics.clear();
                    this.sql_refreshLayers(currentToolDijit.layer, "1=1")
                    $("#submit_reback")[0].style.display = "none"
                },
                changeCityRoad_SuSelect: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("Success changeCityRoad_SuSelect");
                    var layer = mapParent.getLayer("城区干线栅格");
                    var value = $("#CityRoad_Select").val();
                    layer.setVisibility(true);
                    layer.setVisibleLayers([value]);
                },
                changeHighWaySelect: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("Success changeHighWaySelect");
                    var layer_two = mapParent.getLayer("高速高铁线路");
                    var layer_thr = mapParent.getLayer("高铁告警线段");
                    var layer = mapParent.getLayer("高速高铁告警");
                    var layerCellRRU = mapParent.getLayer("高铁小区指标异常线段");
                    var layerZdgjld = mapParent.getLayer("重点攻坚路段");

                    var gsgtGjgzVisible = $("#gsgtGjgzCB").attr("checked");
                    var line = $("#highway_line").val();
                    var begintime = $("#highBegin").val().replace(/-/g, "");
                    var cellrru = $("#highWay_rru_zb").val();
                    var zdgjldType = $("#highWay_zdgjld").val();

                    var sql = "TIME = '" + begintime + "'";
                    var rru_sql = "DATE_ID = '" + begintime + "'";

                    var sql_1 = "1=2";
                    var sql_2 = "1=2";
                    var sql_3 = "1=2";
                    var sql_4 = "1=2";

                    if (line) {
                        if (line.length == 1) {
                            sql_1 = "ROAD_NAME = '" + line[0] + "'";
                            sql_2 = "NAME = '" + line[0] + "高铁'";
                        } else {
                            sql_1 = "ROAD_NAME = '" + line[0] + "'";
                            sql_2 = "NAME = '" + line[0] + "高铁'";
                            for (var num = 1; num < line.length; num++) {
                                sql_1 = sql_1 + " or ROAD_NAME = '" + line[num] + "'";
                                sql_2 = sql_2 + " or NAME = '" + line[num] + "高铁'";
                            }
                        }
                    }

                    //事件类型
                    var _line_EventType = $("#_line_EventType").val();
                    if (_line_EventType) {
                        if (_line_EventType.length == 1) {
                            sql_3 = "EVENT_TYPE = '" + _line_EventType[0] + "'";
                        } else {
                            sql_3 = "EVENT_TYPE = '" + _line_EventType[0] + "'";
                            for (var num = 1; num < _line_EventType.length; num++) {
                                sql_3 = sql_3 + " or EVENT_TYPE = '" + _line_EventType[num] + "'";
                            }
                        }

                        if (gsgtGjgzVisible) {
                            sql_3 += " or EVENT_TYPE ='故障告警'";
                        }
                    } else {
                        if (gsgtGjgzVisible) {
                            sql_3 += " or EVENT_TYPE ='故障告警'";
                        }
                    }

                    if (cellrru) {
                        layerCellRRU.setVisibility(true);
                        if (cellrru.length == 1) {
                            sql_4 = cellrru[0];
                        } else {
                            sql_4 = cellrru[0];
                            for (var num = 1; num < cellrru.length; num++) {
                                sql_4 = sql_4 + " or " + cellrru[num];
                            }
                        }
                        layerCellRRU.setLayerDefinitions(["(" + rru_sql + ") and (" + sql_1 + ") and (" + sql_4 + ")"]);
                    } else {
                        layerCellRRU.setVisibility(false);
                    }


                    if (zdgjldType) {
                        layerZdgjld.setVisibility(true);
                        if (zdgjldType.length == 1) {
                            sql_5 = zdgjldType[0];
                        } else {
                            sql_5 = zdgjldType[0];
                            for (var num = 1; num < zdgjldType.length; num++) {
                                sql_5 = sql_5 + " or " + zdgjldType[num];
                            }
                        }
                        layerZdgjld.setLayerDefinitions(["(" + sql_1 + ") and (" + sql_5 + ")"]);
                    } else {
                        layerZdgjld.setVisibility(false);
                    }

                    var layerSql = "(" + sql + ") and (" + sql_1 + ") and (" + sql_3 + ")";
                    
                    console.log(sql_2);
                    console.log(layerSql);

                    layer._where = layerSql;
                    layer._visitedExtent = false;
                    layer.updateClusters();

                    layer_two.setLayerDefinitions([sql_2]);
                    layer_thr.setLayerDefinitions([layerSql]);

                },
                changeCJ_BZ_QS_Tools: function (toolDijits, currentToolDijit, mapParent) {

                    var heatVisible = $("#qsjkHeatCB").attr("checked");
                    var layerValue = [];
                    $.each($("input[type=\"checkbox\"][name=\"cjQSBox\"]:checked"), function () {
                        var valueCB = $(this).val();
                        layerValue.push(valueCB);                       
                    });

                    var sqls = ["1=1", "1=1", "1=1"];

                    var sql1 = "1=1";                    
                    var qjSelect1 = $("#gfh_qjSelect").val();
                    if (qjSelect1) {
                        if (qjSelect1.length == 1) {
                            sql1 = qjSelect1[0];
                        } else {
                            sql1 = "(" + qjSelect1[0] + ")";
                            for (var num = 1; num < qjSelect1.length; num++) {
                                sql1 = sql1 + " or (" + qjSelect1[num] + ")";
                            }
                        }
                    }

                    var sql2 = "1=1";
                    var qjSelect2 = $("#gll_qjSelect").val();
                    if (qjSelect2) {
                        if (qjSelect2.length == 1) {
                            sql2 = qjSelect2[0];
                        } else {
                            sql2 = "(" + qjSelect2[0] + ")";
                            for (var num = 1; num < qjSelect2.length; num++) {
                                sql2 = sql2 + " or (" + qjSelect2[num] + ")";
                            }
                        }
                    }

                    sqls = [sql1, sql2, "1=1"];

                    var ghwQSLayer = mapParent.getLayer("全省监控");
                    var gfhHeatLayer = mapParent.getLayer("高负荷热力图");
                    var gllHeatLayer = mapParent.getLayer("高流量热力图");
                    var gysHeatLayer = mapParent.getLayer("高拥塞热力图");
                    gfhHeatLayer.setVisibility(false);
                    gllHeatLayer.setVisibility(false);
                    gysHeatLayer.setVisibility(false);
                    if (heatVisible) {
                        var heatcolor = ["rgba(0,0,0,0.05)", "#E8F0FE", "#D2E1FE", "#BBD2FD", "#A5C3FC", "#8FB4FB", "#79A5FB", "#6296FA", "#4C87F9", "#3578F9", "#1F69F8", "#3578F9", "#1F69F8", "#3E87BF", "#4390C2", "#3E87BF", "#4390C2", "#4799C5", "#4CA1C8", "#51AACB", "#57B3CD", "#5CBBCE", "#63C3CF", "#64C2C3", "#65C1B7", "#66C0A9", "#67BF9C", "#68BE8F", "#69BD81", "#6ABC73", "#6BBC66", "#6BBB58", "#6BBA49", "#6CB93A", "#85C139", "#9CC939", "#B1D139", "#C4D839", "#D6E03B", "#E7E73D", "#EADA38", "#ECCC33", "#EEBC2E", "#EFAC2A", "#F09926", "#F08622", "#EE7922", "#ED6C23", "#EB5E23", "#EA5023", "#E83F23", "#E72A22"];
                        var heatmapRenderer = new HeatmapRenderer({
                            colors: heatcolor,
                            blurRadius: 10,
                            maxPixelIntensity: 60,
                            minPixelIntensity: 0
                        });                        
                        if (layerValue.length>0) {
                            for (var i = 0; i < layerValue.length; i++) {
                                if(layerValue[i]=="0"){
                                    gfhHeatLayer.setRenderer(heatmapRenderer);
                                    gfhHeatLayer.setDefinitionExpression(sql1);
                                    gfhHeatLayer.setVisibility(true);
                                }else if(layerValue[i]=="1"){
                                    gllHeatLayer.setRenderer(heatmapRenderer);
                                    gllHeatLayer.setDefinitionExpression(sql2);
                                    gllHeatLayer.setVisibility(true);
                                }else if(layerValue[i] == "2") {
                                    gysHeatLayer.setRenderer(heatmapRenderer);
                                    gysHeatLayer.setVisibility(true);
                                }
                            }
                        }
                    }

                    ghwQSLayer.setVisibleLayers(layerValue);
                    ghwQSLayer.setLayerDefinitions(sqls);
                    //或者使用id，处理步骤
                    //var layer = mapParent.getLayer("全省监控");
                    //var check = $("#CJ_BZ_QS_CheckBoxs").find("input[type=\"checkbox\"]:checked");
                    //var layerid = [];
                    //for (var i = 0; i < check.length; i++) {
                    //    layerid.push(check[i].value)
                    //}
                    //layer.setVisibleLayers(layerid);
                },
                //指纹库覆盖网格分析
                changeZWKGridMutil: function (toolDijits, currentToolDijit, mapParent) {
                    var toolsArray = $("#layerToolsBox").find("div[class=\"attrRow\"]");
                    var value = $("#ZWKCoverGridRadios").find("input[type=\"radio\"]:checked").val()
                    var sqls = ["1=1"];
                    switch (value) {
                        case "0":
                            $("#" + toolsArray[6].id).css("display", "none");
                            $("#" + toolsArray[8].id).css("display", "none");
                            $("#" + toolsArray[7].id).css("display", "none");
                            $("#" + toolsArray[9].id).css("display", "block");
                            var sql = "1=1";
                            var qjSelect = $("#cyd_zwkmgrs_qjSelect").val();
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    sql = qjSelect[0];
                                } else {
                                    sql = "(" + qjSelect[0] + ")";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        sql = sql + " or (" + qjSelect[num] + ")";
                                    }
                                }
                            }
                            sqls = [sql, "1=2", "1=2", "1=2"];
                            break;
                        case "1":
                            $("#" + toolsArray[6].id).css("display", "none");
                            $("#" + toolsArray[8].id).css("display", "none");
                            $("#" + toolsArray[7].id).css("display", "block");
                            $("#" + toolsArray[9].id).css("display", "none");
                            var sql = "1=1";
                            var qjSelect = $("#yd_zwkmgrs_qjSelect").val();
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    sql = qjSelect[0];
                                } else {
                                    sql = "(" + qjSelect[0] + ")";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        sql = sql + " or (" + qjSelect[num] + ")";
                                    }
                                }
                            }
                            sqls = ["1=2", sql, "1=2", "1=2"];
                            break;
                        case "2":
                            $("#" + toolsArray[6].id).css("display", "none");
                            $("#" + toolsArray[8].id).css("display", "block");
                            $("#" + toolsArray[7].id).css("display", "none");
                            $("#" + toolsArray[9].id).css("display", "none");
                            var sql = "1=1";
                            var qjSelect = $("#dx_zwkmgrs_qjSelect").val();
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    sql = qjSelect[0];
                                } else {
                                    sql = "(" + qjSelect[0] + ")";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        sql = sql + " or (" + qjSelect[num] + ")";
                                    }
                                }
                            }
                            sqls = ["1=2", "1=2", sql,"1=2"];
                            break;
                        case "3":
                            $("#" + toolsArray[6].id).css("display", "block");
                            $("#" + toolsArray[8].id).css("display", "none");
                            $("#" + toolsArray[7].id).css("display", "none");
                            $("#" + toolsArray[9].id).css("display", "none");
                            var sql = "1=1";
                            var qjSelect = $("#lt_zwkmgrs_qjSelect").val();
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    sql = qjSelect[0];
                                } else {
                                    sql = "(" + qjSelect[0] + ")";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        sql = sql + " or (" + qjSelect[num] + ")";
                                    }
                                }
                            }
                            sqls = ["1=2", "1=2", "1=2", sql];
                            break;
                    }
                    var time_value = $("#ZWK_TimeMuti").find("input[type=\"radio\"]:checked").val()
                    var date = $("#ZWKCoverGridDate").val().split("-");
                    if (time_value == "day") {
                        $("#" + toolsArray[1].id).css("display", "block");
                        $("#" + toolsArray[2].id).css("display", "none");
                        $("#" + toolsArray[3].id).css("display", "none");
                        
                        date = date.join("");
                        //仅时间切换时候进行小区扇形的更换
                        var layer_site = mapParent.getLayer("LTE扇形");
                        var site_table = "GIS_OBJECT_LTESX" + date;
                        LayerUtil.changeLayerDynamicData(layer_site, site_table, "CellThiess99", null, true);
                    } else if (time_value == "week") {
                        $("#" + toolsArray[1].id).css("display", "none");
                        $("#" + toolsArray[2].id).css("display", "block");
                        $("#" + toolsArray[3].id).css("display", "none");

                        var selectDate = $("#ZWKGridWDateSelect").val().split("-");
                        date = "_W" + selectDate[0];
                    } else if (time_value == "month") {
                        $("#" + toolsArray[1].id).css("display", "none");
                        $("#" + toolsArray[2].id).css("display", "none");
                        $("#" + toolsArray[3].id).css("display", "block");

                        var selectDate = $("#ZWKGridMDateSelect").val();
                        date = selectDate;
                    }
                    if (value && date) {
                        console.log("changeZWKGridMutil is Going")
                        var arcDynamicLayer = mapParent.getLayer("指纹库覆盖网格");
                        var table = "GIS_ZWK_COVER_GRID" + date;
                        arcDynamicLayer.setLayerDefinitions(sqls);
                        LayerUtil.changeLayerDynamicData(arcDynamicLayer, table, "sde238", null, true, value);

                        var layer_site = mapParent.getLayer("指纹栅格联小区天表");
                        var connect_table = "GIS_ZWK_GRID_CELL" + date;
                        LayerUtil.changeLayerDynamicData(layer_site, connect_table, "sde238", null, true);
                    }
                },
                changZWKReturnBtn: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("自定义函数::changZWKReturnBtn执行成功！");
                    var popLayer1 = mapParent.getLayer("指纹库覆盖网格");
                    var popLayer2 = mapParent.getLayer("LTE扇形");
                    var value = $("#ZWKCoverGridRadios").find("input[type=\"radio\"]:checked").val()
                    var sqls = ["1=1"];
                    switch (value) {
                        case "0":
                            var sql = "1=1";
                            var qjSelect = $("#cyd_zwkmgrs_qjSelect").val();
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    sql = qjSelect[0];
                                } else {
                                    sql = "(" + qjSelect[0] + ")";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        sql = sql + " or (" + qjSelect[num] + ")";
                                    }
                                }
                            }
                            sqls = [sql, "1=2", "1=2", "1=2"];
                            break;
                        case "1":
                            var sql = "1=1";
                            var qjSelect = $("#yd_zwkmgrs_qjSelect").val();
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    sql = qjSelect[0];
                                } else {
                                    sql = "(" + qjSelect[0] + ")";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        sql = sql + " or (" + qjSelect[num] + ")";
                                    }
                                }
                            }
                            sqls = ["1=2", sql, "1=2", "1=2"];
                            break;
                        case "2":
                            var sql = "1=1";
                            var qjSelect = $("#dx_zwkmgrs_qjSelect").val();
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    sql = qjSelect[0];
                                } else {
                                    sql = "(" + qjSelect[0] + ")";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        sql = sql + " or (" + qjSelect[num] + ")";
                                    }
                                }
                            }
                            sqls = ["1=2", "1=2", sql, "1=2"];
                            break;
                        case "3":
                            var sql = "1=1";
                            var qjSelect = $("#lt_zwkmgrs_qjSelect").val();
                            if (qjSelect) {
                                if (qjSelect.length == 1) {
                                    sql = qjSelect[0];
                                } else {
                                    sql = "(" + qjSelect[0] + ")";
                                    for (var num = 1; num < qjSelect.length; num++) {
                                        sql = sql + " or (" + qjSelect[num] + ")";
                                    }
                                }
                            }
                            sqls = ["1=2", "1=2", "1=2", sql];
                            break;
                    }
                    popLayer1.setLayerDefinitions(sqls);;
                    this.sql_refreshLayers(popLayer2, "1=1");
                    popLayer2.setVisibility(false);
                    mapParent.getLayer("_graphicsLayerPolygonExtent_").clear();
                    mapParent.graphics.clear();
                    $("#ZWKReturn").css("display", "none");
                },
                changeZWKSXDate: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("自定义函数::changeZWKSXDate执行成功！");
                    var date = $("#ZWK_SX_Date").val().replace(/-/g, "");
                    var qjSelect = $("#cyd_qjSelect").val();
                    var sql = "1=1";
                    if (qjSelect) {
                        if (qjSelect.length == 1) {
                            sql = qjSelect[0];
                        } else {
                            sql = "("+qjSelect[0]+")";
                            for (var num = 1; num < qjSelect.length; num++) {
                                sql = sql + " or (" + qjSelect[num] + ")";
                            }
                        }
                    }


                    var zwk_sx_table = "GIS_ZWK_COVER_CELL" + date;
                    var layer_polt = mapParent.getLayer("指纹库polt");

                    var target_table = "GIS_ZWK_CYD_PNT" + date;
                    //var layer_pnt = mapParent.getLayer("指纹库pnt");

                    var xwcell_sx_table = "GIS_OBJECT_LTESX" + date;
                    var xwcell_sx = mapParent.getLayer("采样点现网小区");

                    LayerUtil.changeLayerDynamicData(layer_polt, zwk_sx_table, "sde238", null, true);
                    //LayerUtil.changeLayerDynamicData(layer_pnt, target_table, "sde238", null, true);
                    LayerUtil.changeLayerDynamicData(xwcell_sx, xwcell_sx_table, "CellThiess99", null, true);

                    this.sql_refreshLayers(layer_polt, sql);
                },
                changZWKPPntReturnBtn: function (toolDijits, currentToolDijit, mapParent) {
                    console.log("自定义函数::changeZWKSXDate执行成功！");
                    var popLayer1 = mapParent.getLayer("指纹库polt");
                    var popLayer2 = mapParent.getLayer("cydLayer");
                    var xwcell_sx = mapParent.getLayer("采样点现网小区");
                    var qjSelect = $("#cyd_qjSelect").val();
                    var sql = "1=1";
                    if (qjSelect) {
                        if (qjSelect.length == 1) {
                            sql = qjSelect[0];
                        } else {
                            sql = "(" + qjSelect[0] + ")";
                            for (var num = 1; num < qjSelect.length; num++) {
                                sql = sql + " or (" + qjSelect[num] + ")";
                            }
                        }
                    }
                    this.sql_refreshLayers(popLayer1, sql);
                    //this.sql_refreshLayers(popLayer2, "1=1");
                    if (popLayer2) {
                        mapParent.removeLayer(popLayer2);
                    }                    
                    xwcell_sx.setVisibility(false);
                    $("#ZWKPPntReturn").css("display", "none");
                },
                _CCIPPrintBtn: function (toolDijits, currentToolDijit, mapParent) {
                    var url = "../proxy_to_11_8001/Complaint/ComplainPoints";
                    url = urlRoute(url);
                    window.open(url);
                }, 
                /*异常分析*/
                _zTycfcFn: function (tags, currentToolDijit, mapParent) {

                    //获取DOM值
                    var arrLayer = [],
                        sqlArr = ["1=2", "1=2", "1=2", "1=2", "1=2", "1=2", "1=2"],
                        layerNum,
                        sql,
                        layers = ["异常分析楼宇", "异常分析栅格"],
                        layerBuild = mapParent.getLayer(layers[0]),
                        layerGrid = mapParent.getLayer(layers[1]);
                        

                    sql = "DATE_ID = '" + $(tags[0].domNode).find("input").val().replace(/[^0-9]/ig, "") + "'";//日期过滤
                    $.each($(tags[2].domNode).find("input[type=\"checkbox\"]:checked"), function () { arrLayer.push($(this).val()); });//楼宇or栅格
                    layerNum = $(tags[3].domNode).find("input[type=\"radio\"]:checked").val();//渲染切换子图层
                    sqlArr[layerNum] = sql;//只过滤渲染子图层
                    var showLayerBuild = arrLayer.indexOf(layers[0]) != -1;//判断图层是否楼宇
                    var showLayerGrid = arrLayer.indexOf(layers[1]) != -1;//判断图层是否栅格

                    //API控制图层
                    if (showLayerBuild) {
                        layerBuild.setLayerDefinitions(sqlArr);
                        layerBuild.setVisibleLayers([layerNum]);
                    }
                    if (showLayerGrid) {
                        layerGrid.setLayerDefinitions(sqlArr);
                        layerGrid.setVisibleLayers([layerNum]);
                    }
                    layerBuild.setVisibility(showLayerBuild);
                    layerGrid.setVisibility(showLayerGrid);
                },
                _addPictureSymbol: function (geometry) {
                    var simplePictureMarkerSymbol = new PictureMarkerSymbol('./widgets/Location/images/locate.gif', 30, 30);
                    var graphic = new Graphic(geometry, simplePictureMarkerSymbol);
                    mapParent.graphics.clear();
                    mapParent.graphics.add(graphic);
                },
                addFeature: function () {
                    if (!this._mapmanager.editstatusmanager._add) return;
                    if(this._mapmanager.editstatusmanager._edit==2){
                        alert("请先结束编辑");
                        return;
                    }
                    if (this._mapmanager.editstatusmanager._delete == 2) {
                        alert("请先取消删除");
                        return;
                    }
                    if (this._yqjklayer) {
                        //this._mapmanager.editstatusmanager._add = !this._mapmanager.editstatusmanager._add;
                        if (this._mapmanager.editstatusmanager._add == 1) {
                            this._mapmanager.editstatusmanager._add = 2;
                            $("#layerToolsBox .button:eq(0)").val('结束新增')
                            this._mapmanager.drawtoolbar.activate(Draw['POLYGON']);
                        } else if (this._mapmanager.editstatusmanager._add == 2) {
                            this._mapmanager.editstatusmanager._add = 1;
                            $("#layerToolsBox .button:eq(0)").val('新增')
                            this._mapmanager.drawtoolbar.deactivate();
                        }
                    }
                },
                modifyFeature: function () {
                    if (!this._mapmanager.editstatusmanager._edit) return;
                    if (this._mapmanager.editstatusmanager._add == 2) {
                        alert("请先结束新增");
                        return;
                    }
                    if (this._mapmanager.editstatusmanager._delete == 2) {
                        alert("请先取消删除");
                        return;
                    }
                    if (this._yqjklayer) {
                        //this._mapmanager.editstatusmanager._edit = !this._mapmanager.editstatusmanager._edit;
                        if (this._mapmanager.editstatusmanager._edit == 1) {
                            this._mapmanager.editstatusmanager._edit = 2
                            $("#layerToolsBox .button:eq(1)").val('结束编辑')
                        } else if (this._mapmanager.editstatusmanager._edit == 2) {
                            var status = this._mapmanager.edittoolbar.getCurrentState();
                            if (!status.graphic) {
                                this._mapmanager.editstatusmanager._edit = 1
                                $("#layerToolsBox .button:eq(1)").val('编辑')
                            } else {
                                if (status.isModified) {
                                    this.saveEdit(status.graphic);
                                }
                                this._mapmanager.edittoolbar.deactivate();
                                this._mapmanager.editstatusmanager._edit = 1
                                $("#layerToolsBox .button:eq(1)").val('编辑');
                            }
                        }
                    }
                },
                deleteFeature: function () {
                    if (!this._mapmanager.editstatusmanager._delete) return;
                    if (this._mapmanager.editstatusmanager._add==2) {
                        alert("请先结束新增");
                        return;
                    }
                    if (this._mapmanager.editstatusmanager._edit==2) {
                        alert("请先结束编辑");
                        return;
                    }
                    if (this._yqjklayer) {
                        //this._mapmanager.editstatusmanager._delete = !this._mapmanager.editstatusmanager._delete;
                        if (this._mapmanager.editstatusmanager._delete == 1) {
                            this._mapmanager.editstatusmanager._delete = 2;
                            $("#layerToolsBox .button:eq(2)").val('取消删除')
                        } else if (this._mapmanager.editstatusmanager._delete == 2) {
                            this._mapmanager.editstatusmanager._delete = 1;
                            $("#layerToolsBox .button:eq(2)").val('删除')
                            this._mapmanager.edittoolbar.deactivate();
                        }
                    }
                },

                _format: function (time, format) {

                    var t = new Date(time);

                    var tf = function (i) { return (i < 10 ? '0' : '') + i };

                    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {

                        switch (a) {

                            case 'yyyy':

                                return tf(t.getFullYear());

                                break;

                            case 'MM':

                                return tf(t.getMonth() + 1);

                                break;

                            case 'mm':

                                return tf(t.getMinutes());

                                break;

                            case 'dd':

                                return tf(t.getDate());

                                break;

                            case 'HH':

                                return tf(t.getHours());

                                break;

                            case 'ss':

                                return tf(t.getSeconds());

                                break;

                        }

                    })

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
