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
    'jimu/dijit/Message',
    'esri/graphic',
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
    './ContrastMaps/Widget',
    'dojo/i18n!./nls/strings'
], function (declare, array, lang, html, on, topic, Deferred, BaseWidget, domClass, domConstruct, domStyle, utils, xhr, Message, Graphic, Point, SpatialReference, PictureMarkerSymbol, ClassBreaksRenderer, SimpleFillSymbol, SimpleLineSymbol, Color, InfoTemplate, graphicsUtils, LayerInfos, Extent,
             _WidgetsInTemplateMixin, GraphicsLayer, ContrastMapsWidget, nls) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-plansite',
        name: "PlanSite",
        open: false,
        nls: nls,
        _graphicsLayer: null,
        _gridAllLayer: null,
        _gridLayer: null,
        _fzGridLayer: null,
        _contrastMaps: null,
        _fzPlanSites: null,
        postCreate: function () {
            this.inherited(arguments);
            this._graphicsLayer = new GraphicsLayer();
            this._gridLayer = new GraphicsLayer();
            this._fzGridLayer = new GraphicsLayer();
            this._gridAllLayer = new GraphicsLayer();

            var symbol = new SimpleFillSymbol();
            symbol.setColor(new Color([150, 150, 150, 0.5]));
            symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID), new Color([255, 255, 255]), 1);
            var renderer = new ClassBreaksRenderer(symbol, "avg_rsrp");

            renderer.addBreak(-140, -110, new SimpleFillSymbol().setColor(new Color([255, 0, 0, 0.5])).setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255]), 1)));

            renderer.addBreak(-110, -100, new SimpleFillSymbol().setColor(new Color([255, 255, 0, 0.5])).setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255]), 1)));

            renderer.addBreak(-100, 0, new SimpleFillSymbol().setColor(new Color([0, 255, 0, 0.5])).setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255]), 1)));

            this._gridLayer.setRenderer(renderer);

            this._fzGridLayer.setRenderer(renderer);

            this._gridAllLayer.setRenderer(renderer);

            this.map.addLayer(this._gridAllLayer);

            this.map.addLayer(this._gridLayer);

            this.map.addLayer(this._graphicsLayer);
            //this.map.addLayer(this._fzGridLayer);

            topic.subscribe("rightButtonStateReset", lang.hitch(this,
                function (_target) {
                    this._gridAllLayer.setVisibility(true);
                }));
        },
        onOpen: function () {


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
        _processFiles: function (files) {
            //选择文件不可用
            //domClass.add(this.showFileDialogBtn, 'jimu-state-disabled');


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
                    }
                    else {
                        Message({
                            message: this.nls.error.XLSXerro
                        });
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                        this.clearXLSXResult();
                    }
                }
                else {
                    new Message({
                        message: this.nls.error.notCSVFile
                    });
                    //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                    this.clearCSVResults();
                }
            }
        },
        handleCSV: function (file) {

        },
        handleXLSX: function (file) {
            //http://10.209.180.1:18081/BI_WebAPI/api/StationPriority/ImportStation
            /**
             var oMyForm = new FormData();
             oMyForm.append("file", file);
             xhr("http://10.209.180.1:18081/BI_WebAPI/api/StationPriority/ImportStation",{
                data:oMyForm,
                method:"POST"
            }).then(function(data){
                domStyle.set(this.exportDataDiv, "display", "block");
            }); **/
                //domStyle.set(this.exportDataDiv, "display", "block");
                //domStyle.set(this.domNode, "width", "1000px");

            var oMyForm = new FormData();
            oMyForm.append("file", file);
            xhr("http://10.209.180.1:18081/BI_WebAPI/api/StationPriority/ImportStation", {
                data: oMyForm,
                method: "POST"
            }).then(lang.hitch(this, function (data) {
                var  results = JSON.parse(data);
                var sgdatas = results.ResultObject.gis;
                var exportdatas = results.ResultObject.export;
                this.allfeatureAttribute = [];
                var tableFeatures = [];
                this._fzPlanSites = {};
                var pictureMarkerSymbol = new PictureMarkerSymbol('sources/widgets/PlanSite/images/BluePin1LargeB.png', 64, 64);
                var infoTemplate = new InfoTemplate("${cellname}", "小区名称: ${cellname} <br/>平均RSRP: ${avg_rsrp} <br/>总采样点数:${total_point}<br/>弱覆盖采样点数:${bad_point}<br/>半径:${range}");
                array.forEach(exportdatas, lang.hitch(this, function (exportData) {
                    var planSiteGra = new Graphic(new Point(exportData.lon, exportData.lat, new SpatialReference({wkid: 4326})), pictureMarkerSymbol, exportData, infoTemplate);
                    this._fzPlanSites[exportData.id] = exportData;
                    tableFeatures.push(planSiteGra);
                    this._graphicsLayer.add(planSiteGra);
                }));

                this.allfeatureAttribute.push(
                    {
                        layerName: "规划建站数据",
                        layerCode: "规划建站数据",
                        features: tableFeatures,
                        click:this.showRowInfo

                    }
                );

                topic.publish("createTab", this.allfeatureAttribute, null);
                $(".jimu-widget-attributetablecustom-main").click();

                //var sgFeatures = [];
                this._gridLayer.clear();
                this._gridAllLayer.clear();
                this._fzGridLayer.clear();
                //绘制栅格
                array.forEach(sgdatas, lang.hitch(this, function (sgdata) {

                    var gridPolygon = WktToPolygon(sgdata.wkt);

                    if (this._fzPlanSites[sgdata.id] != undefined && this._fzPlanSites[sgdata.id] != null && this._fzPlanSites[sgdata.id].grids != undefined
                        && this._fzPlanSites[sgdata.id].grids != null && Array.isArray(this._fzPlanSites[sgdata.id].grids)) {
                        var gridData = {};
                        gridData.grid_id = sgdata.grid_id;
                        gridData.avg_rsrp = sgdata.avg_rsrp;
                        gridData.lon = gridPolygon.getExtent().getCenter().x;
                        gridData.lat = gridPolygon.getExtent().getCenter().y;
                        gridData.wkt = sgdata.wkt;
                        this._fzPlanSites[sgdata.id].grids.push(gridData);
                    } else if (this._fzPlanSites[sgdata.id] != undefined && this._fzPlanSites[sgdata.id] != null) {

                        var gridsArr = [];
                        var gridData = {};
                        gridData.grid_id = sgdata.grid_id;
                        gridData.avg_rsrp = sgdata.avg_rsrp;
                        gridData.lon = gridPolygon.getExtent().getCenter().x;
                        gridData.lat = gridPolygon.getExtent().getCenter().y;
                        gridData.wkt = sgdata.wkt;
                        gridsArr.push(gridData);
                        this._fzPlanSites[sgdata.id].grids = gridsArr;
                    }


                    var sgGra = new Graphic();
                    var sgGraAttr = {};
                    sgGraAttr.grid_id = sgdata.grid_id;
                    sgGraAttr.avg_rsrp = sgdata.avg_rsrp;
                    sgGra.setAttributes(sgGraAttr);
                    sgGra.setGeometry(gridPolygon);

                    this._gridAllLayer.add(sgGra);


                    /**
                     var sgGra = new Graphic();
                     var sgGraAttr = {};
                     sgGraAttr.grid_id = sgdata.grid_id;
                     sgGraAttr.avg_rsrp = sgdata.avg_rsrp;
                     sgGra.setAttributes(sgGraAttr);
                     sgGra.setGeometry(gridPolygon);

                     this._gridLayer.add(sgGra);
                     var sgGrafz = new Graphic();
                     var sgGraAttrfz = {};
                     sgGraAttrfz.grid_id = sgdata.grid_id;
                     sgGraAttrfz.avg_rsrp = sgdata.avg_rsrp+20*Math.random();
                     sgGrafz.setAttributes(sgGraAttrfz);
                     sgGrafz.setGeometry(gridPolygon);
                     //sgFeatures.push(sgGra);
                     this._fzGridLayer.add(sgGrafz);
                     **/
                }));


                //设置renderer
                if (this._contrastMaps == null) {
                    this._contrastMaps = new ContrastMapsWidget({
                        map: this.map,
                        appConfig: this.appConfig,
                        target: this
                    }).placeAt(html.byId("map"));


                }
                $(".popUp").animate({ left: "-400px" }, 500);
                html.setStyle(this._contrastMaps.domNode, "display", "block");

                this._gridAllLayer.setVisibility(false);
                //var offsetW = document.body.offsetWidth;
                //this.map.width = offsetW/2;
                //html.setStyle(this.map.root,"width",offsetW/2+"px");

                //this.map.resize();

                //this.map.reposition();

                /**
                 var  gridsExtent = graphicsUtils.graphicsExtent(this._gridLayer.graphics);
                 var xfen = (gridsExtent.xmax-gridsExtent.xmin)/2;
                 var  newExtent = new Extent(gridsExtent.xmin+7*xfen,gridsExtent.ymin,gridsExtent.xmax,gridsExtent.ymax, gridsExtent.spatialReference);
                 this.map.setExtent(newExtent, true); **/

                this._contrastMaps.initCompent(this._gridLayer, this._fzGridLayer, this._fzPlanSites);

                domStyle.set(this.showFZBtnDiv, "display", "block");
            }));

        },
        showClickInfo:function(attributes){


        },
        clearCSVResults: function () {

        },
        clearXLSXResult: function () {

        },
        showFangzhen: function () {
            this._gridAllLayer.setVisibility(false);
            this._contrastMaps.drawPlanSiteFZ();
            $(".popUp").animate({ left: "-400px" }, 500);
            html.setStyle(this._contrastMaps.domNode, "display", "block");
        },
        _resetResults: function () {


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
        },
    });
});
