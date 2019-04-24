/**
 * Created by alwin on 2016/8/30.
 */
define([
    'dijit/_WidgetBase',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/query',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/InputTextTool.html',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/_base/html',
    'dojo/dom-style',
    'jimu/cronosgis/utils/DateUtil',
    'jimu/cronosgis/utils/ArrayUtil',
    'esri/arcgis/LayerUtil',
    'dojo/topic'
], function (_WidgetBase, declare, lang, array, domConstruct, on, query,
             _TemplatedMixin, template,
             domAttr, domClass, html, domStyle, DateUtil, ArrayUtil, LayerUtil, topic
             ) {

    return declare([_WidgetBase, _TemplatedMixin], {
        declaredClass: "widgets.LayerTools.tools.InputTextTool",
        templateString: template,
        _toolActionType: "dynamic", //工具作用域 是动态切换 "dynamic",还是数据过滤 "datafilter"
        options: { theme: "ToolTemplate", map: null, visible: !0, layer: null },
        _toolValue: "",
        toolContainer: null,
        hasSubmit: false,
        constructor: function (optsp) {
            var opts = lang.mixin({}, this.options, optsp);
            this.options = opts;
            //this.domNode = toolBox;
            this.toolContainer = optsp.toolBox;
            this.set("map", opts.map);
            this.set("theme", opts.theme);
            this.set("visible", opts.visible);
            if (optsp.hasSubmit == true) {
                this.hasSubmit = optsp.hasSubmit;
            }
            this._toolActionType = this.options.optionType;
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            //this.domNode = domConstruct.create("div");

        },
        postCreate: function () {
            this.inherited(arguments);
            //this.own(on(this._homeNode, p, lang.hitch(this, this.home)))
        },
        startup: function () {
            this.inherited(arguments);
            this.map || (this.destroy(), console.log("InputTextTool::map required"));

            if (!this.loaded) {
                if (this.options.label != undefined) {
                    this.ToolLabel.innerHTML = this.options.label;
                }
                if (this.options.selectId != undefined) {
                    this.layerInputText.id = this.options.selectId;
                }
                if (this.options.textValue!=undefined) {
                    this.layerInputText.value = this.options.textValue;
                }
                if (this.options.placeholder != undefined) {
                    this.layerInputText.placeholder = this.options.placeholder;
                }
                
                //需要IE9以上使用
                /**
                dojo.connect(this.layerInputText, "oninput", lang.hitch(this, function () {
                    //$("text").attr("checked", false);
                    topic.publish("tool_status_change", this);
                })); **/
                if (!this.hasSubmit) {
                    dojo.connect(this.layerInputText, "onchange", lang.hitch(this, function () {
                        //$("text").attr("checked", false);
                        topic.publish("tool_status_change", this);
                    }));
                }

            }

            if (this.map.loaded) this._init(); else on.once(this.map, "load", lang.hitch(this, function () {
                this._init()
            }));

            html.place(this.domNode, this.toolContainer);
            if (this.layerInputText.id == "gsmPdInput") {
                var gsm_pds = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '512', '513', '514', '515', '516', '517', '518', '519', '520', '521', '522', '523', '524', '525', '526', '527', '528', '529', '530', '531', '532', '533', '534', '535', '536', '537', '538', '539', '540', '541', '542', '543', '544', '545', '546', '547', '548', '549', '550', '551', '552', '553', '554', '555', '556', '557', '558', '559', '560', '561', '562', '563', '564', '565', '566', '568', '569', '570', '571', '572', '574', '577', '579', '580', '581', '583', '585', '586', '587', '588', '589', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '600', '601', '602', '603', '604', '605', '606', '607', '608', '609', '610', '611', '612', '613', '614', '615', '616', '617', '618', '619', '620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '630', '631', '632', '633', '634', '635', '636', '637', '999', '1002', '1009', '1010', '1013', '1015', '1016', '1017', '1018', '1019', '1020', '1021', '1022', '1023'];
                $("#gsmPdInput").autocomplete({
                    source: gsm_pds
                });
            }
            if (this.layerInputText.id == "tdPdInput") {
                var td_pds = ['9405', '9413', '9421', '9427', '9429', '9437', '9445', '9453', '9455', '9463', '9471', '9479', '9487', '9495', '9505', '9513', '9521', '9529', '9530', '9537', '9538', '9545', '9553', '9555', '9561', '9563', '9569', '9571', '10054', '10055', '10060', '10062', '10063', '10066', '10070', '10071', '10072', '10077', '10079', '10080', '10082', '10084', '10088', '10092', '10096', '10100', '10102', '10104', '10107', '10112', '10114', '10120', '10121'];
                $("#tdPdInput").autocomplete({
                    source: td_pds
                });
            }
            if (this.layerInputText.id == "ltePdInput") {
                var lte_wlxqsbms = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '123', '124', '125', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144', '145', '146', '147', '148', '149', '150', '151', '152', '153', '154', '155', '156', '157', '158', '159', '160', '161', '162', '163', '164', '165', '166', '167', '168', '169', '170', '171', '172', '173', '174', '175', '176', '177', '178', '179', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '190', '191', '192', '193', '194', '195', '196', '197', '198', '199', '200', '201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212', '213', '214', '215', '216', '217', '218', '219', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '259', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '270', '271', '272', '273', '274', '275', '276', '277', '278', '279', '280', '281', '282', '283', '284', '285', '286', '287', '288', '289', '290', '291', '292', '293', '294', '295', '296', '297', '298', '299', '300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324', '325', '326', '327', '328', '329', '330', '331', '332', '333', '334', '335', '336', '337', '338', '339', '340', '341', '342', '343', '344', '345', '346', '347', '348', '349', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '360', '361', '362', '363', '364', '365', '366', '367', '368', '369', '370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '384', '385', '386', '387', '388', '389', '390', '391', '392', '393', '394', '395', '396', '397', '398', '399', '400', '401', '402', '403', '404', '405', '406', '407', '408', '409', '410', '411', '412', '413', '414', '415', '416', '417', '418', '419', '420', '421', '422', '423', '424', '425', '426', '427', '428', '429', '430', '431', '432', '433', '434', '435', '436', '437', '438', '439', '440', '441', '442', '443', '444', '445', '446', '447', '448', '449', '450', '451', '452', '453', '454', '455', '456', '457', '458', '459', '460', '461', '462', '463', '464', '465', '466', '467', '468', '469', '470', '471', '472', '473', '474', '475', '476', '477', '478', '479', '480', '481', '482', '483', '484', '485', '486', '487', '488', '489', '490', '491', '492', '493', '494', '495', '496', '497', '498', '499', '500', '501', '502', '503'];
                $("#ltePdInput").autocomplete({
                    source: lte_wlxqsbms
                });
            }

            if (this.options.optionType == "custom" && this.options.isgo) {
                topic.publish("tool_status_change", this);
            }

            /**
            dojo.connect(this.layerInputText, "onchange", lang.hitch(this, function (inputVal) {
                //$("text").attr("checked", false);
                topic.publish("tool_status_change", this);
            })); **/
           

        },
        _init: function () {
            this._visible();
            this.set("loaded", !0);
            this.emit("load", {});
        },
        destroy: function () {
            this.inherited(arguments)
        },
        _updateThemeWatch: function (c, a, b) {
            domClass.remove(this.domNode, a);
            domClass.add(this.domNode, b);
        },
        _visible: function () {
            this.get("visible") ? domStyle.set(this.domNode, "display", "block") : domStyle.set(this.domNode, "display", "none");
        },
        getResult: function () {
            var result = "";
            var inputValue = $(this.layerInputText).val();
            //泰森多边形，扇形的工具只有动态方法
            if (this._toolActionType == "dynamic") {
                if (this.options.table_pre != undefined && (this.options.orderid == undefined || this.options.orderid == 0)) {

                    return this.options.table_pre + "_" + inputValue;

                } else {

                    return inputValue;

                }

            } else if (this._toolActionType == "query") {
                if(this.options.fieldName !=undefined && inputValue==""){
                    return "1=1"
                }else {
                    if (this.options.fieldName != undefined && this.options.hasQuotationMark) {

                        return this.options.fieldName + "='" + inputValue + "'";

                    } else if (this.options.fieldName != undefined && !this.options.hasQuotationMark) {
                        return this.options.fieldName + "=" + inputValue;
                    } else {
                        return inputValue;
                    }
                }

                

            } else if (this._toolActionType == "highlight") {
                if (this.options.fieldName != undefined && this.options.hasQuotationMark) {

                    return this.options.fieldName + "='" + inputValue + "'";

                } else if (this.options.fieldName != undefined && !this.options.hasQuotationMark) {
                    return this.options.fieldName + "=" + inputValue;
                } else {
                    return inputValue;
                }
            }

            return "";
        }

    });

});