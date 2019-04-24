/**
 * Created by alwin on 2016/8/31.
 */
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
    function(declare, lang, array, dojoDate, topic, dojoJson) {
        var mo = {

            isEmptyObject:function (obj){
                var t;
                for (t in obj)
                    return !1;
                return !0
            }



        }


        return mo;

    });