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
    './ContrastMaps/Widget',
    'dojo/text!./data/GridPopupWindow.html',
    'dojo/i18n!./nls/strings'
], function (declare, array, lang, html, on, topic, Deferred, BaseWidget, domClass, domConstruct, domStyle, utils, xhr, Message, Graphic,Dialog, Point, SpatialReference, PictureMarkerSymbol, ClassBreaksRenderer, SimpleFillSymbol, SimpleLineSymbol, Color, InfoTemplate, graphicsUtils, LayerInfos, Extent,
             _WidgetsInTemplateMixin, GraphicsLayer,dojoString, ContrastMapsWidget,GridPopupWindow, nls) {
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
        _showPopInfo:false,
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

            topic.subscribe("showDialogWindow", lang.hitch(this,
                function (_target) {
                    this.showDialogWindow(_target)
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
        }, clearLocal: function () {

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
                var pictureMarkerSymbol = new PictureMarkerSymbol('/topgis/TopGIS/widgets/PlanSite/images/BluePin1LargeB.png', 64, 64);
                var infoTemplate = new InfoTemplate("${cellname}", "小区名称: ${cellname} <br/>平均RSRP: ${avg_rsrp} <br/>总采样点数:${total_point}<br/>弱覆盖采样点数:${bad_point}<br/>半径:${range}");
                array.forEach(exportdatas, lang.hitch(this, function (exportData) {
                    /**
                     * 目前没有的数据先进行静态呈现,后续有数据了，进行替换
                     * */
                    exportData.dxavg_rsrp = exportData.avg_rsrp + (10-20*Math.random());
                    exportData.ltavg_rsrp = exportData.avg_rsrp + (10-20*Math.random());
                    exportData.ts_num = parseInt(20*Math.random());
                    exportData.serviceLevel = 1;

                    /**静态 end */
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
                        click:this.showClickInfo,
                        target:this
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
        showClickInfo:function(features,clickTarget){
            // var dialog =  document.querySelector('.widget-dialog')
            //dialog.style.display = 'block'
            //console.log(dialog)
            //dojo.byId("dialogClickInfo").show();
            //this.dialogClickInfo.show();
            /***
             *
             * <li>投诉类型: ${complain_type_num}类</li>
             <li>投诉次数: ${complain_num}次</li>
             <li>改善弱覆盖栅格数: ${improve_grid_num}个</li>
             <li>建设后平均电平: ${plan_avg_rsrp}</li>
             <li>新增覆盖数: ${added_cover_num}个</li>
             <li>建设后覆盖率: ${plan_cover_rate}%</li>
             <li>周边基站平均Prb利用率: ${avg_prb_rate}%</li>
             <li>钻、金、银用户数: ${high_level_usernum}位</li>
             <li>分公司评级: ${plan_level}</li>
             <li>平均电平: ${avg_rsrp}dbM</li>
             <li>覆盖率: ${cover_rate}%</li>
             <li>集中问题区域: ${concentrated_area_num}处</li>
             <li>现有规划站: ${plansite_num}个</li>
             <li>平均站间距: ${avg_site_distance}M</li>
             <li>现有站点: ${org_site_num}个</li>
             <li>电信电平: ${dx_avg_rsrp}dbM</li>
             <li>联通电平: ${lt_avg_rsrp}dbM</li>
             <li>电信覆盖率: ${dx_cover_rate}%</li>
             <li>联通覆盖率:  ${lt_cover_rate}%</li>
             */
            clickTarget._showPopInfo = true;
            clickTarget._contrastMaps.drawPlanSiteFZById(features[0].attributes.id);
            $(".popUp").animate({ left: "-400px" }, 500);
            html.setStyle(clickTarget._contrastMaps.domNode, "display", "block");
            clickTarget._gridAllLayer.setVisibility(false);

        },
        showDialogWindow:function(dialogObj){
            //topic.unsubscribe("showDialogWindow");
            if(this._showPopInfo){

                var  dialogData = {
                    complain_type_num:parseInt(Math.random()*5),
                    complain_num:parseInt(Math.random()*20),
                    improve_grid_num:parseInt(Math.random()*30),
                    plan_avg_rsrp:dialogObj.fzAvgRsrp,
                    added_cover_num:parseInt(Math.random()*20),
                    plan_cover_rate:parseInt(dialogObj.fangzhen_weak_grid_num*100.0/dialogObj.fzGrid_num),
                    avg_prb_rate:parseInt(100-Math.random()*20),
                    high_level_usernum:parseInt(Math.random()*30),
                    plan_level:parseInt(1+Math.random()*3),
                    avg_rsrp:dialogObj.avg_rsrp,
                    cover_rate:100-parseInt(dialogObj.bad_point*100.0/dialogObj.total_point),
                    concentrated_area_num:parseInt(Math.random()*3),
                    plansite_num:parseInt(Math.random()*3),
                    avg_site_distance:parseInt(500*Math.random()),
                    org_site_num:parseInt(1+3*Math.random()),
                    dx_avg_rsrp:parseInt(100-Math.random()*15),
                    lt_avg_rsrp:parseInt(100-Math.random()*15),
                    dx_cover_rate:parseInt(100-Math.random()*20),
                    lt_cover_rate:parseInt(100-Math.random()*20),
                };
                var GridPopupWindowHtml = dojoString.substitute(GridPopupWindow,dialogData);
                var myDialog = new Dialog({
                    title: "精准建设能力图",
                    content: GridPopupWindowHtml,
                    style: "width: 860px;height: 480px",
                    onShow: lang.hitch(this, function () {
                    }),
                    onHide: lang.hitch(this, function () {
                        myDialog.destroy();
                    })
                })
                myDialog.show();
            }

            this._showPopInfo = false;



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
