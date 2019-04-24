/**
 * Created by alwin on 2016/8/31.
 */
define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/date',
        'dojo/topic',
        'dojo/json'
    ],
    function (declare, lang, array, dojoDate, topic, dojoJson) {
        var mo = {

            FORMAT_DATE_COMMON: "yyyy-MM-dd",
            FORMAT_DATE_SIMPLE: "yyyyMMdd",
            FORMAT_TIME_COMMON: "yyyy-MM-dd hh-mm-ss",
            FORMAT_DATE_ES: "yyyy/MM/dd",
            FORMAT_DATE_CN: "yyyy年MM月dd日",


            formatCommon: function (date) {
                return this.format(date, this.FORMAT_DATE_COMMON);
            },
            formatSimple: function (date) {
                return this.format(date, this.FORMAT_DATE_SIMPLE);
            },
            format: function (date, format) {
                var o = {
                    "M+": date.getMonth() + 1, //month
                    "d+": date.getDate(), //day
                    "h+": date.getHours(), //hour
                    "m+": date.getMinutes(), //minute
                    "s+": date.getSeconds(), //second
                    "q+": Math.floor((date.getMonth() + 3) / 3), //quarter
                    "S": date.getMilliseconds() //millisecond
                };
                if (/(y+)/.test(format)) {
                    format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                }

                for (var k in o) {
                    if (new RegExp("(" + k + ")").test(format)) {
                        format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
                    }
                }
                return format;
            },
            parseToSimple: function (dateCommon) {
                return dateCommon.replace(/-/gi, '');
            },
            parseToTimeSimple: function (dateCommon) {
                return dateCommon.substring(0, 13).replace(/-/gi, '').replace(/T/g, '');
            },

            add: function (date, interval, amount) {

                return dojoDate.add(date, interval, amount);
            },

            addDay: function (date, amount) {

                return dojoDate.add(date, "day", amount);

            },
            getYesterDay: function () {
                return this.formatCommon(dojoDate.add(new Date(), "day", -1));
            },
            getBeforeYesterDay: function () {
                return this.formatCommon(dojoDate.add(new Date(), "day", -2));
            },
            /**
             * 得到日期在一年当中的周数
             */
            getISOYearWeek: function (date) {
                var commericalyear = this.getCommerialYear(date);
                var date2 = this.getYearFirstWeekDate(commericalyear);
                var day1 = date.getDay();
                if (day1 == 0) day1 = 7;
                var day2 = date2.getDay();
                if (day2 == 0) day2 = 7;
                var d = Math.round((date.getTime() - date2.getTime() + (day2 - day1) * (24 * 60 * 60 * 1000)) / 86400000);
                return Math.floor(d / 7) + 1;
            },
            /**
             * 得到一年之中的第一周的日期
             */
            getYearFirstWeekDate: function (commericalyear) {
                var yearfirstdaydate = new Date(commericalyear, 0, 1);
                var daynum = yearfirstdaydate.getDay();
                var monthday = yearfirstdaydate.getDate();
                if (daynum == 0) daynum = 7;
                if (daynum <= 4) {
                    return new Date(yearfirstdaydate.getFullYear(), yearfirstdaydate.getMonth(), monthday + 1 - daynum);
                } else {
                    return new Date(yearfirstdaydate.getFullYear(), yearfirstdaydate.getMonth(), monthday + 8 - daynum);
                }
            },
            /**
             * 获取当前日期的年份
             */
            getCommerialYear: function (date) {
                var daynum = date.getDay();
                var monthday = date.getDate();
                if (daynum == 0) daynum = 7;
                var thisthurdaydate = new Date(date.getFullYear(), date.getMonth(), monthday + 4 - daynum);
                return thisthurdaydate.getFullYear();
            },
            /**
             * 获取周一
             */
            getWeekStartDate: function (date) {
                var nowDayOfWeek = (date.getDay() == 0) ? 6 : date.getDay() - 1;
                var t = new Date(date); //复制并操作新对象，避免改动原对象
                //t.setDate(t.getDate() - nowDayOfWeek);
                t.setTime(t.getTime() - nowDayOfWeek * 86400000);
                return t;
            },
            /**
             * 获取周日。本周一+6天
             */
            getWeekEndDate: function (date) {
                var t = new Date(date); //复制并操作新对象，避免改动原对象
                //t.setDate(this.getWeekStartDate(date).getDate() + 6); //date来计算会有出错的情况出现比如10.1这一周
                t.setTime(this.getWeekStartDate(date).getTime() + 6 * 86400000);
                return t;
            },
            /**
             * 判断输入的日期格式是否为 yyyy-mm-dd 或 yyyy-m-d
             */
            isDate: function (dateString) {
                //判断日期是否为空
                if (dateString.trim() == "") {
                    alert("日期为空！请输入格式正确的日期\n\r日期格式：yyyy-mm-dd\n\r例    如：2013-08-08\n\r");
                    return false;
                } else {
                    dateString = dateString.trim();
                }

                //年月日正则表达式
                var r = dateString.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
                if (r == null) {
                    alert("请输入格式正确的日期\n\r日期格式：yyyy-mm-dd\n\r例    如：2013-08-08\n\r");
                    return false;
                }
                var d = new Date(r[1], r[3] - 1, r[4]);
                var num = (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4]);
                if (num == 0) {
                    alert("请输入格式正确的日期\n\r日期格式：yyyy-mm-dd\n\r例    如：2013-08-08\n\r");
                }
                return (num != 0);

            }

        };
        return mo;




    });