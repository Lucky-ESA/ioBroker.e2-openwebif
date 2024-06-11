/* eslint-disable no-var */
/* eslint-disable no-undef */
// @ts-nocheck
"use strict";

if (typeof goog !== "undefined") {
    goog.provide("Blockly.JavaScript.Sendto");
    goog.require("Blockly.JavaScript");
}

Blockly.Translate =
    Blockly.Translate ||
    function (word, lang) {
        lang = lang || systemLang;
        if (Blockly.Words && Blockly.Words[word]) {
            return Blockly.Words[word][lang] || Blockly.Words[word].en;
        } else {
            return word;
        }
    };

Blockly.Words["e2-openwebif"] = {
    en: "WebIf",
    de: "WebIf",
    ru: "WebIf",
    pt: "IWebIf",
    nl: "WebIf",
    fr: "WebIf",
    it: "WebIf",
    es: "WebIf",
    pl: "WebIf",
    uk: "WebIf",
    "zh-cn": "WebIf",
};
Blockly.Words["e2-openwebif_text"] = {
    "en": "Message",
    "de": "Nachricht",
    "ru": "Сообщение",
    "pt": "Mensagem",
    "nl": "Bericht",
    "fr": "Message",
    "it": "Messaggio",
    "es": "Mensaje",
    "pl": "Message",
    "uk": "Новини",
    "zh-cn": "导 言"
};
Blockly.Words["e2-openwebif_timeout"] = {
    "en": "Timeout",
    "de": "Zeit",
    "ru": "Тайм-аут",
    "pt": "Timeout",
    "nl": "Time-out",
    "fr": "Timeout",
    "it": "Tempo",
    "es": "Timeout",
    "pl": "Timeout",
    "uk": "Розклад",
    "zh-cn": "时限"
};
Blockly.Words["e2-openwebif_all"] = {
    en: "All",
    de: "Alle",
    ru: "Все",
    pt: "Todos",
    nl: "Allen",
    fr: "Tout",
    it: "Tutti",
    es: "Todos",
    pl: "Cały",
    uk: "Всі",
    "zh-cn": "一. 导言",
};
Blockly.Words["e2-openwebif_name"] = {
    "en": "Receiver",
    "de": "Empfänger",
    "ru": "Получатель",
    "pt": "Receptor",
    "nl": "Vertaling:",
    "fr": "Receveur",
    "it": "Ricevitore",
    "es": "Receptor",
    "pl": "Receiver",
    "uk": "Отримувач",
    "zh-cn": "收 款"
};
Blockly.Words["e2-openwebif_MSGTYPE"] = {
    "en": "message type",
    "de": "Art der Meldung",
    "ru": "тип сообщения",
    "pt": "tipo de mensagem",
    "nl": "een boodschap type",
    "fr": "type de message",
    "it": "tipo di messaggio",
    "es": "tipo de mensaje",
    "pl": "komunikat",
    "uk": "тип повідомлення",
    "zh-cn": "信息类型"
};
Blockly.Words["e2-openwebif_MSGTYPE_1"] = {
    "en": "info",
    "de": "Informationen",
    "ru": "информация",
    "pt": "info",
    "nl": "info",
    "fr": "info",
    "it": "informazioni",
    "es": "info",
    "pl": "info",
    "uk": "контакти",
    "zh-cn": "导 言"
};
Blockly.Words["e2-openwebif_MSGTYPE_2"] = {
    "en": "Yes/No",
    "de": "Ja/Nein",
    "ru": "Да/Нет",
    "pt": "Sim",
    "nl": "Ja",
    "fr": "Oui/Non",
    "it": "Sì/No",
    "es": "Sí/no",
    "pl": "No",
    "uk": "Так / Ні",
    "zh-cn": "否"
};
Blockly.Words["e2-openwebif_MSGTYPE_3"] = {
    "en": "Message",
    "de": "Nachricht",
    "ru": "Сообщение",
    "pt": "Mensagem",
    "nl": "Bericht",
    "fr": "Message",
    "it": "Messaggio",
    "es": "Mensaje",
    "pl": "Message",
    "uk": "Новини",
    "zh-cn": "导 言"
};
Blockly.Words["e2-openwebif_MSGTYPE_4"] = {
    "en": "warning",
    "de": "Warnung",
    "ru": "предупреждение",
    "pt": "aviso de aviso",
    "nl": "waarschuwing",
    "fr": "avertissement",
    "it": "avvertimento",
    "es": "advertencia",
    "pl": "ostrzeżenie",
    "uk": "зареєструватися",
    "zh-cn": "警告"
};
Blockly.Words["e2-openwebif_log"] = {
    en: "Loglevel",
    de: "Loglevel",
    ru: "Войти",
    pt: "Nível de log",
    nl: "Loglevel",
    fr: "Loglevel",
    it: "Livello di registro",
    es: "Nivel de estudios",
    pl: "Logos",
    uk: "Увійти",
    "zh-cn": "后勤问题",
};
Blockly.Words["e2-openwebif_log_none"] = {
    en: "none",
    de: "kein",
    ru: "нет",
    pt: "nenhum",
    nl: "niemand",
    fr: "aucun",
    it: "nessuno",
    es: "ninguno",
    pl: "żaden",
    uk: "немає",
    "zh-cn": "无",
};
Blockly.Words["e2-openwebif_log_info"] = {
    en: "info",
    de: "info",
    ru: "инфо",
    pt: "info",
    nl: "info",
    fr: "info",
    it: "info",
    es: "info",
    pl: "info",
    uk: "контакти",
    "zh-cn": "导 言",
};
Blockly.Words["e2-openwebif_log_debug"] = {
    en: "debug",
    de: "debug",
    ru: "дебаг",
    pt: "depuração",
    nl: "debug",
    fr: "debug",
    it: "debug",
    es: "debug",
    pl: "debug",
    uk: "напляскване",
    "zh-cn": "黑暗",
};
Blockly.Words["e2-openwebif_log_warn"] = {
    en: "warn",
    de: "warnen",
    ru: "предупреждение",
    pt: "avisem",
    nl: "waarschuwing",
    fr: "prévenir",
    it: "avvertire avvertire",
    es: "warn",
    pl: "ostrzegać",
    uk: "про нас",
    "zh-cn": "战争",
};
Blockly.Words["e2-openwebif_log_error"] = {
    en: "error",
    de: "fehler",
    ru: "ошибка",
    pt: "erro",
    nl: "error",
    fr: "erreur",
    it: "errore",
    es: "error",
    pl: "błąd",
    uk: "про нас",
    "zh-cn": "错误",
};
Blockly.Words["e2-openwebif_anyInstance"] = {
    en: "All Instances",
    de: "Alle Instanzen",
    ru: "Все Instances",
    pt: "Todas as instâncias",
    nl: "Alle instanties",
    fr: "All Instances",
    it: "Tutti i ricorsi",
    es: "All Instances",
    pl: "All Instances (ang.)",
    uk: "Всі Інстанції",
    "zh-cn": "所有案件",
};
Blockly.Words["e2-openwebif_tooltip"] = {
    "en": "Send a message to your devices",
    "de": "Senden Sie eine Nachricht an Ihre Geräte",
    "ru": "Отправить сообщение для ваших устройств",
    "pt": "Enviar mensagem para seus dispositivos",
    "nl": "Stuur een bericht naar je apparatuur",
    "fr": "Envoyer un message à vos appareils",
    "it": "Invia un messaggio ai tuoi dispositivi",
    "es": "Enviar un mensaje a sus dispositivos",
    "pl": "Wysyłano wiadomość do swoich urządzeń",
    "uk": "Надіслати повідомлення на пристрої",
    "zh-cn": "给你的装置发出信息"
};
Blockly.Words["e2-openwebif_help"] = {
    en: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    de: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    ru: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    pt: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    nl: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    fr: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    it: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    es: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    pl: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    uk: "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
    "zh-cn": "https://github.com/Lucky-ESA/ioBroker.e2-openwebif/blob/master/README.md",
};
Blockly.Words["no_instance_found"] = {
    en: "No instance found",
    de: "Keine Instanz gefunden",
    ru: "Не найден",
    pt: "Nenhuma instância encontrada",
    nl: "Geen instantie gevonden",
    fr: "Aucune instance trouvée",
    it: "Nessun caso trovato",
    es: "No hay caso encontrado",
    pl: "Brak",
    uk: "Не знайдено",
    "zh-cn": "未找到实例",
};

Blockly.Sendto.blocks["e2-openwebif"] =
    '<block type="e2-openwebif">' +
    '     <value name="INSTANCE">' +
    "     </value>" +
    '     <value name="DEVICE">' +
    "     </value>" +
    '     <value name="MSGTYPE">' +
    "     </value>" +
    '     <value name="MESSAGE">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">text</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="TIMEOUT">' +
    '         <shadow type="math_number">' +
    '             <field name="NUM">10</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="LOG">' +
    "     </value>" +
    "</block>";

Blockly.Blocks["e2-openwebif"] = {
    init: function () {
        var options_device = [];
        var options_instance = [];
        options_device.push([Blockly.Translate("e2-openwebif_all"), "all"]);
        if (typeof main !== "undefined" && main.instances) {
            for (var i = 0; i < main.instances.length; i++) {
                var m = main.instances[i].match(/^system.adapter.e2-openwebif.(\d+)$/);
                if (m) {
                    var n = parseInt(m[1], 10);
                    options_instance.push(["e2-openwebif." + n, "." + n]);
                    if (
                        main.objects &&
                        main.objects[main.instances[i]] &&
                        main.objects[main.instances[i]].native &&
                        main.objects[main.instances[i]].native.devices
                    ) {
                        for (var a = 0; a < main.objects[main.instances[i]].native.devices.length; a++) {
                            //Checking activ in main.js.
                            var id = main.objects[main.instances[i]].native.devices[a].ip;
                            options_device.push([n + "." + id, id]);
                        }
                    }
                }
            }
        }
        if (Object.keys(options_instance).length == 0) options_instance.push([Blockly.Translate("no_instance_found"), ""]);
        this.appendDummyInput("INSTANCE")
            .appendField(Blockly.Translate("e2-openwebif"))
            .appendField(new Blockly.FieldDropdown(options_instance), "INSTANCE");
        this.appendDummyInput("DEVICE")
            .appendField(Blockly.Translate("e2-openwebif_name"))
            .appendField(new Blockly.FieldDropdown(options_device), "DEVICE");
        this.appendDummyInput("MSGTYPE")
            .appendField(Blockly.Translate("e2-openwebif_MSGTYPE"))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate("e2-openwebif_MSGTYPE_1"), "1"],
                    [Blockly.Translate("e2-openwebif_MSGTYPE_2"), "0"],
                    [Blockly.Translate("e2-openwebif_MSGTYPE_3"), "2"],
                    [Blockly.Translate("e2-openwebif_MSGTYPE_4"), "3"]
                ]),
                "MSGTYPE",
            );

        this.appendValueInput("MESSAGE").appendField(Blockly.Translate("e2-openwebif_text"));

        this.appendValueInput("TIMEOUT").appendField(Blockly.Translate("e2-openwebif_timeout"));

        this.appendDummyInput("LOG")
            .appendField(Blockly.Translate("e2-openwebif_log"))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate("e2-openwebif_log_none"), ""],
                    [Blockly.Translate("e2-openwebif_log_info"), "log"],
                    [Blockly.Translate("e2-openwebif_log_debug"), "debug"],
                    [Blockly.Translate("e2-openwebif_log_warn"), "warn"],
                    [Blockly.Translate("e2-openwebif_log_error"), "error"],
                ]),
                "LOG",
            );

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate("e2-openwebif_tooltip"));
        this.setHelpUrl(Blockly.Translate("e2-openwebif_help"));
    },
};

Blockly.JavaScript["e2-openwebif"] = function (block) {
    var dropdown_instance = block.getFieldValue("INSTANCE");
    var logLevel = block.getFieldValue("LOG");
    var value_device = block.getFieldValue("DEVICE");
    var value_msgType = block.getFieldValue("MSGTYPE");
    var value_message = Blockly.JavaScript.valueToCode(block, "MESSAGE", Blockly.JavaScript.ORDER_ATOMIC);
    var value_timeout = Blockly.JavaScript.valueToCode(block, "TIMEOUT", Blockly.JavaScript.ORDER_ATOMIC);

    var logText;
    if (logLevel) {
        logText =
            "console." + logLevel + '("e2-openwebif: " + ' + value_message + " + " + value_timeout + " + " + value_device + " + " + value_msgType + ");\n";
    } else {
        logText = "";
    }

    return (
        'sendTo("e2-openwebif' +
        dropdown_instance +
        '", "getBlockly", {text: ' +
        value_message +
        ", timeout: " +
        value_timeout +
        ", msgtype: " +
        value_msgType +
        ", device: '" +
        value_device +
        "'});\n" +
        logText
    );
};
