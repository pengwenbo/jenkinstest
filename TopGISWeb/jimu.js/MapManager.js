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
  'dojo/query',
  'dojo/topic',
  'dojo/on',
  'dojo/aspect',
  'dojo/keys',
  'dojo/i18n',
  'dojo/_base/config',
  './dijit/LoadingShelter',
  'esri/dijit/InfoWindow',
  'esri/dijit/PopupMobile',
  'esri/InfoTemplate',
  'esri/request',
  'esri/arcgis/utils',
  'esri/geometry/Extent',
  'esri/geometry/Point',
  'esri/geometry/webMercatorUtils',
  'esri/SpatialReference',
  'esri/symbols/PictureMarkerSymbol',
  'esri/graphic',
  'require',
  './utils',
  'jimu/LayerInfos/LayerInfos',
  'jimu/dijit/Message',
  'esri/renderers/HeatmapRenderer',
  'jimu/dijit/AppStatePopup',
  './MapUrlParamsHandler',
  './AppStateManager',
  './PopupManager',
  './WidgetManager',
  './ConfigManager',
  'esri/mgrs/MGRSLayer',
  'esri/Color',
  'esri/layers/LayerDrawingOptions',
  'esri/renderers/Renderer',
  'esri/renderers/SimpleRenderer',
  'esri/renderers/ClassBreaksRenderer',
  'esri/renderers/UniqueValueRenderer',
  'esri/clusterlayer/clusterfeaturelayer',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  'esri/layers/GraphicsLayer',
  "esri/renderers/jsonUtils",
  './FilterManager'
], function (declare, lang, array, html, query, topic, on, aspect, keys, i18n, dojoConfig, LoadingShelter, InfoWindow,
  PopupMobile, InfoTemplate, esriRequest, arcgisUtils, Extent, Point, webMercatorUtils, SpatialReference, PictureMarkerSymbol, Graphic, require, jimuUtils,
  LayerInfos, Message, HeatmapRenderer, AppStatePopup, MapUrlParamsHandler, AppStateManager, PopupManager, WidgetManager, ConfigManager, MGRSLayer, Color, LayerDrawingOptions, Renderer,
  SimpleRenderer, ClassBreaksRenderer, UniqueValueRenderer, ClusterFeatureLayer, SimpleFillSymbol,
  SimpleLineSymbol, Query, QueryTask, GraphicsLayer, renderJsonUtils, FilterManager) {
    var instance = null,
      infos = {},
      dynamicLayerInfos, popSizes = {};
    clazz = declare(null, {
      appConfig: null,
      mapDivId: '',
      map: null,
      previousInfoWindow: null,
      mobileInfoWindow: null,
      isMobileInfoWindow: false,

      layerInfosObj: null,

      getLayerInfos: [],
      _playerInfo: null,

      charttableList: {},
      chartLayerArray: [],

      constructor: function ( /*Object*/ options, mapDivId) {
        this.appConfig = options.appConfig;
        this.urlParams = options.urlParams;
        this.mapDivId = mapDivId;
        this.id = mapDivId;
        this.appStateManager = AppStateManager.getInstance(this.urlParams);
        this.popupManager = PopupManager.getInstance(this);
        this.filterManager = FilterManager.getInstance();
        this.nls = window.jimuNls;
        topic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged));
        topic.subscribe("syncExtent", lang.hitch(this, this.onSyncExtent));
        topic.subscribe("mapContentModified", lang.hitch(this, this.onMapContentModified));
        /**
         * 新增图层控制事件
         */
        topic.subscribe("layer_checked", lang.hitch(this, this.layerCheckedHander));
        topic.subscribe("map_centerAt", lang.hitch(this, this.centerAtHander));
        //新增end
        on(window, 'resize', lang.hitch(this, this.onWindowResize));
        on(window, 'beforeunload', lang.hitch(this, this.onBeforeUnload));
      },

      showMap: function () {
        // console.timeEnd('before map');
        this._showMap(this.appConfig);
      },

      _showMap: function (appConfig) {
        // console.timeEnd('before map');
        console.time('Load Map');
        this.loading = new LoadingShelter();
        this.loading.placeAt(this.mapDivId);
        this.loading.startup();
        //for now, we can't create both 2d and 3d map
        if (appConfig.map['3D']) {
          if (appConfig.map.itemId) {
            this._show3DWebScene(appConfig);
          } else {
            this._show3DLayersMap(appConfig);
          }
        } else {
          if (appConfig.map.itemId) {
            this._show2DWebMap(appConfig);
          } else {
            this._show2DLayersMap(appConfig);
          }
        }
      },
      _show2DLayersMap: function (appConfig) {

        require(['esri/map'], lang.hitch(this, function (Map) {
          var map = new Map(this.mapDivId, this._processMapOptions(appConfig.map.mapOptions));
          this._visitConfigMapLayers(appConfig, lang.hitch(this, function (layerConfig) {
            this.createLayer(map, '2D', layerConfig);
          }));
          this.map = map;


          var popWin = this.map.infoWindow;

          popWin.on("selection-change", lang.hitch(this, function (selEvt) {
            var featureSelect = popWin.getSelectedFeature(); //获得弹出的要素
            if (featureSelect && featureSelect.getLayer()) {
              var layer = featureSelect.getLayer() //获得弹出的要素所属的图层
              var csLayerId = layer.id;
              if (layer.id.indexOf("|") > -1) {
                csLayerId = layer.id.substring(0, layer.id.indexOf("|"));
              }

              if (layer && popSizes[csLayerId]) {
                if (popSizes[csLayerId].tableFields) {
                  var mapDiv = document.getElementById("map_layers");
                  mapDiv.style.cursor = "wait";
                  this.map.infoWindow.resize(popSizes[csLayerId].width, popSizes[csLayerId].height);
                  this._getPopTableList(layer, popSizes[csLayerId].params, popSizes[csLayerId].tableFields, popSizes[csLayerId].serverUrl, featureSelect);
                } else if (popSizes[csLayerId].interFaceType) {
                  this.map.infoWindow.features = null;
                  this.map.infoWindow.hide();
                  //ShowRightPop(popSizes[csLayerId].interFaceType, featureSelect.attributes);
                } else {
                  var sizes = popSizes[csLayerId].split(",");
                  this.map.infoWindow.resize(sizes[0], sizes[1]);
                }
              }


            }
          }));

          this.map.itemInfo = this._obtainMapLayers();
          this.layerInfosObj = LayerInfos.getInstanceSyncForInit(map, map.itemInfo);

          this._publishMapEvent(map);

          //setTimeout(lang.hitch(this,function(){
          //
          //  //esriPopup   map
          //  var ss =  query(".esriPopup",dojo.byId("map_root"));
          //  html.setStyle(ss[0],"z-index",200);
          //}),3000);
          this.loading.hide();
          this._addDataLoadingOnMapUpdate(map);


          if (this.map.itemId) {
            LayerInfos.getInstance(this.map, this.map.itemInfo)
              .then(lang.hitch(this, function (operLayerInfos) {
                this.operLayerInfos = operLayerInfos;
              }));
          } else {
            var itemInfo = this._obtainMapLayers();
            this.map.itemInfo = itemInfo;
            LayerInfos.getInstance(this.map, itemInfo)
              .then(lang.hitch(this, function (operLayerInfos) {
                this.operLayerInfos = operLayerInfos;
              }));
          }
          //添加鼠标右击事件

        }));
      },
      _obtainMapLayers: function () {
        // summary:
        //    obtain basemap layers and operational layers if the map is not webmap.
        var basemapLayers = [],
          operLayers = [];
        // emulate a webmapItemInfo.
        var retObj = {
          itemData: {
            baseMap: {
              baseMapLayers: []
            },
            operationalLayers: []
          }
        };
        array.forEach(this.map.graphicsLayerIds, function (layerId) {
          var layer = this.map.getLayer(layerId);
          if (layer.isOperationalLayer) {
            operLayers.push({
              layerObject: layer,
              title: layer.label || layer.title || layer.name || layer.id || " ",
              id: layer.id || " "
            });
          }
        }, this);
        array.forEach(this.map.layerIds, function (layerId) {
          var layer = this.map.getLayer(layerId);
          if (layer.isOperationalLayer) {
            operLayers.push({
              layerObject: layer,
              title: layer.label || layer.title || layer.name || layer.id || " ",
              id: layer.id || " "
            });
          } else {
            basemapLayers.push({
              layerObject: layer,
              id: layer.id || " "
            });
          }
        }, this);

        retObj.itemData.baseMap.baseMapLayers = basemapLayers;
        retObj.itemData.operationalLayers = operLayers;
        return retObj;
      },
      _getPopTableList: function (layer, params, tableFields, serverUrl, featureSelect) {
        var headStr = {
          "X-Requested-With": null
        };

        var paramStr = "";

        for (var i = 0; i < params.length; i++) {
          if (i == 0) {
            if (params[i].format) {
              paramStr += "?" + params[i].name + "=" + (params[i].value.indexOf("$") > -1 ? this._format(new Date(featureSelect.attributes[params[i].value.replace("$", "")]), params[i].format) : params[i].value);
            } else {
              paramStr += "?" + params[i].name + "=" + (params[i].value.indexOf("$") > -1 ? featureSelect.attributes[params[i].value.replace("$", "")] : params[i].value);
            }
          } else {
            if (params[i].format) {
              paramStr += "&" + params[i].name + "=" + (params[i].value.indexOf("$") > -1 ? this._format(new Date(featureSelect.attributes[params[i].value.replace("$", "")]), params[i].format) : params[i].value);
            } else {
              paramStr += "&" + params[i].name + "=" + (params[i].value.indexOf("$") > -1 ? featureSelect.attributes[params[i].value.replace("$", "")] : params[i].value);
            }
          }
        }
        //var time = this._format(new Date(featureSelect.attributes.VDATE_D),"yyyy-MM-dd");
        //var city = featureSelect.attributes.CITY;
        //var grid_id = featureSelect.attributes.GRID_ID;
        //var tableName = "weekcover_cell_10";

        xhr(this._urlRoute(serverUrl) + paramStr, {
          handleAs: 'json',
          method: 'GET',
          headers: headStr
        }).then(lang.hitch(this, function (resultList) {
          this._tableHtmlGet(layer, tableFields, resultList);
        }));
      },
      onBeforeUnload: function () {
        if (this.appConfig.keepAppState) {
          this.appStateManager.saveWabAppState(this.map, this.layerInfosObj);
        }
      },

      onWindowResize: function () {
        if (this.map && this.map.resize) {
          this.map.resize();
          this.resetInfoWindow(false);
        }
      },

      getMapInfoWindow: function () {
        return {
          mobile: this._mapMobileInfoWindow,
          bigScreen: this._mapInfoWindow
        };
      },

      resetInfoWindow: function (isNewMap) {
        if (isNewMap) {
          this._mapInfoWindow = this.map.infoWindow;
          if (this._mapMobileInfoWindow) {
            this._mapMobileInfoWindow.destroy();
            // working around for bug of destroying _mapMobileInfoWindow is not completely.
            query("div.esriMobileInfoView.esriMobilePopupInfoView").forEach(function (node) {
              html.destroy(node);
            });
            query("div.esriMobileNavigationBar").forEach(function (node) {
              html.destroy(node);
            });
          }
          this._mapMobileInfoWindow =
            new PopupMobile(null, html.create("div", null, null, this.map.root));
          this.isMobileInfoWindow = false;
        }
        if (jimuUtils.inMobileSize() && !this.isMobileInfoWindow) {
          this.map.infoWindow.hide();
          this.map.setInfoWindow(this._mapMobileInfoWindow);
          this.isMobileInfoWindow = true;
        } else if (!jimuUtils.inMobileSize() && this.isMobileInfoWindow) {
          this.map.infoWindow.hide();
          this.map.setInfoWindow(this._mapInfoWindow);
          this.isMobileInfoWindow = false;
        }
      },

      onSyncExtent: function (map) {
        if (this.map) {
          var extJson = map.extent;
          var ext = new Extent(extJson);
          this.map.setExtent(ext);
        }
      },

      _visitConfigMapLayers: function (appConfig, cb) {
        array.forEach(appConfig.map.basemaps, function (layerConfig, i) {
          layerConfig.isOperationalLayer = false;
          cb(layerConfig, i);
        }, this);

        array.forEach(appConfig.map.operationallayers, function (layerConfig, i) {
          layerConfig.isOperationalLayer = true;
          cb(layerConfig, i);
        }, this);
      },

      _show3DLayersMap: function (appConfig) {
        require(['esri3d/Map'], lang.hitch(this, function (Map) {
          var initCamera = appConfig.map.mapOptions.camera,
            map;
          map = new Map(this.mapDivId, {
            camera: initCamera
          });
          this._visitConfigMapLayers(appConfig, lang.hitch(this, function (layerConfig) {
            this.createLayer(map, '3D', layerConfig);
          }));
          map.usePlugin = Map.usePlugin;
          this._publishMapEvent(map);
        }));
      },

      _show3DWebScene: function (appConfig) {
        this._getWebsceneData(appConfig.map.itemId).then(lang.hitch(this, function (data) {
          require(['esri3d/Map'], lang.hitch(this, function (Map) {
            var map = new Map(this.mapDivId, appConfig.map.mapOptions);

            array.forEach(data.itemData.operationalLayers, function (layerConfig) {
              this.createLayer(map, '3D', layerConfig);
            }, this);

            array.forEach(data.itemData.baseMap.baseMapLayers, function (layerConfig) {
              layerConfig.type = "tile";
              this.createLayer(map, '3D', layerConfig);
            }, this);

            array.forEach(data.itemData.baseMap.elevationLayers, function (layerConfig) {
              layerConfig.type = "elevation";
              this.createLayer(map, '3D', layerConfig);
            }, this);

            map.toc = data.itemData.toc;
            map.bookmarks = data.itemData.bookmarks;
            map.tours = data.itemData.tours;
          }));
        }));
      },

      _publishMapEvent: function (map) {
        //add this property for debug purpose
        window._viewerMap = map;

        MapUrlParamsHandler.postProcessUrlParams(this.urlParams, map);

        console.timeEnd('Load Map');
        if (this.map) {
          this.map = map;
          this.resetInfoWindow(true);
          console.log('map changed.');
          topic.publish('mapChanged', this.map, this.layerInfosObj);
        } else {
          this.map = map;
          this.resetInfoWindow(true);
          topic.publish('mapLoaded', this.map, this.layerInfosObj);
        }
      },

      _getWebsceneData: function (itemId) {
        return esriRequest({
          url: 'http://184.169.133.166/sharing/rest/content/items/' + itemId + '/data',
          handleAs: "json"
        });
      },

      _show2DWebMap: function (appConfig) {
        //should use appConfig instead of this.appConfig, because appConfig is new.
        // if (appConfig.portalUrl) {
        //   var url = portalUrlUtils.getStandardPortalUrl(appConfig.portalUrl);
        //   agolUtils.arcgisUrl = url + "/sharing/content/items/";
        // }
        if (!appConfig.map.mapOptions) {
          appConfig.map.mapOptions = {};
        }
        var mapOptions = this._processMapOptions(appConfig.map.mapOptions) || {};
        mapOptions.isZoomSlider = false;

        var webMapPortalUrl = appConfig.map.portalUrl;
        var webMapItemId = appConfig.map.itemId;
        var webMapOptions = {
          mapOptions: mapOptions,
          bingMapsKey: appConfig.bingMapsKey,
          usePopupManager: true
        };

        if (!window.isBuilder && !appConfig.mode && appConfig.map.appProxy &&
          appConfig.map.appProxy.mapItemId === appConfig.map.itemId) {
          var layerMixins = [];
          array.forEach(appConfig.map.appProxy.proxyItems, function (proxyItem) {
            if (proxyItem.useProxy && proxyItem.proxyUrl) {
              layerMixins.push({
                url: proxyItem.sourceUrl,
                mixin: {
                  url: proxyItem.proxyUrl
                }
              });
            }
          });

          if (layerMixins.length > 0) {
            webMapOptions.layerMixins = layerMixins;
          }
        }

        var mapDeferred = this._createWebMapRaw(webMapPortalUrl, webMapItemId, this.mapDivId, webMapOptions);

        mapDeferred.then(lang.hitch(this, function (response) {
          var map = response.map;

          //hide the default zoom slider
          map.hideZoomSlider();

          // set default size of infoWindow.
          map.infoWindow.resize(270, 316);
          //var extent;
          map.itemId = appConfig.map.itemId;
          map.itemInfo = response.itemInfo;
          map.webMapResponse = response;
          // enable snapping
          var options = {
            snapKey: keys.copyKey
          };
          map.enableSnapping(options);

          html.setStyle(map.root, 'zIndex', 0);

          map._initialExtent = map.extent;

          this.layerInfosObj = LayerInfos.getInstanceSyncForInit(map, map.itemInfo);

          //save layer's original refreshInterval
          this.layerInfosObj.getLayerInfoArrayOfWebmap().forEach(function (layerInfo) {
            layerInfo.getLayerObject().then(lang.hitch(this, function (layerObject) {
              if (layerObject) {
                lang.setObject("_wabProperties.originalRefreshinterval", layerObject.refreshInterval, layerObject);
              }
            }), lang.hitch(this, function (err) {
              console.error("can't get layerObject", err);
            }));
          }, this);

          if (appConfig.map.mapRefreshInterval && !appConfig.map.mapRefreshInterval.useWebMapRefreshInterval) {
            this._updateRefreshInterval(appConfig.map.mapRefreshInterval);
          }

          this._showUnreachableLayersTitleMessage();
          this._publishMapEvent(map);
          setTimeout(lang.hitch(this, this._checkAppState), 500);
          this._addDataLoadingOnMapUpdate(map);
        }), lang.hitch(this, function (error) {
          console.error(error);
          this._showError(error);
          topic.publish('mapCreatedFailed');
        }));
      },

      _handleRefreshLayer: function (featureLayer) {
        // var layerId = "Wildfire_5334";
        //before refresh => update-start => after refresh => get data => graphic-remove => graphic-add => update-end
        var _drawFeatures = featureLayer._mode._drawFeatures;
        var _clearIf = featureLayer._mode._clearIIf;
        var _cellMap = null;
        featureLayer._mode._drawFeatures = function (response, cell) {
          /*jshint unused: false*/
          // console.log(response);
          if (cell && typeof cell.row === 'number' && typeof cell.col === 'number') {
            featureLayer._mode._removeCell(cell.row, cell.col);
          }
          _drawFeatures.apply(featureLayer._mode, arguments);
        };
        aspect.before(featureLayer, 'refresh', function () {
          // console.log("before refresh");
          _cellMap = featureLayer._mode._cellMap;
          featureLayer._mode._clearIIf = function () { };
        });
        aspect.after(featureLayer, 'refresh', function () {
          // console.log("after refresh");
          featureLayer._mode._cellMap = _cellMap;
          featureLayer._mode._clearIIf = _clearIf;
        });

        on(featureLayer, 'update-start', function () {
          // console.log('update-start');
          featureLayer.isUpdating = true;
        });

        on(featureLayer, 'update-end', function () {
          // console.log('update-end');
          featureLayer.isUpdating = false;
        });

        // on(featureLayer, 'graphic-add', function(){
        //   console.log('graphic-add');
        // });

        // on(featureLayer, 'graphic-remove', function(){
        //   console.log('graphic-remove');
        // });

        // on(featureLayer, 'graphics-clear', function(){
        //   console.log('graphics-clear');
        // });
      },

      _showError: function (err) {
        if (err && err.message) {
          html.create('div', {
            'class': 'app-error',
            innerHTML: err.message
          }, document.body);
        }
      },

      _createWebMapRaw: function (webMapPortalUrl, webMapItemId, mapDivId, webMapOptions) {
        var mapDef = jimuUtils.createWebMap(webMapPortalUrl, webMapItemId, mapDivId, webMapOptions);
        return mapDef.then(lang.hitch(this, function (response) {
          return response;
        }), lang.hitch(this, function (error) {
          console.error(error);
          if (error && error instanceof Error && error.message) {
            var cache = i18n.cache;
            var key = "esri/nls/jsapi/" + dojoConfig.locale;
            /*if(dojoConfig.locale !== 'en'){
              key += "/" + dojoConfig.locale;
            }*/
            var esriLocaleNls = cache[key];
            var str = lang.getObject("arcgis.utils.baseLayerError", false, esriLocaleNls);
            if (str && error.message.indexOf(str) >= 0) {
              //The original basemap is not available. We can create the webmap with another basemap layer.
              new Message({
                message: window.jimuNls.map.basemapNotAvailable + window.jimuNls.map.displayDefaultBasemap
              });
              return arcgisUtils.getItem(webMapItemId).then(lang.hitch(this, function (itemInfo) {
                itemInfo.itemData.spatialReference = {
                  wkid: 102100,
                  latestWkid: 3857
                };
                itemInfo.itemData.baseMap = {
                  baseMapLayers: [{
                    url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer",
                    opacity: 1,
                    layerType: "ArcGISTiledMapServiceLayer",
                    visibility: true,
                    id: "defaultBasemap_0"
                  }],
                  title: "Topographic"
                };
                return jimuUtils.createWebMap(webMapPortalUrl, itemInfo, mapDivId, webMapOptions);
              }));
            }
          }

          throw error;
        }));
      },

      _showUnreachableLayersTitleMessage: function () {
        var unreachableLayersTitle = this.layerInfosObj.getUnreachableLayersTitle();
        var layersTitleString = "";
        var message = window.jimuNls.map.layerLoadedError ||
          "The layer, ${layers} cannot be added to the map.";
        if (message && unreachableLayersTitle && unreachableLayersTitle.length > 0) {
          array.forEach(unreachableLayersTitle, lang.hitch(this, function (title) {
            layersTitleString = layersTitleString + title + ", ";
          }));

          new Message({
            message: message.replace("${layers}", layersTitleString)
          });
        }
      },

      _addDataLoadingOnMapUpdate: function (map) {
        var loadHtml = '<div class="map-loading">Loading...</div>';
        var loadContainer = html.toDom(loadHtml);
        html.place(loadContainer, map.root);
        if (map.updating) {
          html.addClass(loadContainer, 'loading');
        }
        on(map, 'update-start', lang.hitch(this, function () {
          html.addClass(loadContainer, 'loading');
        }));
        on(map, 'update-end', lang.hitch(this, function () {
          html.removeClass(loadContainer, 'loading');
        }));
        on(map, 'unload', lang.hitch(this, function () {
          html.destroy(loadContainer);
          loadContainer = null;
        }));
      },

      _checkAppState: function () {
        //URL parameters that affect map extent
        var urlKeys = ['extent', 'center', 'marker', 'find', 'query', 'scale', 'level'];
        var useAppState = this.appConfig.keepAppState;

        if (useAppState) {
          array.forEach(urlKeys, function (k) {
            if (k in this.urlParams) {
              useAppState = false;
            }
          }, this);
        }

        if (useAppState) {
          this.appStateManager.getWabAppState().then(lang.hitch(this, function (stateData) {
            if (stateData.extent || stateData.layers) {
              var appStatePopup = new AppStatePopup({
                nls: {
                  title: this.nls.appState.title,
                  restoreMap: this.nls.appState.restoreMap
                }
              });
              appStatePopup.placeAt('main-page');
              on(appStatePopup, 'applyAppState', lang.hitch(this, function () {
                this._applyAppState(stateData, this.map);
              }));
              appStatePopup.startup();
              appStatePopup.show();
            }
          }));
        }
      },

      _applyAppState: function (stateData, map) {
        var layerOptions = stateData.layers;
        this.layerInfosObj.restoreState({
          layerOptions: layerOptions || null
        });
        if (stateData.extent) {
          map.setExtent(stateData.extent);
        }
      },

      _processMapOptions: function (mapOptions) {
        if (!mapOptions) {
          return;
        }

        if (!mapOptions.lods) {
          delete mapOptions.lods;
        }
        if (mapOptions.lods && mapOptions.lods.length === 0) {
          delete mapOptions.lods;
        }

        var ret = lang.clone(mapOptions);
        if (ret.extent) {
          ret.extent = new Extent(ret.extent);
        }
        if (ret.center && !lang.isArrayLike(ret.center)) {
          ret.center = new Point(ret.center);
        }
        if (ret.infoWindow) {
          ret.infoWindow = new InfoWindow(ret.infoWindow, html.create('div', {}, this.mapDivId));
        }

        return ret;
      },

      createLayer: function (map, maptype, layerConfig) {
        var layMap = {
          '2D_tiled': 'esri/layers/ArcGISTiledMapServiceLayer',
          '2D_dynamic': 'esri/layers/ArcGISDynamicMapServiceLayer',
          '2D_image': 'esri/layers/ArcGISImageServiceLayer',
          '2D_feature': 'esri/layers/FeatureLayer',
          '2D_rss': 'esri/layers/GeoRSSLayer',
          '2D_kml': 'esri/layers/KMLLayer',
          '2D_webTiled': 'esri/layers/WebTiledLayer',
          '2D_wms': 'esri/layers/WMSLayer',
          '2D_wmts': 'esri/layers/WMTSLayer',
          '3D_tiled': 'esri3d/layers/ArcGISTiledMapServiceLayer',
          '3D_dynamic': 'esri3d/layers/ArcGISDynamicMapServiceLayer',
          '3D_image': 'esri3d/layers/ArcGISImageServiceLayer',
          '3D_feature': 'esri3d/layers/FeatureLayer',
          '3D_elevation': 'esri3d/layers/ArcGISElevationServiceLayer',
          '3D_3dmodle': 'esri3d/layers/SceneLayer'
        };


        /**
         * 增加地址转换用来本地测试，实际上线时可以注释掉
             */
        var curip = window.location.host;
        var revUrl = layerConfig.url;
        if (curip.indexOf("localhost") > -1 && revUrl.indexOf("http") > -1) {
          revUrl = revUrl.replace(new RegExp("10.209.180.203:6080/", 'g'), "221.182.241.179:85/");
          revUrl = revUrl.replace(new RegExp("10.209.239.1:8081/arcgis/", 'g'), "221.182.241.179:85/arcgis_digitalmap/");
          revUrl = revUrl.replace(new RegExp("10.209.180.1:18083/", 'g'), "221.182.241.179:85/");
        } else if (curip.indexOf("localhost") > -1 && revUrl.startsWith("/")) {
          revUrl = revUrl.replace(new RegExp("arcgis_digitalmap/", 'g'), "barcgis_digitalmap/");
        }

        layerConfig.url = revUrl;

        require([layMap[maptype + '_' + layerConfig.type]], lang.hitch(this, function (layerClass) {
          var layer, infoTemplate, options = {},
            //keyProperties = ['label', 'url', 'type', 'icon', 'infoTemplate', 'isOperationalLayer'];
            //以下为修改部分，修改属性key
            keyProperties = ['field', 'colors', 'blurRadius', 'maxPixelIntensity', 'minPixelIntensity', 'label', 'url', 'type', 'icon', 'infoTemplate', 'isOperationalLayer'];
          for (var p in layerConfig) {
            if (keyProperties.indexOf(p) < 0) {
              options[p] = layerConfig[p];
            }
          }
          /** 
          if (layerConfig.infoTemplate) {
            infoTemplate = new InfoTemplate(layerConfig.infoTemplate.title,
              layerConfig.infoTemplate.content);
            options.infoTemplate = infoTemplate;
  
            layer = new layerClass(layerConfig.url, options);
  
            if (layerConfig.infoTemplate.width && layerConfig.infoTemplate.height) {
              aspect.after(layer, 'onClick', lang.hitch(this, function() {
                map.infoWindow.resize(layerConfig.infoTemplate.width,
                  layerConfig.infoTemplate.height);
              }), true);
            }
          } else {
            layer = new layerClass(layerConfig.url, options);
          } */

          /**
           * 以下为图层弹窗配置： 分为：common弹窗  table弹窗 iframe弹窗 interface弹窗
           * 根据图层类型的不同处理方法不同  "dynamic"   "feature"  和 其他
           */
          if ("dynamic" == layerConfig.type) {
            if (layerConfig.infoWindowType == "common" && layerConfig.infoTemplates) {
              var infoTemps = {};

              for (var infoIndex = 0; infoIndex < layerConfig.infoTemplates.length; infoIndex++) {
                var infoTemplate = new InfoTemplate(layerConfig.infoTemplates[infoIndex].title, layerConfig.infoTemplates[infoIndex].content);
                infoTemps[infoIndex] = {
                  "infoTemplate": infoTemplate
                };
                if (layerConfig.infoTemplates[infoIndex].width && layerConfig.infoTemplates[infoIndex].height) {
                  popSizes[layerConfig.label + "_" + infoIndex] = layerConfig.infoTemplates[infoIndex].width + "," + layerConfig.infoTemplates[infoIndex].height;
                }
              }

              options.infoTemplates = infoTemps;

              layer = new layerClass(layerConfig.url, options);

            } else if (layerConfig.infoWindowType == "iframe" && layerConfig.infoTemplates) {
              var infoTemps = {};

              for (var infoIndex = 0; infoIndex < layerConfig.infoTemplates.length; infoIndex++) {
                var iframeUrlC = this._urlRoute(layerConfig.infoTemplates[infoIndex].iframeUrl);
                var iframeHtml = '<iframe name="page_interface_frame" src="' + iframeUrlC + '"  width="' + (layerConfig.infoTemplates[infoIndex].width - 20) + '" height="' + (layerConfig.infoTemplates[infoIndex].height - 10) + '" ></iframe>';

                var infoTemplate = new InfoTemplate(layerConfig.infoTemplates[infoIndex].title, iframeHtml);
                infoTemps[infoIndex] = {
                  "infoTemplate": infoTemplate
                };

                if (layerConfig.infoTemplates[infoIndex].width && layerConfig.infoTemplates[infoIndex].height) {
                  popSizes[layerConfig.label + "_" + infoIndex] = layerConfig.infoTemplates[infoIndex].width + "," + layerConfig.infoTemplates[infoIndex].height;
                }
              }

              options.infoTemplates = infoTemps;

              layer = new layerClass(layerConfig.url, options);

            } else if (layerConfig.infoWindowType == "table" && layerConfig.infoTemplates) {
              var infoTemps = {};

              for (var infoIndex = 0; infoIndex < layerConfig.infoTemplates.length; infoIndex++) {
                var tableFields = layerConfig.infoTemplates[infoIndex].tableFields;
                var tableHtml = '<div class="dgrid dgrid-grid ui-widget" role="grid">';

                tableHtml += '<div class="dgrid-header dgrid-header-row ui-widget-header" role="row">';

                tableHtml = '<table class="dgrid-row-table" role="presentation">';

                tableHtml += "<tr>";

                for (var j in tableFields) {
                  var obj = tableFields[j];
                  tableHtml += '<th class="dgrid-cell dgrid-cell-padding" role="columnheader">' + obj.label + "</th>";
                }
                tableHtml += "</tr>";

                tableHtml += "</table>";

                tableHtml += '</div>';

                tableHtml += '</div>';

                var infoTemplate = new InfoTemplate(layerConfig.infoTemplates[infoIndex].title, tableHtml);
                infoTemps[infoIndex] = {
                  "infoTemplate": infoTemplate
                };

                popSizes[layerConfig.label + "_" + infoIndex] = layerConfig.infoTemplates[infoIndex];
              }

              options.infoTemplates = infoTemps;

              layer = new layerClass(layerConfig.url, options);

            } else if (layerConfig.infoWindowType == "interface" && layerConfig.infoTemplates) {
              var infoTemps = {};

              for (var infoIndex = 0; infoIndex < layerConfig.infoTemplates.length; infoIndex++) {
                var infoTemplate = new InfoTemplate("", "");
                infoTemps[infoIndex] = {
                  "infoTemplate": infoTemplate
                };

                popSizes[layerConfig.label + "_" + infoIndex] = layerConfig.infoTemplates[infoIndex];
              }

              options.infoTemplates = infoTemps;

              layer = new layerClass(layerConfig.url, options);

            } else {
              layer = new layerClass(layerConfig.url, options);
            }

          } else if ("feature" == layerConfig.type) {
            if (layerConfig.blurRadius) {
              var heatmapRenderer = new HeatmapRenderer({
                field: layerConfig.field,
                colors: layerConfig.colors,
                blurRadius: layerConfig.blurRadius,
                maxPixelIntensity: layerConfig.maxPixelIntensity,
                minPixelIntensity: layerConfig.minPixelIntensity
              });

              layer = new layerClass(layerConfig.url, options);
              layer.setRenderer(heatmapRenderer);
            } else {
              if (layerConfig.infoWindowType == "common" && layerConfig.infoTemplate) {
                var infoTemplate = new InfoTemplate(layerConfig.infoTemplate.title, layerConfig.infoTemplate.content);
                options.infoTemplate = infoTemplate;
                options.outFields = ["*"];
                if (layerConfig.infoTemplate.width && layerConfig.infoTemplate.height) {
                  popSizes[layerConfig.label + "_0"] = layerConfig.infoTemplate.width + "," + layerConfig.infoTemplate.height;
                }

                layer = new layerClass(layerConfig.url, options);

              } else {
                options.outFields = ["*"];
                layer = new layerClass(layerConfig.url, options);
              }

              if (layerConfig.renderer != undefined && layerConfig.renderer != null) {

                var jsonrenderer = renderJsonUtils.fromJson(layerConfig.renderer);
                layer.setRenderer(jsonrenderer);

              }
            }

          } else {
            if (layerConfig.infoWindowType == "common" && layerConfig.infoTemplate) {
              var infoTemplate = new InfoTemplate(layerConfig.infoTemplate.title, layerConfig.infoTemplate.content);
              options.infoTemplate = infoTemplate;

              if (layerConfig.infoTemplate.width && layerConfig.infoTemplate.height) {
                popSizes[layerConfig.label + "_0"] = layerConfig.infoTemplate.width + "," + layerConfig.infoTemplate.height;
              }

              layer = new layerClass(layerConfig.url, options);

            } else {
              layer = new layerClass(layerConfig.url, options);
            }

          }

          layer.isOperationalLayer = layerConfig.isOperationalLayer;
          layer.label = layerConfig.label;
          layer.icon = layerConfig.icon;
          /**新增开始*/
          layer.id = layerConfig.label;
          layer.visible = layerConfig.visible;
          layer.configObj = layerConfig;
          /**新增结束*/
          map.addLayer(layer);
        }));
      },

      onAppConfigChanged: function (appConfig, reason, changedJson) {
        // jshint unused:false
        this.appConfig = appConfig;
        if (reason === 'mapChange') {
          this._recreateMap(appConfig);
        } else if (reason === 'mapOptionsChange') {
          if (changedJson.lods) {
            this._recreateMap(appConfig);
          }
        } else if (reason === 'mapRefreshIntervalChange') {
          var itemData = this.map && this.map.itemInfo.itemData;
          if (itemData && this.layerInfosObj) {
            this._updateRefreshInterval(changedJson);
          }
        }
      },

      onMapContentModified: function () {
        this._recreateMap(this.appConfig);
      },

      _updateRefreshInterval: function (refreshInterval) {
        var minutes = -1;

        if (refreshInterval.useWebMapRefreshInterval) {
          //Honor the individual interval of each layer
          minutes = -1;
        } else {
          //Use a single interval for all layers
          minutes = refreshInterval.minutes;
        }

        this.layerInfosObj.getLayerInfoArrayOfWebmap().forEach(function (layerInfo) {
          layerInfo.getLayerObject().then(lang.hitch(this, function (layerObject) {
            if (!layerObject) {
              return;
            }
            //only handle non-static layer
            var originalRefreshinterval = lang.getObject("_wabProperties.originalRefreshinterval", false, layerObject);

            if (originalRefreshinterval > 0) {
              if (typeof layerObject.setRefreshInterval === 'function') {
                if (minutes < 0) {
                  //Honor the individual interval of each layer
                  layerObject.setRefreshInterval(originalRefreshinterval);
                } else {
                  //Use a single interval for all layers
                  layerObject.setRefreshInterval(minutes);
                }
              }
            }
          }), lang.hitch(this, function (err) {
            console.error("can't get layerObject", err);
          }));
        }, this);
      },

      _recreateMap: function (appConfig) {
        if (this.map) {
          topic.publish('beforeMapDestory', this.map);
          this.map.destroy();
        }
        this._showMap(appConfig);
      },

      disableWebMapPopup: function () {
        this.map.setInfoWindowOnClick(false);
      },

      enableWebMapPopup: function () {
        this.map.setInfoWindowOnClick(true);
      }

      /**
       * 新增的自定义函数，用来处理，左侧的树形结构图层点击事件
       * 以下内容都是新增，如果需要更新新的框架源码需要更新这部分
       */
      ,
      layerCheckedHander: function (layerConfig, isChecked) {
        console.log(layerConfig, isChecked)


        //如果执行的是关闭图层的事件，则需要判断是否还有有效图层，如果没有有效图层则发布无有效图层的事件，给其他组件使用
      
        //右侧统计图表呈现
        if (layerConfig.charttable != undefined && isChecked) {

          this.charttableList[layerConfig.label] = layerConfig.charttable;
          this.chartLayerArray.push(layerConfig.label);
          var chartTableWidget = this._getAvailableWidget("StatisticalChartAndTable");

          if (!chartTableWidget) {
            return;
          }
          WidgetManager.getInstance().triggerWidgetOpen(chartTableWidget.id)
            .then(function (ctWidget) {
              ctWidget.onStatisticalOpen({
                target: "StatisticalChartAndTable",
                param: layerConfig.charttable
              });
            });

        }

        if (!isChecked && this.charttableList.hasOwnProperty(layerConfig.label)) {

          delete this.charttableList[layerConfig.label];
          var layerIndex = this.chartLayerArray.indexOf(layerConfig.label);
          if (layerIndex > -1) {
            this.chartLayerArray.splice(layerIndex, 1);
            var chartTableWidget = this._getAvailableWidget("StatisticalChartAndTable");

            if (!chartTableWidget) {
              return;
            }
            if (this.chartLayerArray.length > 0) {
              var lastCharttable = this.charttableList[this.chartLayerArray[this.chartLayerArray.length - 1]];
             
              WidgetManager.getInstance().triggerWidgetOpen(chartTableWidget.id)
                .then(function (ctWidget) {
                  ctWidget.onStatisticalOpen({
                    target: "StatisticalChartAndTable",
                    param: lastCharttable
                  });
                });
            }else{
              WidgetManager.getInstance().triggerWidgetOpen(chartTableWidget.id)
                .then(function (ctWidget) {
                  ctWidget.onStatisticalClose();
                });
            }
          }

        }

        //处理图层事件

        if (layerConfig.layerArray) {
          var layerArray = layerConfig.layerArray;
          for (var j = 0; j < layerArray.length; j++) {
            //console.log(layerConfig + "===>" + isChecked);
            this._setCheckLayerVisible(layerArray[j], isChecked);
            //获取当前选过的图层，进行图层的相对于的操作

            if (this.getLayerInfos.length == 0) {
              if (this.map.layerIds.length > 1) {
                this.getLayerInfos.push(this.map.getLayer(this.map.layerIds[1]));
              }
              if (this.map.graphicsLayerIds.length > 1) {
                this.getLayerInfos.push(this.map.getLayer(this.map.graphicsLayerIds[1]));
              }
            } else {
              var flag = false;
              var ckLayer = this.map.getLayer(layerArray[j].label)
              for (var i in this.getLayerInfos) {
                if (this.getLayerInfos[i] == ckLayer) {
                  flag = true;
                  break;
                }
              }
              if (!flag) {
                this.getLayerInfos.push(ckLayer);
              }
            }
          }

        } else {
          //console.log(layerConfig + "===>" + isChecked);
          this._setCheckLayerVisible(layerConfig, isChecked);
          //获取当前选过的图层，进行图层的相对于的操作

          if (this.getLayerInfos.length == 0) {
            if (this.map.layerIds.length > 1) {
              this.getLayerInfos.push(this.map.getLayer(this.map.layerIds[1]));
            }
            if (this.map.graphicsLayerIds.length > 1) {
              this.getLayerInfos.push(this.map.getLayer(this.map.graphicsLayerIds[1]));
            }
          } else {
            var ckLayer = this.map.getLayer(layerConfig.label)
            for (var i in this.getLayerInfos) {
              if (this.getLayerInfos[i] == ckLayer) {
                return;
              }
            }
            this.getLayerInfos.push(ckLayer);
          }
        }


      },
      _getAvailableWidget: function (widgetName) {
        var appConfig = ConfigManager.getInstance().getAppConfig();
        var attributeTableWidget = appConfig.getConfigElementsByName(widgetName)[0];
        if (attributeTableWidget && attributeTableWidget.visible) {
          return attributeTableWidget;
        }
        return null;
      },
      _setCheckLayerVisible: function (layerConfig, ckSelect) {
        var ckLayerId = layerConfig.label;
        if (ckSelect) {
          //判断图层是否存在，如果存在直接设置图层显示还是隐藏，如果不存在则添加图层
          if (this.map.getLayer(ckLayerId)) {
            var ckLayer = this.map.getLayer(ckLayerId);
            ckLayer.setVisibility(ckSelect);
          } else {
            this.createLayer(this.map, "2D", layerConfig);

          }

        } else {

          var ckLayer = this.map.getLayer(ckLayerId);
          ckLayer.setVisibility(false);

        }

      },

      /**
       * 图层事件触发，同样需要权限配置，以及配置funjson 每个用户针对每个图层所能看到的图层控制事件不一致
       * 这个配置可以先写死，后面写一个无界面的widget再改
       */
      eventTrigger: function (config, type, label, data) {
        //不需要创建透明度条了,config为传过来的json内容，type当前点击事件的控件,data是传过来的透明度的值
        //先将透明条放在一边最后做，先做上下移动
        var item;
        for (var i = 0; i < this._candidateMenuItems.length; i++) {
          if (this._candidateMenuItems[i].key == this.valueArray[type]) {
            item = this._candidateMenuItems[i];
            item.label = config.label;
          }
        }
        //根据内容创建其他
        //config为传过来的json内容，data是传过来的透明度的值，item是与对应点击事件相同的的数组
        this._MenuItemClick(config, item, data);
      },

      _MenuItemClick: function (config, item, data) {
        //config为后台传过来的值，内含如./config.json里的map.operationallayers里的一个值类似
        var layerid = config.label;
        this._playerInfo = this.map.getLayer(layerid);
        var evt = {
          extraData: data / 100,
          itemKey: item.key,
          layerListView: this
        },
          result;
        result = this._onPopupMenuClick(evt, config);
        if (result.closeMenu) {
          //this.closeDropMenu();
        }
      },
      _onPopupMenuClick: function (evt, config) {
        var result = {
          closeMenu: true
        };
        switch (evt.itemKey) {
          case 'zoomto' /*this.nls.itemZoomTo'Zoom to'*/
            :
            this.onItemZoomToClick(evt);
            break;
          case 'moveup' /*this.nls.itemMoveUp'Move up'*/
            :
            this.onMoveUpItemClick(evt);
            break;
          case 'movedown' /*this.nls.itemMoveDown'Move down'*/
            :
            this.onMoveDownItemClick(evt);
            break;
          case 'transparency':
            this.onTransparencyChanged(evt);
            result.closeMenu = false;
            break;
        }
        return result;
      },

      //closeDropMenu: function () {
      //    this.state = 'closed';
      //    html.setStyle(this.dropMenuNode, 'display', 'none');
      //    this.emit('onCloseMenu');
      //},
      //点击缩放至按钮后的缩放事件
      onItemZoomToClick: function (evt) {
        //var Extent = this._playerInfo.initialExtent;
        //暂时利用地图的fullExtent来进行操作
        var Extent = this.map.getLayer(this.map.layerIds[0]).fullExtent
        this.map.setExtent(Extent);
      },
      //点击上移后的事件
      onMoveUpItemClick: function (evt) {
        if (!this._playerInfo.isFirst) {
          this._moveUpLayer(this._playerInfo.id);
        }
      },
      //点击下移后的事件
      onMoveDownItemClick: function (evt) {
        if (!this._playerInfo.isLast) {
          this._moveDownLayer(this._playerInfo.id);
        }
      },
      //移动透明度条后的显示
      onTransparencyChanged: function (evt) {
        //this._playerInfo.setOpacity(1 - evt.extraData.newTransValue);
        //由于传过来的值就是直接是百分比数值
        this._playerInfo.setOpacity(1 - evt.extraData);
      },
      centerAtHander: function (lon, lat) {
        this._centerAtToZB(lon, lat);
      },
      _centerAtToZB: function (lon, lat) {
        var p = new Point(lon, lat, this.map.spatialReference);
        var wp = webMercatorUtils.geographicToWebMercator(p);
        this.map.centerAt(wp);
        this._addPictureSymbol(wp);
      },
      _addPictureSymbol: function (geometry) {
        var simplePictureMarkerSymbol = new PictureMarkerSymbol('./widgets/Location/images/locate.gif', 30, 30);
        var graphic = new Graphic(geometry, simplePictureMarkerSymbol);
        this.map.graphics.clear();
        this.map.graphics.add(graphic);
      },
      _clearGraphicInMap: function () {
        this.map.graphics.clear();
      }





    });

    clazz.getInstance = function (options, mapDivId) {
      if (instance === null) {
        instance = new clazz(options, mapDivId);
      }
      return instance;
    };

    return clazz;
  });