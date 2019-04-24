/**
 * Created by zgj on 2015/8/5.参考common.js的格式来做
 * 一些常用方法
 */

define(["esri/map",
        'dojo/_base/lang',
        'dojox/grid/EnhancedGrid',
        'dojo/data/ItemFileWriteStore',
        "dojox/grid/enhanced/nls/zh/Pagination",
        "dijit/registry",
        "dojox/grid/enhanced/plugins/Pagination",
        "dojo/domReady!"
    ],
    function (Map, lang, EnhancedGrid, ItemFileWriteStore, pagination_reload, registry, Pagination) {
        /* global method*/
        var mo = {};

        //重载pagination.js中的_updateDescription，定制description信息
        function reloadpagination() {


        }



        //年份选择
        mo.selectyear = function (map, layername) {
            //初值1是为了方便后面循环
            var year = [1];
            var layer = map.getLayer(layername);
            var layerinfo = layer.layerInfos;
            for (var m = 0; m < layerinfo.length; m++) {
                for (var n = 0; n < year.length; n++) {
                    if (layerinfo[m].name == year[n]) {
                        break;
                    }
                }
                if (layerinfo[m].name == year[n]) {
                    break;
                }
                if (!isNaN(layerinfo[m].name)) {
                    year.push(layerinfo[m].name);
                }

            };
            //删除第一个元素1
            year.splice(0, 1);
            return year;
        };


        //获取鼠标的位置，考虑滚动条
        mo.getmouselocation = function (evt, panelid) {
            var x, y;
            var e = evt || window.event;
            var scrollY = document.getElementById(panelid).scrollTop
            var scrollX = document.getElementById(panelid).scrollLeft
            return { x: e.clientX + scrollX,
                y: e.clientY + scrollY
            };
        }

        //创建enhancedgrid表格，包含详细信息图标，需要传的参数：json数组、layout参数、表格所放置的div的id、默认行数、表格行高，返回值是grid
        //image图片的点击事件要额外添加，因为该事件要有返回值
        mo.buildtable = function (data_list, layout, divid, defaultrow, tableid, rowheight) {

            pagination_reload.itemTitle = "number";
            pagination_reload.descTemplate = "page";
            //            Pagination_reload.extend({
            //                _updateDescription: function () {
            //                    // summary:
            //                    // Update size information.
            //                    var s = this.plugin.forcePageStoreLayer, maxSize = this.plugin._maxSize, nls = this.plugin._nls, getItemTitle = function () {
            //                        return maxSize <= 0 || maxSize == 1 ? nls[5] : nls[4];
            //                    };
            //                    if (this.description && this.descriptionDiv) {
            //                        this.descriptionDiv.innerHTML = maxSize > 0 ? string.substitute(nls[0], [getItemTitle(), maxSize, s.startIdx + 1, s.endIdx + 1]) : "0 " + getItemTitle();
            //                    }
            //                }
            //            });



            //如果之前有id和，则删除之前创建的

            if (registry.byId(tableid)) {

                registry.byId(tableid).destroyRecursive();
            };
            /*set up data store*/
            var data = {
                identifier: "id",
                items: []
            };

            //表格行数
            var rows = data_list.length;
            //给表格增加序号
            for (var i = 0, l = data_list.length; i < rows; i++) {
                data.items.push(lang.mixin({ id: i + 1 }, data_list[i % l]));
            }

            var store = new ItemFileWriteStore({ data: data });

            /*create a new grid*/
            var grid = new EnhancedGrid(dojo.mixin({

                plugins: {
                    pagination: {
                        //设置默认信息显示行数
                        defaultPageSize: defaultrow,
                        sizeSwitch: false,
                        pageSizes: ['5', '10'], //注意必须是字符串,当sizeSwitch设置为false的时候没用
                        maxPageStep: 3, //在右边最多显示几页  
                        //                        itemTitle: '行', //默认把每一行称作一个item，当然可以改成别的  
                        descTemplate: '${2} - ${3} of ${1}'
                    }
                },
                id: tableid,
                rowsPerPage: defaultrow,
                store: store,
                structure: layout,
                rowHeight: rowheight,
                autoHeight: true,
                autoWidth: true,
                rowSelector: '0px'
            }));
            var plugin = grid.plugin('pagination');
            plugin._nls[0] = "第" + "${2} - ${3}" + "条" + " 共" + "${1}" + "条";
            /*append the new grid to the div*/
            grid.placeAt(divid);

            /*Call startup() to render the grid*/
            grid.startup();
            return grid;

        }
        mo.trun_data = function (feature, cloumns, bs_data, column) {
            var data = [];
            var column = {};
            //var key = features[i].attributes["证号"].toString();
           // data[i].attributes["证件号"] = bs_data["PERMIT_NUM"];
            feature.graphic.attributes["初次领证时间"] = bs_data["PERMIT_LZSJ"];
            feature.graphic.attributes["企业名称"] = bs_data["COMPANYNAME"];
            feature.graphic.attributes["企业地址"] = bs_data["COMPANYADDR"];
            feature.graphic.attributes["企业性质"] = bs_data["COMPANYPROP"];
            feature.graphic.attributes["法人"] = bs_data["LEGALREPRESENT"];
            feature.graphic.attributes["持证人"] = bs_data["CZLXB"];
            feature.graphic.attributes["生产规模"] = bs_data["PRODSCALE"];
            feature.graphic.attributes["原料来源"] = bs_data["SOURCE"];
            feature.graphic.attributes["经营范围"] = bs_data["BUSISCOPE"];
            feature.graphic.attributes["加工范围"] = bs_data["PROCRANGE"];
            feature.graphic.attributes["备注"] = bs_data["BZ"];
            feature.graphic.attributes["经营范围其他"] = bs_data["BUSISCOPEQT"];
            feature.graphic.attributes["加工范围其他"] = bs_data["PROCRANGEQT"];
            feature.graphic.attributes["企业成立时间"] = bs_data["ESTABLISHED"];
            feature.graphic.attributes["有效期限"] = bs_data["PERMIT_YXQXS"];
//            for (column in columns) {
//                if (column != "id") {
//                    var _value = features[i].attributes[columns[column].field];
//                    var _cW = common.checkNum(columns[column].field) ? columns[column].field.length * 5 : columns[column].field.length * 10;
//                    var _vW = 0;
//                    var _w = 0;
//                    if (_value != undefined) {
//                        _vW = common.checkNum(_value) ? _value.length * 5 : _value.length * 10;
//                    }
//                    _w = _cW > _vW ? _cW : _vW;
//                    data[i][columns[column].field] = features[i].attributes[columns[column].field];
//                    columns[column]["width"] = _w + 20 + _w / 6;
//                }
//                else {
//                    data[i].id = i + 1;
//                }
            


            return data;
        }


        return mo;
    })