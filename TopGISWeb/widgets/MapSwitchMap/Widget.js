///////////////////////////////////////////////////////////////////////////
//
//Created by GaoSong on 2017/11/14.
///////////////////////////////////////////////////////////////////////////

define([
        'dojo/_base/declare',
        'jimu/BaseWidget',
        "esri/dijit/LocateButton",
        'dojo/_base/html',
        'dojo/on',
        'dojo/_base/lang',
        'dojo/topic',
        'jimu/utils',
        'jimu/dijit/Message',
    
        'dojo/touch'
    ],
    function (declare, BaseWidget, LocateButton, html, on, lang,topic, jimuUtils) {
        var clazz = declare([BaseWidget], {

            name: 'StartLocation',
            baseClass: 'jimu-widget-Startlocation',

            startup: function () {
                this.inherited(arguments);
                this.placehoder = html.create('div', {
                    'class': 'place-holder',
                    title: this.label
                }, this.domNode);
                this.a_location=html.create('a',{
                    'class': '',
                    'href':"#"
                },this.placehoder);

                this.own(on(this.placehoder, 'click', lang.hitch(this, this.onStartLocationClick)));
            },
            onStartLocationClick:function () {
              
                if(this.a_location.className=="on") {
                    html.removeClass(this.a_location, "on");
                    this.map.getLayer("街道图").setVisibility(true);
                    this.map.getLayer("影像").setVisibility(false);
                    topic.publish("switchBaseMap","街道图");
                }else {
                    html.addClass(this.a_location, "on");
                    this.map.getLayer("街道图").setVisibility(false);
                    this.map.getLayer("影像").setVisibility(true);
                    topic.publish("switchBaseMap","影像图");
                }
            },

            destroy: function () {

            }
        });
        clazz.inPanel = false;
        clazz.hasUIFile = false;
        return clazz;
    });