/**
 * Created by GaoSong on 2017/7/10.
 */

define(
    [
        "dojo/_base/declare",
        "dojo/on",
        'dojo/topic',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dojo/request/xhr',
        'dojo/_base/html',
        "esri/map",
        'esri/graphic',
        "esri/layers/ArcGISTiledMapServiceLayer",
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'custom/common',
        'jimu/MapManager',
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        'esri/layers/TableDataSource',
        'esri/layers/LayerDataSource',
        'esri/layers/FeatureLayer',
        'esri/arcgis/LayerUtil',
        'esri/graphicsUtils',
        'dojo/i18n!../nls/strings',
        'esri/renderers/SimpleRenderer',
        'esri/tasks/DetailTask',
        'esri/renderers/jsonUtils',
        'esri/symbols/PictureMarkerSymbol',
        'esri/renderers/UniqueValueRenderer',
        'esri/layers/DynamicLayerInfo',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/geometry/Point',
        "esri/SpatialReference",
        "esri/InfoTemplate",
        'esri/renderers/ClassBreaksRenderer',
        'esri/Color',
        'esri/clusterlayer/clusterfeaturelayer',
        'esri/geometry/Extent',
        'esri/layers/GraphicsLayer',
        'esri/renderers/HeatmapRenderer',
        "dojo/text!./Widget.html"
    ], function (declare, on, topic, array,lang,xhr, html, Map,Graphic, ArcGISTiledMapServiceLayer,ArcGISDynamicMapServiceLayer, common, MapManager, _WidgetBase, _TemplatedMixin,
        TableDataSource, LayerDataSource, FeatureLayer, LayerUtil, graphicsUtils,nls, SimpleRenderer, DetailTask, jsonUtils, PictureMarkerSymbol, UniqueValueRenderer, DynamicLayerInfo,
        SimpleLineSymbol, SimpleMarkerSymbol,Point, SpatialReference,InfoTemplate,ClassBreaksRenderer, Color, ClusterFeatureLayer, Extent,GraphicsLayer, HeatmapRenderer, template) {
        return  declare([_WidgetBase, _TemplatedMixin], {
            nls:nls,
            templateString: template,
            _cMap:null,
            _mapLeft:false,
            _mapRight:false,
            _mapChangeEvent:null,
            _cMapChangeEvent:null,
            _preButton:null,
            _featureLayer: "",
            _planSites:[],
            _currentIndex:0,
            _orgLayer:null,
            _fzLayer:null,
            _graphicsLayer:null,
            _gridPolygonDic:{},
            postCreate:function(){
                this._graphicsLayer = new GraphicsLayer();
            },
            initCompent: function (layer,fzlayer,planSites) {
                this._preButton = html.byId("cMap_sl");
                this._planSites =  [];
                this._gridPolygonDic = {};
                this._currentIndex = 0;
                this._orgLayer = layer;
                this._fzLayer = fzlayer;
                for(key in planSites){
                    this._planSites.push(planSites[key]);
                }
                if(this._cMap == null){
                    var mapoption = {
                        logo:false
                    };
                    this._cMap = new Map("fzMap",mapoption);

                }
                var _basemaps = this.appConfig.map.basemaps;
                if(_basemaps.length>0){
                    this._addTiledLayerToMap(_basemaps[0]);
                }
                var offsetW = document.body.offsetWidth;
                html.setStyle(this.domNode,"width",offsetW+"px");
                html.setStyle(this.domNode,"right",-(offsetW/2)+"px");

                html.setStyle(html.byId("closeContrast"),"left",((offsetW/2)-45)+"px");
                this._cMap.resize();

                //this._cMap.setExtent(gridExtent,true);
                //this._cMap.setLevel(this.map.getLevel());

                html.setStyle(html.byId("previousPlanSite"),"left",-((offsetW/2)-45)+"px");
                html.setStyle(html.byId("nextPlanSite"),"left",((offsetW/2)-90)+"px");
                html.setStyle(html.byId("CurrentStatusDiv"),"left",-((offsetW/2)-((offsetW/2)-500)/2)+"px");
                html.setStyle(html.byId("FangZhenStatusDiv"),"left",((offsetW/2)-500)/2+"px");


                this.map.on("mouse-over",lang.hitch(this,function(evt){
                    this._mapLeft = true;
                    this._mapRight = false;

                }));

                this._cMap.on("mouse-over",lang.hitch(this,function(evt){
                    this._mapLeft = false;
                    this._mapRight = true;
                }));


                this._mapChangeEvent = this.map.on("extent-change",lang.hitch(this,function(evt){
                    if(this._mapLeft){
                        /**
                        var gridsExtent = this.map.extent;
                        var xfen = (gridsExtent.xmax-gridsExtent.xmin)/4;
                        var  newExtent = new Extent(gridsExtent.xmin,gridsExtent.ymin,gridsExtent.xmax-2*xfen,gridsExtent.ymax, gridsExtent.spatialReference);
                        this._cMap.setExtent(newExtent,true);
                        //this._cMap.setLevel(this.map.getLevel()); **/
                        this._cMap.setExtent(this.map.extent);
                    }
                }));
                this._cMapChangeEvent = this._cMap.on("extent-change",lang.hitch(this,function(evt){
                    this._cMap.hideZoomSlider();
                    if(this._mapRight){
                        /**
                        var  gridsExtent = this._cMap.extent;
                        var xfen = (gridsExtent.xmax-gridsExtent.xmin)/2;
                        var  newExtent = new Extent(gridsExtent.xmin,gridsExtent.ymin,gridsExtent.xmax+2*xfen,gridsExtent.ymax, gridsExtent.spatialReference);
                        this.map.setExtent(newExtent, true); **/
                        //this.map.setLevel(this._cMap.getLevel());
                        this.map.setExtent(this._cMap.extent);
                    }
                }));

                this._static_LayerChange(fzlayer);
                this.drawPlanSiteFZ();
                this.cMap_time.innerHTML = nls.conLabel;
                this.Map_time.innerHTML = nls.baseLabel ;
            },
            _hasObj: function (layer, _featureLayer) {
                if (layer.configObj) {
                    _featureLayer.configObj = layer.configObj;
                }
            },
            _static_LayerChange: function (layer) {
                this._removeUseChangeLayer();
                if(layer.declaredClass == "esri.layers.GraphicsLayer"){

                    this._cMap.addLayer(layer);

                }
                this._cMap.addLayer(this._graphicsLayer);

            },
            _previousEvent:function(){
                //this._planSites =  planSites;
                this._currentIndex = this._currentIndex-1;
                if(this._currentIndex<0){
                    this._currentIndex =  this._planSites.length-1;
                }

                this.drawPlanSiteFZ();

            },
            _nextEvent:function(){

                this._currentIndex = this._currentIndex+1;
                if(this._currentIndex>=this._planSites.length){
                    this._currentIndex = 0;
                }
                this.drawPlanSiteFZ();

            },
            drawPlanSiteFZById:function(dataId){
                this._orgLayer.clear();
                this._fzLayer.clear();
                this._graphicsLayer.clear();
                this._gridPolygonDic = {};
                for(var p=0;p<this._planSites.length;p++){
                    var planSiteObj = this._planSites[p];
                    if(planSiteObj.id === dataId){
                        this.drawFZ(planSiteObj);
                        break;
                    }
                }

            },
            drawPlanSiteFZ:function(){
                this._orgLayer.clear();
                this._fzLayer.clear();
                this._graphicsLayer.clear();
                this._gridPolygonDic = {};
                var planSiteObj = this._planSites[this._currentIndex];
               //"avg_rsrp":-95,"bad_point":1103920.0,"total_point":11438331.0,"id":1,"lon":109.3056,"lat":19.45526,"cellname":"儋州八一农行","range":500.0,"level":2}
               return this.drawFZ(planSiteObj);
            },
            drawFZ:function(planSiteObj){
                var cellName = planSiteObj.cellname;
                var total_point = planSiteObj.total_point;
                var bad_point = planSiteObj.bad_point;
                var avg_rsrp = planSiteObj.avg_rsrp;
                var lon = planSiteObj.lon;
                var lat = planSiteObj.lat;
                var grids  = planSiteObj.grids;
                var fzReqStationData = {'hight':200,'lon':lon,'lat':lat};
                this.PlanSiteName.innerHTML = cellName;

                var grid_num = grids.length;
                var current_weak_grid_num = 0;
                var fangzhen_weak_grid_num = 0;
                var sum_fz_rsrp = 0;
                var sum_cur_rsrp = 0 ;
                var fzRequestGrids = [];
                array.forEach(grids,lang.hitch(this, function(gridData) {

                    var sgGra = new Graphic();
                    var sgGraAttr = {};
                    sgGraAttr.grid_id = gridData.grid_id;
                    sgGraAttr.avg_rsrp = gridData.avg_rsrp;
                    sum_cur_rsrp+=sgGraAttr.avg_rsrp;
                    if(gridData.avg_rsrp<=-110){
                        current_weak_grid_num++;
                    }
                    sgGra.setAttributes(sgGraAttr);
                    var gridPolygon = WktToPolygon(gridData.wkt);
                    sgGra.setGeometry(gridPolygon);
                    this._orgLayer.add(sgGra);


                    this._gridPolygonDic[gridData.grid_id] = gridPolygon;

                    var reqgrdiData = {'gridId':gridData.grid_id,'lon':gridData.lon,'lat':gridData.lat,'rsrp':gridData.avg_rsrp};
                    fzRequestGrids.push(reqgrdiData);



                }));

                planSiteObj.fzGrid_num = grid_num;
                planSiteObj.fzAvgRsrp = "--";
                planSiteObj.fangzhen_weak_grid_num = 0;
                /**
                 * 请求仿真数据
                 * */
                var headStr = {
                    "X-Requested-With": null
                };
                var requestData = {"grids":JSON.stringify(fzRequestGrids),"station":JSON.stringify(fzReqStationData)};
                xhr("http://10.209.180.1:18083/InterfaceEngineering/simulation/runSimulation",{
                    handleAs: 'json',
                    data:requestData,
                    headers: headStr,
                    method:"POST"
                }).then(lang.hitch(this,function(redata) {

                    var currentStatusString = "栅格数目："+grid_num+"&nbsp;平均电平："+parseInt(sum_cur_rsrp/grid_num)+"&nbsp;弱覆盖栅格数："+current_weak_grid_num;
                    var fangzhenStatusString = "仿真无数据请联系管理员....";
                    if(redata.returnCode === 100&&redata.simulationList!==null){
                        var regrids = redata.simulationList;
                        array.forEach(regrids,lang.hitch(this, function(gridData) {

                            var sgGrafz = new Graphic();
                            var sgGraAttrfz = {};
                            sgGraAttrfz.grid_id = gridData.grid.gridId;
                            sgGraAttrfz.avg_rsrp = gridData.simulationRsrp;
                            sum_fz_rsrp+=sgGraAttrfz.avg_rsrp;
                            if(sgGraAttrfz.avg_rsrp<=-110){
                                fangzhen_weak_grid_num++;
                            }
                            sgGrafz.setAttributes(sgGraAttrfz);
                            sgGrafz.setGeometry(this._gridPolygonDic[sgGraAttrfz.grid_id]);
                            this._fzLayer.add(sgGrafz);
                        }));
                        planSiteObj.fzGrid_num = regrids.length;
                        planSiteObj.fzAvgRsrp = parseInt(sum_fz_rsrp/grid_num);
                        planSiteObj.fangzhen_weak_grid_num = fangzhen_weak_grid_num;
                        fangzhenStatusString = "栅格数目："+regrids.length+"&nbsp;平均电平："+parseInt(sum_fz_rsrp/grid_num)+"&nbsp;弱覆盖栅格数："+fangzhen_weak_grid_num;
                    }
                    this.CurrentStatus.innerHTML = currentStatusString;
                    this.FangZhenStatus.innerHTML = fangzhenStatusString;
                    topic.publish("showDialogWindow", planSiteObj);

                }),
                 lang.hitch(this,function(err){
                        // Handle the error condition
                        topic.publish("showDialogWindow", planSiteObj);

                })

                );


                var pictureMarkerSymbol = new PictureMarkerSymbol('/Topgis/TopGis/widgets/PlanSite/images/shanxing.png', 180, 168);
                var infoTemplate = new InfoTemplate("${cellname}","小区名称: ${cellname} <br/>平均RSRP: ${avg_rsrp} <br/>总采样点数:${total_point}<br/>弱覆盖采样点数:${bad_point}<br/>半径:${range}");
                var planSiteGra = new Graphic(new Point(lon,lat,new SpatialReference({ wkid: 4326 })), pictureMarkerSymbol,planSiteObj,infoTemplate);
                this._graphicsLayer.add(planSiteGra);



                var  gridsExtent = graphicsUtils.graphicsExtent(this._orgLayer.graphics);
                this._mapLeft = true;
                this._mapRight = false;
                var xfen = (gridsExtent.xmax-gridsExtent.xmin)/2;
                var yfen = (gridsExtent.ymax-gridsExtent.ymin)/2;
                var  newExtent = new Extent(gridsExtent.xmin,gridsExtent.ymin-yfen,gridsExtent.xmax+4*xfen,gridsExtent.ymax+yfen, gridsExtent.spatialReference);
                //this._cMap.setExtent(newExtent);
                this.map.setExtent(newExtent);
                 return planSiteObj;
            },
            _removeUseChangeLayer:function() {
                if (this._cMap.getLayer(this._layerIds)) {
                    //this._cMap.removeLayer(this._cMap.getLayer(this._layerIds));
                    this._cMap.getLayer(this._layerIds).setVisibility(false);
                }
            },
            _addTiledLayerToMap: function(linfo)
            {
                if(linfo.type==="tiled" && this._cMap !== null)
                {
                    var _layer = new ArcGISTiledMapServiceLayer(linfo.url);
                    _layer.visible = true;
                    _layer.id = "cMap_"+linfo.id;
                    this._cMap.addLayer(_layer);
                }
                else
                {
                }


            },
            _mapSwitchEvent: function(evt){
                //_mapSwitchEvent
                var target = evt.currentTarget;
                if(this._preButton != null){
                    html.removeClass(this._preButton,"toggleButton-selected");
                }
                if(target.className.indexOf("toggleButton-selected") == -1){
                    html.addClass(target,"toggleButton-selected");
                }

                this._preButton = target;

                var _basemaps = this.appConfig.map.basemaps;
                this._cMap.removeAllLayers();
                if(target.id == "cMap_sl"){
                    if(_basemaps.length>0){
                        this._addTiledLayerToMap(_basemaps[0]);
                    }
                }
                else{
                    if(_basemaps.length>1){
                        this._addTiledLayerToMap(_basemaps[1]);
                    }
                }
            },
            _closeEvent: function(evt){
                topic.publish("rightButtonStateReset",this);
                //var offsetW = document.body.offsetWidth;
                //this.map.width = offsetW/2;
                //html.setStyle(this.map.root,"width",offsetW+"px");
                $(".popUp").animate({ left: "0px" }, 500);
                html.setStyle(this.domNode,"display","none");
            },
            _onGetAllDetail: function () {
            },
            _onGetAllDetailError: function (a) {
                console.log("error:" + a);
            }

        });
    });
