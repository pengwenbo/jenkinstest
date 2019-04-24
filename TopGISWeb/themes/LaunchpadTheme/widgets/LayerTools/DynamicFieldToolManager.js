define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/topic',
  'dojo/on',
  'dojo/string',
    "esri/tasks/GenerateRendererTask",
  "esri/tasks/GenerateRendererParameters",
  "esri/tasks/AlgorithmicColorRamp",
  "esri/tasks/UniqueValueDefinition",
  "esri/tasks/ClassBreaksDefinition",
  "esri/Color",
  "esri/layers/LayerDrawingOptions",
  "esri/renderers/UniqueValueRenderer",
  "esri/symbols/SimpleFillSymbol",
   "esri/symbols/SimpleLineSymbol",
   "esri/symbols/SimpleMarkerSymbol"
],
function (declare, lang, array, topic, on, string, GenerateRendererTask, GenerateRendererParameters, AlgorithmicColorRamp, UniqueValueDefinition,
    ClassBreaksDefinition, Color, LayerDrawingOptions, UniqueValueRenderer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol) {
    var instance = null,
        clazz = declare(null, {
            defaultFromColor: "#33FF22",
            defaultToColor: "#FF2233",

            constructor: function (/*Object*/ options) {


            },
            processTools: function (currentToolDijit) {
                console.log("动态字段切换工具处理类，正在处理...");
         
                if (currentToolDijit != undefined) {
                    var dynamicFieldObj = JSON.parse(currentToolDijit.getResult().replace(/'/g,"\""));
                    var fieldName = dynamicFieldObj.field;
                    var rendererType = dynamicFieldObj.rendererType;

                    var layer = currentToolDijit.options.layer;

                    var queryUrl = layer.url;
                    var dynamicSource = null;
                    if (layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                        if (layer.dynamicLayerInfos != undefined && layer.dynamicLayerInfos.length != 0 ) {
                            var layerSource = layer.dynamicLayerInfos[0].source;
                            if (layerSource.declaredClass != "esri.layers.LayerMapSource") {
                                dynamicSource = layerSource;
                                queryUrl = queryUrl + "/dynamicLayer";
                            } else {
                                queryUrl = queryUrl + "/0";
                            }
                          
                        } else {
                            queryUrl = queryUrl + "/0";
                        }


                    } else if (layer.declaredClass == "esri.layers.FeatureLayer") {
                        if (layer.source != undefined) {
                            dynamicSource = layer.source ;
                            queryUrl = queryUrl.substring(0, queryUrl.length - 2) + "/dynamicLayer";
                        }

                    }
                    console.log(queryUrl);
                    var generateRendererParams = new GenerateRendererParameters();
                    var generateRendererTask = new GenerateRendererTask(queryUrl);
                    if (dynamicSource != null) {
                        generateRendererTask.source = dynamicSource;
                    }
                  
                    var acolorRamp = new AlgorithmicColorRamp();
                    acolorRamp.algorithm = "hsv";
                    if (dynamicFieldObj.fromColor != undefined) {
                        acolorRamp.fromColor = Color.fromHex(dynamicFieldObj.fromColor);
                    } else {
                        acolorRamp.fromColor = Color.fromHex(this.defaultFromColor);
                    }
                    if (dynamicFieldObj.toColor != undefined) {
                        acolorRamp.toColor = Color.fromHex(dynamicFieldObj.toColor);
                    } else {
                        acolorRamp.toColor = Color.fromHex(this.defaultToColor);
                    }
                    if (rendererType == "classbreak" || rendererType == "unique") {
                        if (rendererType == "classbreak") {
                            var classBreaksDefinition = new ClassBreaksDefinition();
                            classBreaksDefinition.breakCount = 5;
                            classBreaksDefinition.classificationField = fieldName;
                            classBreaksDefinition.classificationMethod = "geometrical-interval";
                            classBreaksDefinition.colorRamp = acolorRamp;

                            generateRendererParams.classificationDefinition = classBreaksDefinition;
                        } else if (rendererType == "unique") {
                            var classificationDefinition = new UniqueValueDefinition();
                            var fieldName2 = dynamicFieldObj.field2;
                            var fieldName3 = dynamicFieldObj.field3;
                            classificationDefinition.attributeField = fieldName;
                            if (fieldName2 != undefined && fieldName2 != "") {
                                classificationDefinition.attributeField2 = fieldName2;
                            }
                            if (fieldName3 != undefined && fieldName3 != "") {
                                classificationDefinition.attributeField3 = fieldName3;
                            }

                            classificationDefinition.colorRamp = acolorRamp;
                            generateRendererParams.classificationDefinition = classificationDefinition;
                        }
                        generateRendererTask.execute(generateRendererParams).then(lang.hitch(this, function (resultRender) {
                            if (layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                                var dynamicDrawOpts = layer.layerDrawingOptions;
                                if (dynamicDrawOpts != undefined) {
                                    for (var i = 0; i < dynamicDrawOpts.length; i++) {
                                        var ldrawOpt = dynamicDrawOpts[i];
                                        ldrawOpt.renderer = resultRender;
                                    }

                                } else {
                                    dynamicDrawOpts = [];
                                    var drawingOptions = new LayerDrawingOptions();
                                    drawingOptions.renderer = resultRender;
                                    dynamicDrawOpts.push(drawingOptions);

                                }
                                layer.setLayerDrawingOptions(dynamicDrawOpts);
                                //layer.layerDrawingOptions = dynamicDrawOpts;
                                //layer.refresh();

                            } else if (layer.declaredClass == "esri.layers.FeatureLayer") {

                                layer.setRenderer(resultRender);
                                layer.refresh();
                            }

                            console.log(resultRender);

                        }));
                    }
                    else if (rendererType == "unique10") {
                        var unique10Renderer = new UniqueValueRenderer();
                        unique10Renderer.attributeField = fieldName;

                        if (dynamicFieldObj.geometryType == "point") {
                            var uvInfo0 = {};
                            uvInfo0.value = "0";
                            uvInfo0.label = "否";
                            var sfsSourceymbol0 = new SimpleMarkerSymbol();
                            sfsSourceymbol0.color = 0x00CC66;
                            sfsSourceymbol0.alpha = 1;
                            sfsSourceymbol0.size = 10;
                            sfsSourceymbol0.style = SimpleMarkerSymbol.STYLE_CIRCLE;
                            var sSourcebianSym = new SimpleLineSymbol();
                            sSourcebianSym.color = 0xFFFFFF;
                            sSourcebianSym.width = 1;
                            sfsSourceymbol0.outline = sSourcebianSym;
                            uvInfo0.symbol = sfsSourceymbol0;

                            var sfsSourceymbol1 = new SimpleMarkerSymbol();
                            sfsSourceymbol1.color = 0xFF0066;
                            sfsSourceymbol1.alpha = 1;
                            sfsSourceymbol1.size = 10;
                            sfsSourceymbol1.style = SimpleMarkerSymbol.STYLE_CIRCLE;
                            sfsSourceymbol1.outline = sSourcebianSym;
                            var uvInfo1 = {};
                            uvInfo1.value = "1";
                            uvInfo1.label = "是";
                            uvInfo1.symbol = sfsSourceymbol1;
                            unique10Renderer.infos = [uvInfo0, uvInfo1];
                            var sfsSourceymbol = new SimpleMarkerSymbol();
                            sfsSourceymbol.color = 0x999999;
                            sfsSourceymbol.alpha = 1;
                            sfsSourceymbol.size = 10;
                            sfsSourceymbol.style = SimpleMarkerSymbol.STYLE_CIRCLE;
                            sfsSourceymbol.outline = sSourcebianSym;
                            unique10Renderer.defaultLabel = "未匹配小区";
                            unique10Renderer.defaultSymbol = sfsSourceymbol;

                        } else {
                            var uvInfo0 = {};
                            uvInfo0.value = "0";
                            uvInfo0.label = "否";
                            var sfsSourceymbol0 = new SimpleFillSymbol();
                            sfsSourceymbol0.color = 0x00CC66;
                            sfsSourceymbol0.alpha = 1;

                            var sSourcebianSym = new SimpleLineSymbol();
                            sSourcebianSym.color = 0xFFFFFF;
                            sSourcebianSym.width = 1;
                            sfsSourceymbol0.outline = sSourcebianSym;
                            uvInfo0.symbol = sfsSourceymbol0;

                            var sfsSourceymbol1 = new SimpleFillSymbol();
                            sfsSourceymbol1.color = 0xFF0066;
                            sfsSourceymbol1.alpha = 1;
                            sfsSourceymbol1.outline = sSourcebianSym;
                            var uvInfo1 = {};
                            uvInfo1.value = "1";
                            uvInfo1.label = "是";
                            uvInfo1.symbol = sfsSourceymbol1;
                            unique10Renderer.infos = [uvInfo0, uvInfo1];
                            var sfsSourceymbol = new SimpleFillSymbol();
                            sfsSourceymbol.color = 0x999999;
                            sfsSourceymbol.alpha = 1;
                            sfsSourceymbol.outline = sSourcebianSym;
                            unique10Renderer.defaultLabel = "未匹配小区";
                            unique10Renderer.defaultSymbol = sfsSourceymbol;
                        }
                       
						
                        if (layer.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer") {
                            var dynamicDrawOpts = layer.layerDrawingOptions;
                            if (dynamicDrawOpts != undefined) {
                                for (var i = 0; i < dynamicDrawOpts.length; i++) {
                                    var ldrawOpt = dynamicDrawOpts[i];
                                    ldrawOpt.renderer = unique10Renderer;
                                }

                            } else {
                                dynamicDrawOpts = [];
                                var drawingOptions = new LayerDrawingOptions();
                                drawingOptions.renderer = unique10Renderer;
                                dynamicDrawOpts.push(drawingOptions);

                            }
                            layer.setLayerDrawingOptions(dynamicDrawOpts);
                            //layer.layerDrawingOptions = dynamicDrawOpts;
                            //layer.refresh();

                        } else if (layer.declaredClass == "esri.layers.FeatureLayer") {

                            layer.setRenderer(unique10Renderer);
                            layer.refresh();
                        }
                    }
          
                   
                }
                return fieldName;
            }




        });
    clazz.getInstance = function (options) {
        if (instance === null) {
            instance = new clazz(options);
        }
        return instance;
    };

    return clazz;


});
