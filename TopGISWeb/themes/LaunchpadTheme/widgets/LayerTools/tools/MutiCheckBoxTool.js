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
  'dojo/text!./templates/MutiCheckBoxTool.html',
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
  domAttr, domClass, html, domStyle, DateUtil, ArrayUtil, LayerUtil, CommonUtil, topic
) {

  return declare([_WidgetBase, _TemplatedMixin], {
    declaredClass: "widgets.LayerTools.tools.MutiCheckBoxTool",
    templateString: template,
    _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
    options: {
      theme: "ToolTemplate",
      map: null,
      visible: !0,
      layer: null
    },
    _toolValue: "",
    toolContainer: null,
    radioName: "mutiCheckbox",
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
      this.map || (this.destroy(), console.log("MutiCheckBoxTool::map required"));
      if (!this.loaded) {
        if (this.options.label != undefined) {
          this.ToolLabel.innerHTML = this.options.label;
        }
        if (this.options.selectId != undefined) {
          this.chksContent.id = this.options.selectId;
        }
        var checkboxes = this.options.checkboxes;
        if (checkboxes != undefined && checkboxes.length > 0) {
          array.forEach(checkboxes, lang.hitch(this, function (checkboxConfig) {
            var checkboxName = this.radioName;
            if (checkboxConfig.name) {
              checkboxName = checkboxConfig.name;
            }
            var checkboxdiv = domConstruct.create("div", {
              class: "checkbox-wrap"
            }, this.chksContent)
            var checkboxBtn = domConstruct.create("input", {
              type: "checkbox",
              id: checkboxConfig.id,
              value: checkboxConfig.value,
              class: "checkbox-input",
              name: checkboxName,
              orderid: checkboxConfig.orderid,
              checked: (checkboxConfig.checked == true ? true : false)
            }, checkboxdiv);
            var radioLabel = domConstruct.create("label", {
              innerHTML: checkboxConfig.label,
              style: checkboxConfig.label_style,
              class: 'checkbox-label'
            }, checkboxdiv);


            if (!this.hasSubmit) {
              dojo.connect(checkboxBtn, "onclick", lang.hitch(this, function () {
                topic.publish("tool_status_change", this);
              }));
            }

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

      if (this.map.loaded) this._init();
      else on.once(this.map, "load", lang.hitch(this, function () {
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
      var checkedChkbs = $("[name = '" + this.radioName + "']:checkbox:checked");
      checkedChkbs.sort(function (achkb, bchkb) {
        var aorderid = $(achkb).attr("orderid");
        var borderid = $(bchkb).attr("orderid");
        return aorderid - borderid;

      });

      for (var i = 0; i < checkedChkbs.length; i++) {
        var checkedChkb = checkedChkbs[i];
        var checkedValue = $(checkedChkb).val();
        if (this._toolActionType == "dynamic") {

          result = result + (i == 0 ? "" : "_") + checkedValue;

        } else if (this._toolActionType == "query") {

          result = result + " or " + checkedValue;

        } else if (this._toolActionType == "highlight") {

          result = result + " or " + checkedValue;
        }
      }


      //泰森多边形，扇形的工具只有动态方法

      return result;
    }

  });

});