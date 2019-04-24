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
    'dojo/text!./templates/JxghQyTimeTool.html',
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
        declaredClass: "widgets.LayerTools.tools.JxghQyTimeTool",
        templateString: template,
        _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "ToolTemplate", map: null, visible: !0, layer: null },
        _toolValue: "",
        toolContainer: null,
        _jxghQxNameFZ: "",
        _jxghQxNameQZ: "",
        _jxghQxNameXM: "",
        _jxghQxNameNP: "",
        _jxghQxNameND: "",
        _jxghQxNamePT: "",
        _jxghQxNameZZ: "",
        _jxghQxNameLY: "",
        _jxghQxNameSM: "",
        _jxghZcqTimeHtml: "",
        _jxghQxTimeHtml:"",
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
            this.map || (this.destroy(), console.log("SelectTool::map required"));

            if (!this.loaded) {

                if (this.options.label != undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                if (this.options.citylabel != undefined) {
                    this.CityLabel.innerHTML = this.options.citylabel;
                }
                if (this.options.countylabel != undefined) {
                    this.CountyLabel.innerHTML = this.options.countylabel;
                }

                var headStr = {
                    "X-Requested-With": null
                };

                if (this.options.cityfield != undefined && this.options.cityfield != "") {

                    if (this.options.cityoptionshtml != undefined) {

                        this.layerCitySelect.innerHTML = this.options.cityoptionshtml;

                    }

                    if (!this.hasSubmit) {
                        dojo.connect(this.layerCitySelect, "onchange", lang.hitch(this, function () {
                            //$("text").attr("checked", false);
                            topic.publish("tool_status_change", this);
                        }));
                    }

                } else {
                    $(this.CityLabel).hide();
                    $(this.layerCitySelect).hide();
                }
                if (this.options.countyfield != undefined && this.options.countyfield != "") {

                    this._jxghQxNameFZ = "<option  value='119.290201999,26.077432990,主城区'>主城区</option><option  value='119.34988,25.72288'>福清</option><option  value='119.135643,26.150650'>闽侯</option><option  value='119.505710,25.965672'>长乐</option><option  value='119.785606,25.504230'>平潭</option><option  value='119.537891,26.212287'>连江县</option><option  value='118.862003,26.223644'>闽清县</option><option  value='119.550914,26.489968'>罗源县</option><option  value='118.943469,25.862438'>永泰县</option>";
                    this._jxghQxNameQZ = "<option  value='118.670102000,24.877198999,主城区'>主城区</option><option  value='118.628763,24.739004'>石狮</option><option  value='118.570775,24.812345'>晋江</option><option  value='118.386910,24.968210'>南安</option><option  value='118.749392,24.903859'>惠安县</option><option  value='118.185248,25.054111'>安溪县</option><option  value='118.908646,25.130064'>泉港区</option><option  value='118.285603,25.324951'>永春县</option><option  value='118.240219,25.492804'>德化县</option>";
                    this._jxghQxNameXM = "<option  value='118.083111000,24.482371000,主城区'>主城区</option><option  value='118.237919,24.658964'>翔安</option><option  value='118.146808,24.725928'>同安</option><option  value='117.977235,24.485445'>海沧区</option><option  value='118.035793,24.641623'>集美区</option>";
                    this._jxghQxNameNP = "<option  value='118.171492999,26.644745000,主城区'>主城区</option><option  value='118.114913,27.344218'>建阳</option><option  value='117.334395,27.549049'>光泽县</option><option  value='118.859597,27.368452'>政和县</option><option  value='117.802105,26.805956'>顺昌县</option><option  value='118.52474,27.915971'>浦城县</option><option  value='118.780988,27.52957'>松溪县</option><option  value='118.325603,27.02724'>建瓯市</option><option  value='117.489773,27.287492'>邵武市</option><option  value='118.014779,27.746127'>武夷山</option><option  value='118.117533,26.580306'>延平水东街道</option>";
                    this._jxghQxNameND = "<option  value='119.520323000,26.670259999,主城区'>主城区</option><option  value='119.331762,27.10749'>周宁县</option><option  value='118.734716,26.582721'>古田县</option><option  value='119.651527,27.09057'>福安市</option><option  value='118.981616,26.913208'>屏南县</option><option  value='119.500552,27.46086'>寿宁县</option><option  value='119.893542,27.238342'>柘荣县</option><option  value='120.211836,27.32645'>福鼎市</option><option  value='120.019256,26.881711'>霞浦县</option><option  value='119.524658,26.6597'>蕉城漳湾镇</option>";
                    this._jxghQxNamePT = "<option  value='119.001728000,25.456864000,主城区'>主城区</option><option  value='119.106525,25.462822'>涵江区</option><option  value='118.700252,25.35297'>仙游县</option><option  value='119.096185,25.299886'>秀屿区</option><option  value='119.01022,25.442347'>城厢龙桥街道</option>";
                    this._jxghQxNameZZ = "<option  value='117.640432000,24.517783990,主城区'>主城区</option><option  value='117.172938,23.712516'>诏安县</option><option  value='117.423796,23.704133'>东山县</option><option  value='117.751244,24.624056'>长泰县</option><option  value='117.528205,25.005703'>华安县</option><option  value='117.33267,23.949039'>云霄县</option><option  value='117.362509,24.517144'>南靖县</option><option  value='117.809652,24.445997'>龙海市</option><option  value='117.310321,24.368293'>平和县</option><option  value='117.61072,24.125235'>漳浦县</option>";
                    this._jxghQxNameLY = "<option  value='117.011234999,25.078495990,主城区'>主城区</option><option  value='116.729272,24.722933'>永定区</option><option  value='116.752745,25.708316'>连城县</option><option  value='116.09637,25.096457'>武平县</option><option  value='116.4175,25.051751'>上杭县</option><option  value='117.422653,25.276586'>漳平市</option><option  value='116.342856,25.825516'>长汀县</option>";
                    this._jxghQxNameSM = "<option  value='117.632745000,26.266921999,主城区'>主城区</option><option  value='116.656266,26.26204'>宁化县</option><option  value='117.846765,25.693231'>大田县</option><option  value='117.171063,26.901045'>泰宁县</option><option  value='116.810589,26.176442'>清流县</option><option  value='118.196319,26.178264'>尤溪县</option><option  value='117.47109,26.730907'>将乐县</option><option  value='116.840255,26.831956'>建宁县</option><option  value='117.359724,25.973389'>永安市</option><option  value='117.785282,26.402726'>沙县</option><option  value='117.196828,26.360866'>明溪县</option><option  value='117.557343,26.19883'>三元荆西街道</option>";

                    this.layerCountySelect.innerHTML = this._jxghQxNameFZ;

                    dojo.connect(this.layerCitySelect, "onchange", lang.hitch(this, function () {
                        domConstruct.empty(this.layerCountySelect);
                        var cityName = this.layerCitySelect.value;
                        if (cityName == "福州") {
                            this.layerCountySelect.innerHTML = this._jxghQxNameFZ;
                        } else if (cityName == "泉州") {
                            this.layerCountySelect.innerHTML = this._jxghQxNameQZ;
                        } else if (cityName == "厦门") {
                            this.layerCountySelect.innerHTML = this._jxghQxNameXM;
                        } else if (cityName == "南平") {
                            this.layerCountySelect.innerHTML = this._jxghQxNameNP;
                        } else if (cityName == "宁德") {
                            this.layerCountySelect.innerHTML = this._jxghQxNameND;
                        } else if (cityName == "莆田") {
                            this.layerCountySelect.innerHTML = this._jxghQxNamePT;
                        } else if (cityName == "漳州") {
                            this.layerCountySelect.innerHTML = this._jxghQxNameZZ;
                        } else if (cityName == "龙岩") {
                            this.layerCountySelect.innerHTML = this._jxghQxNameLY;
                        } else if (cityName == "三明") {
                            this.layerCountySelect.innerHTML = this._jxghQxNameSM;
                        }
                        //this.options.timeSelectId == undefined || this.options.timeSelectId == ""时候为
                        //非联动时间选择时候进行的地市联动
                        if (this.options.timeSelectId == undefined || this.options.timeSelectId == "") {
                            var qylonlat = this.layerCountySelect.value.split(",");
                            topic.publish("map_centerAt", qylonlat[0], qylonlat[1]);
                        }

                        var jxghTime = $("#JxghTimeSelect").val();
                        var jxghCity = $("#layerCitySelect").val();
                        var queryData = {};
                        queryData.city = jxghCity;
                        queryData.date_id = jxghTime;

                        if (document.getElementById("cjTimeSelect")) {
                            var dataUrl = urlRoute("../proxy_to_92/WG_JZXN_JXGH11/Gis/getWeakCoverDataSourceDate");
                            $.ajax({
                                type: 'GET',
                                url: dataUrl,
                                data: queryData,
                                success: function (data) {
                                    if (data != "") {
                                        var optionsHtml = "<option  value='" + data + "' >" + data + "</option>";
                                        document.getElementById("cjTimeSelect").innerHTML = optionsHtml;
                                    } else {
                                        document.getElementById("cjTimeSelect").innerHTML = "<option  value='' >暂无数据</option>";
                                    }

                                }

                            });
                        }
                    }));
                    //this.options.timeSelectId == undefined || this.options.timeSelectId == ""时候为
                    //非联动时间选择时候进行的地市联动
                    dojo.connect(this.layerCountySelect, "onchange", lang.hitch(this, function () {
                        if (this.options.timeSelectId == undefined || this.options.timeSelectId == "") {
                            var qylonlat = this.layerCountySelect.value.split(",");
                            topic.publish("map_centerAt", qylonlat[0], qylonlat[1]);
                        }
                    }));

                    if (!this.hasSubmit) {
                        dojo.connect(this.layerCountySelect, "onchange", lang.hitch(this, function () {
                            //$("text").attr("checked", false);
                            topic.publish("tool_status_change", this);
                        }));
                    }

                } else {
                    $(this.CountyLabel).hide();
                    $(this.layerCountySelect).hide();

                }

                if (this.options.timeSelectId != undefined && this.options.timeSelectId != "") {

                    this._jxghZcqTimeHtml = "<option  value='20150525'>20150525</option>";
                    this._jxghQxTimeHtml = "<option  value='20150525'>20150525</option>";

                    xhr(urlRoute(this.options.zcqTimeUrl), { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsTime) {
                        var optionsHtml = "";
                        for (var i = 0; i < optionsTime.length; i++) {
                            optionsHtml += "<option  value='" + optionsTime[i] + "' >" + optionsTime[i] + "</option>";
                        }
                        this._jxghZcqTimeHtml = optionsHtml;

                    }));

                    xhr(urlRoute(this.options.qxTimeUrl), { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsTime) {
                        var optionsHtml = "";
                        for (var i = 0; i < optionsTime.length; i++) {
                            optionsHtml += "<option  value='" + optionsTime[i] + "' >" + optionsTime[i] + "</option>";
                        }
                        this._jxghQxTimeHtml = optionsHtml;

                    }));

                    dojo.connect(this.layerCitySelect, "onchange", lang.hitch(this, function () {
                        //var selectTimeId = this.options.timeSelectId;
                        //if (this.layerCountySelect.value.indexOf("主城区") > -1) {
                        //    document.getElementById(selectTimeId).innerHTML = this._jxghZcqTimeHtml;
                        //} else {
                        //    document.getElementById(selectTimeId).innerHTML = this._jxghQxTimeHtml;
                        //}
                        var qylonlat = this.layerCountySelect.value.split(",");
                        topic.publish("map_centerAt", qylonlat[0], qylonlat[1]);

                    }));

                    dojo.connect(this.layerCountySelect, "onchange", lang.hitch(this, function () {
                        //var selectTimeId = this.options.timeSelectId;
                        //if (this.layerCountySelect.value.indexOf("主城区") > -1) {
                        //    document.getElementById(selectTimeId).innerHTML = this._jxghZcqTimeHtml;
                        //} else {
                        //    document.getElementById(selectTimeId).innerHTML = this._jxghQxTimeHtml;
                        //}
                        var qylonlat = this.layerCountySelect.value.split(",");
                        topic.publish("map_centerAt", qylonlat[0], qylonlat[1]);

                    }));

                    if (!this.hasSubmit) {
                        dojo.connect(this.layerTimeSelect, "onchange", lang.hitch(this, function () {
                            //$("text").attr("checked", false);
                            topic.publish("tool_status_change", this);
                        }));
                    }
                }

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



            return "SelectTool";
        }

    });

});