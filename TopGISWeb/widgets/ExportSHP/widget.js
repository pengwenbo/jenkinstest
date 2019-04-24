/**
 * Created by huangfei on 2018/8/27.
 */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/topic',
    'dojo/Deferred',
    'jimu/BaseWidget',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-style',
    'jimu/utils',
    'dojo/request/xhr',
    'jimu/dijit/Message',
    "dijit/Dialog",
    "esri/Color",
    'jimu/LayerInfos/LayerInfos',
    "esri/geometry/Extent",
    'jimu/dijit/LoadingIndicator',
    'dijit/_WidgetsInTemplateMixin',
    'esri/layers/GraphicsLayer',
    'esri/tasks/Geoprocessor',
    'dojo/string',
    './PopupWindow/widget',
    'jimu/cronosgis/utils/DateUtil',
    'dojo/i18n!./nls/strings'
], function (declare, array, lang, html, on, topic, Deferred, BaseWidget, domClass, domConstruct, domStyle, utils, xhr, Message, Dialog, Color, LayerInfos, Extent,LoadingIndicator,
             _WidgetsInTemplateMixin, GraphicsLayer,Geoprocessor,dojoString,SBPopupWindowWidget, DateUtil,nls) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-exportshp',
        name: "exportshp",
        open: false,
        _popupWindow:null,
        nls: nls,
        gp:null,
        loading:null,
        postCreate: function () {
            this.inherited(arguments);
        },
        onOpen: function () {
            var gisService="http://10.209.180.203:6080/ArcGIS/rest/services"
                //'http://221.182.241.179:85/ArcGis/rest/services'
            var gpurl = gisService+"/lpu/downloadShpZip/GPServer/downloadShpZip"

            var table={
                'S1MME':{'sqlserverName':'10.209.180.187','databaseName':'PublicService','table':'GIS_S1MME_XDR_GRID','usetime':true},
                'volte四项指标':{'sqlserverName':'10.209.180.187','databaseName':'PublicService','table':'GIS_jtgd_dilihua_grid','usetime':true},
                '网优栅格':{'sqlserverName':'10.209.180.187','databaseName':'PublicService','table':'gis_wangyou_net_grid_','usetime':true},
                'volte语音':{'sqlserverName':'10.209.180.187','databaseName':'PublicService','table':'gis_f_audio_grid','usetime':true}
            };
            for( var key in table) {
                var opt = document.createElement('option');
                opt.value = key;
                opt.innerHTML = key;
                this.tableChooser.appendChild(opt)
            }
            xhr('hhttp://10.209.180.1:18081/LTE_WebAPI/api/GIS/GetZhangDongDate?tablename=f_wangyou_net_grid_d_new' , {
                handleAs: 'json'
            }).then(function (data) {
                this.dateChooser.value = data[0].starttime;
                for (var i = 0; i <data.length ;i++) {
                    var item = data[i].starttime
                    var opt = document.createElement('option');
                    opt.value = item;
                    opt.innerHTML = item;
                    this.dateChooser.appendChild(opt);
                }
            })
            //var data=[{"tablename":"f_wangyou_net_grid_d_new","starttime":20190101,"endtime":20190103},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181225,"endtime":20181227},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181218,"endtime":20181220},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181211,"endtime":20181213},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181204,"endtime":20181206},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181127,"endtime":20181129},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181120,"endtime":20181122},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181113,"endtime":20181115},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181106,"endtime":20181108},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181030,"endtime":20181101},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181016,"endtime":20181018},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181009,"endtime":20181011},{"tablename":"f_wangyou_net_grid_d_new","starttime":20181002,"endtime":20181004},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180925,"endtime":20180927},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180918,"endtime":20180920},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180911,"endtime":20180913},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180904,"endtime":20180906},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180828,"endtime":20180830},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180814,"endtime":20180816},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180807,"endtime":20180809},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180731,"endtime":20180802},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180724,"endtime":20180726},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180710,"endtime":20180712},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180703,"endtime":20180705},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180626,"endtime":20180628},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180619,"endtime":20180621},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180612,"endtime":20180614},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180605,"endtime":20180607},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180529,"endtime":20180531},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180522,"endtime":20180524},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180515,"endtime":20180517},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180508,"endtime":20180510},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180501,"endtime":20180503},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180424,"endtime":20180426},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180417,"endtime":20180419},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180410,"endtime":20180412},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180403,"endtime":20180405},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180327,"endtime":20180329},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180320,"endtime":20180322},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180313,"endtime":20180315},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180306,"endtime":20180308},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180227,"endtime":20180301},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180206,"endtime":20180208},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180130,"endtime":20180201},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180123,"endtime":20180125},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180116,"endtime":20180118},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180109,"endtime":20180111},{"tablename":"f_wangyou_net_grid_d_new","starttime":20180102,"endtime":20180104},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171226,"endtime":20171228},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171219,"endtime":20171221},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171212,"endtime":20171214},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171205,"endtime":20171207},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171128,"endtime":20171130},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171121,"endtime":20171123},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171114,"endtime":20171116},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171031,"endtime":20171102},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171024,"endtime":20171026},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171017,"endtime":20171019},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171010,"endtime":20171012},{"tablename":"f_wangyou_net_grid_d_new","starttime":20171003,"endtime":20171005},{"tablename":"f_wangyou_net_grid_d_new","starttime":20170919,"endtime":20170921},{"tablename":"f_wangyou_net_grid_d_new","starttime":20170912,"endtime":20170914},{"tablename":"f_wangyou_net_grid_d_new","starttime":20170822,"endtime":20170824},{"tablename":"f_wangyou_net_grid_d_new","starttime":20170815,"endtime":20170817}]
            var that=this
            loading = document.getElementById("loading");
            on( this.dowloadSHPChooser,'click',function(evt){
                var date=that.dateChooser.options[that.dateChooser.selectedIndex].value
                var tablename=that.tableChooser.options[that.tableChooser.selectedIndex].value
                var tabledetail=table[tablename]
                var realtable=tabledetail.table;
                if(tabledetail.usetime){
                    realtable=realtable+date
                }
                var expression=that.whereChooser.value
                var gpParams =
                    {
                        "sqlserverName": tabledetail.sqlserverName,
                        "databaseName": tabledetail.databaseName,
                        "dataName": realtable,
                        "expression": expression
                    }
                console.log(gpParams)
                gp = new Geoprocessor(gpurl);
                loading.style.display='block';
                gp.submitJob(gpParams, this.statusCallback);
            })

        },
        statusCallback:function (jobInfo) {
            if (jobInfo.jobStatus == "esriJobSucceeded") {
                gp.getResultData(jobInfo.jobId, "zipPath",this.downLoadSuccessed);
            }
        },
        downLoadSuccessed:function( zipResult) {
            loading.style.display='none';
            window.location.href = zipResult.value.url;
        },
        fileSelected: function () {
            this.clearLocal();
            //文件选择
            if (utils.file.supportHTML5()) {
                this._processFiles(this.csvFileInput.files);
            } else if (utils.file.supportFileAPI()) {
                this._processFiles(window.FileAPI.getFiles(this.csvFileInput));
            } else {
                console.log("no file handler support !");
            }
            this.csvFileInput.value = null;
            //domClass.add(this.downloadResultsBtn, "hide");


            //断站时间
            var dateValue = $(this.breakDateChooser).val();
            dateValue = DateUtil.parseToSimple(dateValue);



        }, clearLocal: function () {

        },
        _processFiles: function (files) {
            //选择文件不可用
            //domClass.add(this.showFileDialogBtn, 'jimu-state-disabled');


            this._resetResults();
            // console.log(selectMap);
            if (files.length > 0) {
                var file = files[0];
                var fileExtension = file.name.substring(file.name.lastIndexOf('.') + 1).toUpperCase();
                if (file.name.indexOf('.csv') !== -1) {
                    if (file) {
                        this.handleCSV(file);
                    } else {
                        Message({
                            message: this.nls.error.fileIssue
                        });
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                        this.clearCSVResults();
                    }
                }
                //包括一般的excel的数据表格（模板）和txt文本
                else if (fileExtension.indexOf("XL") !== -1 || fileExtension.indexOf("TXT") !== -1) {
                    if (file) {
                        this.handleXLSX(file);
                    }
                    else {
                        Message({
                            message: this.nls.error.XLSXerro
                        });
                        //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                        this.clearXLSXResult();
                    }
                }
                else {
                    new Message({
                        message: this.nls.error.notCSVFile
                    });
                    //domClass.remove(this.showFileDialogBtn, 'jimu-state-disabled');
                    this.clearCSVResults();
                }
            }
        },
        handleCSV: function (file) {

        },
        handleXLSX: function (file) {

        },
        clearCSVResults: function () {

        },
        clearXLSXResult: function () {

        },
        _resetResults: function () {
            if(this._popupWindow == null ){
                this._popupWindow = new  SBPopupWindowWidget().placeAt(html.byId("map"));

            }
            html.setStyle(this._popupWindow.domNode, "display", "block");
            var  breakData = {
                "gridNum":500,
                "regionArea":125000,
                "g24rate":"30/60",
                "cfBreakNum":20,
                "cellsData":[{"name":"L1","value":200},{"name":"L2","value":100},{"name":"L3","value":50},{"name":"L4","value":10},{"name":"L5","value":10}],
                "pointNum":100000,
                "userNum":500,
                "flowTotal":"23.1GB",
                "hwTotall":"21.5Erl",
                "dropRate":"0.02%",
                "connectRate":"99.8%",
                "gzRate":"300KBps",
                "canshuya":"可抬高XXXXXXXX XXXXXX XXXXXX等小区功率",
                "tkytz":"可调整XXXXXXXX XXXXXX XXXXXX等小区电调天线倾角",
                "tkrtz":"可调整XXXXXXXX XXXXXX XXXXXX等小区电调天线倾角",
                "yjc":"无"
            };
            this._popupWindow.initCompent(breakData);
        },
        showFileDialog: function () {
            if (domClass.contains(this.showFileDialogBtn, 'jimu-state-disabled')) {
                return;
            }
            this.csvFileInput.click();
        },
        onClose: function () {
            this.open = false;
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });
});
