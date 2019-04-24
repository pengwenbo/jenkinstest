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
    'dojo/text!./templates/SectorOrThiessTool.html',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/_base/html',
    'dojo/dom-style',
    'jimu/cronosgis/utils/DateUtil',
    'jimu/cronosgis/utils/ArrayUtil',
    'custom/common',
    'esri/arcgis/LayerUtil',
    'dojo/topic'
], function (_WidgetBase, declare, lang, array, domConstruct, on, query,
             _TemplatedMixin, template,
             domAttr, domClass, html, domStyle, DateUtil, ArrayUtil,CommonUtil, LayerUtil, topic
             ) {

    return declare([_WidgetBase, _TemplatedMixin], {
        declaredClass: "widgets.LayerTools.tools.SectorOrThiessTool",
        templateString: template,
        _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "SectorOrThiess", map: null, visible: !0, layer: null},
        _toolValue: "",
        toolContainer: null,
        radioName: "SectorOrThiess",
        hasSubmit: false,
        constructor: function (optsp) {
            var opts = lang.mixin({}, this.options, optsp);
            this.options = opts;
            this.radioName = this.radioName + CommonUtil.guid9();
            this._toolActionType = this.options.optionType;
            //this.domNode = toolBox;
            this.toolContainer = optsp.toolBox;
            this.set("map", opts.map);
            this.set("theme", opts.theme);
            this.set("visible", opts.visible);
            if (optsp.hasSubmit == true) {
                this.hasSubmit = optsp.hasSubmit;
            }
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            //this.domNode = domConstruct.create("div");

        },
        postCreate: function () {
            this.inherited(arguments);
            //this.own(on(this._homeNode, p, lang.hitch(this, this.home)))
        },
        startup: function () {
            this.inherited(arguments);
            this.map || (this.destroy(), console.log("SectorOrThiessTool::map required"));
            if (!this.loaded) {
                if (this.options.label != undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                this.SectorRadio.name = this.radioName;
                this.ThiessRadio.name = this.radioName;

                dojo.connect(this.SectorRadio, "onclick", lang.hitch(this, function () {
                    $("[name = '" + this.radioName + "']:radio").attr("checked", false);
                    $(this.SectorRadio).attr("checked", true);
                    if (!this.hasSubmit) {
                        topic.publish("tool_status_change", this);
                    }
                }));

                dojo.connect(this.ThiessRadio, "onclick", lang.hitch(this, function () {
                    $("[name = '" + this.radioName + "']:radio").attr("checked", false);
                    $(this.ThiessRadio).attr("checked", true);
                    if (!this.hasSubmit) {
                        topic.publish("tool_status_change", this);
                    }
                }));


            }
            if (this.map.loaded) this._init(); else on.once(this.map, "load", lang.hitch(this, function () {
                this._init()
            }));
          

            html.place(this.domNode, this.toolContainer);
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
            var result = "";
            var checkedType = $("[name = '" + this.radioName + "']:radio:checked").val();
            //泰森多边形，扇形的工具只有动态方法
            if (this._toolActionType == "dynamic") {
                if (this.options.table_pre != undefined && (this.options.orderid == undefined || this.options.orderid == 0)) {
                    if (checkedType == "thiess") {
                        return this.options.table_pre +"_"+ this.options.Thiess_table_Phrase;
                    } else {
                        return this.options.table_pre + "_" + this.options.Sector_table_Phrase;
                    }

                } else {
                    if (checkedType == "thiess") {
                        return this.options.Thiess_table_Phrase;
                    } else {
                        return this.options.Sector_table_Phrase;
                    }
                }
            
            } 
            return "";
        }

    });

});