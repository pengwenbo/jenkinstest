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
        "esri/symbols/SimpleFillSymbol",
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
        'esri/graphicsUtils',
        "dojo/text!./Widget.html"
    ],
    function (declare, on, topic, array, lang, xhr, html, Map, Graphic, ArcGISDynamicMapServiceLayer, common, MapManager, _WidgetBase, _TemplatedMixin,
        TableDataSource, LayerDataSource, FeatureLayer, LayerUtil, graphicsUtils, nls, SimpleRenderer, DetailTask, jsonUtils, PictureMarkerSymbol, UniqueValueRenderer, DynamicLayerInfo,
        SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Point, SpatialReference, InfoTemplate, ClassBreaksRenderer, Color, ClusterFeatureLayer, Extent, GraphicsLayer, HeatmapRenderer, graphicsUtils,template) {
        return declare([_WidgetBase, _TemplatedMixin], {
            nls: nls,
            templateString: template,
            rdata: {},
            _gridLayer: null,
            _commLayer: null,
            _pwmap: null,
            _dataRequestUrl:"http://221.182.241.179:85/Nokia_NetworkOptimize_BrokenStation_Api/api/BrokenStation",
            postCreate: function () {
                //http://221.182.241.179:85
                this._gridLayer = new GraphicsLayer();
                this._commLayer = new GraphicsLayer();
                this.map.addLayers([this._gridLayer, this._commLayer]);

            },
            closeWidget: function () {

                html.setStyle(this.domNode, "display", "none");
            },
            initCompent: function (ddata) {
                rdata = ddata;
                this._gridLayer.clear();
                this._commLayer.clear();
                this.getGridData();
                this.getCommData();


                var cellsData = ddata.cellsData;
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
            exportDetailExcel1: function () {
                type = 'A';
                let uuid = rdata.uuid;
                let url = this._dataRequestUrl+'/ExportCellList?'
                url += 'dataType=' + type + '&uuid=' + uuid
                window.location.href = url;
                console.log(type);

            },
            exportDetailExcel2: function () {
                type = 'B';
                let uuid = rdata.uuid;
                let url = this._dataRequestUrl+'/ExportCellList?'
                url += 'dataType=' + type + '&uuid=' + uuid
                window.location.href = url;
                console.log(type);

            },
            exportDetailExcel3: function () {
                type = 'C';
                let uuid = rdata.uuid;
                let url = this._dataRequestUrl+'/ExportCellList?'
                url += 'dataType=' + type + '&uuid=' + uuid
                window.location.href = url;
                console.log(type);

            },
            getGridData: function () {
                let uuid = rdata.uuid;
                let url = this._dataRequestUrl+'/GetGisTableList?'
                url += 'uuid=' + uuid
                xhr(url, {
                    method: 'GET'
                }).then(lang.hitch(this, function (resdata) {
                    resdata = JSON.parse(resdata);
                    //console.log(resdata.status);
                    if (resdata.status == '1') {
                        //console.log(resdata.dataList);
                        for (i in resdata.dataList) {
                            this._addpoly(resdata.dataList[i]);
                        }
                    } else {

                    }
                }));

            },
            getCommData: function () {
                let uuid = rdata.uuid;
                let url = this._dataRequestUrl+'/GetGisCellList?';
                url += 'uuid=' + uuid;
                xhr(url, {
                    method: 'GET'
                }).then(lang.hitch(this, function (resdata) {
                    resdata = JSON.parse(resdata);
                    //console.log(resdata.status);
                    if (resdata.status == '1') {
                        //console.log(resdata.dataList);
                        for (i in resdata.dataList) {
                            if (resdata.dataList[i].lon > 109 && resdata.dataList[i].lat > 17) {
                                this._addmarker(resdata.dataList[i]);
                            }
                        }
                        var  gridsExtent = graphicsUtils.graphicsExtent(this._commLayer.graphics);
                        this.map.setExtent(gridsExtent);
                    } else {

                    }
                }));
            },
            _addmarker: function (attr) {
                //小区打点
                let markerSymbol = new PictureMarkerSymbol('./widgets/StationBreak/images/BluePin1LargeB.png', 32, 32).setOffset(0, 11);
                let x = attr.lon;
                let y = attr.lat;
                let point = new Point(x, y);
                let gra = new Graphic(point, markerSymbol);
                //cell_name 小区名称, eci 不知名参数
                gra.setAttributes({
                    "name": attr.cell_name,
                    "eci": attr.eci
                });
                this._commLayer.add(gra);
                //console.log(graphicsUtils.graphicsExtent(gra))
                //return point;
            },
            _addpoly: function (attr) {
                //栅格打点
                let symbol1 = new SimpleFillSymbol().setStyle(SimpleFillSymbol.STYLE_SOLID).setColor([208,16,76,0.5]).setOutline(0);
                let symbol2 = new SimpleFillSymbol().setStyle(SimpleFillSymbol.STYLE_SOLID).setColor([27,129,62,0.5]).setOutline(0);
                let poly = WktToPolygon(attr.shape, 4326);
                let gra;
                if (attr.nl_rsrp>-110){
                    gra = new Graphic(poly, symbol2);
                    console.log('123')
                } else {
                    gra = new Graphic(poly, symbol1);
                }
                //grid_id 栅格名称, rsrp_a  nl_rsrp  不知名参数
                gra.setAttributes({
                    "grid_id": attr.grid_id,
                    "rsrp_a": attr.rsrp_a,
                    "nl_rsrp": attr.nl_rsrp
                });
                this._gridLayer.add(gra);
                //console.log(graphicsUtils.graphicsExtent(gra))
                //return point;
            },
            createPieChart: function (cellsData) {

                var levelNames = [];
                var levelValues = [];
                for (var ikey in cellsData) {
                    levelNames.push(cellsData[ikey].index_part);
                    levelValues.push(cellsData[ikey].index_value);
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
                        x: '9.4%',
                        y: '42%',
                        textStyle: {
                            color: '#000',
                            fontFamily: 'fontDigit',
                            fontSize: (window.designSize / 70) * 22
                        }
                    },
                    tooltip: {
                        trigger: 'item'
                    },
                    legend: {
                        show: true,
                        orient: 'vertical',
                        icon: "rect",
                        left: '50%',
                        top: '14%',
                        height: '78%',
                        itemGap: (window.designSize / 70) * 14,
                        itemWidth: (window.designSize / 70) * 14,
                        itemHeight: (window.designSize / 70) * 14,
                        data: levelNames,
                        formatter: function (name) {
                            var datalist = levelValues
                            var namelist = levelNames
                            var index = ''
                            for (var i in namelist) {
                                if (namelist[i] === name) {
                                    index = i
                                }
                            }
                            return ' ' + '' + name + '{a|' + datalist[index] + '}'
                        },
                        textStyle: {
                            color: '#000',
                            fontSize: (window.designSize / 70) * 16,
                            fontWeight: '500',
                            rich: {
                                a: {
                                    fontFamily: 'Helvetica Neue',
                                    align: 'left',
                                    color: '#000',
                                    fontSize: (window.designSize / 70) * 16,
                                    fontWeight: '500',
                                    padding: [0, 0, 0, (window.designSize / 70) * 20],
                                    // width: 50
                                }
                            }
                        }
                    },
                    series: [{
                        name: '小区数',
                        type: 'pie',
                        radius: ['48%', '70%'],
                        center: ['20%', '50%'],
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
                        data: [{
                            value: levelValues[0],
                            name: levelNames[0]
                        },
                            {
                                value: levelValues[1],
                                name: levelNames[1]
                            },
                            {
                                value: levelValues[2],
                                name: levelNames[2]
                            },
                            {
                                value: levelValues[3],
                                name: levelNames[3]
                            },
                            {
                                value: levelValues[4],
                                name: levelNames[4]
                            }
                        ]
                    }]
                };
                //console.log(JSON.stringify(option));
                myChart.setOption(option);


            }



        });

    });