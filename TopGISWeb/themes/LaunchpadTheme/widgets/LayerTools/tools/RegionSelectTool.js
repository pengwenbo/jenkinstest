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
    'dojo/text!./templates/RegionSelectTool.html',
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
        declaredClass: "widgets.LayerTools.tools.RegionSelectTool",
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
            this.map || (this.destroy(), console.log("SelectTool::map required"));

            if (!this.loaded) {

                if (this.options.label!=undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                

                if (this.options.citylabel!=undefined) {
                    this.CityLabel.innerHTML = this.options.citylabel;
                }
                if (this.options.countylabel != undefined) {
                    this.CountyLabel.innerHTML = this.options.countylabel;
                }
                if (this.options.gridlabel != undefined) {
                    this.GridLabel.innerHTML = this.options.gridlabel;
                }
                var headStr = {
                    "X-Requested-With": null
                };
                if (this.options.cityfield != undefined && this.options.cityfield!="") {
                    if (this.options.cityoptionshtml != undefined) {
                        //如果是配置里面已经有optionshtml则直接将这个html嵌入select tool中
                        this.layerCitySelect.innerHTML = this.options.cityoptionshtml;

                    } else if (this.options.cityoptionsurl != undefined) {
                        /**
                           根据url进行请求options
                       */
                       
                        xhr(this.options.cityoptionsurl, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {
        
                            this.layerCitySelect.innerHTML = optionsHtml;
        
                        }));  


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

                    if (this.options.countyoptionshtml != undefined) {
                        //如果是配置里面已经有optionshtml则直接将这个html嵌入select tool中
                        this.layerCountySelect.innerHTML = this.options.countyoptionshtml;

                    } else if (this.options.countyoptionsurl != undefined) {
                        /**
                           根据url进行请求options
                       */
                        if (this.options.countyoptionsurl.indexOf("{") > -1) {
                            var dataReg = /\{(.+)\}/;
                            if (dataReg.test(this.options.countyoptionsurl)) {
                                var rs = this.options.countyoptionsurl.match(dataReg);
                                if (rs[1] == "city") {

                                    var countyUrl = this.options.countyoptionsurl.replace("{city}", this.layerCitySelect.value);
                                    xhr(countyUrl, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsCounty) {
                                        var optionsHtml = "<option  value='所有' >所有</option>";
                                        for (var i = 0; i < optionsCounty.length;i++){
                                            optionsHtml += "<option  value='" + optionsCounty[i] + "' >" + optionsCounty[i] + "</option>";
                                        }
                                        this.layerCountySelect.innerHTML = optionsHtml;

                                    }));

                                    dojo.connect(this.layerCitySelect, "onchange", lang.hitch(this, function () {
                                        //$("text").attr("checked", false);
                                        domConstruct.empty(this.layerCountySelect);

                                        var countyNewUrl = this.options.countyoptionsurl.replace("{city}", this.layerCitySelect.value);
                                        xhr(countyNewUrl, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsCounty) {
                                            var optionsHtml = "<option  value='所有' >所有</option>";
                                            for (var i = 0; i < optionsCounty.length; i++) {
                                                optionsHtml += "<option  value='" + optionsCounty[i] + "' >" + optionsCounty[i] + "</option>";
                                            }
                                            this.layerCountySelect.innerHTML = optionsHtml;

                                        }));
                                    }));
                                }

                            }
                        } else {
                            xhr(this.options.countyoptionsurl, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {

                                this.layerCountySelect.innerHTML = optionsHtml;

                            }));

                        }
                 
                       


                    }
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



                if (this.options.gridfield != undefined && this.options.gridfield != "") {
                    /**
                         根据url进行请求options
                     */
                    if (this.options.countyoptionsurl.indexOf("{") > -1) {
                        var dataReg = /\{(.+)\}/;
                        if (dataReg.test(this.options.countyoptionsurl)) {
                            var rs = this.options.countyoptionsurl.match(dataReg);
                            var girdUrl = this.options.countyoptionsurl;
                            girdUrl = this.options.countyoptionsurl.replace("{city}", this.layerCitySelect.value);
                            girdUrl = girdUrl.replace("{county}", this.layerCountySelect.value);
                    
                            xhr(girdUrl, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsCounty) {
                                    var optionsHtml = "<option  value='所有' >所有</option>";
                                    for (var i = 0; i < optionsCounty.length; i++) {
                                        optionsHtml += "<option  value='" + optionsCounty[i] + "' >" + optionsCounty[i] + "</option>";
                                    }
                                    this.layerGridSelect.innerHTML = optionsHtml;

                                }));

                                dojo.connect(this.layerCitySelect, "onchange", lang.hitch(this, function () {
                                    //$("text").attr("checked", false);
                                    domConstruct.empty(this.layerGridSelect);
                                    var girdNewUrl = this.options.countyoptionsurl;
                                    girdNewUrl = this.options.countyoptionsurl.replace("{city}", this.layerCitySelect.value);
                                    girdNewUrl = girdNewUrl.replace("{county}", this.layerCountySelect.value);

                                    xhr(girdNewUrl, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsCounty) {
                                        var optionsHtml = "<option  value='所有' >所有</option>";
                                        for (var i = 0; i < optionsCounty.length; i++) {
                                            optionsHtml += "<option  value='" + optionsCounty[i] + "' >" + optionsCounty[i] + "</option>";
                                        }
                                        this.layerGridSelect.innerHTML = optionsHtml;

                                    }));

                                }));

                                dojo.connect(this.layerCountySelect, "onchange", lang.hitch(this, function () {
                                    //$("text").attr("checked", false);
                                    domConstruct.empty(this.layerGridSelect);
                                    var girdNewUrl = this.options.countyoptionsurl;
                                    girdNewUrl = this.options.countyoptionsurl.replace("{city}", this.layerCitySelect.value);
                                    girdNewUrl = girdNewUrl.replace("{county}", this.layerCountySelect.value);

                                    xhr(girdNewUrl, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsCounty) {
                                        var optionsHtml = "<option  value='所有' >所有</option>";
                                        for (var i = 0; i < optionsCounty.length; i++) {
                                            optionsHtml += "<option  value='" + optionsCounty[i] + "' >" + optionsCounty[i] + "</option>";
                                        }
                                        this.layerGridSelect.innerHTML = optionsHtml;

                                    }));

                                }));


                            }

                        
                    } else {
                        xhr(this.options.countyoptionsurl, { handleAs: 'json', method: 'GET', headers: headStr }).then(lang.hitch(this, function (optionsHtml) {

                            this.layerCountySelect.innerHTML = optionsHtml;

                        }));

                    }

                    if (!this.hasSubmit) {
                        dojo.connect(this.layerGridSelect, "onchange", lang.hitch(this, function () {
                            //$("text").attr("checked", false);
                            topic.publish("tool_status_change", this);
                        }));
                    }
                } else {
                    $(this.GridLabel).hide();
                    $(this.layerGridSelect).hide();
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