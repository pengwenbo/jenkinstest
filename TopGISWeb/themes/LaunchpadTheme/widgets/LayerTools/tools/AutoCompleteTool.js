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
    'dojo/text!./templates/AutoCompleteTool.html',
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
        declaredClass: "widgets.LayerTools.tools.AutoCompleteTool",
        templateString: template,
        _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "ToolTemplate", map: null, visible: !0, layer: null },
        _toolValue: "",
        toolContainer: null,
        hasSubmit:false,
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
            this.map || (this.destroy(), console.log("AutoCompleteTool::map required"));
            if (!this.loaded) {

                var availableTags = [];
                if (this.options.label != undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                if (this.options.selectId != undefined) {
                    this.layerInputText.id = this.options.selectId;
                }
                if (this.options.tagsdata != undefined) {
                    //如果是配置里面已经有optionshtml则直接将这个html嵌入select tool中
                    availableTags = this.options.tagsdata;

                } else if (this.options.tagsurl != undefined) {
                    /**
                       根据url进行请求options
                  
                    var headStr = {
                        "X-Requested-With": null
                    };
                    xhr(this.options.optionsurl, { handleAs: 'json', method: 'POST', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {
    
    
    
                    }));   */

                    var td_pds = ['9405', '9413', '9421', '9427', '9429', '9437', '9445', '9453', '9455', '9463', '9471', '9479', '9487', '9495', '9505', '9513', '9521', '9529', '9530', '9537', '9538', '9545', '9553', '9555', '9561', '9563', '9569', '9571', '10054', '10055', '10060', '10062', '10063', '10066', '10070', '10071', '10072', '10077', '10079', '10080', '10082', '10084', '10088', '10092', '10096', '10100', '10102', '10104', '10107', '10112', '10114', '10120', '10121'];

                    //var innerOptions = "<option  value='SX'  >扇形</option><option  value='THIESS' >泰森多边形</option><option  value='CIRCLE' >圆形</option>";

                    availableTags = td_pds;

                }
                if (!this.hasSubmit) {
                    dojo.connect(this.layerInputText, "onchange", lang.hitch(this, function () {
                        //$("text").attr("checked", false);
                        topic.publish("tool_status_change", this);
                    }));
                }
              

            }
            if (this.map.loaded) this._init(); else on.once(this.map, "load", lang.hitch(this, function () {
                this._init()
            }));

            html.place(this.domNode, this.toolContainer);
            if (this.options.optionType == "custom" && this.options.isgo) {
                topic.publish("tool_status_change", this);
            }
           
            $(this.layerInputText).autocomplete({
                source: availableTags
            });
            $(this.layerInputText).focus(function () {
                $(".ui-autocomplete").css("display", "block");
            });

   
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
            var inputValue = $(this.layerInputText).val();
            //泰森多边形，扇形的工具只有动态方法
            if (this._toolActionType == "dynamic") {
                if (this.options.table_pre != undefined && (this.options.orderid == undefined || this.options.orderid == 0)) {

                    return this.options.table_pre + "_" + inputValue;

                } else {

                    return inputValue;

                }

            } else if (this._toolActionType == "query") {
                if (this.options.fieldName != undefined && this.options.hasQuotationMark) {

                    return this.options.fieldName + "='" + inputValue + "'";

                } else if (this.options.fieldName != undefined && !this.options.hasQuotationMark) {
                    return this.options.fieldName + "=" + inputValue;
                }

                

            } else if (this._toolActionType == "highlight") {
                if (this.options.fieldName != undefined && this.options.hasQuotationMark) {

                    return this.options.fieldName + "='" + inputValue + "'";

                } else if (this.options.fieldName != undefined && !this.options.hasQuotationMark) {
                    return this.options.fieldName + "=" + inputValue;
                } 
            }

            return "";
        }

    });

});