/**
 * Created by huangfei on 2019/1/10.
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
    ], function (declare, on, topic, array,lang,xhr, html, Map,Graphic,ArcGISDynamicMapServiceLayer, common, MapManager, _WidgetBase, _TemplatedMixin,
                 TableDataSource, LayerDataSource, FeatureLayer, LayerUtil, graphicsUtils,nls, SimpleRenderer, DetailTask, jsonUtils, PictureMarkerSymbol, UniqueValueRenderer, DynamicLayerInfo,
                 SimpleLineSymbol, SimpleMarkerSymbol,Point, SpatialReference,InfoTemplate,ClassBreaksRenderer, Color, ClusterFeatureLayer, Extent,GraphicsLayer, HeatmapRenderer, template) {
        return declare([_WidgetBase, _TemplatedMixin], {
            nls:nls,
            templateString: template,
            postCreate:function(){


            },
            closeWidget:function(){

                html.setStyle(this.domNode, "display", "none");
            },
            initCompent: function (ddata){

                var cellsData =  ddata.cellsData;
                this.gridNumSpan.innerHTML = ddata.gridNum;
                this.regionAreaSpan.innerHTML = ddata.regionArea;
                this.g24RateSpan.innerHTML = ddata.g24rate;
                this.cfBreakSpan.innerHTML = ddata.cfBreakNum;
                this.pointNumSpan.innerHTML = ddata.pointNum;
                this.userNumSpan.innerHTML = ddata.userNum;
                this.flowTotalSpan.innerHTML = ddata.flowTotal;
                this.hwTotallSpan.innerHTML = ddata.hwTotall;
                this.dropRateSpan.innerHTML = ddata.dropRate;
                this.connectRateSpan.innerHTML = ddata.connectRate;
                this.gzRateSpan.innerHTML = ddata.gzRate;
                this.canshuSpan.innerHTML = ddata.canshuya;
                this.tkytzSpan.innerHTML = ddata.tkytz;
                this.tkrtzSpan.innerHTML = ddata.tkrtz;
                this.yjcSpan.innerHTML = ddata.yjc;

                this.createPieChart(cellsData);
            },
            exportDetailExcel1:function(type){

                 console.log(type);

           },
            exportDetailExcel2:function(type){

                console.log(type);

            },
            exportDetailExcel3:function(type){

                console.log(type);

            },
            createPieChart:function(cellsData){

                var levelNames = [];
                var levelValues = [];
                for(var  ikey in cellsData){
                    levelNames.push(cellsData[ikey].name);
                    levelValues.push(cellsData[ikey].value);
                }
                var myChart = echarts.init(document.getElementById('echarts-pie'));
                var option = {
                    grid: {
                        left: '0',
                        right: '0',
                        top: '0',
                        bottom: '0'
                    },
                    title: {
                        text: '小区数',
                        x: '6.8%',
                        y: '42%',
                        textStyle: {
                            color: '#000',
                            fontFamily: 'fontDigit',
                            fontSize:(window.designSize /70) * 22
                        }
                    },
                    tooltip: {
                        trigger: 'item'
                    },
                    legend: {
                        show: true,
                        orient: 'vertical',
                        icon: "rect",
                        left: '30%',
                        top: '14%',
                        height:'78%',
                        itemGap: (window.designSize /70) * 14,
                        itemWidth: (window.designSize /70) * 14,
                        itemHeight: (window.designSize /70) * 14,
                        data: levelNames,
                        formatter: function (name) {
                            var datalist = levelValues
                            var namelist =  levelNames
                            var index = ''
                            for (var i in namelist) {
                                if (namelist[i] === name) {
                                    index = i
                                }
                            }
                            return   ' ' + ''+name + '{a|'+datalist[index]+'}'
                        },
                        textStyle: {
                            color:  '#000',
                            fontSize: (window.designSize /70) * 16,
                            fontWeight:'500',
                            rich: {
                                a: {
                                    fontFamily: 'Helvetica Neue',
                                    align: 'left',
                                    color: '#000',
                                    fontSize:  (window.designSize /70) * 16,
                                    fontWeight:'500',
                                    padding:[0,0,0, (window.designSize /70) * 20],
                                    // width: 50
                                }
                            }
                        }
                    },
                    series: [
                        {
                            name: '小区数',
                            type: 'pie',
                            radius: ['48%', '70%'],
                            center: ['14%', '50%'],
                            label: {
                                show: false
                            },
                            itemStyle: {
                                normal: {
                                    borderWidth: 4,
                                    borderColor: '#fff',
                                    labelLine: {
                                        show: false
                                    }
                                }
                            },
                            color: ['#00d1ff', '#7ed321', '#f7e93b', '#eb5945', '#913baf'],
                            data: cellsData
                        }
                    ]
                };
                myChart.setOption(option);

            }



        });

    });