const cs = require("./constants");
// @ts-ignore
const encodeurl  = require("encodeurl");

module.exports = {
    async createDeviceInfo(box, deviceInfo) {
        await this.setObjectNotExistsAsync(box, {
            type: "device",
            common: {
                name: "deviceInfo",
            },
            native: {},
        });
        let common = {};
        common = {
            type: "number",
            role: "state",
            name: {
                "en": "Status Receiver",
                "de": "Status Receiver",
                "ru": "Статус Получатель",
                "pt": "Receptor de Estado",
                "nl": "Status Rece",
                "fr": "Récepteur de statut",
                "it": "Ricevitore di stato",
                "es": "Estado receptor",
                "pl": "Status Receiver",
                "uk": "Статус на сервери",
                "zh-cn": "现状领取人"
            },
            desc: "Status Receiver",
            read: false,
            write: true,
            def: 0,
            states: {
                0: "Standby",
                1: "Online",
                2: "Deep Standby"
            }
        };
        await this.createDataPoint(`${box}.STATUS_DEVICE`, common, "state");
        await this.json2iob.parse(`${box}.deviceInfo`, deviceInfo, {
            forceIndex: true,
            preferedArrayName: null,
            channelName: null,
        });
    },
    async createStatusInfo(box, statusInfo) {
        await this.setObjectNotExistsAsync(box, {
            type: "folder",
            common: {
                name: "statusInfo",
            },
            native: {},
        });
        let common = {};
        await this.json2iob.parse(`${box}.statusInfo`, statusInfo, {
            forceIndex: true,
            preferedArrayName: null,
            channelName: null,
        });
        common = {
            type: "string",
            role: "text",
            name: {
                "en": "Picon",
                "de": "Picon",
                "ru": "Пикон",
                "pt": "Picon",
                "nl": "Picon",
                "fr": "Picon",
                "it": "Picon",
                "es": "Picon",
                "pl": "Pikon",
                "uk": "Пікон",
                "zh-cn": "皮科"
            },
            desc: "Current Picon",
            read: false,
            write: true,
            def: ""
        };
        await this.createDataPoint(`${box}.statusInfo.now.picon`, common, "state");
        await this.createDataPoint(`${box}.statusInfo.next.picon`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: {
                "en": "Remaining time",
                "de": "Restzeit",
                "ru": "Оставшееся время",
                "pt": "Tempo restante",
                "nl": "Tijd herbeleven",
                "fr": "Temps restant",
                "it": "Tempo di permanenza",
                "es": "Tiempo restante",
                "pl": "Remain Time",
                "uk": "Час відновлення",
                "zh-cn": "B. 留 时间"
            },
            desc: "Remaining time",
            read: false,
            write: true,
            def: ""
        };
        await this.createDataPoint(`${box}.statusInfo.now.remaining_time`, common, "state");
        await this.createDataPoint(`${box}.statusInfo.next.remaining_time`, common, "state");
    },
    async createRemote(box) {
        let common = {};
        common = {
            name: {
                "en": "Remote Control",
                "de": "Fernsteuerung",
                "ru": "Дистанционное управление",
                "pt": "Controle remoto",
                "nl": "Verwijder controle",
                "fr": "Télécommande",
                "it": "Controllo remoto",
                "es": "Control remoto",
                "pl": "Kontrola Pamięci",
                "uk": "Пульт дистанційного керування",
                "zh-cn": "遥感"
            }
        };
        await this.createDataPoint(`${box}.remote`, common, "folder");
        common = {
            type: "number",
            role: "state",
            name: {
                "en": "Status from Receiver",
                "de": "Status von Receiver",
                "ru": "Статус от получателя",
                "pt": "Estado do receptor",
                "nl": "Status van Receiver",
                "fr": "Statut du receveur",
                "it": "Stato dal Ricevitore",
                "es": "Estado del receptor",
                "pl": "Status z Receiver",
                "uk": "Статус на сервери",
                "zh-cn": "收 金"
            },
            desc: "Status from Receiver",
            read: false,
            write: true,
            def: 3,
            states: {
                0: "Standby",
                1: "Online",
                2: "Deep Standby",
                3: "Unknown"
            }
        };
        await this.createDataPoint(`${box}.remote.STATUS_FROM_DEVICE`, common, "state");
        common = {
            name: {
                "en": "Message to the Box",
                "de": "Nachricht an die Box",
                "ru": "Сообщение в коробке",
                "pt": "Mensagem para a Caixa",
                "nl": "Bericht naar de Box",
                "fr": "Message à la case",
                "it": "Messaggio alla casella",
                "es": "Mensaje a la caja",
                "pl": "Posłanie do pudełka",
                "uk": "Повідомлення на Box",
                "zh-cn": "向框 告"
            }
        };
        await this.createDataPoint(`${box}.remote.message`, common, "folder");
        common = {
            type: "number",
            role: "state",
            name: {
                "en": "Message Typ: 0= Yes/No, 1= Info, 2=Message, 3=Attention",
                "de": "Nachricht Typ: 0= Ja/Nein, 1= Info, 2=Message, 3=Attention",
                "ru": "Текст сообщения: 0= Да/Нет, 1= Информация, 2=Сообщение, 3=Внимание",
                "pt": "Tipo de mensagem: 0= Sim/Não, 1= Informações, 2=Message, 3=Atenção",
                "nl": "Bericht Typ: Ja, 1 = Info, 2 =Message, 3 =Attentie",
                "fr": "Message Typ: 0= Oui/Non, 1= Info, 2=Message, 3=Attention",
                "it": "Messaggio Tipo: Traduzione:",
                "es": "Tipo de mensaje: 0= Sí/No, 1= Info, 2=Mensaje, 3=Atención",
                "pl": "Typ 0= Yes/No, 1= Info, 2=Mesage, 3=Attention",
                "uk": "Повідомлення Тис: 0= Так/No, 1= Інфо, 2=Повідомлення, 3=В наявності",
                "zh-cn": "Message Typ: 0 否/否,1= 信息,2=Message,3=Attenting"
            },
            desc: "messagetype=Number from 0 to 3, 0= Yes/No, 1= Info, 2=Message, 3=Attention",
            min: 0,
            max: 3,
            read: true,
            write: true,
            def: 1,
            states: {
                0: "Yes/No",
                1: "Info",
                2: "Message",
                3: "Attention"
            }
        };
        await this.createDataPoint(`${box}.remote.message.type`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: {
                "en": "Can be empty or the Number of seconds the Message should disappear after",
                "de": "Kann leer sein oder die Anzahl der Sekunden sollte die Nachricht nach verschwinden",
                "ru": "Может быть пустым или число секунд Сообщение должно исчезнуть после",
                "pt": "Pode ser vazio ou o Número de segundos que a Mensagem deve desaparecer após",
                "nl": "Kan leeg zijn of de Nummer van seconden de Message moet verdwijnen na",
                "fr": "Peut être vide ou le nombre de secondes que le Message devrait disparaître après",
                "it": "Può essere vuoto o il Numero di secondi che il Messaggio dovrebbe sparire dopo",
                "es": "Puede estar vacío o el Número de segundos el Mensaje debe desaparecer después",
                "pl": "Mogą być puste lub numery sekundy, po czym zaginęły",
                "uk": "Чи може бути порожній або номер секунд повідомлення зникне після",
                "zh-cn": "空洞或二秒钟应消失"
            },
            desc: "Can be empty or the Number of seconds the Message should disappear after",
            read: true,
            write: true,
            def: 0
        };
        await this.createDataPoint(`${box}.remote.message.timeout`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: {
                "en": "Message to the Receiver Screen",
                "de": "Nachricht an den Receiver-Bildschirm",
                "ru": "Сообщение на экран получателя",
                "pt": "Mensagem para a tela do receptor",
                "nl": "Bericht van de Receiver Screen",
                "fr": "Message à l'écran du receveur",
                "it": "Messaggio allo schermo del ricevitore",
                "es": "Mensaje a la pantalla del receptor",
                "pl": "Zdjęcia do ekranu Receiver",
                "uk": "Повідомлення на екран Отримувача",
                "zh-cn": "收 金"
            },
            desc: "messagetext=Text of Message",
            read: true,
            write: true
        };
        await this.createDataPoint(`${box}.remote.message.message`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: {
                "en": "Answer from device",
                "de": "Antwort vom Gerät",
                "ru": "Ответ с устройства",
                "pt": "Resposta do dispositivo",
                "nl": "Antwoord",
                "fr": "Réponse du dispositif",
                "it": "Risposta dal dispositivo",
                "es": "Respuesta del dispositivo",
                "pl": "Urządzenie",
                "uk": "Відповідь від пристрою",
                "zh-cn": "来自装置的回答"
            },
            desc: "Answer from device",
            read: true,
            write: true
        };
        await this.createDataPoint(`${box}.remote.message.answer`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: {
                "en": "Send a info Message to the Receiver Screen",
                "de": "Sende eine Nachricht an den Receiver-Bildschirm",
                "ru": "Отправить сообщение для экрана получателя",
                "pt": "Enviar mensagem para a tela do receptor",
                "nl": "Stuur een info Message naar de Receiver Screen",
                "fr": "Envoyer un message à l'écran du receveur",
                "it": "Invia un messaggio info alla schermata Ricevitore",
                "es": "Enviar un mensaje a la pantalla del receptor",
                "pl": "Przesłanie informacji do ekranu Receiver",
                "uk": "Надсилання інформації на екран Отримувача",
                "zh-cn": "Send a Info Message to the接受国 Screen"
            },
            desc: "Send a info Message to the Receiver Screen",
            read: true,
            write: true,
            def: false
        };
        await this.createDataPoint(`${box}.remote.message.sendMessage`, common, "state");
        common = {
            name: {
                "en": "Power Control",
                "de": "Leistungssteuerung",
                "ru": "Контроль мощности",
                "pt": "Controle de potência",
                "nl": "Controle:",
                "fr": "Power Control",
                "it": "Controllo potenza",
                "es": "Control de potencia",
                "pl": "Kontrola",
                "uk": "Контроль потужності",
                "zh-cn": "控制"
            }
        };
        await this.createDataPoint(`${box}.remote.power`, common, "folder");
        common = {
            type: "number",
            role: "value",
            name: {
                "en": "Powerstates",
                "de": "Powerstates",
                "ru": "Энергии",
                "pt": "Powerstates",
                "nl": "Powerstates",
                "fr": "Powerstates",
                "it": "Poteri",
                "es": "Powerstates",
                "pl": "Powerstate",
                "uk": "Енергетика",
                "zh-cn": "大国"
            },
            desc: "Powerstates",
            read: true,
            write: true,
            states: {
                0: "Toggle StandBy",
                1: "DeepStandBy",
                2: "Reboot",
                3: "Restart Enigma",
                4: "Wakeup",
                5: "Standby",
                6: "WOL"
            },
            def: 0
        };
        await this.createDataPoint(`${box}.remote.power.powerstate`, common, "state");
        common = {
            name: {
                "en": "Remote Command",
                "de": "Fernbedienung",
                "ru": "Удаленная команда",
                "pt": "Comando remoto",
                "nl": "Verwijder het commando",
                "fr": "Commande à distance",
                "it": "Comando remoto",
                "es": "Mando remoto",
                "pl": "Dowództwo Pamięci",
                "uk": "Віддалене командування",
                "zh-cn": "远程指挥"
            }
        };
        await this.createDataPoint(`${box}.remote.command`, common, "folder");
        const states = {};
        common = {
            type: "string",
            role: "value",
            name: {
                "en": "enigma2 send remote control command as number",
                "de": "enigma2 versendet Fernsteuerung Befehl als Nummer",
                "ru": "enigma2 отправить удаленную команду управления как номер",
                "pt": "enigma2 enviar comando de controle remoto como número",
                "nl": "enigma2 stuurt afstandsbedieningscommando als nummer",
                "fr": "enigma2 envoyer la commande télécommande comme numéro",
                "it": "enigma2 invia comando telecomando come numero",
                "es": "enigma2 enviar mando de control remoto como número",
                "pl": "enigma2 wysyła zdalne pole dowodzenia",
                "uk": "enigma2 відправити команду дистанційного керування як номер",
                "zh-cn": "伊格马2派遣遥控指挥员的人数"
            },
            desc: "enigma2 send remote control command as number",
            read: true,
            write: true
        };
        Object.keys(cs.KEYIDS).forEach(async (keys) => {
            states[keys] = cs.KEYIDS[keys];
        });
        const new_common = common;
        new_common["states"] = states;
        await this.createDataPoint(`${box}.remote.command.REMOTE_CONTROL`, new_common, "state");
        const commons = [
            {
                datapoint: "KEY_VOLUMEUP",
                name: {
                    "en": "Volumen up",
                    "de": "Lauter",
                    "ru": "Обьем вверх",
                    "pt": "Volume acima",
                    "nl": "Volume",
                    "fr": "Volume",
                    "it": "Volume in su",
                    "es": "Volumen arriba",
                    "pl": "Volumen up",
                    "uk": "Об'єм",
                    "zh-cn": "火山"
                }
            },
            {
                datapoint: "KEY_VOLUMEDOWN",
                name: {
                    "en": "Volumen down",
                    "de": "Leiser",
                    "ru": "Обьем вниз",
                    "pt": "Volume para baixo",
                    "nl": "Volumen",
                    "fr": "Volume",
                    "it": "Volume in calo",
                    "es": "Volumen abajo",
                    "pl": "Volumen down",
                    "uk": "Об'єм",
                    "zh-cn": "下降"
                }
            },
            {
                datapoint: "KEY_POWER",
                name: {
                    "en": "Toggle to Standby",
                    "de": "Standby umschalten",
                    "ru": "Переключиться в Standby",
                    "pt": "Alternar para Standby",
                    "nl": "Toggle",
                    "fr": "Toggle to Standby",
                    "it": "Toggle to Standby",
                    "es": "Toggle to Standby",
                    "pl": "Toggle to Standby",
                    "uk": "Партнерство",
                    "zh-cn": "B. 妨碍待命"
                }
            },
            {
                datapoint: "KEY_MUTE",
                name: {
                    "en": "toggle to Mute/Unmute",
                    "de": "Mute/Unmute umschalten",
                    "ru": "переключиться на Mute/Unmute",
                    "pt": "alternar para Mute/Unmute",
                    "nl": "toggle to Mute/Unmute",
                    "fr": "toggle to Mute/Unmute",
                    "it": "toggle to Mute/Unmute",
                    "es": "toggle to Mute/Unmute",
                    "pl": "togo to Mute/Unmute",
                    "uk": "toggle to Mute/Unmute",
                    "zh-cn": "ggle to Mute/Unmute"
                }
            },
            {
                datapoint: "KEY_CHANNELUP",
                name: {
                    "en": "Channel up",
                    "de": "Kanal hoch",
                    "ru": "Канал вверх",
                    "pt": "Canal acima",
                    "nl": "Kanaal omhoog",
                    "fr": "Canalisation",
                    "it": "Ingrandisci",
                    "es": "Canalizado",
                    "pl": "Channel up",
                    "uk": "Канали",
                    "zh-cn": "海峡"
                }
            },
            {
                datapoint: "KEY_CHANNELDOWN",
                name: {
                    "en": "Channel down",
                    "de": "Kanal runter",
                    "ru": "Канал вниз",
                    "pt": "Canal abaixo",
                    "nl": "Kanaal neer",
                    "fr": "Canal vers le bas",
                    "it": "Canale",
                    "es": "Canal abajo",
                    "pl": "Channel down",
                    "uk": "Канал вниз",
                    "zh-cn": "黑暗淡"
                }
            },
            {
                datapoint: "KEY_OK",
                name: {
                    "en": "OK",
                    "de": "OKAY",
                    "ru": "ОК",
                    "pt": "ESTÁ BEM",
                    "nl": "OKÉ",
                    "fr": "OK",
                    "it": "OK",
                    "es": "OK",
                    "pl": "OK",
                    "uk": "ЗАРЕЄСТРУВАТИСЯ",
                    "zh-cn": "OK"
                }
            },
            {
                datapoint: "KEY_EXIT",
                name: {
                    "en": "Exit",
                    "de": "Exit",
                    "ru": "Выход",
                    "pt": "Saída",
                    "nl": "Uitgang",
                    "fr": "Sortie",
                    "it": "Uscita",
                    "es": "Exit",
                    "pl": "Expert",
                    "uk": "Випадковий",
                    "zh-cn": "通告"
                }
            },
            {
                datapoint: "KEY_INFO",
                name: {
                    "en": "EPG",
                    "de": "EPG",
                    "ru": "ЭПГ",
                    "pt": "EPG",
                    "nl": "EPG",
                    "fr": "EPG",
                    "it": "EPG",
                    "es": "EPG",
                    "pl": "EPG",
                    "uk": "ПЕГ",
                    "zh-cn": "导 言"
                }
            },
            {
                datapoint: "KEY_MENU",
                name: {
                    "en": "Menu",
                    "de": "Menü",
                    "ru": "Меню",
                    "pt": "Menu",
                    "nl": "Menu",
                    "fr": "Menu",
                    "it": "Menu",
                    "es": "Menú",
                    "pl": "Menu",
                    "uk": "Навігація",
                    "zh-cn": "男子"
                }
            },
            {
                datapoint: "KEY_PLAYPAUSE",
                name: {
                    "en": "Pause",
                    "de": "Pause",
                    "ru": "Пауза",
                    "pt": "Pausa",
                    "nl": "Pauze",
                    "fr": "Pause",
                    "it": "Pausa",
                    "es": "Pausa",
                    "pl": "Pause",
                    "uk": "Пауза",
                    "zh-cn": "口粮"
                }
            },
            {
                datapoint: "KEY_RECORD",
                name: {
                    "en": "Record",
                    "de": "Rekord",
                    "ru": "Запись",
                    "pt": "Gravação",
                    "nl": "Record",
                    "fr": "Enregistrement",
                    "it": "Registrazione",
                    "es": "Record",
                    "pl": "Record",
                    "uk": "Запис",
                    "zh-cn": "录音"
                }
            },
            {
                datapoint: "KEY_STOP",
                name: {
                    "en": "Stop",
                    "de": "Stopp",
                    "ru": "Стоп",
                    "pt": "Pára",
                    "nl": "Stop",
                    "fr": "Arrête",
                    "it": "Fermati",
                    "es": "Para",
                    "pl": "Stop",
                    "uk": "Зареєструватися",
                    "zh-cn": "禁止"
                }
            },
            {
                datapoint: "KEY_TV",
                name: {
                    "en": "TV",
                    "de": "TV",
                    "ru": "ТВ",
                    "pt": "TV",
                    "nl": "TV",
                    "fr": "TV",
                    "it": "TV",
                    "es": "TV",
                    "pl": "TV",
                    "uk": "ТЕЛЕВІЗОР",
                    "zh-cn": "电视"
                }
            },
            {
                datapoint: "KEY_RADIO",
                name: {
                    "en": "Radio",
                    "de": "Radio",
                    "ru": "Радио",
                    "pt": "Rádio",
                    "nl": "Radio",
                    "fr": "Radio",
                    "it": "Radio",
                    "es": "Radio",
                    "pl": "Radio",
                    "uk": "Радіо",
                    "zh-cn": "无线电"
                }
            },
            {
                datapoint: "KEY_UP",
                name: {
                    "en": "up",
                    "de": "hoch",
                    "ru": "вверх",
                    "pt": "levanta-te",
                    "nl": "omhoog",
                    "fr": "debout",
                    "it": "su",
                    "es": "arriba",
                    "pl": "uprise",
                    "uk": "вгору",
                    "zh-cn": "增 编"
                }
            },
            {
                datapoint: "KEY_DOWN",
                name: {
                    "en": "down",
                    "de": "runter",
                    "ru": "вниз",
                    "pt": "para baixo",
                    "nl": "omlaag",
                    "fr": "en bas",
                    "it": "giù",
                    "es": "abajo",
                    "pl": "down",
                    "uk": "вниз",
                    "zh-cn": "下降"
                }
            },
            {
                datapoint: "KEY_LEFT",
                name: {
                    "en": "left",
                    "de": "links",
                    "ru": "влево",
                    "pt": "esquerda",
                    "nl": "links",
                    "fr": "gauche",
                    "it": "sinistra",
                    "es": "izquierda",
                    "pl": "lewicowy",
                    "uk": "увійти",
                    "zh-cn": "留下来"
                }
            },
            {
                datapoint: "KEY_RIGHT",
                name: {
                    "en": "right",
                    "de": "rechts",
                    "ru": "право",
                    "pt": "certo",
                    "nl": "juist",
                    "fr": "droit",
                    "it": "destra",
                    "es": "derecho",
                    "pl": "prawo",
                    "uk": "увійти",
                    "zh-cn": "权利"
                }
            },
        ];
        for (const element of commons) {
            common = {
                name: element.name,
                role: "button",
                type: "boolean",
                desc: element.name + " Button",
                read: true,
                write: true,
                def: false
            };
            await this.createDataPoint(`${box}.remote.command.${element.datapoint}`, common, "state");
        }
        common = {
            type: "number",
            role: "level.volume",
            name: {
                "en": "Set volumen",
                "de": "Volumen einstellen",
                "ru": "Установить объемн",
                "pt": "Conjunto de volume",
                "nl": "Vertaling:",
                "fr": "Set volumen",
                "it": "Set volumen",
                "es": "Volumen",
                "pl": "Set volume (ang.)",
                "uk": "Комплекти",
                "zh-cn": "定量"
            },
            desc: "Set Volumen",
            def: 0,
            min: 0,
            max: 100,
            read: true,
            write: true
        };
        await this.createDataPoint(`${box}.remote.power.SET_VOLUME`, common, "state");
    },
    async createBouquetsAndEPG(box, bouquets) {
        let common = {};
        common = {
            name: {
                "en": "Channel list",
                "de": "Kanalliste",
                "ru": "Список каналов",
                "pt": "Lista de canais",
                "nl": "Kanaallijst",
                "fr": "Liste des canaux",
                "it": "Elenco dei canali",
                "es": "Lista de canales",
                "pl": "Lista kanałów",
                "uk": "Список каналів",
                "zh-cn": "名单"
            }
        };
        await this.createDataPoint(`${box}.remote.bouquets`, common, "folder");
        common = {
            name: {
                "en": "EPG",
                "de": "EPG",
                "ru": "ЭПГ",
                "pt": "EPG",
                "nl": "EPG",
                "fr": "EPG",
                "it": "EPG",
                "es": "EPG",
                "pl": "EPG",
                "uk": "ПЕГ",
                "zh-cn": "导 言"
            }
        };
        await this.createDataPoint(`${box}.remote.epg`, common, "folder");
        common = {
            name: {
                "en": "Channel Info",
                "de": "Kanal Info",
                "ru": "Информация о канале",
                "pt": "InformaÃ§Ã£o do canal",
                "nl": "Channel Info",
                "fr": "Channel Info",
                "it": "Informazioni sul canale",
                "es": "Información del Canal",
                "pl": "Channel Info",
                "uk": "Радіоканал інформація",
                "zh-cn": "信息网"
            }
        };
        await this.createDataPoint(`${box}.remote.epg.channel`, common, "folder");
        common = {
            name: {
                "en": "Movielist folder",
                "de": "Movielist Ordner",
                "ru": "Бумажная папка",
                "pt": "Pasta de lista de filmes",
                "nl": "Movalist map",
                "fr": "Movielist dossier",
                "it": "Cartella della lista dei film",
                "es": "Carpeta de película",
                "pl": "Movielista",
                "uk": "Папка Movielist",
                "zh-cn": "主持人"
            }
        };
        await this.createDataPoint(`${box}.remote.movielist`, common, "folder");
        await this.loadBouquets(box, bouquets);
        common = {
            type: "mixed",
            role: "value",
            name: {
                "en": "Channel",
                "de": "Kanal",
                "ru": "Канал",
                "pt": "Canal",
                "nl": "Channel",
                "fr": "Channel",
                "it": "Canale",
                "es": "Canal",
                "pl": "Channel",
                "uk": "Канали",
                "zh-cn": "海峡"
            },
            desc: "Select channel",
            read: true,
            write: true,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.bouquets.SET_CHANNEL`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: {
                "en": "EPG",
                "de": "EPG",
                "ru": "ЭПГ",
                "pt": "EPG",
                "nl": "EPG",
                "fr": "EPG",
                "it": "EPG",
                "es": "EPG",
                "pl": "EPG",
                "uk": "ПЕГ",
                "zh-cn": "导 言"
            },
            desc: "EPG value as json",
            read: true,
            write: true,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.epg.EPG_JSON`, common, "state");
        common = {
            type: "string",
            role: "value",
            name: {
                "en": "Select EPG Channel",
                "de": "Wählen Sie EPG Kanal",
                "ru": "Выберите EPG Канал",
                "pt": "Selecione EPG Canal",
                "nl": "EPG Channel",
                "fr": "Sélectionnez EPG Channel",
                "it": "Selezionare EPG Canale",
                "es": "Seleccionar EPG Canal",
                "pl": "EPG Channel",
                "uk": "Виберіть EPG Канали",
                "zh-cn": "收购公司 海峡"
            },
            desc: "Select EPG Channel",
            read: true,
            write: true,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.epg.SET_EPG_CHANNEL`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: {
                "en": "Response createion timer",
                "de": "Antwort erstellen Timer",
                "ru": "Таймер на создание ответа",
                "pt": "Temporizador de criação de resposta",
                "nl": "Vertaling:",
                "fr": "Temporaire de création de réponse",
                "it": "Tempo di creazione di risposta",
                "es": "Temporizador de creación de respuestas",
                "pl": "Response tworzyć timer",
                "uk": "Створювальний таймер відповіді",
                "zh-cn": "反应造成时间"
            },
            desc: "Response createion timer",
            read: true,
            write: false,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.epg.RECORDING_RESPONSE`, common, "state");
        common = {
            type: "string",
            role: "value",
            name: {
                "en": "Select EPG recording",
                "de": "Wählen Sie EPG-Aufzeichnung",
                "ru": "Выберите EPG запись",
                "pt": "Selecione a gravação EPG",
                "nl": "Select EPG opname",
                "fr": "Sélectionnez l'enregistrement EPG",
                "it": "Selezionare la registrazione EPG",
                "es": "Seleccione la grabación EPG",
                "pl": "Okładka",
                "uk": "Виберіть запис ЕПГ",
                "zh-cn": "录制"
            },
            desc: "Select EPG recording",
            read: true,
            write: true,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.epg.SET_EPG_RECORDING`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: {
                "en": "BOUQUETS update",
                "de": "Aktualisierung der BOUQUES",
                "ru": "Обновление BOUQUETS",
                "pt": "Atualização do BOUQUETS",
                "nl": "Vertaling:",
                "fr": "Mise à jour de BOUQUETS",
                "it": "Aggiornamento BOUQUESTI",
                "es": "BOUQUETS update",
                "pl": "Aktualizacja",
                "uk": "Оновлення BOUQUETS",
                "zh-cn": "BOUQUETS的最新情况"
            },
            desc: "BOUQUETS update",
            read: true,
            write: true,
            def: false
        };
        await this.createDataPoint(`${box}.remote.epg.UPDATE_BOUQUETS`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: {
                "en": "Create recording time",
                "de": "Aufnahmezeit erstellen",
                "ru": "Создать время записи",
                "pt": "Criar tempo de gravação",
                "nl": "Createer opname tijd",
                "fr": "Créer un temps d'enregistrement",
                "it": "Creare il tempo di registrazione",
                "es": "Crear tiempo de grabación",
                "pl": "Czas nagrywania płyty",
                "uk": "Створення часу запису",
                "zh-cn": "创设记录时间"
            },
            desc: "Create recording time",
            read: true,
            write: true,
            def: false
        };
        await this.createDataPoint(`${box}.remote.epg.CREATE_RECORDING_TIME`, common, "state");
        common = {
            type: "string",
            role: "value",
            name: {
                "en": "Choose folder",
                "de": "Wählen Sie den Ordner",
                "ru": "Выберите папку",
                "pt": "Escolha a pasta",
                "nl": "Kies vouw",
                "fr": "Choisir le dossier",
                "it": "Scegli la cartella",
                "es": "Elija la carpeta",
                "pl": "Choose folder",
                "uk": "Виберіть папку",
                "zh-cn": "评 注"
            },
            desc: "Choose folder",
            read: true,
            write: true,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.movielist.SET_FOLDER`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: {
                "en": "JSON Movielist",
                "de": "JSON Filmliste",
                "ru": "JSON Фильмлист",
                "pt": "Lista de filmes",
                "nl": "JSON Moest",
                "fr": "JSON Movielist",
                "it": "JSON Lista film",
                "es": "JSON Movielist",
                "pl": "JSON Movielist (ang.)",
                "uk": "JSON Кінолист",
                "zh-cn": "JSON Movielist"
            },
            desc: "JSON Movielist",
            read: true,
            write: false,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.movielist.MOVIELIST`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: {
                "en": "Load all Folder",
                "de": "Alle Ordner laden",
                "ru": "Загрузить все Folder",
                "pt": "Carregar todas as pastas",
                "nl": "Laad alle Folder",
                "fr": "Charger tous les dossiers",
                "it": "Caricare tutta la cartella",
                "es": "Carga toda la carpeta",
                "pl": "Load all Folder (ang.)",
                "uk": "Завантаження всіх папок",
                "zh-cn": "贷款"
            },
            desc: "Load all Folder",
            read: true,
            write: true,
            def: false
        };
        await this.createDataPoint(`${box}.remote.movielist.LOAD_FOLDER`, common, "state");
        common = {
            name: {
                "en": "Remote Control",
                "de": "Fernsteuerung",
                "ru": "Дистанционное управление",
                "pt": "Controle remoto",
                "nl": "Verwijder controle",
                "fr": "Télécommande",
                "it": "Controllo remoto",
                "es": "Control remoto",
                "pl": "Kontrola Pamięci",
                "uk": "Пульт дистанційного керування",
                "zh-cn": "遥感"
            }
        };
        await this.createDataPoint(`${box}.remote.control`, common, "folder");
        if (this.config.mac != "") {
            common = {
                type: "boolean",
                role: "button",
                name: {
                    "en": "Use WOL",
                    "de": "Verwenden Sie WOL",
                    "ru": "Используйте WOL",
                    "pt": "Use WOL",
                    "nl": "Gebruik WOL",
                    "fr": "Utilisez WOL",
                    "it": "Utilizzare WOL",
                    "es": "Use WOL",
                    "pl": "Wykorzystywanie",
                    "uk": "Використання WOL",
                    "zh-cn": "使用WOL"
                },
                desc: "Wake on LAN",
                read: true,
                write: true,
                def: false
            };
            await this.createDataPoint(`${box}.remote.control.wol`, common, "state");
        }
        const req = {
            type: "string",
            role: "value",
            name: {
                "en": "Send request",
                "de": "Anfrage senden",
                "ru": "Отправить запрос",
                "pt": "Enviar pedido",
                "nl": "Stuur een verzoek",
                "fr": "Envoyer la demande",
                "it": "Invia richiesta",
                "es": "Enviar solicitud",
                "pl": "Żądanie",
                "uk": "Надіслати запит",
                "zh-cn": "附录"
            },
            desc: "Send request",
            read: true,
            write: true,
            def: ""
        };
        const req_states = {};
        Object.keys(cs.API).forEach(async (keys) => {
            req_states[cs.API[keys]] = keys;
        });
        req["states"] = req_states;
        await this.createDataPoint(`${box}.remote.control.request`, req, "state");
        common = {
            type: "string",
            role: "value",
            name: {
                "en": "Send your request",
                "de": "Senden Sie Ihre Anfrage",
                "ru": "Отправить запрос",
                "pt": "Enviar o seu pedido",
                "nl": "Stuur uw verzoek",
                "fr": "Envoyez votre demande",
                "it": "Invia la tua richiesta",
                "es": "Enviar su solicitud",
                "pl": "Pozwólcie na żądanie",
                "uk": "Надіслати запит",
                "zh-cn": "请"
            },
            desc: "Send your request",
            read: true,
            write: true,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.control.your_request`, common, "state");
        common = {
            type: "string",
            role: "value",
            name: {
                "en": "Change IP",
                "de": "IP ändern",
                "ru": "Изменить IP",
                "pt": "Alterar IP",
                "nl": "Verander IP",
                "fr": "Modifier IP",
                "it": "Modifica IP",
                "es": "Cambiar IP",
                "pl": "Zmiana IP",
                "uk": "Зміна IP",
                "zh-cn": "变革IP"
            },
            desc: "Change IP",
            read: true,
            write: true,
            def: this.config.ip
        };
        await this.createDataPoint(`${box}.remote.control.change_ip`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: {
                "en": "Response to your request",
                "de": "Antwort auf Ihre Anfrage",
                "ru": "Ответ на ваш запрос",
                "pt": "Resposta ao seu pedido",
                "nl": "Verantwoordelijk voor uw verzoek",
                "fr": "Réponse à votre demande",
                "it": "Risposta alla vostra richiesta",
                "es": "Respuesta a su solicitud",
                "pl": "Odpowiedzi na prośbę",
                "uk": "Відповідь на запит",
                "zh-cn": "对你的要求的答复"
            },
            desc: "Response to your request",
            read: true,
            write: false,
            def: ""
        };
        await this.createDataPoint(`${box}.remote.control.response`, common, "state");
    },
    async createFolderJson(folder) {
        this.log.info("FOLDER: " + folder);
        const movielist = await this.getRequest(`${cs.API.movielist}?dirname=${encodeurl(folder)}`);
        if (
            movielist &&
            movielist.movies &&
            Array.isArray(movielist.movies) &&
            movielist.movies.length > 0
        ) {
            this.folderstates[folder] = this.counter;
            ++this.counter;
        }
        if (
            movielist &&
            movielist.bookmarks &&
            Array.isArray(movielist.bookmarks) &&
            movielist.bookmarks.length > 0
        ) {
            for (const element of movielist.bookmarks) {
                if (!["#recycle", ".Trash", "@eaDir"].includes(element)) {
                    this.log.info("element: " + element);
                    await this.createFolderJson(`${folder}${element}/`);
                }
                this.log.info(element);
            }
        }
    },
    async createDataPoint(ident, common, types) {
        const obj = await this.getObjectAsync(this.namespace + "." + ident);
        if (!obj) {
            await this.setObjectNotExistsAsync(ident, {
                type: types,
                common: common,
                native: {},
            })
                .catch((error) => {
                    this.log.error(error);
                });
        } else {
            delete obj["common"];
            obj["common"] = common;
            await this.setForeignObjectAsync(this.namespace + "." + ident, obj);
        }
    },
    async loadBouquets(box, bouquets) {
        const commons = {
            type: "mixed",
            role: "value",
            name: {
                "en": "Channel list select",
                "de": "Kanalliste auswählen",
                "ru": "Список каналов выбрать",
                "pt": "Lista de canais select",
                "nl": "Channel lijst",
                "fr": "Sélectionnez la liste",
                "it": "Elenco canali selezionare",
                "es": "Lista de canales seleccione",
                "pl": "Lista kanałów",
                "uk": "Вибір списку каналів",
                "zh-cn": "名单"
            },
            desc: "Select bouquets",
            read: true,
            write: true,
            def: ""
        };
        const new_states = {};
        for (const element of bouquets["bouquets"]) {
            new_states[element[0]] = element[1];
        }
        commons["states"] = new_states;
        await this.createDataPoint(`${box}.remote.bouquets.SET_BOUQUETS`, commons, "state");
        commons["name"] = {
            "en": "EPG select",
            "de": "EPG auswählen",
            "ru": "EPG выбрать",
            "pt": "EPG select",
            "nl": "EPG",
            "fr": "EPG Sélectionner",
            "it": "EPG selezionare",
            "es": "EPG select",
            "pl": "EPG selekcje EPG",
            "uk": "Вибір ЕПГ",
            "zh-cn": "D. 选择方案"
        };
        commons["desc"] = "EPG";
        await this.createDataPoint(`${box}.remote.epg.SET_EPG_BOUQUETS`, commons, "state");
    }
};
