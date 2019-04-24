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
    'dojo/text!./templates/MutiRadioBtnTool.html',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/_base/html',
    'dojo/dom-style',
    'jimu/cronosgis/utils/DateUtil',
    'jimu/cronosgis/utils/ArrayUtil',
    'esri/arcgis/LayerUtil',
       'custom/common',
    'dojo/topic'
], function (_WidgetBase, declare, lang, array, domConstruct, on, query,
             _TemplatedMixin, template,
             domAttr, domClass, html, domStyle, DateUtil, ArrayUtil, LayerUtil, CommonUtil,topic
             ) {

    return declare([_WidgetBase, _TemplatedMixin], {
        declaredClass: "widgets.LayerTools.tools.MutiRadioBtnTool",
        templateString: template,
        _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "ToolTemplate", map: null, visible: !0, layer: null },
        _toolValue: "",
        toolContainer: null,
        radioName: "mutiRadio",
        hasSubmit: false,
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
            this.radioName = this.radioName + CommonUtil.guid9();
        },
        postCreate: function () {
            this.inherited(arguments);
            //this.own(on(this._homeNode, p, lang.hitch(this, this.home)))
        },
        startup: function () {
            this.inherited(arguments);
            this.map || (this.destroy(), console.log("MutiRadioBtnTool::map required"));
            if (!this.loaded) {

                if (this.options.label != undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                if (this.options.selectId != undefined) {
                    this.radiosContent.id = this.options.selectId;
                }

                var radios = this.options.radios;
                if (radios != undefined && radios.length > 0) {
                    array.forEach(radios, lang.hitch(this, function (radioConfig) {


                        var radioBtn = domConstruct.create("input", { type: "radio", id: radioConfig.id, value: radioConfig.value, name: this.radioName, checked: (radioConfig.checked == true ? true : false) }, this.radiosContent);
                        var radioLabel = domConstruct.create("label", { innerHTML: radioConfig.label }, this.radiosContent);
                        
                        dojo.connect(radioBtn, "onclick", lang.hitch(this, function () {
                            $("[name = '" + this.radioName + "']:radio").attr("checked", false);
                            $(radioBtn).attr("checked", true);
                            if (!this.hasSubmit) {
                                topic.publish("tool_status_change", this);
                            }
                        }));

                    }));


                }
            }
            



            html.place(this.domNode, this.toolContainer);
            if (this.loaded) {
                if (this.options.optionType == "custom" && this.options.isgo) {
                    topic.publish("readlyTools", this);
                }
            } else {
                if (this.options.optionType == "custom" && this.options.isgo) {
                    topic.publish("tool_status_change", this);
                }
            }

            if (this.map.loaded) this._init(); else on.once(this.map, "load", lang.hitch(this, function () {
                this._init()
            }));
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
            var result = "";
            var checkedValue = $("[name = '" + this.radioName + "']:radio:checked").val();
            //泰森多边形，扇形的工具只有动态方法
            if (this._toolActionType == "dynamic") {
                if (this.options.table_pre != undefined && (this.options.orderid == undefined || this.options.orderid == 0)) {
                  
                    return this.options.table_pre + "_" + checkedValue;
                   

                } else {
                    return checkedValue;
                }

            } else if (this._toolActionType == "query") {

                return checkedValue;

            } else if (this._toolActionType == "highlight") {

                return checkedValue;
            } else if (this._toolActionType == "dynamicfield") {

                return selectedValue;;
            }
            return "";
        }

    });

});