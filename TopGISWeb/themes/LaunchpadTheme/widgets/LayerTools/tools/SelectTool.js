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
    'dojo/text!./templates/SelectTool.html',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/_base/html',
    'dojo/dom-style',
    'jimu/cronosgis/utils/DateUtil',
    'jimu/cronosgis/utils/ArrayUtil',
     'dojo/request/xhr',
    'esri/arcgis/LayerUtil',
    'dojo/topic'
], function (_WidgetBase, declare, lang, array, domConstruct, on, query,
             _TemplatedMixin, template,
             domAttr, domClass, html, domStyle, DateUtil, ArrayUtil, xhr, LayerUtil, topic
             ) {

    return declare([_WidgetBase, _TemplatedMixin], {
        declaredClass: "widgets.LayerTools.tools.SelectTool",
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
        initTool: function () {

        },
        postCreate: function () {
            this.inherited(arguments);
            //this.own(on(this._homeNode, p, lang.hitch(this, this.home)))
        },
        startup: function () {
            this.inherited(arguments);
            this.map || (this.destroy(), console.log("SelectTool::map required"));

            if (!this.loaded) {
                if (this.options.label != undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                if (this.options.optionshtml != undefined) {
                    //如果是配置里面已经有optionshtml则直接将这个html嵌入select tool中
                    if (this.options.SX_TS) {
                        //时间日>11,月份-1；日>=11,月份-2，lastMonth本身就是减一月的值
                        var _getMonth = null, _getYear = null;
                        if (nowDay <= 11) {
                            _getYear = nowYear;
                            _getMonth = nowMonth - 1;
                            if (_getMonth < 0) {
                                _getYear = _getYear - 1;
                                _getMonth = 12 + _getMonth;
                            }
                        } else {
                            _getYear = nowYear;
                            _getMonth = nowMonth;
                            if (_getMonth == 0) {
                                _getYear = _getYear - 1;
                                _getMonth = 12;
                            }
                        }
                        var time = _getYear.toString() + _getMonth.toString();//如时间2018-01-24，则time=201712
                        this.options.optionshtml = this.options.optionshtml.split("'>")[0] + time + "'>" + time + this.options.optionshtml.split("'>")[1];
                    }
                    this.layerSelect.innerHTML = this.options.optionshtml;
                    if (this.options.selectId != undefined) {
                        this.layerSelect.id = this.options.selectId;
                    }
                    //仅为唯一时间时候使用，也就是说图层信息为一个，并且时间为{today}-2
                    if (this.options.optionshtml.indexOf("z-date") > -1) {
                        var mydate = new Date();
                        //时间减去2天
                        var time = mydate.getTime();
                        if (this.options.defaultDate) {
                            var num = this.options.defaultDate.split("-")[1];
                            time -= num * 24 * 60 * 60 * 1000;
                        } else {
                            time -= 2 * 24 * 60 * 60 * 1000;
                        }
                        var need_date = this.getformat(time, "yyyy-MM-dd");
                        this.layerSelect.innerHTML = "<option  value='" + need_date.replace(/-/g, "") + "'  >" + need_date + "</option>";
                    }

                } else if (this.options.optionsurl != undefined) {
                    // 根据url进行请求options
                    var headStr = {
                        "X-Requested-With": null
                    };
                    if (this.options.label.indexOf("被评估期") > -1) {
                        xhr(urlRoute(this.options.optionsurl), { sync: true, handleAs: 'json', method: 'POST', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {
                            var stringContent = "";
                            var i = "LasttimeList";
                            for (var j in optionsHtml[i]) {
                                stringContent += "<option  value='" + optionsHtml[i][j] + "'  >" + optionsHtml[i][j] + "</option>";
                            }
                            this.layerSelect.innerHTML = stringContent;
                            stringContent = "";

                            if (this.options.selectId != undefined) {
                                this.layerSelect.id = this.options.selectId;
                            }
                        }));
                    } else if (this.options.label.indexOf("对比本期") > -1) {
                        xhr(urlRoute(this.options.optionsurl), { sync: true, handleAs: 'json', method: 'POST', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {
                            var stringContent = "";
                            var i = "ThistimeList";
                            for (var j in optionsHtml[i]) {
                                stringContent += "<option  value='" + optionsHtml[i][j] + "'  >" + optionsHtml[i][j] + "</option>";
                            }
                            this.layerSelect.innerHTML = stringContent;
                            stringContent = "";

                            if (this.options.selectId != undefined) {
                                this.layerSelect.id = this.options.selectId;
                            }
                        }));
                    } else {
                        if (this.options.optionType == "custom") {
                            xhr(urlRoute(this.options.optionsurl), { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {
                                var stringContent = "";
                                for (var j in optionsHtml) {
                                    if (this.options.selectId == "gxWDate") {
                                        if(j==0){
                                            stringContent = "<option  value='20181022-20181028'  >20181022-20181028</option>" + "<option  value='" + optionsHtml[j] + "'  >" + optionsHtml[j] + "</option>";
                                        } else {
                                            if (optionsHtml[j] != "20181022-20181028") {
                                                stringContent += "<option  value='" + optionsHtml[j] + "'  >" + optionsHtml[j] + "</option>";
                                            }
                                        }
                                    }else{
                                        stringContent += "<option  value='" + optionsHtml[j] + "'  >" + optionsHtml[j] + "</option>";
                                    }
                                }
                                this.layerSelect.innerHTML = stringContent;
                                stringContent = "";

                                if (this.options.selectId != undefined) {
                                    this.layerSelect.id = this.options.selectId;
                                }

                                if (this.options.optionType == "custom" && this.options.isgo) {
                                    topic.publish("tool_status_change", this);
                                }
                            }));
                        }else{
                            xhr(urlRoute(this.options.optionsurl), { sync: true, handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {
                                var stringContent = "";
                                for (var j in optionsHtml) {
                                    stringContent += "<option  value='" + optionsHtml[j] + "'  >" + optionsHtml[j] + "</option>";
                                }
                                this.layerSelect.innerHTML = stringContent;
                                stringContent = "";

                                if (this.options.selectId != undefined) {
                                    this.layerSelect.id = this.options.selectId;
                                }
                            }));
                        }
                    }
                    // var innerOptions = "<option  value='SX'  >扇形</option><option  value='THIESS' >泰森多边形</option><option  value='CIRCLE' >圆形</option>";
                    //
                    // this.layerSelect.innerHTML = innerOptions;

                }
                if (!this.hasSubmit) {
                    dojo.connect(this.layerSelect, "onchange", lang.hitch(this, function () {
                        //$("text").attr("checked", false);
                        topic.publish("tool_status_change", this);
                    }));
                }
            }

            html.place(this.domNode, this.toolContainer);
            
            if (this.loaded) {
                if (this.options.optionType == "custom" && this.options.isgo) {
                    topic.publish("readlyTools", this);
                }
            }else{
                if (this.options.optionType == "custom" && this.options.isgo && this.options.optionsurl == undefined) {
                    topic.publish("tool_status_change", this);
                }
            }

            if (this.map.loaded) this._init(); else on.once(this.map, "load", lang.hitch(this, function () {
                this._init()
            }));
        } ,
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
        getformat: function (time, format) {
            var t = new Date(time);
            var tf = function (i) {
                return (i < 10 ? '0' : '') + i
            };
            return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
                switch (a) {
                    case 'yyyy':
                        return tf(t.getFullYear());
                        break;
                    case 'MM':
                        return tf(t.getMonth() + 1);
                        break;
                    case 'mm':
                        return tf(t.getMinutes());
                        break;
                    case 'dd':
                        return tf(t.getDate());
                        break;
                    case 'HH':
                        return tf(t.getHours());
                        break;
                    case 'ss':
                        return tf(t.getSeconds());
                        break;
                }
            })
        },
        getResult: function () {

            var result = "";
            var selectedValue = $(this.layerSelect).find('option:selected').val();
            //泰森多边形，扇形的工具只有动态方法
            if (this._toolActionType == "dynamic") {
                if (this.options.table_pre != undefined && (this.options.orderid == undefined || this.options.orderid == 0) && !this.options.disconnect_tureorfalse) {

                    return this.options.table_pre + "_" + selectedValue;

                } if (this.options.disconnect_tureorfalse) {
                    return this.options.table_pre + selectedValue;
                } else {

                    return selectedValue;

                }

            } else if (this._toolActionType == "query") {

                return selectedValue;

            } else if (this._toolActionType == "highlight") {

                return selectedValue;

            } else if (this._toolActionType == "dynamicfield") {

                return selectedValue;;
            }


            return "SelectTool";
        }

    });

});