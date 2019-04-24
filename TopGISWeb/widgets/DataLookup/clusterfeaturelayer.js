define("dojo/_base/declare dojo/_base/array dojo/_base/lang dojo/_base/Color dojo/_base/connect dojo/on dojo/promise/all esri/SpatialReference esri/geometry/Point esri/geometry/Polygon esri/geometry/Multipoint esri/geometry/Extent esri/graphic esri/config esri/geometry/normalizeUtils esri/symbols/SimpleMarkerSymbol esri/symbols/SimpleLineSymbol esri/symbols/SimpleFillSymbol esri/symbols/TextSymbol esri/symbols/Font esri/renderers/ClassBreaksRenderer esri/request esri/symbols/jsonUtils esri/renderers/jsonUtils esri/dijit/PopupTemplate esri/layers/GraphicsLayer esri/tasks/query esri/tasks/QueryTask".split(" "),
    function (t, f, j, g, n, l, u, v, q, r, m, w, p, x, H, k, i, I, s, y, z, A, J, B, C, D, E, F) {
        function G(a) {
            for (var b = a.length, d = []; b--;) {
                var e = a[b];
                e.constructor === Array ? d = d.concat(e) : d.push(e)
            }
            return d
        }

        window.console || (window.console = {});
        n = "log info warn error debug trace dir group groupCollapsed groupEnd time timeEnd profile profileEnd dirxml assert count markTimeline timeStamp clear".split(" ");
        for (m = 0; m < n.length; m++)window.console[n[m]] || (window.console[n[m]] = function () {
        });
        return t([D], {
            constructor: function (a) {
                this._clusterTolerance =
                    a.distance || 50;
                this._clusterData = [];
                this._clusters = [];
                this._tmpWidth = a.tmpWidth || 300;
                this._tmpHeight = a.tmpHeight || 300;
                this._clusterLabelColor = a.labelColor || "#000";
                this._clusterLabelOffset = a.hasOwnProperty("labelOffset") ? a.labelOffset : -5;
                this._singles = [];
                this._showSingles = a.hasOwnProperty("showSingles") ? a.showSingles : !0;
                this._zoomOnClick = a.hasOwnProperty("zoomOnClick") ? a.zoomOnClick : !0;
                this._singleSym = a.singleSymbol || new k("circle", 16, new i(i.STYLE_SOLID, new g([85, 125, 140, 1]), 3), new g([255, 255, 255,
                        1]));
                this._singleTemplate = a.singleTemplate || new C({title: "", description: "{*}"});
                this._disablePopup = a.disablePopup || !1;
                this._maxSingles = a.maxSingles || 1E4;
                this._font = a.font || (new y("10pt")).setFamily("Arial");
                this._sr = a.spatialReference || new v({wkid: 4326});
                this._zoomEnd = null;
                this.url = a.url || null;
                this._outFields = a.outFields || ["*"];
                this.queryTask = new F(this.url);
                this._where = a.where || null;
                this._useDefaultSymbol = a.hasOwnProperty("useDefaultSymbol") ? a.useDefaultSymbol : !1;
                this._returnLimit = a.returnLimit ||
                    1E3;
                this._singleRenderer = a.singleRenderer;
                this._objectIdField = a.objectIdField || "OBJECTID";
                if (!this.url)throw Error("url is a required parameter");
                this._clusterCache = {};
                this._objectIdCache = [];
                this._objectIdHash = {};
                this._visitedExtent = this._currentClusterLabel = this._currentClusterGraphic = null;
                this.detailsLoaded = !1;
                this._query = new E;
                this.MODE_SNAPSHOT = a.hasOwnProperty("MODE_SNAPSHOT") ? a.MODE_SNAPSHOT : !0;
                this._getServiceDetails();
                x.defaults.geometryService = "http://localhost:6080/arcgis/rest/services/Utilities/Geometry/GeometryServer"
            },
            _getServiceDetails: function () {
                A({url: this.url, content: {f: "json"}, handleAs: "json"}).then(j.hitch(this, function (a) {
                    this._defaultRenderer = this._singleRenderer || B.fromJson(a.drawingInfo.renderer);
                    "esriGeometryPolygon" === a.geometryType && (this._useDefaultSymbol = !1, console.info("polygon geometry will be converted to points"));
                    this.emit("details-loaded", a)
                }))
            }, _getDefaultSymbol: function (a) {
                var b = this._defaultRenderer;
                return !this._useDefaultSymbol || !b ? this._singleSym : b.getSymbol(a)
            }, _getRenderedSymbol: function (a) {
                if (1 ===
                    a.attributes.clusterCount) {
                    if (!this._useDefaultSymbol)return this._singleSym;
                    var b = this._defaultRenderer;
                    return b ? b.getSymbol(a) : null
                }
                return null
            }, _reCluster: function () {
                this.suspended || (this._clusterResolution = this._map.extent.getWidth() / this._map.width, this._visitedExtent ? this._visitedExtent.contains(this._map.extent) ? this._clusterGraphics() : this._getObjectIds(this._map.extent) : this._getObjectIds(this._map.extent), this._visitedExtent = this._visitedExtent ? this._visitedExtent.union(this._map.extent) :
                    this._map.extent)
            }, _setClickedClusterGraphics: function (a) {
                null === a ? this._currentClusterLabel = this._currentClusterGraphic = null : null === a.symbol ? (this._currentClusterLabel = this._getCurrentLabelGraphic(a), this._currentClusterGraphic = a) : "esri.symbol.TextSymbol" === a.symbol.declaredClass && (this._currentClusterLabel = a, this._currentClusterGraphic = this._getCurrentClusterGraphic(a))
            }, _getCurrentClusterGraphic: function (a) {
                return f.filter(this.graphics, function (b) {
                    return b.attributes.clusterId === a.attributes.clusterId
                })[0]
            },
            _getCurrentLabelGraphic: function (a) {
                return f.filter(this.graphics, function (b) {
                    return b.symbol && "esri.symbol.TextSymbol" === b.symbol.declaredClass && b.attributes.clusterId === a.attributes.clusterId
                })[0]
            }, _popupVisibilityChange: function () {
                var a = this._map.infoWindow.isShowing;
                this._showClickedCluster(!a);
                a || this.clearSingles()
            }, _showClickedCluster: function (a) {
                this._currentClusterGraphic && this._currentClusterLabel && (a ? (this._currentClusterGraphic.show(), this._currentClusterLabel.show()) : (this._currentClusterGraphic.hide(),
                    this._currentClusterLabel.hide()))
            }, _setMap: function (a) {
                this._query.outSpatialReference = a.spatialReference;
                this._query.returnGeometry = !0;
                this._query.outFields = this._outFields;
                this._extentChange = l.pausable(a, "extent-change", j.hitch(this, "_reCluster"));
                a.infoWindow.on("hide", j.hitch(this, "_popupVisibilityChange"));
                a.infoWindow.on("show", j.hitch(this, "_popupVisibilityChange"));
                var b = l(a, "layer-add", j.hitch(this, function (a) {
                    if (a.layer === this && (b.remove(), !this.detailsLoaded)) l.once(this, "details-loaded",
                        j.hitch(this, function () {
                            if (!this.renderer) {
                                this._singleSym = this._singleSym || new k("circle", 16, new i(i.STYLE_SOLID, new g([85, 125, 140, 1]), 3), new g([255, 255, 255, 0.5]));
                                var a = new z(this._singleSym, "clusterCount");
                                small = new k("circle", 25, new i(i.STYLE_SOLID, new g([140, 177, 210, 0.35]), 15), new g([140, 177, 210, 0.75]));
                                medium = new k("circle", 50, new i(i.STYLE_SOLID, new g([97, 147, 179, 0.35]), 15), new g([97, 147, 179, 0.75]));
                                large = new k("circle", 80, new i(i.STYLE_SOLID, new g([59, 110, 128, 0.35]), 15), new g([59, 110, 128,
                                    0.75]));
                                xlarge = new k("circle", 110, new i(i.STYLE_SOLID, new g([20, 72, 77, 0.35]), 15), new g([20, 72, 77, 0.75]));
                                a.addBreak(2, 10, small);
                                a.addBreak(10, 25, medium);
                                a.addBreak(25, 100, large);
                                a.addBreak(100, Infinity, xlarge);
                                this.setRenderer(a)
                            }
                            this._reCluster()
                        }))
                }));
                return this.inherited(arguments)
            }, _unsetMap: function () {
                this.inherited(arguments);
                this._extentChange.remove()
            }, _onClusterClick: function (a) {
                var b = a.graphic.attributes;
                b && b.clusterCount && (a = f.filter(this._clusterData, function (a) {
                    return b.clusterId ===
                        a.attributes.clusterId
                }, this), this.emit("cluster-click", a))
            }, _getObjectIds: function (a) {
                this.url && (a = a || this._map.extent, this._query.objectIds = null, this._where && (this._query.where = this._where), this.MODE_SNAPSHOT || (this._query.geometry = a), !this._query.geometry && !this._query.where && (this._query.where = "1=1"), this.queryTask.executeForIds(this._query).then(j.hitch(this, "_onIdsReturned"), this._onError))
            }, _onError: function (a) {
                console.warn("ReturnIds Error", a)
            }, _onIdsReturned: function (a) {
                var b = this._objectIdHash,
                    d = a.length, e = [];
                if (this._objectIdCache.length)for (; d--;) {
                    var h = a[d];
                    b[h] || (b[h] = h, e.push(h))
                } else for (e = a; d--;)h = a[d], b[h] || (b[h] = h);
                a = e;
                this._objectIdCache = this._objectIdCache.concat(a);
                if (a && a.length)if (this._query.where = null, this._query.geometry = null, b = [], a.length > this._returnLimit) {
                    for (; a.length;)this._query.objectIds = a.splice(0, this._returnLimit - 1), b.push(this.queryTask.execute(this._query));
                    u(b).then(j.hitch(this, function (a) {
                        a = f.map(a, function (a) {
                            return a.features
                        });
                        this._onFeaturesReturned({features: G(a)})
                    }))
                } else this._query.objectIds =
                    a.splice(0, this._returnLimit - 1), this.queryTask.execute(this._query).then(j.hitch(this, "_onFeaturesReturned"), this._onError); else this._objectIdCache.length ? this._onFeaturesReturned({features: []}) : this.clear()
            }, _inExtent: function () {
                for (var a = this._getNormalizedExtentsPolygon(), b = this._objectIdCache.length, d = []; b--;) {
                    var e = this._clusterCache[this._objectIdCache[b]];
                    e && a.contains(e.geometry) && d.push(e)
                }
                return d
            }, _onFeaturesReturned: function (a) {
                var b = this._inExtent();
                if ("esriGeometryPolygon" === this.native_geometryType) {
                    for (var a =
                        a.features, d = a.length, e = []; d--;) {
                        var h = a[d];
                        e.push(new p(h.geometry.getCentroid(), h.symbol, h.attributes, h.infoTemplate))
                    }
                    a = e
                } else a = a.features;
                a.length && (this._clusterData.length = 0, this.clear(), f.forEach(a, function (a) {
                    this._clusterCache[a.attributes[this._objectIdField]] = a
                }, this), this._clusterData = a.concat(b));
                this._clusterGraphics()
            }, updateClusters: function () {
                this.clearCache();
                this._reCluster()
            }, clearCache: function () {
                f.forEach(this._objectIdCache, function (a) {
                    delete this._objectIdCache[a]
                }, this);
                this._objectIdCache.length = 0;
                this._clusterCache = {};
                this._objectIdHash = {}
            }, add: function (a) {
                if (a.declaredClass) this.inherited(arguments); else {
                    this._clusterData.push(a);
                    for (var b = !1, d = 0; d < this._clusters.length; d++) {
                        var e = this._clusters[d];
                        if (this._clusterTest(a, e)) {
                            this._clusterAddPoint(a, e);
                            this._updateClusterGeometry(e);
                            this._updateLabel(e);
                            b = !0;
                            break
                        }
                    }
                    b || (this._clusterCreate(a), a.attributes.clusterCount = 1, this._showCluster(a))
                }
            }, clear: function () {
                this.inherited(arguments);
                this._clusters.length = 0
            },
            clearSingles: function (a) {
                f.forEach(a || this._singles, function (a) {
                    this.remove(a)
                }, this);
                this._singles.length = 0
            }, onMouseMove: function (a) {
                if (1 < a.graphic.attributes.clusterCount && 11 > a.graphic.attributes.clusterCount && this._map.getZoom() !== this._map.getMaxZoom()) {
                    this.clearSingles(this._singles);
                    var b = this._getClusterSingles(a.graphic.attributes.clusterId);
                    b.length > this._maxSingles ? alert("Sorry, that cluster contains more than " + this._maxSingles + " points. Zoom in for more detail.") : (this._showClickedCluster(!0),
                        this._setClickedClusterGraphics(a.graphic), this._showClickedCluster(!1), this._addSingleGraphics(b))
                }
            }, onClick: function (a) {
                a.stopPropagation();
                if (a.graphic.attributes.clusterCount)if (1 === a.graphic.attributes.clusterCount) {
                    this._showClickedCluster(!0);
                    this._setClickedClusterGraphics(null);
                    this.clearSingles(this._singles);
                    var b = this._getClusterSingles(a.graphic.attributes.clusterId);
                    f.forEach(b, function (a) {
                        a.setSymbol(this._getDefaultSymbol(a));
                        a.setInfoTemplate(this._singleTemplate)
                    }, this);
                    this._addSingleGraphics(b);
                    this._disablePopup || (this._map.infoWindow.setFeatures(b), this._map.infoWindow.show(a.graphic.geometry), this._map.infoWindow.resize(this._tmpWidth, this._tmpHeight))
                } else this._zoomOnClick && 1 < a.graphic.attributes.clusterCount && this._map.getZoom() !== this._map.getMaxZoom() ? (b = this._getClusterExtent(a.graphic), b.getWidth() ? this._map.setExtent(b.expand(1.5), !0) : this._map.centerAndZoom(a.graphic.geometry, this._map.getMaxZoom())) : (this.clearSingles(this._singles), b = this._getClusterSingles(a.graphic.attributes.clusterId),
                    b.length > this._maxSingles ? alert("Sorry, that cluster contains more than " + this._maxSingles + " points. Zoom in for more detail.") : (this._showClickedCluster(!0), this._setClickedClusterGraphics(null), this._addSingleTemplate(b), this._disablePopup || (this._map.infoWindow.setFeatures(this._singles), this._map.infoWindow.show(a.graphic.geometry), this._map.infoWindow.resize(this._tmpWidth, this._tmpHeight)))); else b = this._getOrderSingles(a.graphic.attributes), this._map.infoWindow.setFeatures(b), this._map.infoWindow.show(a.graphic.geometry),
                    this._map.infoWindow.resize(this._tmpWidth, this._tmpHeight)
            }, _clusterGraphics: function () {
                this.clear();
                for (var a = this._getNormalizedExtentsPolygon(), b = 0, d = this._clusterData.length; b < d; b++) {
                    var e = this._clusterData[b].geometry || this._clusterData[b];
                    if (a.contains(e)) {
                        for (var h = this._clusterData[b], f = !1, g = 0; g < this._clusters.length; g++) {
                            var i = this._clusters[g];
                            if (this._clusterTest(e, i)) {
                                this._clusterAddPoint(h, e, i);
                                f = !0;
                                break
                            }
                        }
                        f || this._clusterCreate(h, e)
                    } else this._clusterData[b].attributes.clusterId = -1
                }
                this._showAllClusters()
            },
            _clusterTest: function (a, b) {
                return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)) / this._clusterResolution <= this._clusterTolerance
            }, _clusterAddPoint: function (a, b, d) {
                var e, f;
                e = d.attributes.clusterCount;
                f = (b.x + d.x * e) / (e + 1);
                e = (b.y + d.y * e) / (e + 1);
                d.x = f;
                d.y = e;
                b.x < d.attributes.extent[0] ? d.attributes.extent[0] = b.x : b.x > d.attributes.extent[2] && (d.attributes.extent[2] = b.x);
                b.y < d.attributes.extent[1] ? d.attributes.extent[1] = b.y : b.y > d.attributes.extent[3] && (d.attributes.extent[3] = b.y);
                d.attributes.clusterCount++;
                b.hasOwnProperty("attributes") || (b.attributes = {});
                a.attributes.clusterId = b.attributes.clusterId = d.attributes.clusterId;
                l.emit(this, "on-add-point-to-cluster", {cluster: d, point: b})
            }, _clusterCreate: function (a, b) {
                var d = this._clusters.length + 1;
                b.attributes || (b.attributes = {});
                a.attributes.clusterId = b.attributes.clusterId = d;
                d = {x: b.x, y: b.y, attributes: {clusterCount: 1, clusterId: d, extent: [b.x, b.y, b.x, b.y]}};
                this._clusters.push(d);
                l.emit(this, "on-add-point-to-cluster", {cluster: d, point: b})
            }, _showAllClusters: function () {
                for (var a =
                    0, b = this._clusters.length; a < b; a++)this._showCluster(this._clusters[a]);
                this.emit("clusters-shown", this._clusters)
            }, _showCluster: function (a) {
                var b = new q(a.x, a.y, this._sr), d = new p(b, null, a.attributes);
                d.setSymbol(this._getRenderedSymbol(d));
                this.add(d);
                2 > a.attributes.clusterCount || (d = (new s(a.attributes.clusterCount.toString())).setColor(new g(this._clusterLabelColor)).setOffset(0, this._clusterLabelOffset).setFont(this._font), this.add(new p(b, d, a.attributes)))
            }, _findCluster: function () {
                f.filter(this.graphics,
                    function (a) {
                        return !a.symbol && a.attributes.clusterId === c.attributes.clusterId
                    })
            }, _getClusterExtent: function (a) {
                a = a.attributes.extent;
                return new w(a[0], a[1], a[2], a[3], this._map.spatialReference)
            }, _getClusteredExtent: function () {
                for (var a, b, d = 0; d < this._clusters.length; d++)a = this._getClusteredExtent(this._clusters[d]), b = b ? b.union(a) : a;
                return b
            }, _getClusterSingles: function (a) {
                for (var b = [], d = 0, e = this._clusterData.length; d < e; d++)a === this._clusterData[d].attributes.clusterId && b.push(this._clusterData[d]);
                return b
            }, _getOrderSingles: function (a) {
                for (var b = [], d = 0, e = this._clusterData.length; d < e; d++)if (a[this._objectIdField] === this._clusterData[d].attributes[this._objectIdField]) {
                    b.push(this._clusterData[d]);
                    break
                }
                d = 0;
                for (e = this._clusterData.length; d < e; d++)a.clusterId === this._clusterData[d].attributes.clusterId && a[this._objectIdField] !== this._clusterData[d].attributes[this._objectIdField] && b.push(this._clusterData[d]);
                return b
            }, _addSingleGraphics: function (a) {
                f.forEach(a, function (a) {
                    a.setSymbol(this._getDefaultSymbol(a));
                    a.setInfoTemplate(this._singleTemplate);
                    this._singles.push(a);
                    this._showSingles && this.add(a)
                }, this)
            }, _addSingleTemplate: function (a) {
                f.forEach(a, function (a) {
                    a.setSymbol(this._getDefaultSymbol(a));
                    a.setInfoTemplate(this._singleTemplate);
                    this._singles.push(a)
                }, this)
            }, _updateClusterGeometry: function (a) {
                var b = f.filter(this.graphics, function (b) {
                    return !b.symbol && b.attributes.clusterId === a.attributes.clusterId
                });
                1 === b.length ? b[0].geometry.update(a.x, a.y) : console.log("didn not find exactly one cluster geometry to update: ",
                    b)
            }, _updateLabel: function (a) {
                var b = f.filter(this.graphics, function (b) {
                    return b.symbol && "esri.symbol.TextSymbol" === b.symbol.declaredClass && b.attributes.clusterId === a.attributes.clusterId
                });
                1 === b.length ? (this.remove(b[0]), b = (new s(a.attributes.clusterCount.toString())).setColor(new g(this._clusterLabelColor)).setOffset(0, this._clusterLabelOffset).setFont(this._font), this.add(new p(new q(a.x, a.y, this._sr), b, a.attributes))) : console.log("didn not find exactly one label: ", b)
            }, _getNormalizedExtentsPolygon: function () {
                var a =
                    this._map.extent.normalize(), a = f.map(a, function (a) {
                    return r.fromExtent(a)
                }), b = new r(this._map.spatialReference);
                f.forEach(a, function (a) {
                    b.addRing(a.rings[0])
                });
                return b
            }, _clusterMeta: function () {
                console.log("Total:    ", this._clusterData.length);
                var a = 0;
                f.forEach(this._clusters, function (b) {
                    a += b.attributes.clusterCount
                });
                console.log("In clusters:    ", a)
            }
        })
    });
