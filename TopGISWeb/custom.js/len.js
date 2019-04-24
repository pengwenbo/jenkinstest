define([
    "dojo/Deferred",
    "dojo/_base/lang",
    'dojo/_base/array',
    "dojo/on",
    "jimu/MapManager",
    'jimu/ConfigManager',
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/map",
    "esri/InfoTemplate",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/Color",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    'jimu/dijit/Message',
    "dojox/grid/DataGrid",
    "dojo/data/ItemFileWriteStore",
    "dojo/dom"
],

function (Deferred, lang, array, on, MapManager, ConfigManager, Query, QueryTask, Map, InfoTemplate, ArcGISDynamicMapServiceLayer, TiledLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, PictureMarkerSymbol, Color, TextSymbol, Font,
         Message, DataGrid, ItemFileWriteStore, dom
 ) {
    var le = {};
    var para;
    var paraArray; //为grid3中的详细信息显示提供参数。
    var layers;
    var detailsMaps = [];
    /*自己添加的访问服务器的函数*/
    le.Asynchronous = function (gUrl/*访问的服务地址*/, param/*服务所需参数*/, Layerinfo) {
        layers = Layerinfo;
        paraArray = param.split(',');
        var content = "area=" + paraArray[2] + "&startyear=" + paraArray[0] + "&endyear=" + paraArray[1];
        para = content;
        xmlhttp = null;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        }
        else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        var url = gUrl;
        xmlhttp.onreadystatechange = state_Change;
        xmlhttp.open("post", url, true);
        xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xmlhttp.send(content);
        function state_Change() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    var As_data = xmlhttp.responseXML;
                    var node1 = document.getElementById("m_table");
                    le.create_gridData1(As_data, node1);


                }
                else {
                    alert("Problem retrieving XML data");
                }
            }
        }
    };

    //创建第一个grid。
    le.create_gridData1 = function (data_sourse, node1) {
        var grid_node = document.getElementById("grid1");
        var data = {
            items: []
        };
        for (i = 0; i < data_sourse.getElementsByTagName("TURN_TYPE").length; i++) {
            var data_list = [
        {
            col1: data_sourse.getElementsByTagName("DI_LEI_NAME")[i].textContent,
            col2: data_sourse.getElementsByTagName("TURN_TYPE")[i].textContent,
            col3: parseFloat(data_sourse.getElementsByTagName("SUM1")[i].textContent).toFixed(2),
            col4: data_sourse.getElementsByTagName("COUNT1")[i].textContent
        }];
            data.items.push(data_list[0]);
        }
        var dataStore = new ItemFileWriteStore({ data: data });

        /*set up layout*/
        var layout = [[
        { 'name': '用地类型', 'field': 'col1' },
        { 'name': '转换', 'field': 'col2' },
        { 'name': '面积', 'field': 'col3' },
        { 'name': '数目', 'field': 'col4' }
        ]];
        if (grid_node) {
            var grid = dijit.byId("grid1");
            grid.setStore(dataStore);
        }
        /*create a new grid*/
        var grid1 = new DataGrid({
            id: 'grid1',
            store: dataStore,
            structure: layout
        });

        //var node1 = document.getElementById("m_table");
        /*append the new grid to the div*/
        grid1.placeAt(node1);
        grid1.onRowClick = function (e) {



            var mm = e.rowNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent;
            var t_type = e.rowNode.childNodes[0].childNodes[0].childNodes[0].childNodes[1].textContent;
            para2 = para + "&" + "dlname=" + mm + "&turn_type=" + t_type;

            alert(para2);
            url2 = "http://localhost:2314/WebService.asmx/get_table2";
            xmlhttp = null;
            if (window.XMLHttpRequest) {
                xmlhttp = new XMLHttpRequest();
            }
            else {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            }

            xmlhttp.onreadystatechange = state_Change;
            xmlhttp.open("post", url2, true);
            xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlhttp.send(para2);
            function state_Change() {
                if (xmlhttp.readyState == 4) {
                    if (xmlhttp.status == 200) {
                        var As_data = xmlhttp.responseXML;
                        var node2 = document.getElementById("m_table1");
                        //当查询成功后页面跳转。注意此时控制跳转的语句只能放在创建grid2语句前.
                        var tabContainer = dijit.byId("tc1-prog")
                        var dbTab = dijit.byId("target2");
                        tabContainer.selectChild(dbTab);
                        le.create_gridData2(As_data, node2);
                    }
                    else {
                        alert("Problem retrieving XML data");
                    }
                }
            }



        };

        /*Call startup() to render the grid*/
        grid1.startup();
    };



    //创建第二个grid

    le.create_gridData2 = function (data_sourse/*dataGrid的数据源*/, node/*存放datagrid的节点*/) {

        var grid_node = document.getElementById("grid2");
        var data = {
            identifier: "id",
            items: []
        };
        for (i = 0; i < data_sourse.getElementsByTagName("CHANGE_TYPE").length; i++) {
            var data_list = [
        {
            col2: data_sourse.getElementsByTagName("CHANGE_TYPE")[i].textContent,
            col3: parseFloat(data_sourse.getElementsByTagName("SUM")[i].textContent).toFixed(2),
            col4: data_sourse.getElementsByTagName("COUNT")[i].textContent
        }];
            //data.items.push(data_list[0]);
            data.items.push(lang.mixin({ id: i + 1 }, data_list[0]));
        }
        var dataStore = new ItemFileWriteStore({ data: data });
        /*set up layout*/
        var layout = [[
        { 'name': '序号', 'field': 'id', 'width': '40px' },
        { 'name': '变化类型', 'field': 'col2', 'width': '100px' },
        { 'name': '面积', 'field': 'col3', 'width': '100px' },
        { 'name': '数目', 'field': 'col4', 'width': '50px' }
        ]];
        if (grid_node) {
            var grid = dijit.byId("grid2");
            grid.setStore(dataStore);
        }
        /*create a new grid*/
        var grid2 = new DataGrid({
            id: 'grid2',
            store: dataStore,
            structure: layout
        });
        /*append the new grid to the div*/
        grid2.placeAt(node);
        /*Add the event to the grid*/
        grid2.onRowClick = function (e) {
            //用来获取所需要的单元格的值。方便后面的传值
            var mm = e.rowNode.childNodes[0].childNodes[0].childNodes[0].childNodes[1].textContent;
            dojo.byId("t3_bhlx").innerText = "变化类型：" + mm;
            var dl_names = mm.split('——>');
            var para3 = para + "&dlname_start=" + dl_names[0] + "&dlname_end=" + dl_names[1];
            alert(para3);
            url3 = "http://localhost:2314/WebService.asmx/get_table3";
            xmlhttp = null;
            if (window.XMLHttpRequest) {
                xmlhttp = new XMLHttpRequest();
            }
            else {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            }
            xmlhttp.onreadystatechange = state_Change;
            xmlhttp.open("post", url3, true);
            xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlhttp.send(para3);
            function state_Change() {
                if (xmlhttp.readyState == 4) {
                    if (xmlhttp.status == 200) {
                        var As_data = xmlhttp.responseXML;
                        var node3 = document.getElementById("m_table2");
                        var tabContainer = dijit.byId("tc1-prog")
                        var dbTab = dijit.byId("target3");
                        tabContainer.selectChild(dbTab);
                        le.create_gridData3(As_data, node3);
                    }
                    else {
                        alert("Problem retrieving XML data");
                    }
                }
            }
        };
        /*Call startup() to render the grid*/
        grid2.startup();
    };


    //创建第三个grid。
    le.create_gridData3 = function (data_sourse/*dataGrid的数据源*/, node/*存放datagrid的节点*/) {
        var grid_node = document.getElementById("grid3");
        var data = {
            items: []
        };
        for (i = 0; i < data_sourse.getElementsByTagName("MJ").length; i++) {
            var data_list = [
        {
            col1: data_sourse.getElementsByTagName("NO")[i].textContent,
            col2: parseFloat(data_sourse.getElementsByTagName("MJ")[i].textContent).toFixed(2),
            col3: 'xiangxi',
            col4: data_sourse.getElementsByTagName("START_DKID")[i].textContent,
            col5: data_sourse.getElementsByTagName("END_DKID")[i].textContent

        }];
            data.items.push(data_list[0]);
        }
        var dataStore = new ItemFileWriteStore({ data: data });
        /*set up layout*/
        var layout = [[
        { 'name': '序号', 'field': 'col1', 'width': '40px' },
        { 'name': '面积', 'field': 'col2', 'width': '100px' },
        { 'name': '详细', 'field': 'col3', 'width': '100px', "formatter": function () { return '<img src="/stemapp/images/details.png" />'; } },
        { 'name': 'START_DKID', 'field': 'col4', 'width': '100px', 'hidden': true },
        { 'name': 'END_DKID', 'field': 'col5', 'width': '100px', 'hidden': true }
        ]];

        if (grid_node) {
            var grid = dijit.byId("grid3");
            grid.setStore(dataStore);
        }
        /*create a new grid*/
        var grid3 = new DataGrid({
            id: 'grid3',
            store: dataStore,
            structure: layout
        });

        grid3.onRowClick = function (e) {
            var dc = document.getElementById("detail_container");
            if (dc) {
                detailsMaps = [];
                var node_lenth = dc.childNodes.length;
                for (var i = 0; i < node_lenth; i++) {
                    dc.removeChild(dc.firstChild);
                }
            }
            var directions = ["left", "right"];

            var startDkid = e.rowNode.childNodes[0].childNodes[0].childNodes[0].childNodes[3].textContent;
            var endDkid = e.rowNode.childNodes[0].childNodes[0].childNodes[0].childNodes[4].textContent;
            var dkid = [startDkid, endDkid];
            le.show_detials(paraArray[0], paraArray[3], startDkid, directions[0]);
            le.show_detials(paraArray[1], paraArray[3], endDkid, directions[1]);
            detailsMaps[0].on("extent-change", function () {

                detailsMaps[1].setExtent(detailsMaps[0].extent);

            });


        };

        /*append the new grid to the div*/
        grid3.placeAt(node);
        grid3.startup();
    };






    le.show_detials = function (Year, Area, Dkid, Direction) {
        //创建并添加详细显示图层的父元素。
        var node_parent = document.getElementById("detail_container");
        if (!node_parent) {
            var node_map = dojo.byId("map_container");
            var node_mapLayer = document.getElementById("map_layers");
            node_mapLayer.style.display = "none";
            var node_0 = document.createElement("div");
            node_0.id = "detail_container";
            node_0.style.width = "100%";
            node_0.style.height = "100%";
            node_map.appendChild(node_0);
            node_parent = node_0;
        }


        //创建并添加详细显示图层。
        var detail_node = document.createElement("div");
        var divId = "map_" + Direction;
        detail_node.style.display = "inline-block"
        detail_node.style.borderRight = "1px solid black";
        detail_node.style.width = "50%"
        detail_node.style.height = "100%";
        detail_node.id = divId;
        node_parent.appendChild(detail_node);




        //            var details_para = ['2012', '白云区林地落界小班数据', '2013']; //用于测试

        var visible;
        //获取相应的图层。details_para中分别有起始年份，区域，截止年份。
        for (var i = 0; i < layers.length; i++) {
            var parent_id;
            if (layers[i].name == Year) {
                parent_id = layers[i].id; //获取年份图层的id
                for (var j = 0; j < layers.length; j++) {
                    if (layers[j].name == Area && layers[j].parentLayerId == parent_id) {
                        visible = layers[j].id; //获取要展示的图层的id
                        break;
                    }
                }
                break;
            }

        }
        var baseUrl = "http://gis.gyforest.com:6080/arcgis/rest/services/GYSLFH/MapServer";//怎么避免在js文件出现类似的服务地址，让其在config文件中控制。
        var featureUrl = "http://gis.gyforest.com:6080/arcgis/rest/services/LDLJXBQX/MapServer"
        var featureL = new esri.layers.FeatureLayer("http://gis.gyforest.com:6080/arcgis/rest/services/LDLJXBQX/MapServer/1");
        var queryUrl = featureUrl + "/" + visible; //查询服务的图层地址。
        var DetailMap = new Map(divId);
        var layer0 = new TiledLayer(baseUrl);
        DetailMap.addLayer(layer0);
        var layer1 = new esri.layers.ArcGISDynamicMapServiceLayer(featureUrl);
        layer1.setVisibleLayers([visible]);
        DetailMap.addLayer(layer1);

        //dkID = "52011300200800010068";
        QueryByProperty(Dkid, queryUrl);
        detailsMaps.push(DetailMap);

        function QueryByProperty(dkid, Qurl) {
            var queryTask = new QueryTask(Qurl);
            var query = new Query();

            var wheStr = "DJH='" + dkid + "'";
            query.where = wheStr;
            query.outFields = ["*"];
            query.returnGeometry = true;
            queryTask.execute(query, ShowQueryResult);
            //查询后的回调函数；
            function ShowQueryResult(queryResult) {
                if (queryResult.features.length == 0) {
                    alert("查询出错" + Direction);
                }
                else {
                    alert("查询成功" + Direction);
                    for (var i = 0; i < queryResult.features.length; i++) {
                        //新建一个SimpleFillSymbol，用于对选择出来的图像进行高亮显示。构造函数是new SimpleFillSymbol(style, outline, color)
                        var resultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                      new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2),
                      new Color([46, 170, 230, .4]));
                        var rextent = new esri.geometry.Extent();
                        var graphic = queryResult.features[i];
                        //不知道怎么显示不出来！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
                        //var json = { title: "属性", content: "DJH:${DJH}<br>DI_LEI:${DI_LEI}" };
                        var infotamplate = new esri.InfoTemplate("详细信息", "地籍号:${DJH}<br>地类编号:${DI_LEI}");
                        graphic.setSymbol(resultSymbol);
                        graphic.setInfoTemplate(infotamplate);
                        DetailMap.graphics.add(graphic);
                        rextent = graphic.geometry.getExtent();
                        DetailMap.setExtent(rextent.expand(6));
                        //下面两行用去测试，获取数据
//                            var mm = queryResult.features[i].attributes.DKID;
//                            alert(mm);
                    }

                }
            }
        };

    };

    return le;
});