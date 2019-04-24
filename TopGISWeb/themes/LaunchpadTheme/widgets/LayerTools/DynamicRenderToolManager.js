define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/topic',
  'dojo/on',
  'dojo/string',
],
function (declare, lang, array, topic, on, string) {
    var instance = null,
        clazz = declare(null, {


            constructor: function (/*Object*/ options) {


            },
            processTools: function (toolDijits) {

                console.log("动态渲染切换工具处理类，正在处理...");
            }




        });
    clazz.getInstance = function (options) {
        if (instance === null) {
            instance = new clazz(options);
        }
        return instance;
    };

    return clazz;


});
