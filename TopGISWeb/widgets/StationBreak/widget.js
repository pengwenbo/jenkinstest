/**
 * Created by huangfei on 2018/8/27.
 */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/topic',
    'dojo/Deferred',
    'jimu/BaseWidget',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-style',
    'jimu/utils',
    'dojo/request/xhr',
    'jimu/dijit/LoadingIndicator',
    'jimu/dijit/Message',
    'esri/graphic',
    "dijit/Dialog",
    'esri/geometry/Point',
    "esri/SpatialReference",
    "esri/symbols/PictureMarkerSymbol",
    "esri/renderers/ClassBreaksRenderer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "esri/InfoTemplate",
    'esri/graphicsUtils',
    'jimu/LayerInfos/LayerInfos',
    "esri/geometry/Extent",
    'dijit/_WidgetsInTemplateMixin',
    'esri/layers/GraphicsLayer',
    'dojo/string',
    './PopupWindow/widget',
    'jimu/cronosgis/utils/DateUtil',
    'dojo/i18n!./nls/strings'
], function (declare, array, lang, html, on, topic, Deferred, BaseWidget, domClass, domConstruct, domStyle, utils, xhr, LoadingIndicator, Message, Graphic, Dialog, Point, SpatialReference, PictureMarkerSymbol, ClassBreaksRenderer, SimpleFillSymbol, SimpleLineSymbol, Color, InfoTemplate, graphicsUtils, LayerInfos, Extent,
    _WidgetsInTemplateMixin, GraphicsLayer, dojoString, SBPopupWindowWidget, DateUtil, nls) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-stationbreak',
        name: "stationbreak",
        open: false,
        _popupWindow: null,
        nls: nls,
        popdata: {},
        breakData: {},
        uuid: null,
        loading: null,
        _dataRequestUrl:"http://221.182.241.179:85/Nokia_NetworkOptimize_BrokenStation_Api/api/BrokenStation",
        postCreate: function () {
            this.inherited(arguments);

        },
        onOpen: function () {
            //时间控件
            this.breakDateChooser.value = DateUtil.format(DateUtil.addDay(new Date(), -1), "yyyy-MM-ddThh:mm");
            //loading控件
            this.loading = new LoadingIndicator({
                hidden: true
            }, this.loadingNode);
            this.loading.startup();
        },
        fileSelected: function () {
            this.clearLocal();
            //文件选择
            if (utils.file.supportHTML5()) {
                this._processFiles(this.csvFileInput.files);
            } else if (utils.file.supportFileAPI()) {
                this._processFiles(window.FileAPI.getFiles(this.csvFileInput));
            } else {
                console.log("no file handler support !");
            }
            this.csvFileInput.value = null;
            //domClass.add(this.downloadResultsBtn, "hide");






        },
        clearLocal: function () {

        },
        _showLoading: function () {
            this.loading.show();
        },
        _hideLoading: function () {
            this.loading.hide();
        },
        _generateUUID: function () {
            //生成UUID
            var d = new Date().getTime();
            if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
                d += performance.now(); //use high-precision timer if available
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        },
        _uploadFileBase: function (loadfile, date, uid) {
            // 上传Excel数据
            let data = new FormData();
            data.append('baseFile', loadfile);
            data.append('date_id', date);
            data.append('uuid', uid);
            //console.log(data)

            popdata = this._getattr(date, uuid);

        },
        _processFiles: function (files) {
            //选择文件不可用
            //domClass.add(this.showFileDialogBtn, 'jimu-state-disabled');
            this._showLoading();


            this._resetResults();
            // console.log(selectMap);
            if (files.length > 0) {
                var file = files[0];
                var fileExtension = file.name.substring(file.name.lastIndexOf('.') + 1).toUpperCase();
                if (file.name.indexOf('.csv') !== -1) {
                    if (file) {
                        this.handleCSV(file);
                    } else {
                        Message({
                            message: this.nls.error.fileIssue
                        });
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                        this.clearCSVResults();
                    }
                }
                //包括一般的excel的数据表格（模板）和txt文本
                else if (fileExtension.indexOf("XL") !== -1 || fileExtension.indexOf("TXT") !== -1) {
                    if (file) {
                        this.handleXLSX(file);
                    } else {
                        Message({
                            message: this.nls.error.XLSXerro
                        });
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                        this.clearXLSXResult();
                    }
                } else {
                    new Message({
                        message: this.nls.error.notCSVFile
                    });
                    //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                    this.clearCSVResults();
                }
            }
        },
        _getattr: function (date, uid) {
            //取右侧侧边栏数据
            var  resdata = "{\"status\":1,\"yuAnDataList\":[{\"index_name\":\"参数预案\",\"index_value\":\"可抬高(琼海博鳌国宾馆五号楼_五小区_琼海博鳌国宾馆4号路灯杆-HLH-1)等小区功率\"},{\"index_name\":\"天馈软调整预案\",\"index_value\":\"可调整(琼海博鳌国宾馆五号楼_五小区_琼海博鳌国宾馆4号路灯杆-HLH-1)等小区电源天线倾角\"},{\"index_name\":\"应急车开通预案\",\"index_value\":\"无\"}],\"g24rate\":[{\"index_name\":\"2/4G小区占比\",\"index_part\":\"\",\"index_value\":\"0/4\"}],\"gridNum\":[{\"index_name\":\"栅格数\",\"index_part\":\"\",\"index_value\":\"281\"}],\"pointNum\":[{\"index_name\":\"小区数\",\"index_part\":\"L1\",\"index_value\":\"1\"},{\"index_name\":\"小区数\",\"index_part\":\"L4\",\"index_value\":\"1\"},{\"index_name\":\"小区数\",\"index_part\":\"L5\",\"index_value\":\"2\"}],\"dzCellCountList\":[{\"index_name\":\"采样点数\",\"index_value\":\"486642\"},{\"index_name\":\"日均用户数\",\"index_value\":\"2360.00\"},{\"index_name\":\"流量\",\"index_value\":\"349924.49\"},{\"index_name\":\"话务量\",\"index_value\":\"231.69\"}],\"cfBreakNum\":[{\"index_name\":\"重复中断小区数\",\"index_part\":\"\",\"index_value\":\"2\"}],\"zbCellList\":[{\"index_name\":\"掉线率\",\"index_value\":\"0.050000\"},{\"index_name\":\"接通率\",\"index_value\":\"99.940000\"},{\"index_name\":\"上行感知速率\",\"index_value\":\"1.838301\"},{\"index_name\":\"下行感知速率\",\"index_value\":\"8.574150\"}],\"regionArea\":[{\"index_name\":\"区域面积\",\"index_part\":\"\",\"index_value\":\"702500\"}]}";
                //console.log(JSON.parse(resdata))
                popdata = JSON.parse(resdata)
                //数据录入
                breakData.gridNum = popdata.gridNum[0].index_value ? popdata.gridNum[0].index_value : 0;
                breakData.regionArea = popdata.regionArea[0].index_value ? popdata.regionArea[0].index_value +'m<sup>2</sup>': 0+"m<sup>2</sup>";
                breakData.g24rate = popdata.g24rate[0].index_value ? popdata.g24rate[0].index_value : 0;
                breakData.cfBreakNum = popdata.cfBreakNum[0].index_value ? popdata.cfBreakNum[0].index_value : 0;
                for (var ikey in popdata.pointNum) {
                    var result;
                    switch (popdata.pointNum[ikey].index_part) {
                        case "L1":
                            result = $.grep(breakData.cellsData, function (element) {
                                return (element.index_part == 'L1');
                            });
                            result[0].index_value = popdata.pointNum[ikey].index_value;
                            break;
                        case "L2":
                            result = $.grep(breakData.cellsData, function (element) {
                                return (element.index_part == 'L2');
                            });
                            result[0].index_value = popdata.pointNum[ikey].index_value;
                            break;
                        case "L3":
                            result = $.grep(breakData.cellsData, function (element) {
                                return (element.index_part == 'L3');
                            });
                            result[0].index_value = popdata.pointNum[ikey].index_value;
                            break;
                        case "L4":
                            result = $.grep(breakData.cellsData, function (element) {
                                return (element.index_part == 'L4');
                            });
                            result[0].index_value = popdata.pointNum[ikey].index_value;
                            break;
                        case "L5":
                            result = $.grep(breakData.cellsData, function (element) {
                                return (element.index_part == 'L5');
                            });
                            result[0].index_value = popdata.pointNum[ikey].index_value;
                    }
                };
                for (var ikey in popdata.dzCellCountList) {
                    switch (popdata.dzCellCountList[ikey].index_name) {
                        case "采样点数":
                            breakData.pointNum = popdata.dzCellCountList[ikey].index_value;
                            break;
                        case "日均用户数":
                            breakData.userNum = parseFloat(popdata.dzCellCountList[ikey].index_value).toFixed(0);
                            break;
                        case "流量":
                            breakData.flowTotal = parseFloat(popdata.dzCellCountList[ikey].index_value / 1000000).toFixed(2) + 'GB';
                            break;
                        case "话务量":
                            breakData.hwTotall = parseFloat(popdata.dzCellCountList[ikey].index_value).toFixed(1) + 'Erl';
                    }
                };
                for (var ikey in popdata.zbCellList) {
                    var upgzRate, downgzRate;
                    switch (popdata.zbCellList[ikey].index_name) {
                        case "掉线率":
                            breakData.dropRate = parseFloat(popdata.zbCellList[ikey].index_value).toFixed(2) + '%';
                            break;
                        case "接通率":
                            breakData.connectRate = parseFloat(popdata.zbCellList[ikey].index_value).toFixed(1) + '%';
                            break;
                        case "上行感知速率":
                            upgzRate = parseFloat(popdata.zbCellList[ikey].index_value);
                            break;
                        case "下行感知速率":
                            downgzRate = parseFloat(popdata.zbCellList[ikey].index_value);
                    }
                    breakData.gzRate = parseFloat(upgzRate + downgzRate).toFixed(0) + 'Mbps';
                };
                for (var ikey in popdata.yuAnDataList) {
                    switch (popdata.yuAnDataList[ikey].index_name) {
                        case "参数预案":
                            breakData.canshuya = popdata.yuAnDataList[ikey].index_value;
                            break;
                        case "天馈硬调整预案":
                            breakData.tkytz = popdata.yuAnDataList[ikey].index_value;
                            break;
                        case "天馈软调整预案":
                            breakData.tkrtz = popdata.yuAnDataList[ikey].index_value;
                            break;
                        case "应急车开通预案":
                            breakData.yjc = popdata.yuAnDataList[ikey].index_value;
                    }
                };
                //console.log(breakData)
                //创建弹窗
                if (this._popupWindow == null) {
                    this._popupWindow = new SBPopupWindowWidget({
                        map: this.map,
                        appConfig: this.appConfig,
                        target: this
                    }).placeAt(html.byId("map"));
                }
                html.setStyle(this._popupWindow.domNode, "display", "block");
                this._popupWindow.initCompent(breakData);
                this._hideLoading();

        },
        handleCSV: function (file) {

        },
        handleXLSX: function (file) {

            //生成断站时间
            var dateValue = $(this.breakDateChooser).val();
            dateValue = DateUtil.parseToTimeSimple(dateValue);
            //console.log(dateValue);

            uuid = this._generateUUID();
            //console.log(uuid);

            this._uploadFileBase(file, dateValue, uuid)
            breakData.uuid = uuid;


        },
        clearCSVResults: function () {

        },
        clearXLSXResult: function () {

        },
        _resetResults: function () {
            //重置默认数据
            // if (this._popupWindow == null) {
            //     this._popupWindow = new SBPopupWindowWidget().placeAt(html.byId("map"));

            // }
            // html.setStyle(this._popupWindow.domNode, "display", "block");
            breakData = {
                "gridNum": 500,
                "regionArea": 125000,
                "g24rate": "30/60",
                "cfBreakNum": 20,
                "cellsData": [{
                        "index_name": "小区数",
                        "index_part": "L1",
                        "index_value": "0"
                    },
                    {
                        "index_name": "小区数",
                        "index_part": "L2",
                        "index_value": "0"
                    }, {
                        "index_name": "小区数",
                        "index_part": "L3",
                        "index_value": "0"
                    },
                    {
                        "index_name": "小区数",
                        "index_part": "L4",
                        "index_value": "0"
                    }, {
                        "index_name": "小区数",
                        "index_part": "L5",
                        "index_value": "0"
                    }
                ],
                "pointNum": 100000,
                "userNum": 500,
                "flowTotal": "23.1GB",
                "hwTotall": "21.5Erl",
                "dropRate": "0.02%",
                "connectRate": "99.8%",
                "gzRate": "300Mbps",
                "canshuya": "无",
                "tkytz": "无",
                "tkrtz": "无",
                "yjc": "无"
            };

        },
        showFileDialog: function () {
            if (domClass.contains(this.showFileDialogBtn, 'jimu-state-disabled')) {
                return;
            }
            this.csvFileInput.click();
        },
        onClose: function () {
            this.open = false;
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });
});