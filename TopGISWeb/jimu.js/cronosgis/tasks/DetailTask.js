/**
 * Created by alwin on 2016/8/31.
 */
define(["dojo/_base/declare","dojo/_base/lang","dojo/_base/array","dojo/_base/Deferred",
    "dojo/has","esri/kernel","esri/request","esri/deferredUtils","esri/tasks/Task"] ,
    function (declare, lang, array, Deferred, has, kernel, request, deferredUtils, Task) {
        clazz = declare(Task,{

            declaredClass:"jimu.cronosgis.tasks.DetailTask",

            constructor:function(url,options){
                this._handler = lang.hitch(this, this._handler);
            }, _handler: function (result, params, callback, errorBack, defer) {
                try {
                    this._successHandler([result], "onComplete",
                        callback, defer)
                } catch (error) {
                    this._errorHandler(error, errorBack, defer)
                }
            }, getAllDetails: function (callback, errorBack) {
                //this._url.path+="/layers";
                var requeryUrl = this._url.path+"/layers";
                var detailParams = this._encode(lang.mixin({}, this._url.query, {f: "json"}));
                var resulthandle = this._handler, errorHandler = this._errorHandler;
                var defer = new Deferred(deferredUtils._dfdCanceller);
                deferredUtils._pendingDfd = request({
                    url: requeryUrl, content: detailParams, callbackParamName: "callback", load: function (result, params) {
                        resulthandle(result, params, callback, errorBack, defer);
                    }, error: function (error) {
                        errorHandler(error, errorBack, defer);
                    }
                });
                return defer;
            },getDetails:function(layerid,callback, errorBack){
                var requeryUrl = this._url.path+"/"+layerid;
                var detailParams = this._encode(lang.mixin({}, this._url.query, {f: "json"}));
                var resulthandle = this._handler, errorHandler = this._errorHandler;
                var defer = new Deferred(deferredUtils._dfdCanceller);
                deferredUtils._pendingDfd = request({
                    url: requeryUrl, content: detailParams, callbackParamName: "callback", load: function (result, params) {
                        resulthandle(result, params, callback, errorBack, defer);
                    }, error: function (error) {
                        errorHandler(error, errorBack, defer);
                    }
                });
                return defer;
            },getFeatureDetails:function(callback, errorBack){
                var requeryUrl = this._url.path;
                var detailParams = this._encode(lang.mixin({}, this._url.query, {f: "json"}));
                var resulthandle = this._handler, errorHandler = this._errorHandler;
                var defer = new Deferred(deferredUtils._dfdCanceller);
                deferredUtils._pendingDfd = request({
                    url: requeryUrl, content: detailParams, callbackParamName: "callback", load: function (result, params) {
                        resulthandle(result, params, callback, errorBack, defer);
                    }, error: function (error) {
                        errorHandler(error, errorBack, defer);
                    }
                });
                return defer;
            }
             , onComplete: function () {
            }

        });

        return clazz;
    });

