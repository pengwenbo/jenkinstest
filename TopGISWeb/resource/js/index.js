/**
 * Created by huangfei on 2018/11/14.
 */
$(function () {
    $("#tag2").val("");
    //高级搜索-关键字变化
    $("#tags2").bind('keyup', function (event) {
            gjSearch();
    });

    //清空搜索关键字按钮点击事件
    $(".clsBtn").live("click", function () {
        $("#tags2").val("");
        $(".seniorSearch").find(".serResult").slideUp();
    });

    $("#tags2").live("click", function () {
        //搜索框内容不为空时弹出搜索结果
        var keyword = $(this).val();
        if (keyword) {
            var type = $("#type").val();
            var keyword = $("#tags2").val();
            if (type == "位置" || type == "所有") {
                $('.serResult').slideDown();
            }

        }
    });

});

//高级搜索事件
var gjSearch = function () {
    var keyword = $("#tags2").val();
    if (keyword != "") {
        //var city = $("#city").val();
        // var county = $("#district").val();
        searchApi({ keyword: keyword }, 1);
    } else {
        $(".seniorSearch .SmAdressListUl").html("");
        $(".seniorSearch").find(".serResult").slideUp();
        clearGraphic();
    }
}

//搜索接口
//0普通搜索，1高级搜索
var searchApi = function (searchArg, searchType) {
    //查询接口：http://10.209.240.176:6083/search
    //    参数：     keyword: 关键字,     city: 地市,     rows: 最大返回条数,     county: 区县,     type: 类型
    var searchUr = "http://47.75.105.45:8990/search";


    $.ajax({
        type: 'get',
        //dataType:'JSONP',  // 处理Ajax跨域问题
        url: searchUr,
        data: { keyword: searchArg.keyword, city: null, rows: 30, county: null, type: null },
        success: function (data, status, xhr) {
            if (data != "") {
                var json = JSON.parse(data);
                var resultHtml = "";
                if (json != undefined && json.length > 0) {
                    for (var i = 0; i < json.length; i++) {
                        if (json[i].name != "" && json[i].name.trim().length > 0) {
                            resultHtml += "<li><a href=\"#\" onclick=\"searchItemLocationTo(" + json[i].lon + "," + json[i].lat + ")\" title=\"" + json[i].name + "\">" + json[i].name + "</a></li>";
                        }
                    }
                }
                else {
                    resultHtml += "<li><a href=\"#\">未搜索到“" + searchArg.keyword + "”的相关信息</a></li>";
                }
                if (searchType === 0) {
                    $(".searchBar .SmAdressListUl").html(resultHtml);
                    $(".searchBar").find(".serResult").slideDown();
                }
                else if (searchType === 1) {
                    $(".seniorSearch .SmAdressListUl").html(resultHtml);
                    $(".seniorSearch").find(".serResult").slideDown();
                }

            }
        },
        error: function (xhr, type) {
            // alert(data);
        }
    });


}

function searchItemLocationTo(log,lat) {
    locationTo(log, lat);
    $('.serResult').slideUp();
}

//清除点击图标
var clearGraphic = function () {
    require(['dojo/topic'], function (topic) {
        topic.publish("clearGraphic");
    });
}

//左侧栏复选框选择事件
var checkChanged = function (el, zvalue) {
    //子项有选中的设置selLi样式
    if ($(el).parents("li") && $(el).parents("li").length > 0) {
        var roorParentIndex = $(el).parents("li").length - 1;
        var roorParent = $(el).parents("li")[roorParentIndex];
        if ($(roorParent).find("input:checked").length > 0) {
            $(el).parents("li").addClass("selLi");
        }
        else {
            $(el).parents("li").removeClass("selLi");
        }
    }
    //$(".riChMenu").css("display", "block");
    var dataStr = $("#hid_" + zvalue).val();
    var childDataStr = $("#hid_child_" + zvalue).val();
    if (dataStr && dataStr.length > 0) {
        //IP地址映射
        dataStr = urlHelper.urlRoute(dataStr);
        dataStr = dataStr.substring(0, dataStr.length - 1);
        if (childDataStr)
            dataStr = dataStr + ',"layerTools":' + childDataStr + '}';
        else
            dataStr = dataStr + ',"layerTools":""}';
        data = JSON.parse(dataStr);
        var isChecked = el.checked;
        if (isChecked) {
            $(el).parent().parent().find(".riChMenu").css("display", "block");
        } else {
            $(el).parent().parent().find(".riChMenu").css("display", "none");
            $(el).parent().parent().find(".riChMenu").removeClass("on");
            $(el).parent().parent().find(".riChMenu").next(".coPoptip").next(".setBox").slideUp(0);
            $(el).parent().parent().find(".riChMenu").next(".coPoptip").slideUp(0);
        }

       //loadingCallback('jimu', resources.length + 1, resources.length);
        require(['dojo/topic'], function (topic) {
            topic.publish("layer_checked", data, isChecked);
        });
    }

    //定位到指定经纬度
    var locationTo = function (lon, lat) {
        require(['dojo/topic'], function (topic) {
            topic.publish("map_centerAt", lon, lat);
        });
    }
}