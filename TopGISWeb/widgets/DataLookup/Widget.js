define(['dojo/_base/declare',
        'dijit/_WidgetsInTemplateMixin',
        'jimu/BaseWidget',
        'dojo/dom',
        'dojo/on',
        'dojo/sniff',
        'dojo/_base/html',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/string',
        'dojo/dom-class',
        'dojo/dom-construct',
        'dojo/dom-style',
        'dojox/data/CsvStore',
        'esri/geometry/webMercatorUtils',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/layers/FeatureLayer',
        'esri/layers/GraphicsLayer',
        'esri/graphic',
        'esri/graphicsUtils',
        'esri/geometry/Multipoint',
        'esri/geometry/Point',
        'esri/InfoTemplate',
        'esri/tasks/query',
        'esri/tasks/QueryTask',
        'esri/SpatialReference',
        'esri/symbols/jsonUtils',
        'esri/symbols/PictureMarkerSymbol',
        'esri/renderers/UniqueValueRenderer',
        'jimu/dijit/Message',
        'jimu/exportUtils',
        'jimu/utils',
        'esri/renderers/HeatmapRenderer',
        'esri/dijit/editing/TemplatePicker',
        'dojo/_base/window',
        './layerQueryDetails',
        '../GridOverlay/lib/mgrs',
        'esri/geometry/Polygon',
        'custom/common',
        './ClusterLayer',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/renderers/ClassBreaksRenderer',
        'esri/tasks/Geoprocessor',
        'esri/tasks/FeatureSet',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/TextSymbol',
        'esri/symbols/Font',
        'esri/Color'
    ],
    function (declare, _WidgetsInTemplateMixin, BaseWidget, dom, on, has, html, lang, array, string, domClass, domConstruct, domStyle, CsvStore, webMercatorUtils,
              ArcGISDynamicMapServiceLayer, FeatureLayer, GraphicsLayer, Graphic, graphicsUtils, Multipoint, Point, InfoTemplate, Query, QueryTask, SpatialReference,
              symbolJsonUtils, PictureMarkerSymbol, UniqueValueRenderer, Message, exportUtils, utils, HeatmapRenderer, TemplatePicker, win, layerQueryDetails,
              MGRS, Polygon, common, ClusterLayer, SimpleMarkerSymbol, ClassBreaksRenderer, Geoprocessor, FeatureSet, SimpleFillSymbol, SimpleLineSymbol, TextSymbol,
              Font, Color) {

        return declare([BaseWidget, _WidgetsInTemplateMixin], {

            baseClass: 'solutions-widget-datalookup',
            csvStore: null,
            layerLoaded: false,
            lookupLayersFieldNames: [],
            lookupLayersFields: [],
            combinedFields: [],
            latField: null,
            longField: null,
            renderer: null,
            srWebMerc: null,
            syncLayers: null,
            enrichFilter: null,
            enrichResultsProg: {},
            enrichResultsText: {},
            MGRS_50_CONFIG: {},
            errorList: null,
            //获取所有的分类标准，让用户选择相对于的分类标准
            classification: null,
            //获取当前文件的经度标准
            typeLong: null,
            //获取当前文件的纬度标准
            typeLat: null,
            //读取完成的数据
            wb: null,
            //存储XLSX数据
            xlsxData: null,
            //是否将文件读取为二进制字符串
            rABS: false,
            //GP服务循环使用
            i_count:0,
            //默认值
            choose_Import_Type_value: "baseed_FeatureMap",
            postCreate: function () {
                this.inherited(arguments);
                domClass.add(this.downloadResultsBtn, "hide");
            },

            startup: function () {
                var revUrl="";
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
                this.inherited(arguments);
                this.loading.show();
                html.place(html.toDom(this.nls.description), this.widgetDescription);
                this._buildRenderer();
                //聚合使用的图层
                this.clusterLayer;
                //网格使用的图层
                this.dealwith_GP_GraphicsLayer_poylon = new GraphicsLayer();
                this.dealwith_GP_GraphicsLayer_poylon.setMinScale(30000);
                this.dealwith_GP_GraphicsLayer_points = new GraphicsLayer();
                this.dealwith_GP_GraphicsLayer_points.setMaxScale(30000);
                //栅格使用图层
                this.lookup_LocationGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.dealwith_GP_GraphicsLayer_poylon);
                this.map.addLayer(this.dealwith_GP_GraphicsLayer_points);
                this.map.addLayer(this.lookup_LocationGraphicsLayer);
                //小区使用图层
                this.districtLayer = new GraphicsLayer({id: "dis"});
                this.map.addLayer(this.districtLayer);
                //kml使用的图层
                this.kmlLayer = new GraphicsLayer({ id: "kml" });
                this.map.addLayer(this.kmlLayer);

                //这里也要更改一下，变成4326
                this.srWebMerc = new SpatialReference({
                    wkid: 4326
                });
                if (utils.file.supportHTML5()) {
                    var c = dom.byId(this.id);

                    this.own(on(c, 'dragover', function (event) {
                        event.preventDefault();
                    }));
                    this.own(on(c, 'dragenter', function (event) {
                        event.preventDefault();
                    }));
                    this.own(on(c, 'drop', lang.hitch(this, this._handleCSVDrop)));
                }

                if (!utils.file.supportHTML5() && !has('safari') && utils.file.isEnabledFlash()) {
                    utils.file.loadFileAPI().then(lang.hitch(this, function () {
                        console.log('loading FileAPI');
                        domClass.add(this.csvFileInput, 'fileInputNonHTML5, js-fileapi-wrapper');
                    }));
                } else {
                    domClass.add(this.csvFileInput, 'fileInputHTML5');
                    //domClass.remove(this.showFileDialogBtn, 'hide');
                }
                this._initalizeLookupLayers();
                array.forEach(this.config.enrichLayers, function (lay) {
                    var textID = lay.id;
                    var progID = lay.id + '_prog';
                    var row = domConstruct.toDom(
                        "<tr class='controls'>" + "<td><div id='" + progID +
                        "' class='status processing' /></td>" + "<td><div id='" + textID +
                        "' class='result-text' ></div>" + "</td></tr>");

                    domConstruct.place(row, this.widgetsResultsTableBody);
                    this.enrichResultsProg[textID] = dom.byId(progID);
                    this.enrichResultsText[textID] = dom.byId(textID);
                    this.enrichResultsText[textID].innerHTML = string.substitute(
                        this.nls.results.recordsEnriched, {
                            0: 0,
                            1: 0,
                            2: 0,
                            3: lay.label
                        });
                }, this);
                // domClass.add(this.clearResultsBtn, 'jimu-state-disabled');
                this.loading.hide();
                this.initMgrs50Config();
            },
            //模板选择
            createPiker: function (id, target, parsentId) {

                var symbol1 = symbolJsonUtils.fromJson(this.config.Symbol1);
                var symbol2 = symbolJsonUtils.fromJson(this.config.Symbol2);
                var symbol3 = symbolJsonUtils.fromJson(this.config.Symbol3);
                var symbol4 = symbolJsonUtils.fromJson(this.config.Symbol4);
                var symbol5 = symbolJsonUtils.fromJson(this.config.Symbol5);
                var symbol6 = symbolJsonUtils.fromJson(this.config.Symbol6);
                var symbol7 = symbolJsonUtils.fromJson(this.config.Symbol7);
                var symbol8 = symbolJsonUtils.fromJson(this.config.Symbol8);
                var symbol9 = symbolJsonUtils.fromJson(this.config.Symbol9);
                var symbol10 = symbolJsonUtils.fromJson(this.config.Symbol10);
                var symbol11 = symbolJsonUtils.fromJson(this.config.Symbol11);
                var symbol12 = symbolJsonUtils.fromJson(this.config.Symbol12);
                var symbol13 = symbolJsonUtils.fromJson(this.config.Symbol13);
                var symbol14 = symbolJsonUtils.fromJson(this.config.Symbol14);
                var symbol15 = symbolJsonUtils.fromJson(this.config.Symbol15);
                var symbol16 = symbolJsonUtils.fromJson(this.config.Symbol16);
                var symbol17 = symbolJsonUtils.fromJson(this.config.Symbol17);
                var symbol18 = symbolJsonUtils.fromJson(this.config.Symbol18);
                var symbol19 = symbolJsonUtils.fromJson(this.config.Symbol19);
                var symbol20 = symbolJsonUtils.fromJson(this.config.Symbol20);
                var array_items = [{
                    label: "item 1",
                    symbol: symbol1,
                    description: "description 1"
                }, {
                    label: "item 2",
                    symbol: symbol2,
                    description: "description 2"
                }, {
                    label: "item 3",
                    symbol: symbol3,
                    description: "description 3"
                }, {
                    label: "item 4",
                    symbol: symbol4,
                    description: "description 4"
                }, {

                    label: "item 5",
                    symbol: symbol5,
                    description: "description 1"
                }, {
                    label: "item 6",
                    symbol: symbol6,
                    description: "description 2"
                }, {
                    label: "item 7",
                    symbol: symbol7,
                    description: "description 3"
                }, {
                    label: "item 8",
                    symbol: symbol8,
                    description: "description 4"
                }, {
                    label: "item 9",
                    symbol: symbol9,
                    description: "description 4"
                }, {
                    label: "item 10",
                    symbol: symbol10,
                    description: "description 4"
                }, {
                    label: "item 11",
                    symbol: symbol11,
                    description: "description 1"
                }, {
                    label: "item 12",
                    symbol: symbol12,
                    description: "description 2"
                }, {
                    label: "item 13",
                    symbol: symbol13,
                    description: "description 3"
                }, {
                    label: "item 14",
                    symbol: symbol14,
                    description: "description 4"
                }, {

                    label: "item 15",
                    symbol: symbol15,
                    description: "description 1"
                }, {
                    label: "item 16",
                    symbol: symbol16,
                    description: "description 2"
                }, {
                    label: "item 17",
                    symbol: symbol17,
                    description: "description 3"
                }, {
                    label: "item 18",
                    symbol: symbol18,
                    description: "description 4"
                }, {
                    label: "item 19",
                    symbol: symbol19,
                    description: "description 4"
                }, {
                    label: "item 20",
                    symbol: symbol20,
                    description: "description 4"
                }];
                if (this.templatePicker) {
                    this.templatePicker.destroy();
                }
                var templatePicker = new TemplatePicker({
                    items: array_items,
                    rows: "auto",
                    columns: 5,
                    grouping: true,
                    style: "height: auto; overflow: auto;"
                }, id);

                templatePicker.startup();
                this.tget = target;
                templatePicker.on("selection-change", lang.hitch(this, function () {
                    if (templatePicker.getSelected()) {
                        var selectedTemplate = templatePicker.getSelected();

                        var image = selectedTemplate.item.symbol.url;
                        this.tget.src = image;
                        //console.log(image)
                        templatePicker.destroy();
                        domConstruct.destroy(parsentId);
                        var ra = this.getRenderer();
                        this.setRenderer(ra, this.selectValue_select.value);

                    }

                }));
                this.templatePicker = templatePicker;
            },

            _buildRenderer: function () {
                //设置点的样式信息，插入图片做的哦。这样以后就方便了，唯一的缺陷就是插入的是base64位数据，很秀
                this.symOut = symbolJsonUtils.fromJson(this.config.SymbolOutside);
                this.renderer = new UniqueValueRenderer(this.symOut, this.config.intersectField);
                this.renderer.addValue(this.config.valueOut, this.symOut);

            },
            _initalizeLookupLayers: function () {
                this.lookupLayersFields = [];
                this.lookupLayersFieldNames = [];
                var fieldNames;
                var fieldAlias;
                array.forEach(this.config.enrichLayers, function (configLayer) {
                    fieldNames = array.map(configLayer.fields, function (field) {
                        return field.fieldName;
                    });
                    fieldAlias = array.map(configLayer.fields, function (field) {
                        return field.label;
                    });
                    array.forEach(fieldNames, function (field) {
                        var aliasPosition = fieldNames.indexOf(field);
                        var fieldStruct = {
                            'name': null,
                            'alias': null,
                            'type': 'esriFieldTypeString',
                            'editable': true,
                            'domain': null
                        };
                        //if (this.lookupLayersFieldNames.indexOf(field) < 0) {
                        fieldStruct.name = configLayer.label + "_" + field;
                        fieldStruct.alias = configLayer.label + "_" + fieldAlias[aliasPosition];
                        this.lookupLayersFieldNames.push(fieldStruct.name);
                        this.lookupLayersFields.push(fieldStruct);
                        //}
                    }, this);
                }, this);
            },
            fileSelected: function () {
                this.clearLocal();
                while (this.selectValue_select.firstChild) {
                    this.selectValue_select.removeChild(this.selectValue_select.firstChild);
                }
                //文件选择
                if (utils.file.supportHTML5()) {
                    this._processFiles(this.csvFileInput.files);
                } else if (utils.file.supportFileAPI()) {
                    this._processFiles(window.FileAPI.getFiles(this.csvFileInput));
                } else {
                    console.log("no file handler support !");
                }
                this.csvFileInput.value = null;
                domClass.add(this.downloadResultsBtn, "hide");
            },
            _handleCSVDrop: function (event) {
                event.preventDefault();
                var dataTransfer = event.dataTransfer;
                if (domClass.contains(this.showFileDialogBtn, 'jimu-state-disabled')) {
                    return;
                }
                domClass.add(this.downloadResultsBtn, "hide");

                this._processFiles(dataTransfer.files);
            },
            _processFiles: function (files) {
                //选择文件不可用
                //domClass.add(this.showFileDialogBtn, 'jimu-state-disabled');


                this._resetResults();
                var selectMap = document.querySelectorAll('input[name=choose_feature_Map]:checked')[0].id;
                this.mapType = selectMap;
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
                    } else if (this.baseed_KmlMap.checked && fileExtension.indexOf("KML") > -1) {
                        if (file) {
                            this.handleKML(file);
                        }
                        else {
                            Message({
                                message: "文件不存在!"
                            });
                            this.clearCSVResults();
                        }
                    }else {
                        new Message({
                            message: this.nls.error.notCSVFile
                        });
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                        this.clearCSVResults();
                    }
                }
            },
            showFileDialog: function () {
                if (domClass.contains(this.showFileDialogBtn, 'jimu-state-disabled')) {
                    return;
                }
                this.csvFileInput.click();
            },
            handleCSV: function (file) {
                //console.log('Reading CSV: ', file, ', ', file.name, ', ', file.type, ', ', file.size);
                if (utils.file.supportHTML5()) {
                    var reader = new FileReader();
                    reader.onload = lang.hitch(this, function () {
                        this._processCSVData(reader.result);
                    });
                    reader.readAsText(file);
                } else {
                    //console.log(window.atob);
                    window.FileAPI.readAsText(file, lang.hitch(this, function (evt) {
                        //console.log('result: ' + evt.result);
                        if (evt.type === 'load') {
                            this._processCSVData(evt.result);
                        }
                    }));
                }
            },
            handleXLSX: function (file) {
                if (utils.file.supportHTML5()) {
                    var reader = new FileReader();
                    reader.onload = lang.hitch(this, function () {
                        this._processXLSXData(reader.result);
                    });
                    if (this.rABS) {
                        reader.readAsArrayBuffer(file);
                    } else {
                        reader.readAsBinaryString(file);
                    }
                }
                else {
                    //console.log(window.atob);
                    window.FileAPI.readAsText(file, lang.hitch(this, function (evt) {
                        //console.log('result: ' + evt.result);
                        if (evt.type === 'load') {
                            this._processXLSXData(evt.result);
                        }
                    }));
                }
            },
            handleKML: function (file) {
                if (utils.file.supportHTML5()) {
                    var reader = new FileReader();
                    reader.onload = lang.hitch(this, function () {
                        this._processKMLData(reader.result);
                    });
                    reader.readAsText(file);
                } else {
                    window.FileAPI.readAsText(file, lang.hitch(this, function (evt) {
                        if (evt.type === 'load') {
                            this._processKMLData(evt.result);
                        }
                    }));
                }
            },
            _processKMLData: function (data) {
                var toGeoJSON = (function () {
                    'use strict';

                    var removeSpace = /\s*/g,
                        trimSpace = /^\s*|\s*$/g,
                        splitSpace = /\s+/;
                    // generate a short, numeric hash of a string
                    function okhash(x) {
                        if (!x || !x.length) return 0;
                        for (var i = 0, h = 0; i < x.length; i++) {
                            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
                        } return h;
                    }
                    // all Y children of X
                    function get(x, y) { return x.getElementsByTagName(y); }
                    function attr(x, y) { return x.getAttribute(y); }
                    function attrf(x, y) { return parseFloat(attr(x, y)); }
                    // one Y child of X, if any, otherwise null
                    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
                    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
                    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
                    // cast array x into numbers
                    function numarray(x) {
                        for (var j = 0, o = []; j < x.length; j++) { o[j] = parseFloat(x[j]); }
                        return o;
                    }
                    // get the content of a text node, if any
                    function nodeVal(x) {
                        if (x) { norm(x); }
                        return (x && x.textContent) || '';
                    }
                    // get the contents of multiple text nodes, if present
                    function getMulti(x, ys) {
                        var o = {}, n, k;
                        for (k = 0; k < ys.length; k++) {
                            n = get1(x, ys[k]);
                            if (n) o[ys[k]] = nodeVal(n);
                        }
                        return o;
                    }
                    // add properties of Y to X, overwriting if present in both
                    function extend(x, y) { for (var k in y) x[k] = y[k]; }
                    // get one coordinate from a coordinate array, if any
                    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
                    // get all coordinates from a coordinate array as [[],[]]
                    function coord(v) {
                        var coords = v.replace(trimSpace, '').split(splitSpace),
                            o = [];
                        for (var i = 0; i < coords.length; i++) {
                            o.push(coord1(coords[i]));
                        }
                        return o;
                    }
                    function coordPair(x) {
                        var ll = [attrf(x, 'lon'), attrf(x, 'lat')],
                            ele = get1(x, 'ele'),
                            // handle namespaced attribute in browser
                            heartRate = get1(x, 'gpxtpx:hr') || get1(x, 'hr'),
                            time = get1(x, 'time'),
                            e;
                        if (ele) {
                            e = parseFloat(nodeVal(ele));
                            if (!isNaN(e)) {
                                ll.push(e);
                            }
                        }
                        return {
                            coordinates: ll,
                            time: time ? nodeVal(time) : null,
                            heartRate: heartRate ? parseFloat(nodeVal(heartRate)) : null
                        };
                    }

                    // create a new feature collection parent object
                    function fc() {
                        return {
                            type: 'FeatureCollection',
                            features: []
                        };
                    }

                    var serializer;
                    if (typeof XMLSerializer !== 'undefined') {
                        /* istanbul ignore next */
                        serializer = new XMLSerializer();
                    } else {
                        var isNodeEnv = (typeof process === 'object' && !process.browser);
                        var isTitaniumEnv = (typeof Titanium === 'object');
                        if (typeof exports === 'object' && (isNodeEnv || isTitaniumEnv)) {
                            serializer = new (require('xmldom').XMLSerializer)();
                        } else {
                            throw new Error('Unable to initialize serializer');
                        }
                    }
                    function xml2str(str) {
                        // IE9 will create a new XMLSerializer but it'll crash immediately.
                        // This line is ignored because we don't run coverage tests in IE9
                        /* istanbul ignore next */
                        if (str.xml !== undefined) return str.xml;
                        return serializer.serializeToString(str);
                    }

                    var t = {
                        kml: function (doc) {

                            var gj = fc(),
                                // styleindex keeps track of hashed styles in order to match features
                                styleIndex = {}, styleByHash = {},
                                // stylemapindex keeps track of style maps to expose in properties
                                styleMapIndex = {},
                                // atomic geospatial types supported by KML - MultiGeometry is
                                // handled separately
                                geotypes = ['Polygon', 'LineString', 'Point', 'Track', 'gx:Track'],
                                // all root placemarks in the file
                                placemarks = get(doc, 'Placemark'),
                                styles = get(doc, 'Style'),
                                styleMaps = get(doc, 'StyleMap');

                            for (var k = 0; k < styles.length; k++) {
                                var hash = okhash(xml2str(styles[k])).toString(16);
                                styleIndex['#' + attr(styles[k], 'id')] = hash;
                                styleByHash[hash] = styles[k];
                            }
                            for (var l = 0; l < styleMaps.length; l++) {
                                styleIndex['#' + attr(styleMaps[l], 'id')] = okhash(xml2str(styleMaps[l])).toString(16);
                                var pairs = get(styleMaps[l], 'Pair');
                                var pairsMap = {};
                                for (var m = 0; m < pairs.length; m++) {
                                    pairsMap[nodeVal(get1(pairs[m], 'key'))] = nodeVal(get1(pairs[m], 'styleUrl'));
                                }
                                styleMapIndex['#' + attr(styleMaps[l], 'id')] = pairsMap;

                            }
                            for (var j = 0; j < placemarks.length; j++) {
                                gj.features = gj.features.concat(getPlacemark(placemarks[j]));
                            }
                            function kmlColor(v) {
                                var color, opacity;
                                v = v || '';
                                if (v.substr(0, 1) === '#') { v = v.substr(1); }
                                if (v.length === 6 || v.length === 3) { color = v; }
                                if (v.length === 8) {
                                    opacity = parseInt(v.substr(0, 2), 16) / 255;
                                    color = '#' + v.substr(6, 2) +
                                        v.substr(4, 2) +
                                        v.substr(2, 2);
                                }
                                return [color, isNaN(opacity) ? undefined : opacity];
                            }
                            function gxCoord(v) { return numarray(v.split(' ')); }
                            function gxCoords(root) {
                                var elems = get(root, 'coord', 'gx'), coords = [], times = [];
                                if (elems.length === 0) elems = get(root, 'gx:coord');
                                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                                var timeElems = get(root, 'when');
                                for (var j = 0; j < timeElems.length; j++) times.push(nodeVal(timeElems[j]));
                                return {
                                    coords: coords,
                                    times: times
                                };
                            }
                            function getGeometry(root) {
                                var geomNode, geomNodes, i, j, k, geoms = [], coordTimes = [];
                                if (get1(root, 'MultiGeometry')) { return getGeometry(get1(root, 'MultiGeometry')); }
                                if (get1(root, 'MultiTrack')) { return getGeometry(get1(root, 'MultiTrack')); }
                                if (get1(root, 'gx:MultiTrack')) { return getGeometry(get1(root, 'gx:MultiTrack')); }
                                for (i = 0; i < geotypes.length; i++) {
                                    geomNodes = get(root, geotypes[i]);
                                    if (geomNodes) {
                                        for (j = 0; j < geomNodes.length; j++) {
                                            geomNode = geomNodes[j];
                                            if (geotypes[i] === 'Point') {
                                                geoms.push({
                                                    type: 'Point',
                                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                                });
                                            } else if (geotypes[i] === 'LineString') {
                                                geoms.push({
                                                    type: 'LineString',
                                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                                });
                                            } else if (geotypes[i] === 'Polygon') {
                                                var rings = get(geomNode, 'LinearRing'),
                                                    coords = [];
                                                for (k = 0; k < rings.length; k++) {
                                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                                }
                                                geoms.push({
                                                    type: 'Polygon',
                                                    coordinates: coords
                                                });
                                            } else if (geotypes[i] === 'Track' ||
                                                geotypes[i] === 'gx:Track') {
                                                var track = gxCoords(geomNode);
                                                geoms.push({
                                                    type: 'LineString',
                                                    coordinates: track.coords
                                                });
                                                if (track.times.length) coordTimes.push(track.times);
                                            }
                                        }
                                    }
                                }
                                return {
                                    geoms: geoms,
                                    coordTimes: coordTimes
                                };
                            }
                            function getPlacemark(root) {
                                var geomsAndTimes = getGeometry(root), i, properties = {},
                                    name = nodeVal(get1(root, 'name')),
                                    address = nodeVal(get1(root, 'address')),
                                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                                    description = nodeVal(get1(root, 'description')),
                                    timeSpan = get1(root, 'TimeSpan'),
                                    timeStamp = get1(root, 'TimeStamp'),
                                    extendedData = get1(root, 'ExtendedData'),
                                    lineStyle = get1(root, 'LineStyle'),
                                    polyStyle = get1(root, 'PolyStyle'),
                                    visibility = get1(root, 'visibility');

                                if (!geomsAndTimes.geoms.length) return [];
                                if (name) properties.name = name;
                                if (address) properties.address = address;
                                if (styleUrl) {
                                    if (styleUrl[0] !== '#') {
                                        styleUrl = '#' + styleUrl;
                                    }

                                    properties.styleUrl = styleUrl;
                                    if (styleIndex[styleUrl]) {
                                        properties.styleHash = styleIndex[styleUrl];
                                    }
                                    if (styleMapIndex[styleUrl]) {
                                        properties.styleMapHash = styleMapIndex[styleUrl];
                                        properties.styleHash = styleIndex[styleMapIndex[styleUrl].normal];
                                    }
                                    // Try to populate the lineStyle or polyStyle since we got the style hash
                                    var style = styleByHash[properties.styleHash];
                                    if (style) {
                                        if (!lineStyle) lineStyle = get1(style, 'LineStyle');
                                        if (!polyStyle) polyStyle = get1(style, 'PolyStyle');
                                        var iconStyle = get1(style, 'IconStyle');
                                        if (iconStyle) {
                                            var icon = get1(iconStyle, 'Icon');
                                            if (icon) {
                                                var href = nodeVal(get1(icon, 'href'));
                                                if (href) properties.icon = href;
                                            }
                                        }
                                    }
                                }
                                if (description) properties.description = description;
                                if (timeSpan) {
                                    var begin = nodeVal(get1(timeSpan, 'begin'));
                                    var end = nodeVal(get1(timeSpan, 'end'));
                                    properties.timespan = { begin: begin, end: end };
                                }
                                if (timeStamp) {
                                    properties.timestamp = nodeVal(get1(timeStamp, 'when'));
                                }
                                if (lineStyle) {
                                    var linestyles = kmlColor(nodeVal(get1(lineStyle, 'color'))),
                                        color = linestyles[0],
                                        opacity = linestyles[1],
                                        width = parseFloat(nodeVal(get1(lineStyle, 'width')));
                                    if (color) properties.stroke = color;
                                    if (!isNaN(opacity)) properties['stroke-opacity'] = opacity;
                                    if (!isNaN(width)) properties['stroke-width'] = width;
                                }
                                if (polyStyle) {
                                    var polystyles = kmlColor(nodeVal(get1(polyStyle, 'color'))),
                                        pcolor = polystyles[0],
                                        popacity = polystyles[1],
                                        fill = nodeVal(get1(polyStyle, 'fill')),
                                        outline = nodeVal(get1(polyStyle, 'outline'));
                                    if (pcolor) properties.fill = pcolor;
                                    if (!isNaN(popacity)) properties['fill-opacity'] = popacity;
                                    if (fill) properties['fill-opacity'] = fill === '1' ? properties['fill-opacity'] || 1 : 0;
                                    if (outline) properties['stroke-opacity'] = outline === '1' ? properties['stroke-opacity'] || 1 : 0;
                                }
                                if (extendedData) {
                                    var datas = get(extendedData, 'Data'),
                                        simpleDatas = get(extendedData, 'SimpleData');

                                    for (i = 0; i < datas.length; i++) {
                                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                                    }
                                    for (i = 0; i < simpleDatas.length; i++) {
                                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                                    }
                                }
                                if (visibility) {
                                    properties.visibility = nodeVal(visibility);
                                }
                                if (geomsAndTimes.coordTimes.length) {
                                    properties.coordTimes = (geomsAndTimes.coordTimes.length === 1) ?
                                        geomsAndTimes.coordTimes[0] : geomsAndTimes.coordTimes;
                                }
                                var feature = {
                                    type: 'Feature',
                                    geometry: (geomsAndTimes.geoms.length === 1) ? geomsAndTimes.geoms[0] : {
                                        type: 'GeometryCollection',
                                        geometries: geomsAndTimes.geoms
                                    },
                                    properties: properties
                                };
                                if (attr(root, 'id')) feature.id = attr(root, 'id');
                                return [feature];
                            }
                            return gj;
                        },
                        gpx: function (doc) {
                            var i,
                                tracks = get(doc, 'trk'),
                                routes = get(doc, 'rte'),
                                waypoints = get(doc, 'wpt'),
                                // a feature collection
                                gj = fc(),
                                feature;
                            for (i = 0; i < tracks.length; i++) {
                                feature = getTrack(tracks[i]);
                                if (feature) gj.features.push(feature);
                            }
                            for (i = 0; i < routes.length; i++) {
                                feature = getRoute(routes[i]);
                                if (feature) gj.features.push(feature);
                            }
                            for (i = 0; i < waypoints.length; i++) {
                                gj.features.push(getPoint(waypoints[i]));
                            }
                            function initializeArray(arr, size) {
                                for (var h = 0; h < size; h++) {
                                    arr.push(null);
                                }
                                return arr;
                            }
                            function getPoints(node, pointname) {
                                var pts = get(node, pointname),
                                    line = [],
                                    times = [],
                                    heartRates = [],
                                    l = pts.length;
                                if (l < 2) return {};  // Invalid line in GeoJSON
                                for (var i = 0; i < l; i++) {
                                    var c = coordPair(pts[i]);
                                    line.push(c.coordinates);
                                    if (c.time) times.push(c.time);
                                    if (c.heartRate || heartRates.length) {
                                        if (!heartRates.length) initializeArray(heartRates, i);
                                        heartRates.push(c.heartRate || null);
                                    }
                                }
                                return {
                                    line: line,
                                    times: times,
                                    heartRates: heartRates
                                };
                            }
                            function getTrack(node) {
                                var segments = get(node, 'trkseg'),
                                    track = [],
                                    times = [],
                                    heartRates = [],
                                    line;
                                for (var i = 0; i < segments.length; i++) {
                                    line = getPoints(segments[i], 'trkpt');
                                    if (line) {
                                        if (line.line) track.push(line.line);
                                        if (line.times && line.times.length) times.push(line.times);
                                        if (heartRates.length || (line.heartRates && line.heartRates.length)) {
                                            if (!heartRates.length) {
                                                for (var s = 0; s < i; s++) {
                                                    heartRates.push(initializeArray([], track[s].length));
                                                }
                                            }
                                            if (line.heartRates && line.heartRates.length) {
                                                heartRates.push(line.heartRates);
                                            } else {
                                                heartRates.push(initializeArray([], line.line.length || 0));
                                            }
                                        }
                                    }
                                }
                                if (track.length === 0) return;
                                var properties = getProperties(node);
                                extend(properties, getLineStyle(get1(node, 'extensions')));
                                if (times.length) properties.coordTimes = track.length === 1 ? times[0] : times;
                                if (heartRates.length) properties.heartRates = track.length === 1 ? heartRates[0] : heartRates;
                                return {
                                    type: 'Feature',
                                    properties: properties,
                                    geometry: {
                                        type: track.length === 1 ? 'LineString' : 'MultiLineString',
                                        coordinates: track.length === 1 ? track[0] : track
                                    }
                                };
                            }
                            function getRoute(node) {
                                var line = getPoints(node, 'rtept');
                                if (!line.line) return;
                                var prop = getProperties(node);
                                extend(prop, getLineStyle(get1(node, 'extensions')));
                                var routeObj = {
                                    type: 'Feature',
                                    properties: prop,
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: line.line
                                    }
                                };
                                return routeObj;
                            }
                            function getPoint(node) {
                                var prop = getProperties(node);
                                extend(prop, getMulti(node, ['sym']));
                                return {
                                    type: 'Feature',
                                    properties: prop,
                                    geometry: {
                                        type: 'Point',
                                        coordinates: coordPair(node).coordinates
                                    }
                                };
                            }
                            function getLineStyle(extensions) {
                                var style = {};
                                if (extensions) {
                                    var lineStyle = get1(extensions, 'line');
                                    if (lineStyle) {
                                        var color = nodeVal(get1(lineStyle, 'color')),
                                            opacity = parseFloat(nodeVal(get1(lineStyle, 'opacity'))),
                                            width = parseFloat(nodeVal(get1(lineStyle, 'width')));
                                        if (color) style.stroke = color;
                                        if (!isNaN(opacity)) style['stroke-opacity'] = opacity;
                                        // GPX width is in mm, convert to px with 96 px per inch
                                        if (!isNaN(width)) style['stroke-width'] = width * 96 / 25.4;
                                    }
                                }
                                return style;
                            }
                            function getProperties(node) {
                                var prop = getMulti(node, ['name', 'cmt', 'desc', 'type', 'time', 'keywords']),
                                    links = get(node, 'link');
                                if (links.length) prop.links = [];
                                for (var i = 0, link; i < links.length; i++) {
                                    link = { href: attr(links[i], 'href') };
                                    extend(link, getMulti(links[i], ['text', 'type']));
                                    prop.links.push(link);
                                }
                                return prop;
                            }
                            return gj;
                        }
                    };
                    return t;
                })();
                var kmlgeoJson = toGeoJSON.kml($.parseXML(data));
                var jsonf = this.geoJsonConverter();
                var esriJson = jsonf.toEsri(kmlgeoJson);
                this.kmlFeatures = esriJson.features;
            },
            //获取XLSX文件，转换为csv读取格式
            _processXLSXData: function (data) {

                if (this.rABS) {
                    this.wb = XLSX.read(btoa(this.fixdata(data)), {
                        type: 'base64'
                    });
                } else {
                    this.wb = XLSX.read(data, {
                        type: 'binary'
                    });
                }
                //wb.SheetNames[0]是获取Sheets中第一个Sheet的名字
                //wb.Sheets[Sheet名]获取第一个Sheet的数据
                this.xlsxData = XLSX.utils.sheet_to_json(this.wb.Sheets[this.wb.SheetNames[0]]);
                var read_Result = this._xlsxTranToCSV();
                this._processCSVData(read_Result);
            },
            fixdata: function (data) {
                var o = "",
                    l = 0,
                    w = 10240;
                for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
                o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
                return o;
            },
            clearXLSXResult: function () {

            },
            _processCSVData: function (data) {
                if (data.length > 2) {
                    this.deleteSelectionValues();
                    var newLineIndex = data.indexOf('\n');
                    var firstLine = lang.trim(data.substr(0, newLineIndex));
                    if (this.baseed_GridMap.checked) {
                        if (firstLine.indexOf("MGRS") == -1) {
                            firstLine = "MGRS," + firstLine;
                        }
                    }
                    var remainder = data.replace(firstLine, '');
                    if (firstLine !== '' && remainder.length > 2) { //2 to handle CSV with no record. just header.
                        //获取符号分隔符
                        var separator = this._getSeparator(firstLine);
                        //记录导入表属性值，用于给下拉框赋值
                        this.fileAttributes = firstLine.split(separator);
                        this.writeSelectionValues();
                        //先把每行数据化为数组的一部分，再根据separator来对其内部的_attribute进行细致划分
                        this.csvStore = new CsvStore({
                            data: data,
                            separator: separator
                        });

                        this.csvStore.fetch({
                            onComplete: lang.hitch(this, function (items) {
                                this.items_result = items;
                            }),
                            onError: lang.hitch(this, function (error) {
                                //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                                var msg = string.substitute(this.nls.error.fetchingCSV, {
                                    0: error.message
                                });
                                Message({
                                    message: msg
                                });
                                console.error(msg, error);
                            })
                        });
                    } else {
                        new Message({
                            message: this.nls.error.CSVNoRecords
                        });
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                        this.clearCSVResults();
                    }
                } else {
                    new Message({
                        message: this.nls.error.CSVEmptyFile
                    });
                    //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                    this.clearCSVResults();
                }
            },
            _xlsxTranToCSV: function () {
                var csvFields_XLSX = [];
                for (var i in this.xlsxData[0]) {
                    csvFields_XLSX.push(i);
                }
                var toCSVString = "";
                for (var i = 0; i < csvFields_XLSX.length - 1; i++) {
                    toCSVString += csvFields_XLSX[i] + ",";
                }
                toCSVString += csvFields_XLSX[csvFields_XLSX.length - 1] + "\n";

                for (var i = 0; i < this.xlsxData.length; i++) {
                    for (var j = 0; j < csvFields_XLSX.length - 1; j++) {
                        toCSVString += this.xlsxData[i][csvFields_XLSX[j]] + ",";
                    }
                    toCSVString += this.xlsxData[i][csvFields_XLSX[csvFields_XLSX.length - 1]] + "\n";
                }
                return toCSVString;
            },
            //导入数据处理
            _csvReadComplete: function () {
                var items = this.items_result;
                if (items.length && items.length <= parseInt(this.config.maxRowCount, 10)) {
                    var recCount = items.length.toString();
                    domClass.remove(this.results, "hide");
                    this.resultsLoading.innerHTML = string.substitute(this.nls.results.csvLoaded, {
                        0: recCount
                    });
                    domClass.replace(this.resultsLoadingImage, "complete", "processing");

                    var objectId = 1;
                    //定义点的相关信息，包括空间坐标信息和相对于的属性信息
                    var featureCollection = this._generateFeatureCollectionTemplateCSV(this.csvStore, items);
                    var popupInfo = this._generateDefaultPopupInfo(featureCollection);
                    //设置相对于的点的属性template啦
                    var infoTemplate = new InfoTemplate(this._buildInfoTemplate(popupInfo));
                    //判断是否为UTM信息
                    var mapProj = "latlon_4326";
                    array.forEach(this.inputForm.rdProjection, lang.hitch(this, function (radio) {
                        if (radio.checked) {
                            mapProj = radio.value;
                        }
                    }));
                    this.latField = null;
                    this.longField = null;
                    array.some(this.csvFields, function (fieldName) {
                        var matchId;
                        //Lat信息，即为空间坐标系的Y轴坐标信息，即为纬度
                        matchId = array.indexOf(this.config.latFields, fieldName.toLowerCase());
                        this.typeLat = matchId;
                        if (matchId !== -1) {
                            this.latField = fieldName;
                        }
                        //Long信息，即为空间坐标系的X轴坐标信息，即为经度
                        matchId = array.indexOf(this.config.longFields, fieldName.toLowerCase());
                        this.typeLong = matchId;
                        if (matchId !== -1) {
                            this.longField = fieldName;
                        }
                        if (this.latField && this.longField) {
                            return true;
                        }
                        return false;
                    }, this);
                    if ((this.latField === null || this.longField === null) && this.choose_Import_Type_value != "baseed_PlotMap") {
                        Message({
                            message: this.nls.error.invalidCoord
                        });
                        this.clearCSVResults();
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                        return;
                    }
                    var errorCnt = 0;
                    this.errorList = [];
                    //获取每个字段的唯一值
                    var classiObeject = {};
                    var allCSVInfomation={};
                    for (var i = 0; i < this.classification.length; i++) {
                        classiObeject[this.classification[i]] = new Set();
                        allCSVInfomation[this.classification[i]] = new Set();
                        allCSVInfomation[this.classification[i]]=[];
                    }
                    array.forEach(items, function (item, i) {
                        var errorFlag = false;
                        var attributes = {};
                        array.forEach(this.combinedFields, function (attr) {
                            var value = Number(this.csvStore.getValue(item, attr));
                            attributes[attr] = isNaN(value) ? this.csvStore.getValue(item, attr) : value;
                            if (attr != this.combinedFields[this.combinedFields.length - 1]) {
                                allCSVInfomation[attr].push(attributes[attr]);
                            }
                            if (classiObeject.hasOwnProperty(attr)) {
                                classiObeject[attr].add(attributes[attr]);
                            }
                        }, this);

                        attributes.__OBJECTID = objectId;
                        attributes[this.config.intersectField] = this.config.valueOut;
                        objectId++;
                        var latitude = 0;
                        var longitude = 0;
                        if (isNaN(attributes[this.latField]) || isNaN(attributes[this.longField])) {
                            errorFlag = true;
                            errorCnt = errorCnt + 1;
                            //increase error id by 2 to handle zero start and 1 has header.
                            this.errorList.push((parseInt(item._csvId, 10) + 2));
                            this.enrichErrors.innerHTML = string.substitute(this.nls.results.recordsError, {
                                0: errorCnt
                            });
                        } else {
                            latitude = parseFloat(attributes[this.latField]);
                            longitude = parseFloat(attributes[this.longField]);
                        }

                        if (!errorFlag) {
                            var geometry;
                            if (mapProj === 'latlon_4326') {
                                //webMercatorUtils.lngLatToXY(y,x)是将经纬度转化为UTM值
                                geometry = new Point(longitude, latitude, this.srWebMerc);
                            } else {
                                geometry = new Point(longitude, latitude, this.srWebMerc);
                            }

                            var feature = {
                                'geometry': geometry.toJson(),
                                'attributes': attributes
                            };
                            featureCollection.featureSet.features.push(feature);
                            this.resultsPlotting.innerHTML = string.substitute(this.nls.results.recordsPlotted, {
                                0: ((i - errorCnt) + 1).toString(),
                                1: recCount
                            });
                        }
                    }, this);
                    this.classiObeject = classiObeject;
                    //记录导入的所有的值
                    this.allCSVInfomation = allCSVInfomation;
                    if (this.layerLoaded) {
                        this.map.removeLayer(this.featureLayer);
                    }
                    var options = {
                        opacity: 0.8,
                        outFields: ["*"],
                        visible: true,
                        infoTemplate: infoTemplate,
                        id: 'csvLayer',
                        name: 'CSV Layer'
                    };
                    //好的，开始在图中标注出相对于的CSV的信息的点了。
                    this.featureLayer = new FeatureLayer(featureCollection, options);
                    //将所有的点都放在this.featureLayer图层里
                    this.featureLayer.setRenderer(this.renderer);
                    domClass.replace(this.resultsPlottingImage, 'complete', 'processing');
                    domClass.remove(this.clearResultsBtn, 'jimu-state-disabled');
                    var key;
                    //是否选择仅绘制点选项
                    if (!this.chkboxPlotOnly.checked) {
                        this._enrichData(this.featureLayer, this.config.enrichLayers);
                        for (key in this.enrichResultsProg) {
                            if (this.enrichResultsProg.hasOwnProperty(key)) {
                                domStyle.set(this.enrichResultsProg[key], 'display', 'block');
                            }
                        }
                    } else {
                        for (key in this.enrichResultsText) {
                            if (this.enrichResultsText.hasOwnProperty(key)) {
                                this.enrichResultsText[key].innerHTML = '';
                            }
                        }
                        for (key in this.enrichResultsProg) {
                            if (this.enrichResultsProg.hasOwnProperty(key)) {
                                domStyle.set(this.enrichResultsProg[key], 'display', 'none');
                            }
                        }
                    }
                } else {
                    new Message({
                        message: string.substitute(this.nls.error.tooManyRecords, {
                            0: this.config.maxRowCount
                        })
                    });
                    this.clearCSVResults();
                }
                //启用选择图片和清除数据
                //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                domClass.remove(this.clearHeatmapRenderer, 'jimu-state-disabled');
            },
            //This function breaks up the csv points into manageable chunks then sends the arrray
            // of chunks to a deferred object then calls the selectFeatures callback function.
            _enrichData: function (flayer, enrichLayers) {
                this.syncLayers = [];
                var counter = 0;
                var points = 1;
                var arrGraphics = [];
                arrGraphics[counter] = [];
                array.forEach(flayer.graphics, lang.hitch(this, function (graphic) {
                    if (points >= parseInt(this.config.cacheNumber, 10)) {
                        arrGraphics[counter].push(graphic);
                        if (flayer.graphics.length > ((counter + 1) * parseInt(this.config.cacheNumber, 10))) {
                            counter++;
                            points = 1;
                            arrGraphics[counter] = [];
                        }
                    } else {
                        arrGraphics[counter].push(graphic);
                        points++;
                    }
                }));

                array.forEach(enrichLayers, function (layer) {
                    var idx = 0;
                    var fields = array.map(layer.fields, function (field) {
                        return field.fieldName;
                    });
                    var syncDet = new layerQueryDetails({
                        'layer': layer,
                        'numberOfRequest': flayer.graphics.length,
                        'totalRecords': flayer.graphics.length,
                        'numberOfHits': 0,
                        'fields': fields,
                        'intersectField': this.config.intersectField,
                        //'valueIn' : this.config.valueIn,
                        'valueOut': this.config.valueOut,
                        //'valueInSym' : this.symIn,
                        'valueOutSym': this.symOut
                    });
                    this.own(on(syncDet, 'complete', lang.hitch(this, this._syncComplete)));
                    this.own(on(syncDet, 'requestComplete', lang.hitch(this, this._requestComplete)));
                    this.own(on(syncDet, 'error', lang.hitch(this, this._deferredErrorCallback)));
                    this.syncLayers.push(syncDet);

                    this.queryCallback(arrGraphics, idx, layer, fields, syncDet);

                }, this);
            },
            // This function creates a multipoint geometry to just a geometry filter in selectFeatures call.
            // The function then calls selectFeatures recursively and sequentially for each enrich layer
            // against the point chunks.
            queryCallback: function (chunks, idx, layer, fields, syncDet) {
                var def;
                var multipoint = new Multipoint(this.map.spatialReference);
                array.forEach(chunks[idx], function (graphic) {
                    var geometry = graphic.geometry;
                    if (geometry) {
                        multipoint.addPoint({
                            x: geometry.x,
                            y: geometry.y
                        });
                    }
                });
                var queryTask = new QueryTask(layer.url);
                if (idx === 0) {
                    var query = new Query();
                    query.returnGeometry = true;
                    query.outFields = ["*"];
                    query.geometry = multipoint;
                    def = queryTask.execute(query, lang.hitch(this,
                        this.queryCallback(chunks, idx + 1, layer, fields, syncDet)),
                        lang.hitch(this, this.queryErrorback(layer)
                        ));
                    //layer.mapLayer.setAutoGeneralize(false);
                    //def = layer.mapLayer.selectFeatures(query, FeatureLayer.MODE_ONDEMAND, lang.hitch(this, this.queryCallback(chunks, idx + 1, layer, fields, syncDet)), lang.hitch(this, this.queryErrorback(layer)));
                    syncDet.addDeferred(def, chunks[idx]);
                    this.featureLayer.redraw();
                } else {
                    return function (results) {
                        if (chunks.length > idx) {
                            var query = new Query();
                            query.returnGeometry = true;
                            query.outFields = ["*"];
                            query.geometry = multipoint;
                            def = queryTask.execute(query, lang.hitch(this,
                                this.queryCallback(chunks, idx + 1, layer, fields, syncDet)),
                                lang.hitch(this, this.queryErrorback(layer)
                                ));
                            //layer.mapLayer.setAutoGeneralize(false);
                            //def = layer.mapLayer.selectFeatures(query, FeatureLayer.MODE_ONDEMAND, lang.hitch(this, this.queryCallback(chunks, idx + 1, layer, fields, syncDet)), lang.hitch(this, this.queryErrorback(layer)));
                            syncDet.addDeferred(def, chunks[idx]);
                            this.featureLayer.redraw();
                        }
                        return {
                            'results': results
                        };
                    };
                }
            },
            queryErrorback: function (layer) {
                return lang.hitch(this, function (err) {
                    if (this.enrichResultsProg.hasOwnProperty(layer.id)) {
                        domClass.replace(this.enrichResultsProg[layer.id], 'error', 'complete');
                        domClass.replace(this.enrichResultsProg[layer.id], 'error', 'processing');
                    }
                    console.log(err);
                    return err;
                });
            },
            _deferredErrorCallback: function (args) {
                if (this.enrichResultsProg.hasOwnProperty(args.layerID)) {
                    domClass.replace(this.enrichResultsProg[args.layerID], 'error', 'complete');
                    domClass.replace(this.enrichResultsProg[args.layerID], 'error', 'processing');
                }
            },
            _syncComplete: function (args) {
                domClass.replace(this.enrichResultsProg[args.layerID], 'complete', 'processing');
                var stillProc = array.some(this.syncLayers, function (syncDet) {

                    return !syncDet.isComplete();
                }, this);
                if (stillProc) {
                    return;
                }
                this.featureLayer.redraw();
                //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                domClass.remove(this.downloadResultsBtn, "hide");
            },
            _requestComplete: function (args) {
                this.enrichResultsText[args.layerID].innerHTML = string.substitute(this.nls.results.recordsEnriched,
                    {
                        0: args.currentNumber,
                        1: args.totalRecords,
                        2: args.intesected,
                        3: args.name
                    });
                this.featureLayer.redraw();
            },

            _resetResults: function () {
                domClass.replace(this.resultsLoadingImage, 'processing', 'complete');
                domClass.replace(this.resultsPlottingImage, 'processing', 'complete');
                var key;
                var labelText = '';
                for (key in this.enrichResultsProg) {
                    if (this.enrichResultsProg.hasOwnProperty(key)) {
                        domClass.replace(this.enrichResultsProg[key], 'processing', 'error');
                        domClass.replace(this.enrichResultsProg[key], 'processing', 'complete');
                    }
                }
                var cb = lang.hitch(this, function (layer) {
                    if (layer.id === key) {
                        mapLay = layer;
                    }
                });
                for (key in this.enrichResultsProg) {
                    if (this.enrichResultsText.hasOwnProperty(key)) {
                        var mapLay;
                        array.forEach(this.config.enrichLayers, cb);
                        if (mapLay) {
                            labelText = mapLay.label;
                        }
                        this.enrichResultsText[key].innerHTML = string.substitute(this.nls.results.recordsEnriched,
                            {
                                0: 0,
                                1: 0,
                                2: 0,
                                3: labelText
                            });
                    }
                }
                this.resultsLoading.innerHTML = string.substitute(this.nls.results.csvLoaded, {
                    0: 0
                });
                this.enrichErrors.innerHTML = '';
                this.resultsPlotting.innerHTML = string.substitute(this.nls.results.recordsPlotted, {
                    0: 0,
                    1: 0
                });
            },
            downloadCSVResults: function () {
                // console.log(this.featureLayer);
                //CSVUtils.exportCSVFromFeatureLayer(this.nls.savingCSV, this.featureLayer, {fromClient:true});
                var ds = exportUtils.createDataSource({
                    type: exportUtils.TYPE_FEATURESET,
                    filename: this.nls.savingCSV,
                    data: utils.toFeatureSet(this.featureLayer.graphics)
                });

                ds.setFormat(exportUtils.FORMAT_CSV);
                ds.download();

            },
            clearCSVResults: function () {
                //基础图/要素图层
                if (this.layerLoaded && this.featureLayer) {
                    this.map.removeLayer(this.featureLayer);
                    //this.featureLayer = null;
                }
                if (this.dealwith_GP_GraphicsLayer_poylon) {
                    this.dealwith_GP_GraphicsLayer_poylon.clear();
                    this.dealwith_GP_GraphicsLayer_points.clear();
                }
                //小区图
                if(this.districtLayer) {
                    this.districtLayer.clear();
                }
                //kml图
                if(this.kmlLayer){
                    this.kmlLayer.clear();
                }
                //栅格图
                if (this.lookup_LocationGraphicsLayer) {
                    this.lookup_LocationGraphicsLayer.clear();
                }
                //聚合图
                if(this.clusterLayer){
                    this.map.removeLayer(this.clusterLayer);
                }
                this._resetResults();
                domClass.add(this.downloadResultsBtn, "hide");
                domClass.add(this.results, "hide");
                domStyle.set(this.enrichErrorsList, 'display', 'none');
                domClass.add(this.clearResultsBtn, 'jimu-state-disabled');
                //普通图
                if (document.getElementById("NormalRenderTable")) {
                    domConstruct.destroy("NormalRenderTable");
                }
                //热力图
                if (!domClass.contains(this.heatmapControl, "hide")) {
                    domClass.add(this.heatmapControl, "hide");
                }

                this.clearLocal();
            },
            destroy: function () {
                if (this.layerLoaded) {
                    this.map.removeLayer(this.featureLayer);
                }
                this.inherited(arguments);
            },
            //获取CSV表格中的分隔符
            _getSeparator: function (string) {
                var separators = [',', '      ', ';', '|'];
                var maxSeparatorLength = 0;
                var maxSeparatorValue = '';
                //利用separators来获取不同的定义格式  Lat,Long； Lat      Long；Lat;Long；Lat|Long
                array.forEach(separators, function (separator) {
                    var length = string.split(separator).length;
                    if (length > maxSeparatorLength) {
                        maxSeparatorLength = length;
                        maxSeparatorValue = separator;
                    }
                });
                return maxSeparatorValue;
            },

            //将点的坐标系定义为4326坐标系信息
            //将数据转化为要素集合
            _generateFeatureCollectionTemplateCSV: function (store, items) {
                var featColl = {
                    'layerDefinition': null,
                    'featureSet': {
                        'features': [],
                        'geometryType': 'esriGeometryPoint',
                        'spatialReference': {
                            'wkid': 4326
                        }
                    }
                };

                featColl.layerDefinition = {
                    'geometryType': 'esriGeometryPoint',
                    'objectIdField': '__OBJECTID',
                    'type': 'Feature Layer',
                    'typeIdField': '',
                    'fields': [{
                        'name': '__OBJECTID',
                        'alias': 'Row Number',
                        'type': 'esriFieldTypeOID',
                        'editable': false,
                        'domain': null
                    }],
                    'types': [],
                    'capabilities': 'Query'
                };
                //分别获取表格数据的行的信息
                this.csvFields = store.getAttributes(items[0]);
                //克隆csvFields信息
                this.combinedFields = lang.clone(this.csvFields);
                this.classification = [];
                for (var i in this.combinedFields) {
                    // if (this.config.latFields.indexOf(this.combinedFields[i]) != -1 || this.config.longFields.indexOf(this.combinedFields[i]) != -1) {
                    // }
                    // else {
                    //     this.classification.push(this.combinedFields[i]);
                    // }
                    this.classification.push(this.combinedFields[i]);
                }
                //加入"intersected"分割  信息
                this.combinedFields.push(this.config.intersectField);

                array.forEach(this.combinedFields, function (field) {
                    //该条数组信息下的获取相对于的Lat和Long经纬度坐标值和intersected
                    var value = store.getValue(items[0], field);
                    var parsedValue = Number(value);
                    if (isNaN(parsedValue) || field === this.config.intersectField) {
                        featColl.layerDefinition.fields.push({
                            'name': field,
                            'alias': field,
                            'type': 'esriFieldTypeString',
                            'editable': true,
                            'domain': null
                        });
                    } else {
                        featColl.layerDefinition.fields.push({
                            'name': field,
                            'alias': field,
                            'type': 'esriFieldTypeDouble',
                            'editable': true,
                            'domain': null
                        });
                    }
                }, this);
                featColl.layerDefinition.fields.push({
                    'name': 'Out',
                    'alias': 'GLProcessed',
                    'type': 'esriFieldTypeString',
                    'editable': false,
                    'visible': false,
                    'domain': null
                });
                this.combinedFields = this.combinedFields.concat(this.lookupLayersFieldNames);
                featColl.layerDefinition.fields = featColl.layerDefinition.fields.concat(this.lookupLayersFields);
                //featColl的属性：featureSet是进行点的空间性质的定义，包信含空间坐标系息；layerDefinition是将数据列数、CSV里的Lat和Long属性以及intersected和GLProcessed
                return featColl;
            },

            _generateDefaultPopupInfo: function (featureCollection) {
                var fields = featureCollection.layerDefinition.fields;
                var decimal = {
                    'esriFieldTypeDouble': 1,
                    'esriFieldTypeSingle': 1
                };
                var integer = {
                    'esriFieldTypeInteger': 1,
                    'esriFieldTypeSmallInteger': 1
                };
                var dt = {
                    'esriFieldTypeDate': 1
                };
                var displayField = null;
                var fieldInfos = array.map(fields, lang.hitch(this, function (item) {
                    if (item.name.toUpperCase() === 'NAME') {
                        displayField = item.name;
                    }
                    var visible = (item.type !== 'esriFieldTypeGlobalID' &&
                    item.type !== 'esriFieldTypeGeometry');
                    //var visible = (item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeGeometry');
                    if (item.alias === 'GLProcessed') {
                        visible = false;
                    }
                    var format = null;
                    if (visible) {
                        var f = item.name.toLowerCase();
                        var hideFieldsStr = ',stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,';
                        hideFieldsStr = hideFieldsStr + 'subclass,subclass_,rings_ok,rings_nok,';
                        if (hideFieldsStr.indexOf(',' + f + ',') > -1 || f.indexOf('_i') === f.length - 2) {
                            visible = false;
                        }
                        if (item.type in integer) {
                            format = {
                                places: 0,
                                digitSeparator: true
                            };
                        } else if (item.type in decimal) {
                            format = {
                                places: 4,
                                digitSeparator: true
                            };
                        } else if (item.type in dt) {
                            format = {
                                dateFormat: 'shortDateShortTime'
                            };
                        }
                    }
                    return lang.mixin({}, {
                        fieldName: item.name,
                        label: item.alias,
                        isEditable: false,
                        tooltip: '',
                        visible: visible,
                        format: format,
                        stringFieldOption: 'textbox'
                    });
                }));

                var popupInfo = {
                    title: displayField ? '{' + displayField + '}' : '',
                    fieldInfos: fieldInfos,
                    description: null,
                    showAttachments: false,
                    mediaInfos: []
                };
                return popupInfo;
            },

            _buildInfoTemplate: function (popupInfo) {
                var linestyle = 'border:none;border-top: 1px solid #333333;margin-top: 6px;margin-bottom: 6px;';
                var contentString = '<div style="font-weight:bold;">' + this.nls.results.label + '</div>';
                contentString += '<div style="' + linestyle + '"></div><table>';
                var json = {
                    content: contentString
                };

                array.forEach(popupInfo.fieldInfos, function (field) {
                    if (field.visible) {
                        json.content += '<tr><td valign="top" style="color:#888888;padding-right:5px;">';
                        json.content += field.label + ': <\/td>';
                        json.content += '<td valign="top" style="padding:2px;padding-bottom:5px;">${';
                        json.content += field.fieldName + '}<\/td><\/tr>';
                    }
                    //获取列表中用户想要设定热力图的标准
                    //if(this.config.indexOf(field.fileName)!=-1&&this.classification.indexOf(field.fieldName)==-1){
                    //  this.classification.push(field.fieldName);
                    //}
                    //if(this.config.indexOf(field.fileName)!=-1&&this.classification.indexOf(${field.fieldName})==-1){
                    //  this.classification.push(${field.fieldName});
                    //}
                });
                json.content += '<\/table>';
                return json;
            },
            _zoomToData: function (featureLayer) {
                var multipoint = new Multipoint(this.map.spatialReference);
                array.forEach(featureLayer.graphics, function (graphic) {
                    var geometry = graphic.geometry;
                    if (geometry.type!="point") {
                        geometry = graphic.geometry.getCentroid();
                    }
                    if (geometry) {
                        multipoint.addPoint({
                            x: geometry.x,
                            y: geometry.y
                        });
                    }
                });
                featureLayer.name = 'CSV Layer';
                this.layerLoaded = true;
                if (multipoint.points.length > 0) {
                    //this.map.setExtent(multipoint.getExtent().expand(1.05), true);
                    var multipointTotle = multipoint.getExtent().expand(1.05);
                    //公网时使用
                    // multipointTotle.xmax = this.lonlatMercator_X(multipointTotle.xmax);
                    // multipointTotle.xmin = this.lonlatMercator_X(multipointTotle.xmin);
                    // multipointTotle.ymax = this.lonlatMercator_Y(multipointTotle.ymax);
                    // multipointTotle.ymin = this.lonlatMercator_Y(multipointTotle.ymin);
                    this.map.setExtent(multipointTotle, true);
                    if (this.chkboxPlotOnly.checked) {
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                    }
                }
            },
            //经纬度转换为墨卡托
            lonlatMercator_X: function (X) {
                return X * 20037508.34 / 180;
            },
            lonlatMercator_Y: function (Y) {
                var y = Math.log(Math.tan((90 + Y) * Math.PI / 360)) / (Math.PI / 180);
                y = y * 20037508.34 / 180;
                return y;
            },
            //这个为坐标转换
            lonlat2mercator: function (lonlat) {
                var mercator = {x: 0, y: 0};
                var y = Math.log(Math.tan((90 + lonlat.y) * Math.PI / 360)) / (Math.PI / 180);
                y = y * 20037508.34 / 180;
                mercator.x = x;
                mercator.y = y;
                return mercator;
            },

            showErrorTable: function () {
                var errorDivStatus = domStyle.get(this.enrichErrorsList, 'display');
                if (errorDivStatus === 'none') {
                    var content = "";
                    array.forEach(this.errorList, lang.hitch(this, function (error) {
                        content = content + string.substitute(this.nls.results.recordsErrorList, {
                                0: error
                            }) + '<br>';
                    }));
                    this.enrichErrorsList.innerHTML = content;
                    domStyle.set(this.enrichErrorsList, 'display', 'block');
                } else {
                    domStyle.set(this.enrichErrorsList, 'display', 'none');
                }
            },
            //创建热力图
            create_HeatmapRenderer: function () {
                if (this.selectValue_select.value != "") {
                    var valueIsNumber = true;
                    valueIsNumber = !isNaN(this.featureLayer.graphics[1].attributes[this.selectValue_select.value]);
                    if (valueIsNumber) {
                        domClass.remove(this.clearHeatmapRenderer, 'jimu-state-disabled');

                        domClass.add(this.results, "hide");
                        domClass.remove(this.heatmapControl, "hide");

                        var blurCtrl = this.blur;
                        var maxCtrl = this.max;
                        var minCtrl = this.min;
                        var heatmapRenderer = new HeatmapRenderer({
                            field: this.selectValue_select.value,
                            colors: ["rgba(0,0,0,0)", "#0000FF", "#0000F6", "#0000F9", "#0000F5", "#0000F7", "#0000F8", "#0000F5", "#0000F6", "#0000F5", "#0000F6", "#0000F7", "#0000F5", "#0000F6", "#0000F5", "#0000F5", "#0000F6", "#0000F5", "#0000F6", "#0000F5", "#0000F5", "#0000F6", "#0000F4", "#0000F5", "#0000F6", "#0006F6", "#000CF6", "#0013F6", "#0019F6", "#0020F6", "#0026F6", "#002CF6", "#0033F6", "#0039F6", "#0040F6", "#0046F6", "#004CF6", "#0053F6", "#0059F6", "#0060F6", "#0066F6", "#006CF6", "#0073F6", "#0079F6", "#0080F6", "#0086F6", "#008CF6", "#0093F6", "#0099F6", "#01A0F6", "#00A3F5", "#00A6F5", "#00A9F4", "#00ACF4", "#00AFF4", "#00B2F3", "#00B5F3", "#00B8F2", "#00BBF2", "#00BEF2", "#00C1F1", "#00C4F1", "#00C7F0", "#00CAF0", "#00CDF0", "#00D0EF", "#00D3EF", "#00D6EE", "#00D9EE", "#00DCEE", "#00DFED", "#00E2ED", "#00E5EC", "#00E8EC", "#00ECEC", "#00ECE2", "#00EDD9", "#00EECF", "#00EFC6", "#00EFBC", "#00F0B3", "#00F1A9", "#00F2A0", "#00F297", "#00F38D", "#00F484", "#00F57A", "#00F571", "#00F667", "#00F75E", "#00F854", "#00F84B", "#00F942", "#00FA38", "#00FB2F", "#00FB25", "#00FC1C", "#00FD12", "#00FE09", "#00FF00", "#0AFF00", "#14FF00", "#1EFF00", "#28FF00", "#33FF00", "#3DFF00", "#47FF00", "#51FF00", "#5BFF00", "#66FF00", "#70FF00", "#7AFF00", "#84FF00", "#8EFF00", "#99FF00", "#A3FF00", "#ADFF00", "#B7FF00", "#C1FF00", "#CCFF00", "#D6FF00", "#E0FF00", "#EAFF00", "#F4FF00", "#FFFF00", "#FEFC00", "#FDF900", "#FCF700", "#FBF400", "#FAF200", "#F9EF00", "#F8ED00", "#F7EA00", "#F6E800", "#F5E500", "#F4E300", "#F3E000", "#F2DE00", "#F1DB00", "#F0D900", "#EFD600", "#EED400", "#EDD100", "#ECCF00", "#EBCC00", "#EACA00", "#E9C700", "#E8C500", "#E7C200", "#E7C000", "#E7BE00", "#E8BC00", "#E9BA00", "#EAB800", "#EBB600", "#ECB400", "#EDB200", "#EEB000", "#EFAE00", "#F0AC00", "#F1AA00", "#F2A800", "#F3A700", "#F4A500", "#F5A300", "#F6A100", "#F79F00", "#F89D00", "#F99B00", "#FA9900", "#FB9700", "#FC9500", "#FD9300", "#FE9100", "#FF9000", "#FF8A00", "#FF8400", "#FF7E00", "#FF7800", "#FF7300", "#FF6D00", "#FF6700", "#FF6100", "#FF5C00", "#FF5600", "#FF5000", "#FF4A00", "#FF4500", "#FF3F00", "#FF3900", "#FF3300", "#FF2E00", "#FF2800", "#FF2200", "#FF1C00", "#FF1700", "#FF1100", "#FF0B00", "#FF0500", "#FF0000"],
                            blurRadius: blurCtrl.value,
                            maxPixelIntensity: maxCtrl.value,
                            minPixelIntensity: minCtrl.value
                        });
                        this.featureLayer.setRenderer(heatmapRenderer);
                        /** Add event handlers for interactivity **/
                        var sliders = document.querySelectorAll(".blurInfo p~input[type=range]");
                        var addLiveValue = function (ctrl) {
                            var val = ctrl.previousElementSibling.querySelector("span");
                            ctrl.addEventListener("input", function (evt) {
                                val.innerHTML = evt.target.value;
                            });
                        };
                        for (var i = 0; i < sliders.length; i++) {
                            addLiveValue(sliders.item(i));
                        }
                        blurCtrl.addEventListener("change", lang.hitch(this, function (evt) {
                            var r = +evt.target.value;
                            if (r !== heatmapRenderer.blurRadius) {
                                heatmapRenderer.blurRadius = r;
                                this.featureLayer.redraw();
                            }
                        }));
                        maxCtrl.addEventListener("change", lang.hitch(this, function (evt) {
                            var r = +evt.target.value;
                            if (r !== heatmapRenderer.maxPixelIntensity) {
                                heatmapRenderer.maxPixelIntensity = r;
                                this.featureLayer.redraw();
                            }
                        }));
                        minCtrl.addEventListener("change", lang.hitch(this, function (evt) {
                            var r = +evt.target.value;
                            if (r !== heatmapRenderer.minPixelIntensity) {
                                heatmapRenderer.minPixelIntensity = r;
                                this.featureLayer.redraw();
                            }
                        }));

                    } else {
                        Message({
                            message: this.nls.error.listWarnAttributes
                        });
                    }
                }
            },

            setRenderer: function (array, filed) {
                var renderer = new UniqueValueRenderer(null, filed);
                for (var i = 0; i < array.length; i++) {
                    var a = new PictureMarkerSymbol(array[i].image, 18, 18);
                    renderer.addValue({
                        value: Number(array[i].value),
                        symbol: a,
                        label: array[i].value,
                        description: array[i].value
                    });
                }

                this.featureLayer.setRenderer(renderer);
                this.featureLayer.redraw();
                // console.log(renderer);
            },
            //获取表格里的渲染数据
            getRenderer: function () {
                var values = document.querySelectorAll("#NormalRenderTable  input[type=text]");
                var imgs = document.querySelectorAll("#NormalRenderTable  input[type=image]");
                var rArray = [];
                for (var i = 0; i < values.length; i++) {
                    rArray.push({value: values[i].value, image: imgs[i].src})
                }
                // console.log(rArray)
                return rArray;
            },
            //清除导入所创造的热力图
            clear_HeatmapRenderer: function () {
                if (domClass.contains(this.clearHeatmapRenderer, 'jimu-state-disabled')) {
                    return;
                }
                else {
                    //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                    domClass.add(this.clearHeatmapRenderer, 'jimu-state-disabled');
                    domClass.add(this.heatmapControl, "hide");
                    //this.clearResultsBtn.click;
                    if (this.layerLoaded) {
                        this.map.removeLayer(this.featureLayer);
                        //this.featureLayer = null;
                    }
                }
            },
            setHeatMapColor: function (evt) {
                // console.log(evt);
                console.log(this.color);
                var type = evt.target.className;
                var color = this.config[type];
                domClass.remove(this.color, this.color.className);
                domClass.add(this.color, type);
                this.featureLayer.renderer.setColors(color);
                this.featureLayer.redraw();
            },
            clearLocal: function () {
                if (domClass.contains(this.clearHeatmapRenderer, 'jimu-state-disabled')) {
                    return;
                }
                //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                domClass.add(this.clearHeatmapRenderer, 'jimu-state-disabled');
                this.watchOut.style.display = "none";
                this.warnOut.style.display = "none";

                this.heatmapControl.style.display = "none";
                if (document.getElementById("templatePickerDiv").children.length > 0) {
                    document.getElementById("templatePickerDiv").removeChild(document.getElementById("templatePickerDiv").children[0]);
                }
                this.clearResultsBtn.click();
            },
            changeSelectValue: function (evt) {
                if(!this.baseed_GridMap.checked) {
                    var valueIsNumber = true;
                    valueIsNumber = isNaN(this.xlsxData[0][evt.target.value]);
                    //隐藏消息
                    if (valueIsNumber) {
                        this.watchOut.style.display = "block";
                    } else {
                        this.watchOut.style.display = "none";
                    }
                }else{
                    this.watchOut.style.display = "none";
                }
            },
            //渲染小区数据
            rendererDis: function (data) {
                if (this.layerLoaded) {
                    this.map.removeLayer(this.featureLayer);
                    //this.featureLayer = null;
                }
                var features = data.features;
                var pntSymJson;
                var sym = symbolJsonUtils.fromJson(this.symJson);
                var gArray = [];
                // var infor = new InfoTemplate("属性", "CI:${CI}");
                var infor = new InfoTemplate();
                for (var i = 0; i < features.length; i++) {
                    features[i].symbol = sym;
                    features[i].infoTemplate = infor;
                    gArray.push(features[i]);
                    this.districtLayer.add(features[i]);
                }

                var myExtent = graphicsUtils.graphicsExtent(features);
                this.map.setExtent(myExtent);
                // console.log(this.map);
            },
            //缩放
            _zoomToDis: function (url, sql) {


            },
            //生成列表，绑定列表图标事件，
            uniquedRenderer: function (list, value) {
                domClass.add(this.results, "hide");
                var table = this.createNormalRenderTable(list);
                var tableDom = domConstruct.toDom(table);
                if (document.getElementById("templatePickerDiv").children.length > 0) {
                    document.getElementById("templatePickerDiv").removeChild(document.getElementById("templatePickerDiv").children[0]);
                }
                document.getElementById("templatePickerDiv").appendChild(tableDom);
                var ob = document.querySelectorAll("#NormalRenderTable  input[type=image]");
                ob.forEach(lang.hitch(this, lang.hitch(this, function (elem) {
                    elem.addEventListener("click", lang.hitch(this, function (e) {
                        this.clickInput(e)
                    }));
                })));
                var ra = this.getRenderer();
                this.setRenderer(ra, value);
            },
            //生成唯一值表格
            createNormalRenderTable: function (list) {
                var listArray = Array.from(list);
                var contentString = '<table  id="NormalRenderTable" >';
                contentString += '<tr><th>唯一值</th><th>图标</th></tr>';
                for (var i = 0; i < listArray.length; i++) {
                    contentString += '<tr><td valign="top" >';
                    contentString += '<input type="text" readonly="readonly"  value="' + listArray[i] + '"> <\/td>';
                    contentString += '<td valign="top" ">';
                    contentString += '<input type="image"  src="./widgets/DataLookup/images/' + (627024 + i) + '.png" style="width:18px;height:18px;"/> ' + '<\/td><\/tr>';
                }
                contentString += '<\/table>';
                return contentString;
            },
            //点击图标，生成选择框
            clickInput: function (e) {
                //在body里点击触发事件
                this.popup && domConstruct.destroy(this.popup);
                var res = domConstruct.create("div", {id: "tempPopupId"}, win.body(), "last");
                this.popup = res;
                var target = e.target;
                var style = {
                    "background-color": "#fff",
                    "top": e.clientY - 2 + "px",
                    "left": e.clientX + 2 + "px",
                    "width": "300px",
                    "height": "200px",
                    "z-index": "888",
                    "position": "absolute",
                    "word-wrap": "break-word"
                };
                domStyle.set(res, style);
                domConstruct.place("<div id='PickerDiv'>", res);
                this.createPiker("PickerDiv", target, "tempPopupId");
            },
            onClose: function () {
                if (!domClass.contains(this.clearHeatmapRenderer, 'jimu-state-disabled')) {
                    this.clearLocal();
                }
            },
            choose_Import_Type: function (evt) {
                this.choose_Import_Type_value = $(evt.currentTarget)[0].id;
                var example = "DataLookup/data/";
                switch (this.choose_Import_Type_value) {
                    case "baseed_FeatureMap":
                        this.clearLocal();
                        html.byId("feature_type").style.display = "block";
                        html.byId("plot_type").style.display = "none";
                        html.byId("grid_list").style.display = "none";
                        this.normal_feature.click();
                        html.byId("selectValue_value").style.display = "block";
                        //下面的细化处理禁止
                        //html.byId("value_list").style.display = "block";
                        //html.byId("list_list").style.display = "none";
                        //html.byId("add_mark_label").style.display = "block";
                        //html.byId("export_or_not").style.display = "none";
                        //html.byId("count_value").style.display = "none";
                        example += "点信息导入模板.xls";
                        break;
                    case"baseed_PlotMap":
                        this.clearLocal();
                        html.byId("feature_type").style.display = "none";
                        html.byId("plot_type").style.display = "block";
                        html.byId("grid_list").style.display = "none";
                        this.normal_feature.click();
                        this.baseed_GSM_Map.click();
                        this.sector_pic.click();
                        html.byId("selectValue_value").style.display = "block";
                        //下面的细化处理禁止
                        //html.byId("value_list").style.display = "block";
                        //html.byId("list_list").style.display = "none";
                        //html.byId("add_mark_label").style.display = "none";
                        //html.byId("export_or_not").style.display = "none";
                        //html.byId("count_value").style.display = "none";
                        example += "小区导入模板.xls";
                        break;
                    case"baseed_GridMap":
                        this.clearLocal();
                        html.byId("feature_type").style.display = "none";
                        html.byId("plot_type").style.display = "none";
                        html.byId("grid_list").style.display = "block";

                        html.byId("selectValue_value").style.display = "block";
                        //下面的细化处理禁止
                        //html.byId("value_list").style.display = "none";
                        //html.byId("list_list").style.display = "none";
                        //html.byId("add_mark_label").style.display = "block";
                        //html.byId("export_or_not").style.display = "none";
                        //html.byId("count_value").style.display = "none";
                        example += "栅格导入模板.xls";
                        break;
                    case "baseed_KmlMap":
                        this.clearLocal();
                        html.byId("feature_type").style.display = "none";
                        html.byId("plot_type").style.display = "none";
                        html.byId("grid_list").style.display = "none";

                        html.byId("selectValue_value").style.display = "none";
                        //下面的细化处理禁止
                        //html.byId("value_list").style.display = "none";
                        //html.byId("list_list").style.display = "none";
                        //html.byId("add_mark_label").style.display = "block";
                        //html.byId("export_or_not").style.display = "none";
                        //html.byId("count_value").style.display = "none";
                        example += "test.kml";
                        break;
                }
                $("#data_sample")[0].href = $("#data_sample")[0].href.split("DataLookup")[0] + example;
            },
            choose_feature_click: function (evt) {
                var example = "DataLookup/data/";
                switch ($(evt.currentTarget)[0].id) {
                    case "normal_feature":
                        this.heatmapControl.style.display = "none";
                        this.normal_value.click();
                        html.byId("selectValue_value").style.display = "block";
                        //下面的细化处理禁止
                        //html.byId("value_list").style.display = "block";
                        //html.byId("list_list").style.display = "none";
                        //html.byId("add_mark_label").style.display = "block";
                        //html.byId("export_or_not").style.display = "none";
                        //html.byId("count_value").style.display = "none";
                        example += "点信息导入模板.xls";
                        break;
                    case "together_feature":
                        this.heatmapControl.style.display = "none";
                        this.normal_value.click();
                        html.byId("selectValue_value").style.display = "none";
                        //下面的细化处理禁止
                        //html.byId("value_list").style.display = "none";
                        //html.byId("list_list").style.display = "none";
                        //html.byId("add_mark_label").style.display = "block";
                        //html.byId("export_or_not").style.display = "none";
                        //html.byId("count_value").style.display = "none";
                        example += "点信息导入模板.xls";
                        break;
                    case "heat_feature":
                        this.heatmapControl.style.display = "block";
                        if (document.getElementById("templatePickerDiv").children.length > 0) {
                            document.getElementById("templatePickerDiv").removeChild(document.getElementById("templatePickerDiv").children[0]);
                        }
                        html.byId("selectValue_value").style.display = "block";
                        //下面的细化处理禁止
                        //html.byId("value_list").style.display = "none";
                        //html.byId("list_list").style.display = "none";
                        //html.byId("add_mark_label").style.display = "none";
                        //html.byId("export_or_not").style.display = "none";
                        //html.byId("count_value").style.display = "none";
                        example += "网格热力图导入模板.xls";
                        break;
                    case "grid_feature":
                        this.heatmapControl.style.display = "none";
                        html.byId("selectValue_value").style.display = "block";
                        //下面的细化处理禁止
                        //html.byId("value_list").style.display = "none";
                        //html.byId("list_list").style.display = "none";
                        //html.byId("add_mark_label").style.display = "none";
                        //html.byId("export_or_not").style.display = "block";
                        //html.byId("count_value").style.display = "block";
                        example += "网格热力图导入模板.xls";
                        break;
                }
                $("#data_sample")[0].href = $("#data_sample")[0].href.split("DataLookup")[0] + example;
            },
            choose_value_list: function (evt) {
                switch ($(evt.currentTarget)[0].id) {
                    case "normal_value":
                        html.byId("list_list").style.display = "none";
                        break;
                    case "list_value":
                        html.byId("list_list").style.display = "none";
                        break;
                    case "muilt_value":
                        html.byId("list_list").style.display = "block";
                        break;
                }
            },
            writeSelectionValues: function () {
                switch (this.choose_Import_Type_value) {
                    case "baseed_FeatureMap":
                        for (var i = 0; i < this.fileAttributes.length; i++) {
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.LonValue);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.LatValue);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.TitleValue);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.selectValue_select);
                        }
                        this.LonValue.value = this.arrayIncloudvalue("LON");
                        this.LatValue.value = this.arrayIncloudvalue("LAT");
                        this.TitleValue.value = this.arrayIncloudvalue("Title");
                        this.selectValue_select.value = this.arrayIncloudvalue("Value");
                        break;
                    case"baseed_PlotMap":
                        for (var i = 0; i < this.fileAttributes.length; i++) {
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.CI_Value);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.CITY_Value);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.TITLE_Value);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.LonValue);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.LatValue);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.TitleValue);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.selectValue_select);
                        }
                        this.CI_Value.value = this.arrayIncloudvalue("CI");
                        this.CITY_Value.value = this.arrayIncloudvalue("City");
                        this.TITLE_Value.value = this.arrayIncloudvalue("Title");
                        this.LonValue.value = this.arrayIncloudvalue("LON");
                        this.LatValue.value = this.arrayIncloudvalue("LAT");
                        this.TitleValue.value = this.arrayIncloudvalue("Title");
                        this.selectValue_select.value = this.arrayIncloudvalue("Value");
                        break;
                    case"baseed_GridMap":
                        for (var i = 0; i < this.fileAttributes.length; i++) {
                            html.create('option', {'value': this.fileAttributes[i],'innerHTML': this.fileAttributes[i]}, this.MGRS_Value);
                            html.create('option', {'value': this.fileAttributes[i],'innerHTML': this.fileAttributes[i]}, this.grid_LonValue);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.grid_LatValue);
                            html.create('option', {'value': this.fileAttributes[i], 'innerHTML': this.fileAttributes[i]}, this.selectValue_select);
                        }
                        this.MGRS_Value.value = this.arrayIncloudvalue("MGRS");
                        this.grid_LonValue.value = this.arrayIncloudvalue("LON");
                        this.grid_LatValue.value = this.arrayIncloudvalue("LAT");
                        this.selectValue_select.value = this.arrayIncloudvalue("Value");
                        break;
                }
            },
            //删除下拉框
            deleteSelectionValues: function () {
                switch (this.choose_Import_Type_value) {
                    case "baseed_FeatureMap":
                        while (this.LonValue.firstChild) {
                            this.LonValue.removeChild(this.LonValue.firstChild);
                            this.LatValue.removeChild(this.LatValue.firstChild);
                            this.TitleValue.removeChild(this.TitleValue.firstChild);
                            if (this.selectValue_select.firstChild) {
                                this.selectValue_select.removeChild(this.selectValue_select.firstChild);
                            }
                        }
                        break;
                    case"baseed_PlotMap":
                        while (this.LonValue.firstChild) {
                            this.LonValue.removeChild(this.LonValue.firstChild);
                            this.LatValue.removeChild(this.LatValue.firstChild);
                            this.TitleValue.removeChild(this.TitleValue.firstChild);
                            if (this.selectValue_select.firstChild) {
                                this.selectValue_select.removeChild(this.selectValue_select.firstChild);
                            }
                        }
                        while (this.CI_Value.firstChild) {
                            this.CI_Value.removeChild(this.CI_Value.firstChild);
                            this.CITY_Value.removeChild(this.CITY_Value.firstChild);
                            if (this.TITLE_Value.firstChild) {
                                this.TITLE_Value.removeChild(this.TITLE_Value.firstChild);
                            }
                        }
                        break;
                    case"baseed_GridMap":
                        while (this.selectValue_select.firstChild) {
                            this.selectValue_select.removeChild(this.selectValue_select.firstChild);
                        }
                        while (this.MGRS_Value.firstChild) {
                            this.MGRS_Value.removeChild(this.MGRS_Value.firstChild);
                            this.grid_LonValue.removeChild(this.grid_LonValue.firstChild);
                            this.grid_LatValue.removeChild(this.grid_LatValue.firstChild);
                        }
                        break;
                }
            },
            //混淆匹配,根据传递过来的值进行属性的匹配
            arrayIncloudvalue: function (attribute) {
                //所含属性都在这个里面
                this.fileAttributes;
                return attribute;
            },
            //点击后创建图层
            create_MapRenderer: function () {                
                if (!this.baseed_KmlMap.checked) {
                    this.clearHeatmapRenderer.click();
                    this._csvReadComplete();
                }                
                //要素类
                if (this.baseed_FeatureMap.checked) {
                    if (this.normal_feature.checked) {
                        this._base_SelectChange_Value();
                        //添加显示图层
                        this.map.addLayer(this.featureLayer);
                    }
                    if(this.together_feature.checked){
                        if(this.clusterLayer){
                            this.map.removeLayer(this.clusterLayer);
                        }
                        this.create_together_layer();
                    }
                    if (this.heat_feature.checked) {
                        this.heatmapControl.style.display = "block";
                        this.create_HeatmapRenderer();
                        //添加显示图层
                        this.map.addLayer(this.featureLayer);
                    }
                    if (this.grid_feature.checked) {
                        this.dealwith_GP_GraphicsLayer_poylon.clear();
                        this.dealwith_GP_GraphicsLayer_points.clear();
                        this.create_grid_layer();
                    }
                    //导入图层全局
                    if (this.mapType == "heat_feature" || this.mapType == "normal_feature"|| this.mapType == "together_feature") {
                        this._zoomToData(this.featureLayer);
                    }
                }
                //小区类
                else if (this.baseed_PlotMap.checked) {
                    var list_ci,list_city,size,listArray_ci,listArray_city,sql;
                    /**
                     * summery:::::::warn out
                     * */
                    //this.allCSVInfomation为全部的值，只有这里使用
                    list_ci = this.allCSVInfomation[this.CI_Value.value];
                    list_city = this.allCSVInfomation[this.CITY_Value.value];
                    size = list_ci.length;
                    var sql_value=[];
                    for (var i = 0; i < list_ci.length; i++) {
                        sql_value.push(list_city[i] + "_" + list_ci[i]);
                    }
                    sql = this.cifiled+ " in ('" + sql_value.join("','") + "')";
                    //如果要是LTE小区的话查询条件将发生改变
                    if (this.baseed_LTE_Map.checked) {
                        list_ci = this.allCSVInfomation[this.CI_Value.value];
                        size = list_ci.length;
                        listArray_ci = Array.from(list_ci);
                        sql = this.cifiled + " in ('" + listArray_ci.join("','") + "')";
                    }
                    this._plot_SelectChange_Value(sql);
                }
                //kml
                else if (this.baseed_KmlMap.checked) {
                    array.forEach(this.kmlFeatures, lang.hitch(this, function (graphic) {
                        var addGra = new Graphic(graphic);
                        var graInfoTemplate = new InfoTemplate(addGra.attributes.name, "名称：" + addGra.attributes.name);
                        addGra.setInfoTemplate(graInfoTemplate);
                        if (addGra.geometry.type == "point") {
                            this.kmlLayer.add(addGra.setSymbol(common.getPointSymbol));
                        } else if (addGra.geometry.type == "polyline") {
                            this.kmlLayer.add(addGra.setSymbol(common.getLineSymbol(2)));
                        }else{
                            this.kmlLayer.add(addGra.setSymbol(common.getFillSymbol(2)));
                        }
                        
                    }));

                    domClass.remove(this.clearHeatmapRenderer, 'jimu-state-disabled');
                    this._zoomToData(this.kmlLayer);
                }
                //栅格类
                else{
                    this.lookup_LocationGraphicsLayer.clear();
                    //检验值列前缀是否为军事栅格
                    var prefix;
                    var isAllRight = true;
                    if (!this.classiObeject[this.MGRS_Value.value]) {
                        this.classiObeject[this.MGRS_Value.value] = new Set();
                    }
                    if (Array.from(this.classiObeject[this.MGRS_Value.value]).length <= 0) {
                        for (var i = 0; i < Array.from(this.classiObeject[this.grid_LonValue.value]).length; i++) {
                            this.classiObeject[this.MGRS_Value.value].add(MGRS.LLtoMGRS(
                                Array.from(this.classiObeject[this.grid_LatValue.value])[i],
                                Array.from(this.classiObeject[this.grid_LonValue.value])[i],
                                4));
                        }
                    }
                    for (var i = 0; i < Array.from(this.classiObeject[this.MGRS_Value.value]).length; i++) {
                        if (typeof Array.from(this.classiObeject[this.MGRS_Value.value])[i] == 'string') {
                            if (Array.from(this.classiObeject[this.MGRS_Value.value])[i].match(/^[ABYZ]/)) {
                                prefix = Array.from(this.classiObeject[this.MGRS_Value.value])[i].match(/[ABYZ]/)[0].trim();
                            } else if (Array.from(this.classiObeject[this.MGRS_Value.value])[i].match(/\d{1,2}[C-HJ-NP-X]/)) {
                                prefix = Array.from(this.classiObeject[this.MGRS_Value.value])[i].match(/\d{1,2}[C-HJ-NP-X]/)[0].trim();
                            }
                        }
                        if(!prefix){
                            isAllRight = false;
                        }
                        prefix="";
                    }
                    if(isAllRight) {
                        this.deal_With_MGRS_Value(Array.from(this.classiObeject[this.MGRS_Value.value]));
                    }else {
                        common.popupMessage("值列存在非法命名，请检查是否为MGRS值","注意")
                    }
                    this._zoomToData(this.featureLayer);
                }
            },
            //要素类图层渲染及处理
            _base_SelectChange_Value: function () {
                //普通图生成渲染判断
                if (this.selectValue_select.value) {
                    var list = this.classiObeject[this.selectValue_select.value];
                    var size = list.size;
                    if (size > 1 && size <= 20 && this.mapType == "normal_feature") {
                        this.uniquedRenderer(list, this.selectValue_select.value);
                    } else if (this.mapType == "normal_feature" && (size <= 20 || size < 0)) {
                        console.log("唯一值过或者过少");
                    }
                }
            },
            //小区图层渲染及处理
            _plot_SelectChange_Value: function (sql) {
                // console.log(sql);
                if (this.map.getLayer("dis")) {
                    this.districtLayer.clear();
                }
                var queryTask = new QueryTask(this.url);
                var query = new Query();
                query.where = sql;
                // query.outSpatialReference = {wkid:3857}//this.map.spatialReference;
                query.returnGeometry = true;
                // query.outFields = ["CI"];
                query.outFields = ["*"];
                queryTask.execute(query, lang.hitch(this, function (result) {
                    if(result.features.length>0) {
                        this.rendererDis(result);
                    }else {
                        common.popupMessage("无法添加数据，请确定小区类型选择是否正确！","注意");
                    }
                }));
                //隐藏消息
                if (this.selectValue_select.value && this.mapType == 'baseed_PlotMap') {
                    this.results.style.display = "none";
                }
            },
            //处理栅格数据，需要注意的是，这里面的栅格是需要多次循环处理的，所以要重新用到this.classiObeject，为一个数组
            deal_With_MGRS_Value:function (arrayValue) {
                //循环处理存储信息
                for (var i = 0; i < arrayValue.length; i++) {
                    this.lookup_CorrectMGRS_Value(arrayValue[i]);
                }
                // this.lookup_CorrectMGRS_Value(arrayValue[0]);
            },
            lookup_CorrectMGRS_Value:function (MGRS_value) {
                var usngp = MGRS.parseUSNG_str(MGRS_value);
                var angle_MGRSArray = [];
                this.lookup_angleArray = [];
                this.lookup_drawArray = [];
                angle_MGRSArray.push(usngp);
                var east1 = String(parseInt(usngp.east) + 5);
                var north1 = String(parseInt(usngp.north) + 5);

                if (east1.length < 5 && north1.length < 5) {
                    while (true) {
                        if (east1.length < 4) {
                            east1 = "0" + east1;
                        } else {
                            break;
                        }
                    };
                    var east = [east1, east1, usngp.east];                    
                    while (true) {
                        if (north1.length < 4) {
                            north1 = "0" + north1;
                        } else {
                            break;
                        }
                    };
                    var north = [usngp.north, north1, north1];
                    for (var i = 0; i < east.length; i++) {
                        angle_MGRSArray.push({
                            east: east[i],
                            ltr: usngp.ltr,
                            north: north[i],
                            precision: usngp.precision,
                            sq1: usngp.sq1,
                            sq2: usngp.sq2,
                            zone: usngp.zone
                        });
                    }
                } else {
                    while (true) {
                        if (east1.length < 4) {
                            east1 = "0" + east1;
                        } else {
                            break;
                        }
                    };
                    while (true) {
                        if (north1.length < 4) {
                            north1 = "0" + north1;
                        } else {
                            break;
                        }
                    };
                    if (east1.length > 4 && north1.length==4) {
                        east1 = east1.substring(1, 5);
                        var sqnow = this.MGRS_50_CONFIG[usngp.sq1 +","+ usngp.sq2];
                        var sqindex = sqnow + 10
                        var sqnew = this.MGRS_50_CONFIG[sqindex].split(",");
                        angle_MGRSArray.push({
                            east: east1,
                            ltr: usngp.ltr,
                            north: usngp.north,
                            precision: usngp.precision,
                            sq1: sqnew[0],
                            sq2: sqnew[1],
                            zone: usngp.zone
                        });
                        angle_MGRSArray.push({
                            east: east1,
                            ltr: usngp.ltr,
                            north: north1,
                            precision: usngp.precision,
                            sq1: sqnew[0],
                            sq2: sqnew[1],
                            zone: usngp.zone
                        });
                        angle_MGRSArray.push({
                            east: usngp.east,
                            ltr: usngp.ltr,
                            north: north1,
                            precision: usngp.precision,
                            sq1: usngp.sq1,
                            sq2: usngp.sq2,
                            zone: usngp.zone
                        });

                    } else if (east1.length == 4 && north1.length > 4) {
                        north1 = north1.substring(1, 5);
                        var sqnow = this.MGRS_50_CONFIG[usngp.sq1 + "," + usngp.sq2];
                        var sqindex = sqnow + 1
                        var sqnew = this.MGRS_50_CONFIG[sqindex].split(",");
                        angle_MGRSArray.push({
                            east: east1,
                            ltr: usngp.ltr,
                            north: usngp.north,
                            precision: usngp.precision,
                            sq1: usngp.sq1,
                            sq2: usngp.sq2,
                            zone: usngp.zone
                        });
                        angle_MGRSArray.push({
                            east: east1,
                            ltr: usngp.ltr,
                            north: north1,
                            precision: usngp.precision,
                            sq1: sqnew[0],
                            sq2: sqnew[1],
                            zone: usngp.zone
                        });
                        angle_MGRSArray.push({
                            east: usngp.east,
                            ltr: usngp.ltr,
                            north: north1,
                            precision: usngp.precision,
                            sq1: sqnew[0],
                            sq2: sqnew[1],
                            zone: usngp.zone
                        });

                    } else if (east1.length > 4 && north1.length > 4) {
                        east1 = east1.substring(1, 5);
                        north1 = north1.substring(1, 5);
                        var sqnow = this.MGRS_50_CONFIG[usngp.sq1 + "," + usngp.sq2];

                        var sqindex1 = sqnow + 10
                        var sqnew1 = this.MGRS_50_CONFIG[sqindex1].split(",");

                        var sqindex2 = sqnow + 1
                        var sqnew2 = this.MGRS_50_CONFIG[sqindex2].split(",");

                        var sqindex3 = sqnow + 11
                        var sqnew3 = this.MGRS_50_CONFIG[sqindex3].split(",");
                        angle_MGRSArray.push({
                            east: east1,
                            ltr: usngp.ltr,
                            north: usngp.north,
                            precision: usngp.precision,
                            sq1: sqnew1[0],
                            sq2: sqnew1[1],
                            zone: usngp.zone
                        });
                        angle_MGRSArray.push({
                            east: east1,
                            ltr: usngp.ltr,
                            north: north1,
                            precision: usngp.precision,
                            sq1: sqnew3[0],
                            sq2: sqnew3[1],
                            zone: usngp.zone
                        });
                        angle_MGRSArray.push({
                            east: usngp.east,
                            ltr: usngp.ltr,
                            north: north1,
                            precision: usngp.precision,
                            sq1: sqnew2[0],
                            sq2: sqnew2[1],
                            zone: usngp.zone
                        });
                    }
                }
                for (var i = 0; i < angle_MGRSArray.length; i++) {
                    this.lookup_angleArray.push(this.lookup_USING_LL(angle_MGRSArray[i]));
                }
                for (var i = 0; i < this.lookup_angleArray.length; i++) {
                    this.lookup_drawArray.push([this.lookup_angleArray[i][1], this.lookup_angleArray[i][0]])
                }
                this.lookup_drawAndCenterMap(MGRS_value);
            },
            lookup_drawAndCenterMap: function (MGRS_value) {
                var polygonJson = {
                    "rings": [[this.lookup_drawArray[0], this.lookup_drawArray[1], this.lookup_drawArray[2], this.lookup_drawArray[3],
                        this.lookup_drawArray[0]]], "spatialReference": {"wkid": 4326}
                };
                var polygon = new Polygon(polygonJson);
                var symbol = common.getFillSymbol(2);
                var graphics = new Graphic(polygon, symbol);
                this.lookup_LocationGraphicsLayer.add(graphics);
            },
            lookup_USING_LL: function (usngp) {
                var coords = MGRS.USNGtoUTM(usngp.zone, usngp.ltr, usngp.sq1, usngp.sq2, usngp.east, usngp.north);
                // southern hemisphere case
                if (usngp.ltr < 'N') {
                    coords.N -= 10000000.0;
                }
                coords = MGRS.UTMtoLL(coords.N, coords.E, usngp.zone);
                return [coords.lat, coords.lon];
            },
            depend_cifiled_url: function (evt) {
                //this.cinfig.query_value为数据唯一值查询条件
                this.cifiled = this.config.query_value[$(evt.currentTarget)[0].id.split("_")[1]];
                this.url = this.config.polt_url[$(evt.currentTarget)[0].id.split("_")[1]];
                var curip = window.location.host;
                if (curip.indexOf("10.53.160.88") > -1) {
                    this.url = this.url.replace(new RegExp("10.48.186.92/", 'g'), "10.53.160.88:8999/");
                } else if (curip.indexOf("10.53.160.65") > -1) {
                    this.url = this.url.replace(new RegExp("10.48.186.92/", 'g'), "10.53.160.65/jzyh_online/");
                } else if (curip.indexOf("10.46.0.1") > -1) {
                    this.url = this.url.replace(new RegExp("10.48.186.92/", 'g'), "10.46.0.1/jzyh_online/");
                } else if (curip.indexOf("10.46.0.2") > -1) {
                    this.url = this.url.replace(new RegExp("10.48.186.92/", 'g'), "10.46.0.2/jzyh_online/");
                }
                switch($(evt.currentTarget)[0].id.split("_")[1]){
                    case "GSM":
                        this.symJson = {
                            "type": "esriSFS",
                            "style": "esriSFSSolid",
                            "color": [0, 230, 169, 255] ,
                            "outline": {
                                "type": "esriSLS",
                                "style": "esriSLSSolid",
                                "color": [0, 168, 132, 255],
                                "width": 0
                            }
                        };
                        break;
                    case "TD":
                        this.symJson = {
                            "type": "esriSFS",
                            "style": "esriSFSSolid",
                            "color": [0, 92, 230, 255],
                            "outline": {
                                "type": "esriSLS",
                                "style": "esriSLSSolid",
                                "color": [0, 132, 168, 255],
                                "width": 0
                            }
                        };
                        break;
                    case "LTE":
                        this.symJson = {
                            "type": "esriSFS",
                            "style": "esriSFSSolid",
                            "color": [255, 0, 197, 255],
                            "outline": {
                                "type": "esriSLS",
                                "style": "esriSLSSolid",
                                "color": [168, 0, 132, 255],
                                "width": 0
                            }
                        };
                        break;
                }
            },
            //创建聚合图层
            create_together_layer:function () {
                var clusterInfo = [];
                var infoTemplate = new InfoTemplate(this.config.infoTemplates[0].title, this.config.infoTemplates[0].content);
                for (var i in this.featureLayer.graphics) {
                    clusterInfo.push({
                        attributes: this.featureLayer.graphics[i].attributes,
                        x: this.featureLayer.graphics[i].geometry.x,
                        y: this.featureLayer.graphics[i].geometry.y
                    });
                }
                //ClusterLayer为聚合图层的基础类
                this.clusterLayer = new ClusterLayer({
                    "data": clusterInfo,
                    "distance": 100,
                    "id": "clusters",
                    "labelColor": "#fff",
                    "labelOffset": 10,
                    "resolution": this.map.extent.getWidth() / this.map.width,
                    "singleColor": "#888",
                    "singleTemplate": infoTemplate
                });
                var defaultSym = new SimpleMarkerSymbol().setSize(4);
                var renderer = new ClassBreaksRenderer(defaultSym, "clusterCount");

                // var picBaseUrl = "http://localhost:63342/TopGIS/widgets/DataLookup/images/";
                var picBaseUrl = window.location.href.split("TopGIS")[0] + "TopGIS/widgets/DataLookup/images/";
                var blue = new PictureMarkerSymbol(picBaseUrl + "BluePin1LargeB.png", 32, 32).setOffset(0, 15);
                var green = new PictureMarkerSymbol(picBaseUrl + "GreenPin1LargeB.png", 64, 64).setOffset(0, 15);
                var red = new PictureMarkerSymbol(picBaseUrl + "RedPin1LargeB.png", 72, 72).setOffset(0, 15);
                renderer.addBreak(0, 2, blue);
                renderer.addBreak(2, 200, green);
                renderer.addBreak(200, 1001, red);

                this.clusterLayer.setRenderer(renderer);
                this.map.addLayer(this.clusterLayer);
            },
            //创建网格图层
            create_grid_layer: function () {

                var valueIsNumber = isNaN(this.xlsxData[0][this.selectValue_select.value]);
                if (valueIsNumber) {
                    common.popupMessage("请检查值列数值是否为数值类型！", "注意");
                    return;
                }
                var url = "../proxy_to_92/NEW_ARCGIS/arcgis/rest/services/GPServices/FeatureSet2Excel/GPServer/FeatureSet2Excel";
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
                var GP_Server = new Geoprocessor(url)
                GP_Server.setOutputSpatialReference({ wkid: 4326 });
                this.fsset = [];
                var graphics = this.featureLayer.graphics;
                var graphic_GP = [];
                var boolean = true;
                var selectValue = this.selectValue_select.value;
                for (var i in graphics) {
                    //强制更换selectValue_select值到p_VALUE里面
                    graphics[i].attributes["P_VALUE"] = graphics[i].attributes[selectValue];

                    graphic_GP.push(new Graphic(graphics[i].geometry, graphics[i].symbol, graphics[i].attributes));
                }
                var gpOptType = "COUNT";
                if (this.taisen_pic.checked) {
                    gpOptType = "SUM";
                }
                var featureSet = new FeatureSet();
                featureSet.features = graphic_GP;
                var params = { "InputFeatures": featureSet, "FieldName": "P_VALUE", "Type": gpOptType };
                GP_Server.execute(params, lang.hitch(this, function (results) {
                    if (results.length > 0) {
                        var paramValue = results[0];
                        //var paramValue1 = results[1];
                        this.fsset.push(paramValue.value);
                        this.deal_with_GP_Layer();
                    }
                }));
            },
            deal_with_GP_Layer:function () {
                var grapgics=[];
                var font = new Font("20px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLD, "宋体");
                var _200=this.color_To_RGB("0xff0000");
                var _100=this.color_To_RGB("0xF08080");
                var _50=this.color_To_RGB("0xEE9572");
                var _20=this.color_To_RGB("0xEEB4B4");
                var _10=this.color_To_RGB("0xCDAD00");
                var _5=this.color_To_RGB("0xC0FF3E");
                var _0=this.color_To_RGB("0x32CD32");
                var color = new Color([255, 255, 255]);
                var symbol = common.getPointSymbol();
                for (var i in this.fsset[0].features) {
                    var feature=this.fsset[0].features[i];
                    var sfsymbol = new SimpleFillSymbol();
                    var outlineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL);
                    outlineSymbol.width = 0;
                    sfsymbol.outline = outlineSymbol;
                    if (feature.attributes["GRID_CODE"] > 200) {
                        sfsymbol.color = _200;
                    }
                    else if (feature.attributes["GRID_CODE"] > 100) {
                        sfsymbol.color = _100;
                    }
                    else if (feature.attributes["GRID_CODE"] > 50) {
                        sfsymbol.color = _50;
                    }
                    else if (feature.attributes["GRID_CODE"] > 20) {
                        sfsymbol.color = _20;
                    }
                    else if (feature.attributes["GRID_CODE"] > 10) {
                        sfsymbol.color = _10;
                    }
                    else if (feature.attributes["GRID_CODE"] > 5) {
                        sfsymbol.color = _5;
                    }
                    else {
                        sfsymbol.color = _0;
                    }
                    feature.symbol = sfsymbol;
                    this.dealwith_GP_GraphicsLayer_poylon.add(feature);
                    var polygon = new Polygon(feature.geometry);
                    var txtSym = new TextSymbol(feature.attributes["GRID_CODE"],font,color);
                    txtSym.placement = TextSymbol.PLACEMENT_MIDDLE;
                    var labelGra = new Graphic(polygon.getExtent().getCenter(), txtSym, feature.attributes);
                    var pointsShows = new Graphic(polygon.getExtent().getCenter(), symbol);
                    this.dealwith_GP_GraphicsLayer_points.add(pointsShows);
                    this.dealwith_GP_GraphicsLayer_poylon.add(labelGra);
                }
            },
            //将16进制颜色转化为RGB
            color_To_RGB: function (color) {
                var sColor = color.toLowerCase();
                var sColorChange = [];
                for (var i = 2; i < 8; i += 2) {
                    sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
                }
                return new Color([sColorChange[0], sColorChange[1], sColorChange[2]]);
            },
            initMgrs50Config: function (){
                this.MGRS_50_CONFIG[11] = "L,M";
                this.MGRS_50_CONFIG[12] = "L,N";
                this.MGRS_50_CONFIG[13] = "L,P";
                this.MGRS_50_CONFIG[14] = "L,Q";
                this.MGRS_50_CONFIG[15] = "L,R";
                this.MGRS_50_CONFIG[16] = "L,S";
                this.MGRS_50_CONFIG[21] = "M,M";
                this.MGRS_50_CONFIG[22] = "M,N";
                this.MGRS_50_CONFIG[23] = "M,P";
                this.MGRS_50_CONFIG[24] = "M,Q";
                this.MGRS_50_CONFIG[25] = "M,R";
                this.MGRS_50_CONFIG[26] = "M,S";
                this.MGRS_50_CONFIG[31] = "N,M";
                this.MGRS_50_CONFIG[32] = "N,N";
                this.MGRS_50_CONFIG[33] = "N,P";
                this.MGRS_50_CONFIG[34] = "N,Q";
                this.MGRS_50_CONFIG[35] = "N,R";
                this.MGRS_50_CONFIG[36] = "N,S";
                this.MGRS_50_CONFIG[41] = "P,M";
                this.MGRS_50_CONFIG[42] = "P,N";
                this.MGRS_50_CONFIG[43] = "P,P";
                this.MGRS_50_CONFIG[44] = "P,Q";
                this.MGRS_50_CONFIG[45] = "P,R";
                this.MGRS_50_CONFIG[46] = "P,S";
                this.MGRS_50_CONFIG[51] = "Q,M";
                this.MGRS_50_CONFIG[52] = "Q,N";
                this.MGRS_50_CONFIG[53] = "Q,P";
                this.MGRS_50_CONFIG[54] = "Q,Q";
                this.MGRS_50_CONFIG[55] = "Q,R";
                this.MGRS_50_CONFIG[56] = "Q,S";
                this.MGRS_50_CONFIG[61] = "T,G";
                this.MGRS_50_CONFIG[62] = "T,H";
                this.MGRS_50_CONFIG[63] = "T,J";
                this.MGRS_50_CONFIG[64] = "T,K";
                this.MGRS_50_CONFIG[65] = "T,L";
                this.MGRS_50_CONFIG[66] = "T,M";
                this.MGRS_50_CONFIG["L,M"] = 11;
                this.MGRS_50_CONFIG["L,N"] = 12;
                this.MGRS_50_CONFIG["L,P"] = 13;
                this.MGRS_50_CONFIG["L,Q"] = 14;
                this.MGRS_50_CONFIG["L,R"] = 15;
                this.MGRS_50_CONFIG["L,S"] = 16;
                this.MGRS_50_CONFIG["M,M"] = 21;
                this.MGRS_50_CONFIG["M,N"] = 22;
                this.MGRS_50_CONFIG["M,P"] = 23;
                this.MGRS_50_CONFIG["M,Q"] = 24;
                this.MGRS_50_CONFIG["M,R"] = 25;
                this.MGRS_50_CONFIG["M,S"] = 26;
                this.MGRS_50_CONFIG["N,M"] = 31;
                this.MGRS_50_CONFIG["N,N"] = 32;
                this.MGRS_50_CONFIG["N,P"] = 33;
                this.MGRS_50_CONFIG["N,Q"] = 34;
                this.MGRS_50_CONFIG["N,R"] = 35;
                this.MGRS_50_CONFIG["N,S"] = 36;
                this.MGRS_50_CONFIG["P,M"] = 41;
                this.MGRS_50_CONFIG["P,N"] = 42;
                this.MGRS_50_CONFIG["P,P"] = 43;
                this.MGRS_50_CONFIG["P,Q"] = 44;
                this.MGRS_50_CONFIG["P,R"] = 45;
                this.MGRS_50_CONFIG["P,S"] = 46;
                this.MGRS_50_CONFIG["Q,M"] = 51;
                this.MGRS_50_CONFIG["Q,N"] = 52;
                this.MGRS_50_CONFIG["Q,P"] = 53;
                this.MGRS_50_CONFIG["Q,Q"] = 54;
                this.MGRS_50_CONFIG["Q,R"] = 55;
                this.MGRS_50_CONFIG["Q,S"] = 56;
                this.MGRS_50_CONFIG["T,G"] = 61;
                this.MGRS_50_CONFIG["T,H"] = 62;
                this.MGRS_50_CONFIG["T,J"] = 63;
                this.MGRS_50_CONFIG["T,K"] = 64;
                this.MGRS_50_CONFIG["T,L"] = 65;
                this.MGRS_50_CONFIG["T,M"] = 66;
            },
            geoJsonConverter: function () {
                var gCon = {};
                /*compares a GeoJSON geometry type and ESRI geometry type to see if they can be safely 
     put together in a single ESRI feature. ESRI features must only have one 
     geometry type, point, line, polygon*/
                function isCompatible(esriGeomType, gcGeomType) {
                    let compatible = false;
                    if ((esriGeomType === 'esriGeometryPoint' || esriGeomType === 'esriGeometryMultipoint')
                        && (gcGeomType === 'Point' || gcGeomType === 'MultiPoint')) {
                        compatible = true;
                    } else if (esriGeomType === 'esriGeometryPolyline' &&
                        (gcGeomType === 'LineString' || gcGeomType === 'MultiLineString')) {
                        compatible = true;
                    } else if (esriGeomType === 'esriGeometryPolygon' &&
                        (gcGeomType === 'Polygon' || gcGeomType === 'MultiPolygon')) {
                        compatible = true;
                    }
                    return compatible;
                }

                /*Take a GeoJSON geometry type and make an object that has information about 
                 what the ESRI geometry should hold. Includes the ESRI geometry type and the name 
                 of the member that holds coordinate information*/
                function gcGeomTypeToEsriGeomInfo(gcType) {
                    let esriType,
                        geomHolderId;
                    if (gcType === 'Point') {
                        esriType = 'esriGeometryPoint';
                    } else if (gcType === 'MultiPoint') {
                        esriType = 'esriGeometryMultipoint';
                        geomHolderId = 'points';
                    } else if (gcType === 'LineString' || gcType === 'MultiLineString') {
                        esriType = 'esriGeometryPolyline';
                        geomHolderId = 'paths';
                    } else if (gcType === 'Polygon' || gcType === 'MultiPolygon') {
                        esriType = 'esriGeometryPolygon';
                        geomHolderId = 'rings';
                    }
                    return {
                        type: esriType,
                        geomHolder: geomHolderId
                    };
                }

                // Convert GeoJSON polygon coordinates to ESRI polygon coordinates  
                function gcPolygonCoordinatesToEsriPolygonCoordinates(gcCoords) {
                    let i,
                        len;
                    const esriCoords = [];
                    let ring;
                    for (i = 0, len = gcCoords.length; i < len; i++) {
                        ring = gcCoords[i];
                        // Exclusive OR.  
                        if ((i === 0) !== ringIsClockwise(ring)) {
                            ring = ring.reverse();
                        }
                        esriCoords.push(ring);
                    }
                    return esriCoords;
                }
                /*rings is Clockwise or not 
                */
                function ringIsClockwise(ring) {
                    let sum = 0;
                    let i = 1;
                    const len = ring.length;
                    let prev, cur;
                    while (i < len) {
                        prev = cur || ring[0];
                        cur = ring[i];
                        sum += ((cur[0] - prev[0]) * (cur[1] + prev[1]));
                        i++;
                    }
                    return sum > 0;
                }

                /*Wraps GeoJSON coordinates in an array if necessary so code can iterate 
                 through array of points, rings, or lines and add them to an ESRI geometry 
                 Input is a GeoJSON geometry object. A GeoJSON GeometryCollection is not a 
                 valid input */
                function gcCoordinatesToEsriCoordinates(gcGeom) {
                    let i,
                        len,
                        esriCoords;
                    if (gcGeom.type === 'MultiPoint' || gcGeom.type === 'MultiLineString') {
                        esriCoords = gcGeom.coordinates || [];
                    } else if (gcGeom.type === 'Point' || gcGeom.type === 'LineString') {
                        esriCoords = gcGeom.coordinates ? [gcGeom.coordinates] : [];
                    } else if (gcGeom.type === 'Polygon') {
                        esriCoords = [];
                        if (gcGeom.coordinates) {
                            esriCoords = gcPolygonCoordinatesToEsriPolygonCoordinates(gcGeom.coordinates);
                        }
                    } else if (gcGeom.type === 'MultiPolygon') {
                        esriCoords = [];
                        if (gcGeom.coordinates) {
                            for (i = 0, len = gcGeom.coordinates.length; i < len; i++) {
                                const a = gcPolygonCoordinatesToEsriPolygonCoordinates(gcGeom.coordinates[i]);
                                esriCoords.push(a[0]);
                            }
                        }
                    }
                    return esriCoords;
                }

                /*Converts GeoJSON geometry to ESRI geometry. The ESRI geometry is 
                 only allowed to contain one type of geometry, so if the GeoJSON 
                 geometry is a GeometryCollection, then only geometries compatible 
                 with the first geometry type in the collection are added to the ESRI geometry 
                 Input parameter is a GeoJSON geometry object.*/
                function gcGeometryToEsriGeometry(gcGeom) {
                    let esriGeometry,
                        esriGeomInfo,
                        gcGeometriesToConvert,
                        i,
                        g,
                        coords;

                    // if geometry collection, get info about first geometry in collection  
                    if (gcGeom.type === 'GeometryCollection') {
                        const geomCompare = gcGeom.geometries[0];
                        gcGeometriesToConvert = [];
                        esriGeomInfo = gcGeomTypeToEsriGeomInfo(geomCompare.type);

                        // loop through collection and only add compatible geometries to the array  
                        // of geometries that will be converted  
                        for (i = 0; i < gcGeom.geometries.length; i++) {
                            if (isCompatible(esriGeomInfo.type, gcGeom.geometries[i].type)) {
                                gcGeometriesToConvert.push(gcGeom.geometries[i]);
                            }
                        }
                    } else {
                        esriGeomInfo = gcGeomTypeToEsriGeomInfo(gcGeom.type);
                        gcGeometriesToConvert = [gcGeom];
                    }

                    // if a collection contained multiple points, change the ESRI geometry  
                    // type to MultiPoint  
                    if (esriGeomInfo.type === 'esriGeometryPoint' && gcGeometriesToConvert.length > 1) {
                        esriGeomInfo = gcGeomTypeToEsriGeomInfo('MultiPoint');
                    }

                    // make new empty ESRI geometry object  
                    esriGeometry = {
                        // type: esriGeomInfo.type,  
                        spatialReference: {
                            wkid: 4326
                        }
                    };

                    // perform conversion  
                    if (esriGeomInfo.type === 'esriGeometryPoint') {
                        if (!gcGeometriesToConvert[0] || !gcGeometriesToConvert[0].coordinates ||
                            gcGeometriesToConvert[0].coordinates.length === 0) {
                            esriGeometry.x = null;
                        } else {
                            esriGeometry.x = gcGeometriesToConvert[0].coordinates[0];
                            esriGeometry.y = gcGeometriesToConvert[0].coordinates[1];
                        }
                    } else {
                        esriGeometry[esriGeomInfo.geomHolder] = [];
                        for (i = 0; i < gcGeometriesToConvert.length; i++) {
                            if (gcGeometriesToConvert.length > 1) {
                                coords = gcCoordinatesToEsriCoordinates(gcGeometriesToConvert[i]);
                                for (g = 0; g < coords.length; g++) {
                                    esriGeometry[esriGeomInfo.geomHolder].push(coords[g]);
                                }

                            } else {
                                coords = gcCoordinatesToEsriCoordinates(gcGeometriesToConvert[i]);
                                for (g = 0; g < coords.length; g++) {
                                    esriGeometry[esriGeomInfo.geomHolder].push(coords[g]);
                                }
                            }
                        }
                    }
                    return esriGeometry;
                }

                // Converts GeoJSON feature to ESRI REST Feature.  
                //  Input parameter is a GeoJSON Feature object  
                function gcFeatureToEsriFeature(gcFeature) {
                    let esriFeat,
                        esriAttribs;
                    if (gcFeature) {
                        esriFeat = {};
                        if (gcFeature.geometry) {
                            esriFeat.geometry = gcGeometryToEsriGeometry(gcFeature.geometry);
                        }
                        if (gcFeature.properties) {
                            esriAttribs = {};
                            for (var prop in gcFeature.properties) {
                                if (gcFeature.properties.hasOwnProperty(prop)) {
                                    esriAttribs[prop] = gcFeature.properties[prop];
                                }
                            }
                            esriFeat.attributes = esriAttribs;
                        }
                    }
                    return esriFeat;
                }

                /*Converts GeoJSON FeatureCollection, Feature, or Geometry 
                 to ESRI Rest Featureset, Feature, or Geometry*/
                gCon.toEsri = function (geoJsonObject) {
                    let outObj,
                        i,
                        gcFeats,
                        esriFeat;
                    if (geoJsonObject) {
                        if (geoJsonObject.type === 'FeatureCollection') {
                            outObj = {
                                features: []
                            };
                            gcFeats = geoJsonObject.features;
                            for (i = 0; i < gcFeats.length; i++) {
                                esriFeat = gcFeatureToEsriFeature(gcFeats[i]);
                                if (esriFeat) {
                                    outObj.features.push(esriFeat);
                                }
                            }
                        } else if (geoJsonObject.type === 'Feature') {
                            outObj = gcFeatureToEsriFeature(geoJsonObject);
                        } else {
                            outObj = gcGeometryToEsriGeometry(geoJsonObject);
                        }
                    }
                    return outObj;
                };

                return gCon;
            }

        });
    });
