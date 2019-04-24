/**
 * Created by alwin on 2016/8/30.
 */
define([
    'dijit/_WidgetBase',
    'jimu/BaseWidget',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/query',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./templates/SimpleRendererTool.html',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/_base/html',
    'dojo/dom-style',
    'jimu/cronosgis/utils/DateUtil',
    'jimu/cronosgis/utils/ArrayUtil',
    'dojo/request/xhr',
    'esri/arcgis/LayerUtil',
    'jimu/dijit/ViewStack',
    "esri/renderers/SimpleRenderer",
    "esri/layers/LayerDrawingOptions",
    'dojo/topic',
    'jimu/dijit/SymbolChooser'
], function (_WidgetBase,BaseWidget, declare, lang, array, domConstruct, on, query,
             _WidgetsInTemplateMixin, template,
             domAttr, domClass, html, domStyle, DateUtil, ArrayUtil, xhr, LayerUtil, ViewStack, SimpleRenderer, LayerDrawingOptions,topic
             ) {

    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        declaredClass: "widgets.LayerTools.tools.SimpleRendererTool",
        templateString: template,
        _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "ToolTemplate", map: null, visible: !0, layer: null },
        _toolValue: "",
        toolContainer: null,
        hasSubmit: false, 
        DEFAULT_POINT_RENDERER:{
            "type": "simple",
            "label": "",
            "description": "",
            "symbol": {
                "color": [210,105,30,191],
                "size": 12,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "outline": {
                    "color": [0,0,128,255],
                    "width": 0,
                    "type": "esriSLS",
                    "style": "esriSLSSolid"
                }
            }

        },
        constructor: function (optsp) {
            var opts = lang.mixin({}, this.options, optsp);
            this.options = opts;
            //this.domNode = toolBox;
            this.toolContainer = optsp.toolBox;
            this.set("map", opts.map);
            this.set("theme", opts.theme);
            this.set("visible", opts.visible);
            if (optsp.hasSubmit == true) {
                this.hasSubmit = optsp.hasSubmit;
            }
            this._toolActionType = this.options.optionType;
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            //this.domNode = domConstruct.create("div");

        },
        postCreate: function () {
            this.inherited(arguments);
            //this.own(on(this._homeNode, p, lang.hitch(this, this.home)));

            this.viewStack = new ViewStack({
                viewType: 'dom',
                views: [this.pointSection, this.lineSection, this.polygonSection]
            });
            html.place(this.viewStack.domNode, this.settingContent);
        },
        startup: function () {
            this.inherited(arguments);
            this.map || (this.destroy(), console.log("SimbolRendererTool::map required"));
           

            if (!this.loaded) {
             

                this.viewStack.startup();

                this.viewStack.switchView(null);



                if (this.options.geometryType === 'point') {
                    this.viewStack.switchView(this.pointSection);
                }
                else if (this.options.geometryType === 'polyline') {
                    this.viewStack.switchView(this.lineSection);
                }
                else if (this.options.geometryType === 'polygon') {
                    this.viewStack.switchView(this.polygonSection);
                }

                if (this.options.geometryType === 'point') {
                    this.own(on(this.pointSymChooser, 'change', lang.hitch(this, function () {
                        this._setDrawDefaultSymbols("point");
                    })));
                }
                else if (this.options.geometryType === 'polyline') {
                    this.own(on(this.lineSymChooser, 'change', lang.hitch(this, function () {
                        this._setDrawDefaultSymbols("polyline");
                    })));
                }
                else if (this.options.geometryType === 'polygon') {
                    this.own(on(this.fillSymChooser, 'change', lang.hitch(this, function () {
                        this._setDrawDefaultSymbols("polygon");
                    })));
                }
                //bind symbol change events
              
               
                
              
            }

            if (this.map.loaded) this._init(); else on.once(this.map, "load", lang.hitch(this, function () {
                this._init()
            }));


            html.place(this.domNode, this.toolContainer);
            if (this.options.optionType == "custom" && this.options.isgo) {
                topic.publish("tool_status_change", this);
            }
            //this._closeColorPicker();


        }, _setDrawDefaultSymbols: function (geometryType) {
             
            var rendererSymbol = null;
            if (geometryType === 'point') {
                rendererSymbol = this.pointSymChooser.getSymbol();
            }
            else if (geometryType === 'polyline') {
                rendererSymbol = this.lineSymChooser.getSymbol();
            }
            else if (geometryType === 'polygon') {
                rendererSymbol = this.fillSymChooser.getSymbol();
            }
            var simpleRenderer = new SimpleRenderer(rendererSymbol);
            var layer = this.options.layer;
            if (layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                var dynamicDrawOpts = layer.layerDrawingOptions;
                if (dynamicDrawOpts != undefined) {
                    for (var i = 0; i < dynamicDrawOpts.length; i++) {
                        var ldrawOpt = dynamicDrawOpts[i];
                        ldrawOpt.renderer = simpleRenderer;
                    }

                } else {
                    dynamicDrawOpts = [];
                    var drawingOptions = new LayerDrawingOptions();
                    drawingOptions.renderer = simpleRenderer;
                    dynamicDrawOpts.push(drawingOptions);

                }
                layer.setLayerDrawingOptions(dynamicDrawOpts);
                //layer.layerDrawingOptions = dynamicDrawOpts;
                //layer.refresh();

            } else if (layer.declaredClass == "esri.layers.FeatureLayer") {

                layer.setRenderer(simpleRenderer);
                layer.refresh();
            }

        },
        _closeColorPicker: function () {
            var choosers = ["pointSymChooser", "lineSymChooser", "fillSymChooser"];
            for (var i = 0, len = choosers.length; i < len; i++) {
                var chooserStr = choosers[i];
                if (this[chooserStr]) {
                    this[chooserStr].hideColorPicker();
                }
            }
        },
        _init: function () {
            this._visible();
            this.set("loaded", !0);
            this.emit("load", {});
        },
        destroy: function () {
            this.inherited(arguments)
        },
        _updateThemeWatch: function (c, a, b) {
            domClass.remove(this.domNode, a);
            domClass.add(this.domNode, b);
        },
        _visible: function () {
            this.get("visible") ? domStyle.set(this.domNode, "display", "block") : domStyle.set(this.domNode, "display", "none");
        },
        getResult: function () {

         


            return "";
        }

    });

});