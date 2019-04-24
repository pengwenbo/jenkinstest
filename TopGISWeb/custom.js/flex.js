//重新更改的部分
//--全局变量
var queryJxghCjDateUrl = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/getWeakCoverDataSourceDate";
var SearchTableUrl1 = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/weakcover";
var SearchTableUrl2 = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/weakcover_build";
var realtimeOutMonitorCountyUrl = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/realtimeOutMonitor_County";
var urlWG_JZXN_JXGH11Root = "http://10.48.186.92/WG_JZXN_JXGH11/";
var dzAllIndexUrl = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/dz_AllIndex";
var getShiNeiCoverURL = "http://10.48.186.92/WG_JZXN_JXGH11/CQGXSG/index";
var all_city_name = "福州市,厦门市,宁德市,莆田市,泉州市,漳州市,龙岩市,三明市,南平市,全省";
var city_name = "";
var time_tool_id = "", type_tool_id = "", door_tool_id = "", select_city = "", select_county = "", time_choose_value = "", assess_tool_id = "";
function all_value(config, tablename) {
    var city = "";
    if (select_city) {
        city = select_city
    }
    else {
        city = $(".ui-selectmenu-text")[0].innerHTML;
        if (city == "所有地市") {
            city = "福州";
        }
    }
    var date = new Date();
    var needDate = date.getFullYear() + "-" + date.getMonth() + 1 + "-" + (date.getDate() - 2);
    var rdm = Math.random();
    var configOptions = currentToolOptions;
    var time = "", type = "TDD";
    if (time_tool_id) {
        if (document.getElementById(time_tool_id)) {
            document.getElementById(time_tool_id).id = "JxghSelect";
            time = $('#JxghSelect').children('option:selected').val();
        }
    }
    if (type_tool_id) {
        if (document.getElementById(type_tool_id)) {
            document.getElementById(type_tool_id).id = "typeSelect";
            type = $('#typeSelect').children('option:selected').val();
        }
    }
    if (door_tool_id) {
        if ($("#jxghMxSelect").val().indexOf("10") > -1) {
            document.getElementById("limit").innerHTML = 10;
        } else {
            document.getElementById("limit").innerHTML = 20;
        }
    }
    if (config.label == "MR覆盖评估") {
        city += "市";
        return "?dual=" + type + "&rsrp=110&limit=" + document.getElementById("limit").innerHTML + "&city=" + city + "&region=" + select_county + "&time=" + time + "&threeNetTime=" + needDate + "&threeNetTimeType=current&tablename=" + tablename + "&rdm=" + rdm;
    }
    if (config.label == "MR竞对评估") {
        city += "市";
        return "?region_name=" + city + "&rdm=" + rdm;
    }
    if (config.label == "黑点覆盖分析") {
        return "?dateId=" + "&city=" + city + "&flag=1" + "&rdm=" + rdm;
    }
    if (config.label == "智能规划") {
        city += "市";
        return "?rsrp=110&limit=" + document.getElementById("limit").innerHTML + "&city=" + city + "&region=" + select_county + "&time=" + time + "&tablename=" + tablename + "&dual=" + type + "&rdm=" + rdm;
    }
    if (config.label.indexOf("CCIP") > -1 || config.label.indexOf("投诉需求") > -1) {
        var time_today = date.getFullYear() + "-" + date.getMonth() + 1 + "-" + date.getDate();
        if (tablename == 1) {
            var time_nn = date.getFullYear() +""+ date.getMonth() + 1 +""+ (date.getDate() - 1);
            $.ajax({
                type: 'GET',
                url: config.Statistics.options.URL1,
                data: {
                    tableName: "COMPLAIN_RASTER_" + time_nn + "_ALL",
                    fieldName: "Name",
                    valName: "grid_code",
                    orderName: "grid_code",
                    orderBy: "desc",
                    top: 10,
                    rdm: Math.random()
                },
                success: function (data) {
                    createLiTable(data, 1);
                }
            });
        } else if (tablename == 2) {
            var time_yes = date.getFullYear() + "-" + date.getMonth() + 1 + "-" + (date.getDate() - 1);
            $.ajax({
                type: 'GET',
                url: config.Statistics.options.URL2,
                data: {
                    sqlWheres: "ACCEPT_TIME>'" + time_yes + " 00:00:00' and ACCEPT_TIME<'" + time_today + " 00:00:00'",
                    rdm: Math.random()
                },
                success: function (data) {
                    createLiTable(data, 2);
                }
            });
        }
    }
    else {
        return "?limit=" + document.getElementById("limit").innerHTML + "&city=" + city + "&time=20150525&threeNetTime=" + needDate + "&threeNetTimeType=current&tablename=" + tablename + "&rdm=" + rdm;
    }
}
function _changeJxghTools(config, url) {
    $("#type_method")[0].innerHTML = config.label;
    content_innerHtml_html = [];
    var cityName = "";
    if (select_city) {
        cityName = select_city
    }
    else {
        cityName = $(".ui-selectmenu-text")[0].innerHTML;
        if (cityName == "所有地市") {
            cityName = "福州";
        }
    }
    cityName += "市";
    //这个是变量，由于现在没法进行.net的引入所有用下面定值
    queryJxghCjDateUrl = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/getWeakCoverDataSourceDate";
    SearchTableUrl1 = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/weakcover";
    SearchTableUrl2 = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/weakcover_build";
    //var value = changRsrpDateStr();
    // getJxghCjDate(cityName, value);
    if ($("#type_method")[0].innerHTML == "城区干线栅格") {
        _getCityLineGrid(cityName, url);
    }
    if ($("#type_method")[0].innerHTML == "weekcover") {
        _getWeekCover(cityName, value, url);
    }
    if ($("#type_method")[0].innerHTML == "室内覆盖评估") {
        _getShiNeiCover(cityName, url);
    }
    if ($("#type_method")[0].innerHTML == "MR覆盖评估") {
        _getMRWeekCover(config, cityName, url);
    }
    if ($("#type_method")[0].innerHTML == "MR竞对评估") {
        _getMRCompeteCover(cityName, url);
    }
    if ($("#type_method")[0].innerHTML == "黑点覆盖分析") {
        _getBlackPointWeekCover(cityName, url);
    }
    if ($("#type_method")[0].innerHTML == "智能规划") {
        _getACDesign(config, cityName, url);
    }
    if ($("#type_method")[0].innerHTML.indexOf("后评估") > -1) {
        _backAssessTools(url);
    }
}
function _backAssessTools(url) {
    url = change_Url(url);
    $.ajax({
        type: 'GET',
        url: url,
        data: {
            cur_mon: $("#cur_monid").val(),
            cmp_mon: $("#cmp_monid").val(),
            rdm: Math.random()
        },
        success: function (data) {
            content_innerHtml_html = [];
            $("#contentDialog").html(data);
            content_innerHtml_html.push(data);
        }
    });
}
function _getACDesign(config, cityName, url) {
    var time = document.getElementById(time_tool_id).value;
    var rsrp = changRsrpStr();
    url = change_Url(url);
    var countyName = "";
    if (select_county) {
        select_county = $($(".conDiv select")[4]).children('option:selected')[0].innerHTML;
        countyName = select_county;
    }
    else {
        countyName = $(".ui-selectmenu-text")[1].innerHTML;
        if (countyName == "所有区县") {
            countyName = "主城区";
        }
    }
    $('#liCity').click();
    $.ajax({
        type: 'GET',
        url: url,
        data: {
            rsrp: rsrp,
            time: time,
            limit: document.getElementById("limit").innerHTML,
            city: cityName,
            region: countyName,
            tablename: config.Statistics.options.tablename,
            dual: "TDD",
            rdm: Math.random()
        },
        success: function (html) {
            content_innerHtml_html = [];
            if (html && html.indexOf("JxghSelect")) {
                document.getElementById(time_tool_id).id = "JxghSelect";
            }
            $("#contentDialog").html(html);
            content_innerHtml_html.push(html);
            if (html && html.indexOf("JxghSelect")) {
                document.getElementById("JxghSelect").id = time_tool_id;
            }
        }, error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert(errorThrown);
        }
    });
}
function _getBlackPointWeekCover(cityName, url) {
    cityName = cityName.split("市")[0];
    url = change_Url(url);
    $('#liCity').click();
    $.ajax({
        type: 'GET',
        url: url,
        data: {
            dateId: "",
            city: cityName,
            flag: 1,
            rdm: Math.random()
        },
        success: function (html) {
            $("#contentDialog").html(html);
            content_innerHtml_html[0] = html;
        }, error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert(errorThrown);
        }
    });
}
function _getMRCompeteCover(cityName, url) {
    url = change_Url(url);
    $('#liCity').click();
    $.ajax({
        type: 'GET',
        url: url + "/DLD",
        data: {
            grid_name: cityName,
            rdm: Math.random()
        },
        success: function (html) {
            $("#contentDialog").html(html);
            content_innerHtml_html[0] = html;
        }, error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert(errorThrown);
        }
    });
}
function _getMRWeekCover(config, cityName, url) {
    // var time = $('#JxghSelect').children('option:selected').val();
    var time = document.getElementById(time_tool_id).value;
    // document.getElementById(time_tool_id).id = "JxghSelect";
    // time = $('#JxghSelect').children('option:selected').val();
    jQuery.support.cors = true;
    var rsrp = changRsrpStr();
    url = change_Url(url);
    var countyName = "";
    if (select_county) {
        select_county = $($(".conDiv select")[4]).children('option:selected')[0].innerHTML;
        countyName = select_county;
    }
    else {
        countyName = $(".ui-selectmenu-text")[1].innerHTML;
        if (countyName == "所有区县") {
            countyName = "主城区";
        }
    }
    $('#liCity').click();
    $.ajax({
        type: 'GET',
        url: url,
        data: {
            rsrp: rsrp,
            time: time,
            limit: document.getElementById("limit").innerHTML,
            city: cityName,
            region: countyName,
            tablename: config.Statistics.options.tablename,
            rdm: Math.random()
        },
        success: function (html) {
            content_innerHtml_html = [];
            if (html && html.indexOf("JxghSelect")) {
                document.getElementById(time_tool_id).id = "JxghSelect";
            }
            $("#contentDialog").html(html);
            content_innerHtml_html.push(html);
            if (html && html.indexOf("JxghSelect")) {
                document.getElementById("JxghSelect").id = time_tool_id;
            }
        }, error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert(errorThrown);
        }
    });
}
function _getShiNeiCover(cityName, url) {
    var city = cityName.split("市")[0];
    //getShiNeiCoverURL = change_Url(getShiNeiCoverURL);
    url = change_Url(url);
    $.get(url, { city: city, rdm: Math.random() }, function (html) {
        content_innerHtml_html = [];
        $('#liCity').click();
        $("#contentDialog").html(html);
        content_innerHtml_html.push(html);
    });
}
function _getCityLineGrid(city, url) {
    url = change_Url(url);
    city = city.split("市")[0];
    $.get(url, { region_name: city, rdm: Math.random() }, function (html) {
        content_innerHtml_html = [];
        $('#liCity').click();
        html = html.replace(new RegExp("function linkDLD_Detail", 'g'), "function linkDLD_Detail_");
        $("#contentDialog").html(html);
        content_innerHtml_html.push(html);
    });
}

function change_Url(url) {
    if (url) {
        var curip = window.location.host;
        if (curip.indexOf("10.53.160.88") > -1) {
            url = url.replace(new RegExp("10.48.186.92/", 'g'), "10.53.160.88:8999/");
        }
        return url;
    }
}
//栅格弱覆盖，第一张表
function _getWeekCover(cityName, value, url) {
    if (!url) {
        url = "http://10.48.186.92/WG_JZXN_JXGH11/Gis/SearchTable";
    }
    $.ajax({
        type: 'GET',
        url: url,
        data: {
            rsrp: "110",
            limit: document.getElementById("limit").innerHTML,
            city: cityName,
            time: value,
            tablename: $("#hdtablename").val(),
            rdm: Math.random()
        },
        success: function (data) {
            $("#contentDialog").html(data);
            content_innerHtml_html.push(data);
        }
    });
}


function changRsrpDateStr() {
    // var value = $("#JxghSelect").val();
    var value = document.getElementById(time_tool_id).value;
    //var rsrpVisible = $("#rsrpCB").attr("checked");
    var rsrpVisible = false;

    if (rsrpVisible && value == "20161226") {
        value = "20161227";
    } else if (rsrpVisible && value == "20170119") {
        value = "20170120";
    } else if (rsrpVisible && value != "20161226" && value != "20170119") {
        value = "20201231";
    }

    return value;
}


function getJxghCjDate(city, time) {
    var queryData = {};
    queryData.city = city;
    queryData.date_id = time;

    $.ajax({
        type: 'GET',
        url: queryJxghCjDateUrl,
        data: queryData,
        success: function (data) {
            $("#planTabCon").find(".toolsDateLabel").text("采集时间:" + data);
            content_innerHtml_html.push(data);
        }
    });
}
//实时断站监控
function getRealTimeOutMonitorSecond(city) {
    realtimeOutMonitorCountyUrl = change_Url(realtimeOutMonitorCountyUrl);
    $('#liContry').show();
    $('#liContry').click();
    $.get(realtimeOutMonitorCountyUrl, { city: city, rdm: Math.random() }, function (html) {
        $("#contentDialog").html(html);
        content_innerHtml_html[1] = html;
    });
}
function getRealTimeOutMonitorThird(city, county) {
    urlWG_JZXN_JXGH11Root = change_Url(urlWG_JZXN_JXGH11Root);
    $('#chu').show();
    $('#chu').click();
    $.get(urlWG_JZXN_JXGH11Root + "gis/realtimeOutMonitor_Cell", {
        city: city,
        county: county,
        rdm: Math.random()
    }, function (html) {
        $("#contentDialog").html(html);
        content_innerHtml_html[2] = html;
    });
}

//断站
function getsec_dz(county, type) {
    $('#liContry').show();
    $('#liContry').click();
    $.get(urlWG_JZXN_JXGH11Root + "gis/dz_city", { type: type, city: county, rdm: Math.random() }, function (html) {
        $("#contentDialog").html(html);
        content_innerHtml_html[1] = html;
    });
}

function getthird_dz(county, type) {
    $("#excel_cell").unbind("click").click(function () {
        var url = urlWG_JZXN_JXGH11Root + "gis/Import_dz_xiang?county=" + county + "&type=" + type + "&limit=" + document.getElementById("limit").innerHTML + "&rdm=" + Math.random();
        window.open(url);
    });
    $('#chu').show();
    $('#chu').click();
    $.get(urlWG_JZXN_JXGH11Root + "gis/dz_county", { type: type, county: county, rdm: Math.random() }, function (html) {
        $("#contentDialog").html(html);
        content_innerHtml_html[2] = html;
    });
}
//三网断站乡镇分布图
function break_site() {
    dzAllIndexUrl = change_Url(dzAllIndexUrl);
    $("div.pTabBox a").live("click", function () {
        var city = this.innerHTML;
        if (all_city_name.indexOf(city) > -1) {
            city_name = "";
            city_name = city;
            $('#liContry').show();
            $('#liContry').click();
            $.get(dzAllIndexUrl.replace("dz_AllIndex", "dz_AllCity"), {
                city: city,
                rdm: Math.random()
            }, function (html) {
                $("#contentDialog").html(html);
                content_innerHtml_html[1] = html;
            });
        } else {
            $('#chu').show();
            $('#chu').click();
            $.get(dzAllIndexUrl.replace("dz_AllIndex", "dz_AllCounty"), {
                city: city_name,
                county: this.innerHTML,
                rdm: Math.random()
            }, function (html) {
                $("#contentDialog").html(html);
                content_innerHtml_html[2] = html;
            });
        }
    });
}
//城区干线栅格第二块
function linkDLD_Detail(grid_name) {
    $('#liContry').show();
    $('#liContry').click();

    $.get(urlWG_JZXN_JXGH11Root + "CQGXSG/DLD", { grid_name: grid_name }, function (html) {
        $("#contentDialog").html(html);
        content_innerHtml_html[1] = html;
    });
}
//室内覆盖评估
function ShowGIS_LC_COVER_PNTDetail(dateid, city) {
    $('#liContry').show();
    $('#liContry').click();
    $.get(SNFGPGSecUrl, { dateid: dateid, city: city, rdm: Math.random() }, function (html) {
        $("#contentDialog").html(html);
        content_innerHtml_html[1] = html;
    });
}
//---地图跳转
function centerAt(lon, lat) {
    require(['dojo/topic'], function (topic) {
        topic.subscribe("map_centerAt", lon, lat);
    });
}
//MR覆盖评估
function getsec(type, city, county) {
    var time = document.getElementById(time_tool_id).value;
    // var time = $('#JxghSelect').children('option:selected').val();
    var a = time.substring(0, 4);
    var b = time.substring(4, 6);
    var c = time.substring(6, 8);
    var d = a + b + c;
    jQuery.support.cors = true;
    $('#chu').show();
    $('#chu').click();
    var rsrp = changRsrpStr();
    SearchTableUrl1 = change_Url(SearchTableUrl1);
    SearchTableUrl2 = change_Url(SearchTableUrl2);
    if (type == "弱覆盖楼宇") {
        document.getElementById("method").innerHTML = "weakcover_build";
        $.get(SearchTableUrl2, {
            rsrp: rsrp,
            time: d,
            limit: document.getElementById("limit").innerHTML,
            city: city,
            county: county,
            rdm: Math.random()
        }, function (html) {
            $("#contentDialog").html(html);
            content_innerHtml_html[2] = html;
        })
    }
    else {
        if (type == "面弱覆盖") {
            document.getElementById("ques_type").innerHTML = "2";
            $.ajax({
                type: 'GET',
                url: SearchTableUrl1,
                data: {
                    dual: "TDD",
                    rsrp: rsrp,
                    time: d,
                    limit: document.getElementById("limit").innerHTML,
                    city: city,
                    county: county,
                    ques_type: 2,
                    tablename: "defLayer",
                    page: $(this).attr("goPage"),
                    rdm: Math.random()
                },
                success: function (html) {
                    $("#contentDialog").html(html);
                    content_innerHtml_html[2] = html;
                }, error: function (XMLHttpRequest, textStatus, errorThrown) {
                    alert(errorThrown);
                }
            });
        }
        else {
            document.getElementById("ques_type").innerHTML = "1";
            $.get(SearchTableUrl1, {
                dual: "TDD",
                rsrp: rsrp,
                time: d,
                limit: document.getElementById("limit").innerHTML,
                ques_type: 1,
                city: city,
                county: county,
                rdm: Math.random()
            }, function (html) {
                $("#contentDialog").html(html);
                content_innerHtml_html[2] = html;
            })
        }
    }
}
function changRsrpStr() {
    var value = "110";
    var rsrpVisible = false;
    if (rsrpVisible) {
        value = "105";
    }
    return value;
}
function getzhinengSec(time, city, unnull, type) {
    $('#liContry').show();
    $('#liContry').click();
    $.get("http://10.48.186.11:8001/zngh/DrillPage", {
        date: time,
        region: city,
        county: $($(".conDiv select")[4]).children('option:selected')[0].innerHTML,
        znghtype: type,
        rdm: Math.random()
    }, function (html) {
        $("#contentDialog").html(html);
        content_innerHtml_html[1] = html;
    })
}
function clickTopTelNum(telNum) {
    require(['dojo/topic'], function (topic) {
        topic.publish("clickTopTelNum", telNum, null);
    });
}
function createLiTable(resultList, num) {
    $('#liCity').show();
    $('#liContry').show();
    $('#liContry').click();
    //处理字符串的过程
    var array = resultList;
    var li = "";
    //地点
    if (num == 1) {
        for (var i in array) {
            li += "<li style=\"border-bottom: 1px #ccc dotted;line-height: 30px;\"><a style=\"color:#000;\" href=\"#\" onclick=\"centerAt(" + array[i].LON + "," + array[i].LAT + ")\">" + array[i].LABLENAME + "</a><span style=\"color:#ccc;float:right;\">" + array[i].LABLEVAL + "次</span></li>"
        }
    }
    //号码
    if (num == 2) {
        for (var i in array) {
            li += "<li style=\"border-bottom: 1px #ccc dotted;line-height: 30px;\"><a style=\"color:#000;\" href=\"#\" onclick=\"clickTopTelNum(" + array[i].LABLENAME + ")\">" + array[i].LABLENAME + "</a><span style=\"color:#ccc;float:right;\">" + array[i].GROUPCOUNT + "次</span></li>"
        }
    }
    var html = "<div>" + "<ul class=\"newslist\" id=\"topNList\">" + li + "</ul>" + "</div>";
    $("#contentDialog").html(html);
    content_innerHtml_html.push(html);
}