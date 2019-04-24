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
    'dojo/text!./templates/MutiSelectTool.html',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/_base/html',
    'dojo/dom-style',
    'jimu/cronosgis/utils/DateUtil',
    'jimu/cronosgis/utils/ArrayUtil',
    'esri/arcgis/LayerUtil',
    'dojo/topic'
], function (_WidgetBase, declare, lang, array, domConstruct, on, query,
             _TemplatedMixin, template,
             domAttr, domClass, html, domStyle, DateUtil, ArrayUtil, LayerUtil, topic
             ) {

    return declare([_WidgetBase, _TemplatedMixin], {
        declaredClass: "widgets.LayerTools.tools.MutiSelectTool",
        templateString: template,
        _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "ToolTemplate", map: null, visible: !0, layer: null },
        _toolValue: "",
        toolContainer: null,
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

        },
        postCreate: function () {
            this.inherited(arguments);
            //this.own(on(this._homeNode, p, lang.hitch(this, this.home)))
        },
        startup: function () {
            this.inherited(arguments);
            this.map || (this.destroy(), console.log("MutiSelectTool::map required"));
            if (!this.loaded) {
                if (this.options.label != undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                if (this.options.selectId != undefined) {
                    this.layerSelect.id = this.options.selectId;
                }
                if (this.options.optionshtml != undefined) {
                    //如果是配置里面已经有optionshtml则直接将这个html嵌入select tool中
                    this.layerSelect.innerHTML = this.options.optionshtml;

                } else if (this.options.optionsurl != undefined) {
                    /**
                       根据url进行请求options
                  
                    var headStr = {
                        "X-Requested-With": null
                    };
                    xhr(this.options.optionsurl, { handleAs: 'json', method: 'POST', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {
    
    
    
                    }));   */


                    var innerOptions = "<option  value='SX'  >扇形</option><option  value='THIESS' >泰森多边形</option><option  value='CIRCLE' >圆形</option>";

                    this.layerSelect.innerHTML = innerOptions;

                }
                if (!this.hasSubmit) {
                    $(this.layerSelect).live("change", lang.hitch(this, function () {
                        //$("text").attr("checked", false);
                        topic.publish("tool_status_change", this);
                    }));
                }

                /**
                dojo.connect(this.layerSelect, "onchange", lang.hitch(this, function () {
                    //$("text").attr("checked", false);
                    topic.publish("tool_status_change", this);
                })); **/

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

            $(".multi").multiselect({ minWidth: 160 });

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

            if (this._toolActionType == "dynamic") {
                if (this.options.table_pre != undefined && (this.options.orderid == undefined || this.options.orderid == 0)) {
                    result = this.options.table_pre + "_";
                }

            } else if (this._toolActionType == "query" || this._toolActionType == "highlight") {
                result = "1=2";
            }


            var selectedOptions = $(this.layerSelect).find('option:selected');

            selectedOptions.sort(function (aoption, boption) {
                var aorderid = $(aoption).attr("orderid");
                var borderid = $(boption).attr("orderid");
                return aorderid - borderid;

            });

            for (var i = 0; i < selectedOptions.length; i++) {
                var selectedOption = selectedOptions[i];
                var checkedValue = $(selectedOption).val();
                if (this._toolActionType == "dynamic") {

                    result = result + (i == 0 ? "" : "_") + checkedValue;

                } else if (this._toolActionType == "query") {

                    result = result + " or " + checkedValue;

                } else if (this._toolActionType == "highlight") {

                    result = result + " or " + checkedValue;
                }
            }
           
            return result;
        }

    });

});