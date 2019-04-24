/**
 * Created by huangfei on 2019/2/15.
 */

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
        return declare([_WidgetBase, _TemplatedMixin], {
            nls:nls,
            templateString: template,
            _cMap:null,
            _graphicsLayer:null,
            postCreate:function(){
                this._graphicsLayer = new GraphicsLayer();
            },

            initCompent: function (datas) {
                if(this._cMap == null){
                    var mapoption = {
                        logo:false
                    };
                    this._cMap = new Map("sbMap",mapoption);

                }
                var _basemaps = this.appConfig.map.basemaps;
                if(_basemaps.length>0){
                    this._addTiledLayerToMap(_basemaps[0]);
                }
            },
            _addTiledLayerToMap: function(linfo)
            {
                if(linfo.type==="tiled" && this._cMap !== null)
                {
                    var _layer = new ArcGISTiledMapServiceLayer(linfo.url);
                    _layer.visible = true;
                    _layer.id = "sbMap_"+linfo.id;
                    this._cMap.addLayer(_layer);
                }
                else
                {
                }


            }


        })
    })

