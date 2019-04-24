/**
 * Created by alwin on 2016/8/30.
 */
define([
    'dijit/_WidgetBase',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/query',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/SubmitButtonTool.html',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/_base/html',
    'dojo/dom-style',
    'jimu/cronosgis/utils/DateUtil',
    'jimu/cronosgis/utils/ArrayUtil',
    'esri/arcgis/LayerUtil',
    'dojo/topic',
    '../CustomFunctionToolManager'
], function (_WidgetBase, declare, lang, array, domConstruct, on, query,
             _TemplatedMixin, template,
             domAttr, domClass, html, domStyle, DateUtil, ArrayUtil, LayerUtil, topic, CustomFunctionToolManager
             ) {

    return declare([_WidgetBase, _TemplatedMixin], {
        declaredClass: "widgets.LayerTools.tools.SubmitButtonTool",
        templateString: template,
        _toolActionType: "submit", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "ToolTemplate", map: null, visible: !0, layer: null },
        _toolValue: "",
        toolContainer: null,
        constructor: function (optsp) {
            var opts = lang.mixin({}, this.options, optsp);
            this.options = opts;
            //this.domNode = toolBox;
            this.toolContainer = optsp.toolBox;
            this.set("map", opts.map);
            this.set("theme", opts.theme);
            this.set("visible", opts.visible);

            this._toolActionType = this.options.optionType;
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            //this.domNode = domConstruct.create("div");
            if (this.options.divclass == "attrVal") {
                this.templateString = this.templateString.replace("attrBarR", "attrVal");
            }
        },
        postCreate: function () {
            this.inherited(arguments);
            //this.own(on(this._homeNode, p, lang.hitch(this, this.home)))
        },
        startup: function () {
            this.inherited(arguments);
            this.map || (this.destroy(), console.log("SubmitButtonTool::map required"));
            if (!this.loaded) {
                this.submitBtn.value = this.options.label;
                if (this.options.selectId != undefined) {
                    this.submitBtn.id = this.options.selectId;
                }
                dojo.connect(this.submitBtn, "onclick", lang.hitch(this, function () {
                    if (this.options.customFunction) {
                        if (this.options.customFunction == "changeFnTouSuLayer") {
                            CustomFunctionToolManager.getInstance()[this.options.customFunction](this.options.map);
                        } else if (this.options.customFunction == "changRoadReturnBtn" || this.options.customFunction == "changCjpgReturnBtn") {
                            CustomFunctionToolManager.getInstance()[this.options.customFunction]("", this.options, this.options.map, this.options.layer.configObj.label);
                        } else {
                            CustomFunctionToolManager.getInstance()[this.options.customFunction]("", this.options, this.options.map);
                        }
                    } else {
                        //$("text").attr("checked", false);
                        topic.publish("tool_status_change", this);
                    }
                }));
            }

            if (this.map.loaded) this._init(); else on.once(this.map, "load", lang.hitch(this, function () {
                this._init()
            }));

            html.place(this.domNode, this.toolContainer);
            if (!this.options.showVisible) {
                domStyle.set(this.submitBtn, "display", "none");
            }
            if (this.options.optionType == "custom" && this.options.isgo) {
                topic.publish("tool_status_change", this);
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
            return "SubmitButtonTool";
        }

    });

});