/**
 * Created by alwin on 2016/8/31.
 */
define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/date',
        'dojo/topic',
        'dojo/json',
        "esri/renderers/jsonUtils",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/layers/FeatureLayer",
        "esri/layers/DynamicLayerInfo",
        "esri/layers/LayerDataSource",
        "esri/layers/LayerDrawingOptions",
         "esri/layers/TableDataSource",
         "jimu/cronosgis/tasks/DetailTask"
    ],
    function(declare, lang, array, dojoDate, topic, dojoJson,jsonUtils,
             ArcGISDynamicMapServiceLayer,FeatureLayer,DynamicLayerInfo,LayerDataSource,LayerDrawingOptions,TableDataSource,DetailTask) {
        var mo = {

           changeLayerDynamicData:function(layer,newtableName,workspaceId){

               if(layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer"){
                   var dynamicLayerInfos =  layer.createDynamicLayerInfosFromLayerInfos();
                   var dynamicLayerInfo = dynamicLayerInfos[0];

                   var options = [];
                   var dataSource = new TableDataSource();
                   dataSource.workspaceId = workspaceId;
                   dataSource.dataSourceName = newtableName;
                   var layerSource = new LayerDataSource();
                   layerSource.dataSource = dataSource;
                   dynamicLayerInfo.source = layerSource;
                   //dynamicLayerInfos.push(dynamicLayerInfo);
                   var drawingOptions = new LayerDrawingOptions();
                   var detailTask = new DetailTask(layer.url);
                   detailTask.getAllDetails(this.onGetAllDetail,this.onGetAllDetailError).then(function(layerAllDetails){
                       var layerDrawInfo  = layerAllDetails.layers[0].drawingInfo;
                       //var render = layerDrawInfo.renderer;
                       var render = jsonUtils.fromJson(layerDrawInfo.renderer)
                       drawingOptions.renderer = render;
                       options[0] = drawingOptions;
                       layer.setDynamicLayerInfos(dynamicLayerInfos, false);
                       layer.setLayerDrawingOptions(options);
                       layer.refresh();
                   });
               }else if(layer.declaredClass == "esri.layers.FeatureLayer"){
                   var dataSource = new TableDataSource();
                   dataSource.workspaceId = workspaceId;
                   dataSource.dataSourceName = newtableName;

                   var layerSource = new LayerDataSource();
                   layerSource.dataSource = dataSource;
                   layer.source = layerSource;
                   var detailTask = new DetailTask(layer.url);
                   detailTask.getFeatureDetails(this.onGetAllDetail,this.onGetAllDetailError).then(function(layerAllDetails){
                       var layerDrawInfo  = layerAllDetails.drawingInfo;
                       //var render = layerDrawInfo.renderer;
                       var render = jsonUtils.fromJson(layerDrawInfo.renderer);
                       layer.renderer = render;
                       layer.redraw();
                       layer.refresh();
                   });


                   
               }

           }


        }


        return mo;

    });