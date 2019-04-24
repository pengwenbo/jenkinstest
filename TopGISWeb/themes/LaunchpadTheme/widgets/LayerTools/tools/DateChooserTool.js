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
    'dojo/text!./templates/DateChooserTool.html',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/_base/html',
    'dojo/dom-style',
    'jimu/cronosgis/utils/DateUtil',
    'jimu/cronosgis/utils/ArrayUtil',
    'esri/arcgis/LayerUtil',
    'dojo/request/xhr',
    'dojo/topic'
], function (_WidgetBase, declare, lang, array, domConstruct, on, query,
             _TemplatedMixin, template,
             domAttr, domClass, html, domStyle, DateUtil, ArrayUtil, LayerUtil, xhr, topic
             ) {

    return declare([_WidgetBase, _TemplatedMixin], {
        declaredClass: "widgets.LayerTools.tools.DateChooserTool",
        templateString: template,
        _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "DateChooser", map: null, visible: !0, layer: null, toolDate: new Date() },
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
            this.map || (this.destroy(), console.log("DateChooserTool::map required"));

            if (!this.loaded) {

                if (this.options.label != undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                if (this.options.selectId != undefined) {
                    this.dateLayerChooser.id = this.options.selectId;
                }
                var defaultDate = this.options.defaultDate;
                if (defaultDate!=undefined&&defaultDate.indexOf("{") != -1) {
                    var dateReg = /\{(.+)\}-(\d+)/;
                    var dateReg2 = /\{(.+)\}/;
                    var dateStr = "today";
                    var dateNum = 0;
                    if (dateReg.test(defaultDate)) {
                        var rs = defaultDate.match(dateReg);
                         dateStr = rs[1];
                         dateNum = parseInt(rs[2]);

                    } else {
                         dateStr = rs[1];
                    }

                    if (this.options.connect_table == "GIS_ZWK_GRID_CELL") {
                        // 根据url进行请求时间差
                        var headStr = {
                            "X-Requested-With": null
                        };
                        xhr("../../GisCommonApi/SelectMaxTimeByTable?tableName=" + this.options.connect_table, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (dateObject) {
                            dateNum = dateObject.DiffDay;

                            switch (dateStr) {
                                case "today":
                                    this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(new Date(), -dateNum));
                                    break;
                                case "yesterday":
                                    this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(new Date(), -dateNum - 1));
                                    break;
                                case "beforeyesterday":
                                    this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(new Date(), -dateNum - 2));
                                    break;
                                case "lastmonth":
                                    this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(DateUtil.add(new Date(), "month", -1), -dateNum));
                                    break;
                                case "lastyear":
                                    this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(DateUtil.add(new Date(), "year", -1), -dateNum));
                                    break;
                                default:
                                    this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(new Date(), -dateNum));
                                    break;
                            }

                            topic.publish("tool_status_change", this);

                        }));
                    } else {

                        switch (dateStr) {
                            case "today":
                                this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(new Date(), -dateNum));
                                break;
                            case "yesterday":
                                this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(new Date(), -dateNum - 1));
                                break;
                            case "beforeyesterday":
                                this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(new Date(), -dateNum - 2));
                                break;
                            case "lastmonth":
                                this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(DateUtil.add(new Date(), "month", -1), -dateNum));
                                break;
                            case "lastyear":
                                this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(DateUtil.add(new Date(), "year", -1), -dateNum));
                                break;
                            default:
                                this.dateLayerChooser.value = DateUtil.formatCommon(DateUtil.addDay(new Date(), -dateNum));
                                break;
                        }

                    }


                } else if (defaultDate != undefined && DateUtil.isDate(this.options.defaultDate)) {

                    this.dateLayerChooser.value = this.options.defaultDate;

                }
            }            
           
            html.place(this.domNode, this.toolContainer);
            if (this.options.optionType == "custom" && this.options.isgo) {
                topic.publish("tool_status_change", this);
            }

            $(".dateWidget").datepicker();
            if (!this.loaded) {
                if (!this.hasSubmit) {
                    on($(".dateWidget"), "change", lang.hitch(this, function () {
                        topic.publish("tool_status_change", this);
                    }));
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
        changDate:function(){
            topic.publish("tool_status_change", this);
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
            var dateValue = $(this.dateLayerChooser).val();
            //泰森多边形，扇形的工具只有动态方法
            if (this._toolActionType == "dynamic") {
                dateValue = DateUtil.parseToSimple(dateValue);
                if (this.options.table_pre != undefined && (this.options.orderid == undefined || this.options.orderid == 0)) {

                    return this.options.table_pre  + dateValue;

                } else {

                    return dateValue;

                }

            } else if (this._toolActionType == "query") {
                if (this.options.haveNoLine) {
                    return this.options.DateFieldName + "= '" + dateValue.replace(/-/g, "") + "'";
                }else{
                    return this.options.DateFieldName + "= '" + dateValue + "'";
                }
                

            } else if (this._toolActionType == "highlight") {

                return this.options.DateFieldName + "= '" + dateValue + "'";
            }

            return "";
        }

    });

});