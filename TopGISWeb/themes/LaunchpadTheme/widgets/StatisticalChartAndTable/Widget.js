///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/_base/window',
    'dojo/window',
    'dojo/query',
    'dojo/on',
    'dojo/topic',
    'dojo/Deferred',
    'jimu/BaseWidget',
    'jimu/WidgetManager',
    'jimu/LayoutManager',
    'jimu/utils'
  ],
  function(declare, lang, array, html, domClass,domStyle, winBase, win, query, on,dojoTopic,
    Deferred, BaseWidget, WidgetManager, LayoutManager, utils) {
    /* global jimuConfig */
    /*jshint scripturl:true*/
    var clazz = declare([BaseWidget], {

      baseClass: 'jimu-widget-StatisticalChartAndTable jimu-main-background',
      name: 'StatisticalChartAndTable',
      isOpen:false,
      domWidth: '',


      constructor: function() {

      },

      postCreate: function() {
        this.own(dojoTopic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged)));
        this.own(dojoTopic.subscribe("switchBaseMap", lang.hitch(this, this.switchBaseMapChangeCss)));
        //this.inherited(arguments);
      },

      switchBaseMapChangeCss:function(type){

        if(type == "街道图"){
           //修改背景为白色
           domStyle.set(this.statisticalContent, "background", "rgba(255, 255, 255, 0.5)");
        }else if(type == "影像图"){
           //修改背景为黑色
           domStyle.set(this.statisticalContent, "background", "rgba(0, 0, 0, 0.5)");
        }

      },

      startup: function() {
        this.inherited(arguments);

        // Update UI:
        // Logo
        if (this.appConfig ) {

        }
        html.addClass(this.statisticalContent, "hide");

      },
      onAppConfigChanged: function(appConfig, reason, changedData) {
        this.appConfig = appConfig;
      },
      handleMove:function(){

         if(this.isOpen){
          domStyle.set(this.statisticalContent, {
            transform: 'translateX(' + this.domWidth + ')'
        
          });

          domClass.remove(this.statisticalBtn, 'fa-angle-right');
          domClass.add(this.statisticalBtn, 'fa-angle-left');
        }else{
          domStyle.set(this.statisticalContent, {
            transform: 'translateX(0)'
          });
  
          domClass.add(this.statisticalBtn, 'fa-angle-right');
          domClass.remove(this.statisticalBtn, 'fa-angle-left');
        }
        this.isOpen = !this.isOpen;
      },
      setPosition: function(position, containerNode){
        //For on-screen off-panel widget, layout manager will call this function
        //to set widget's position after load widget. If your widget will position by itself,
        //please override this function.
        this.position = position;
        var style = utils.getPositionStyle(this.position);
        style.position = 'absolute';
        style.width = 'auto';
        style.height = 'auto';
        if(!containerNode){
          if(position.relativeTo === 'map'){
            containerNode = this.map.id;
          }else{
            containerNode = window.jimuConfig.layoutId;
          }
        }

        html.place(this.domNode, containerNode);
        html.setStyle(this.domNode, style);
        if(this.started){
          setTimeout(lang.hitch(this, this.resize), 200);
        }
      },

      resize: function() {
        if(!this._started){
          return;
        }

      },
      onStatisticalOpen: function (params) {
         console.log(params);
         html.removeClass(this.statisticalContent, "hide");

         this.resizeNew(params.param.width,params.param.height);
      },
      onStatisticalClose: function () {
         this.isOpen = false;
         domClass.remove(this.statisticalBtn, 'fa-angle-right');
         domClass.add(this.statisticalBtn, 'fa-angle-left');
         html.addClass(this.statisticalContent, "hide");
      },

      resizeNew: function(newWidth,newHeight) {

        // var style = domStyle.getComputedStyle(this.statisticalContent);
        // style.width = newWidth;
        // style.height = newHeight;
        // domStyle.set(this.statisticalContent, style);
        this.domWidth = newWidth
  
        domStyle.set(this.statisticalContent, {
          width: newWidth,
          height: newHeight,
          transform: 'translateX(' + newWidth + ')'
        });
      },
      destroy: function() {
        this.inherited(arguments);
      }
    });
    return clazz;
  });
