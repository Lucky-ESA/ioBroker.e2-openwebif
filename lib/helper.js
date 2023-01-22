const cs = require("./constants");

module.exports = {
    async createDeviceInfo(box, foldername, deviceInfo) {
        try {
            await this.setObjectNotExistsAsync(box, {
                type: "device",
                common: {
                    name: foldername,
                },
                native: {},
            });
            let common = {};
            common = {
                type: "number",
                role: "info.status",
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
                read: true,
                write: false,
                def: 0,
                states: {
                    0: "Standby",
                    1: "Online",
                    2: "Deep Standby"
                }
            };
            await this.createDataPoint(`${box}.STATUS_DEVICE`, common, "state");
            common = {
                type: "number",
                role: "info.interval",
                name: {
                    "en": "Current Interval in secondes",
                    "de": "Aktuelles Intervall in Sekunden",
                    "ru": "Текущий интервал в секундах",
                    "pt": "Intervalo atual em segundos",
                    "nl": "Current Interval in seconden",
                    "fr": "Intervalle actuelle en secondes",
                    "it": "Intervallo attuale in secondi",
                    "es": "Intervalo actual en segundos",
                    "pl": "Obecny interwał",
                    "uk": "Поточний Інтервал у секундах",
                    "zh-cn": "目前二者之间的间关系"
                },
                desc: "Current Interval in secondes",
                read: true,
                write: false,
                unit: "sec.",
                def: 0
            };
            await this.createDataPoint(`${box}.CURRENT_INTERVAL`, common, "state");
            common = {
                type: "string",
                role: "json",
                name: {
                    "en": "Datapoints Quality",
                    "de": "Datenpunkte Qualität",
                    "ru": "Качество точек данных",
                    "pt": "Qualidade dos Datapoints",
                    "nl": "Quality",
                    "fr": "Datapoints Qualité",
                    "it": "Qualità dei datapoint",
                    "es": "Datapoints Quality",
                    "pl": "Jakość danych",
                    "uk": "Якість точок даних",
                    "zh-cn": "数据点 质量"
                },
                desc: "Datapoints Quality",
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.DP_QUALITY`, common, "state");
            await this.setObjectNotExistsAsync(box, {
                type: "folder",
                common: {
                    name: {
                        "en": "Device Info",
                        "de": "Informationen über das Gerät",
                        "ru": "Информация об устройстве",
                        "pt": "InformaÃ§Ã£o do dispositivo",
                        "nl": "Device Info",
                        "fr": "Infos sur les appareils",
                        "it": "Informazioni sul dispositivo",
                        "es": "Información del dispositivo",
                        "pl": "Info",
                        "uk": "Інформація про пристрій",
                        "zh-cn": "Device Info"
                    },
                },
                native: {},
            });
            await this.json2iob.parse(`${box}.deviceInfo`, deviceInfo, {
                forceIndex: true,
                preferedArrayName: null,
                channelName: null,
                autoCast: true,
                checkvalue: true,
                checkType: true,
            });
        } catch (e) {
            this.sendLucky(e, "try createDeviceInfo");
        }
    },
    async createStatusInfo(box, statusInfo) {
        try {
            await this.setObjectNotExistsAsync(box, {
                type: "folder",
                common: {
                    name: {
                        "en": "StatusInfo",
                        "de": "Status",
                        "ru": "СтатусInfo",
                        "pt": "StatusInfo",
                        "nl": "Status",
                        "fr": "StatusInfo",
                        "it": "Stato Info",
                        "es": "StatusInfo",
                        "pl": "StatusInfo",
                        "uk": "СтатусІнфо",
                        "zh-cn": "现状"
                    },
                },
                native: {},
            });
            let common = {};
            await this.json2iob.parse(`${box}.statusInfo`, statusInfo, {
                forceIndex: true,
                preferedArrayName: null,
                channelName: null,
                autoCast: true,
                checkvalue: true,
                checkType: true,
            });
            common = {
                type: "number",
                role: "info",
                name: {
                    "en": "Active recordings",
                    "de": "Aktive Aufnahmen",
                    "ru": "Активные записи",
                    "pt": "Gravações ativas",
                    "nl": "Actieve opnames",
                    "fr": "Enregistrements actifs",
                    "it": "Registrazioni attive",
                    "es": "Grabaciones activas",
                    "pl": "Nagrania aktowe",
                    "uk": "Активні записи",
                    "zh-cn": "精算记录"
                },
                desc: "Active recordings",
                read: true,
                write: false,
                def: 0
            };
            await this.createDataPoint(`${box}.statusInfo.info.recordings_activ`, common, "state");
            common = {
                type: "number",
                role: "info",
                name: {
                    "en": "Open recordings",
                    "de": "Offene Aufnahmen",
                    "ru": "Открытые записи",
                    "pt": "Gravações abertas",
                    "nl": "Open opnames",
                    "fr": "Enregistrements ouverts",
                    "it": "Registrazioni aperte",
                    "es": "Grabaciones abiertas",
                    "pl": "Otwarte nagranie",
                    "uk": "Відкриті записи",
                    "zh-cn": "公开记录"
                },
                desc: "Open recordings",
                read: true,
                write: false,
                def: 0
            };
            await this.createDataPoint(`${box}.statusInfo.info.recordings_open`, common, "state");
            common = {
                type: "number",
                role: "info",
                name: {
                    "en": "Recordings done",
                    "de": "Aufzeichnungen",
                    "ru": "Записи сделаны",
                    "pt": "Gravações feitas",
                    "nl": "Vertaling:",
                    "fr": "Enregistrements effectués",
                    "it": "Registrazioni effettuate",
                    "es": "Grabaciones realizadas",
                    "pl": "Nagrywanie",
                    "uk": "Записи",
                    "zh-cn": "录音"
                },
                desc: "Open recordings",
                read: true,
                write: false,
                def: 0
            };
            await this.createDataPoint(`${box}.statusInfo.info.recordings_done`, common, "state");
            common = {
                type: "number",
                role: "info",
                name: {
                    "en": "Error recordings",
                    "de": "Fehleraufnahmen",
                    "ru": "Ошибка записи",
                    "pt": "Gravações de erro",
                    "nl": "Error opnames",
                    "fr": "Enregistrements d'erreur",
                    "it": "Registrazioni di errore",
                    "es": "Grabaciones de errores",
                    "pl": "Nagranie Error",
                    "uk": "Записи помилок",
                    "zh-cn": "录音记录"
                },
                desc: "Error recordings",
                read: true,
                write: false,
                def: 0
            };
            await this.createDataPoint(`${box}.statusInfo.info.recordings_error`, common, "state");
            common = {
                type: "string",
                role: "info",
                name: {
                    "en": "Next recording starttime",
                    "de": "Nächster Aufnahmestart",
                    "ru": "Следующая запись starttime",
                    "pt": "Próximo tempo de início de gravação",
                    "nl": "Volgende opname start",
                    "fr": "Prochain enregistrement débutant",
                    "it": "Prossima registrazione",
                    "es": "Siguiente grabación de inicio",
                    "pl": "Okładka",
                    "uk": "Попередній запис",
                    "zh-cn": "录制"
                },
                desc: "Next recording starttime",
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.statusInfo.info.recording_next_start`, common, "state");
            common = {
                type: "string",
                role: "info",
                name: {
                    "en": "Next recording endtime",
                    "de": "Nächste Aufnahme Endzeit",
                    "ru": "Следующая запись endtime",
                    "pt": "Próximo tempo de gravação",
                    "nl": "Volgende opname",
                    "fr": "Prochain enregistrement temps",
                    "it": "Prossima registrazione",
                    "es": "Siguiente grabación de última hora",
                    "pl": "Ostatni album",
                    "uk": "Попередній запис",
                    "zh-cn": "下表"
                },
                desc: "Next recording endtime",
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.statusInfo.info.recording_next_end`, common, "state");
            common = {
                type: "string",
                role: "info",
                name: {
                    "en": "Next recording channel",
                    "de": "Nächster Aufnahmekanal",
                    "ru": "Следующий канал записи",
                    "pt": "Próximo canal de gravação",
                    "nl": "Volgende opname kanaal",
                    "fr": "Chaîne d'enregistrement suivante",
                    "it": "Il prossimo canale di registrazione",
                    "es": "Siguiente canal de grabación",
                    "pl": "Kanał muzyczny",
                    "uk": "Наступний запис канал",
                    "zh-cn": "下一次录音带"
                },
                desc: "Next recording channel",
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.statusInfo.info.recording_next_channel`, common, "state");
            common = {
                type: "string",
                role: "url.icon",
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
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.statusInfo.now.picon`, common, "state");
            await this.createDataPoint(`${box}.statusInfo.next.picon`, common, "state");
            common = {
                type: "number",
                role: "media.broadcastDate",
                name: {
                    "en": "Event in Percent",
                    "de": "Veranstaltung in Prozent",
                    "ru": "Мероприятие в Проценте",
                    "pt": "Evento em porcentagem",
                    "nl": "Avond",
                    "fr": "Événement en pourcentage",
                    "it": "Evento in Percentuale",
                    "es": "Evento en porcentaje",
                    "pl": "Wydarzenie",
                    "uk": "Подія в відсоток",
                    "zh-cn": "预定活动"
                },
                desc: "Event in Percent",
                read: true,
                write: false,
                unit: "%",
                def: 0
            };
            await this.createDataPoint(`${box}.statusInfo.now.event_percent`, common, "state");
            common = {
                type: "number",
                role: "media.broadcastDate",
                name: {
                    "en": "Start timestamp",
                    "de": "Startzeitstempel",
                    "ru": "Начало timetamp",
                    "pt": "Start timestamp",
                    "nl": "Start Timestamp",
                    "fr": "Start timestamp",
                    "it": "Avviare il timestamp",
                    "es": "Inicio horarios",
                    "pl": "Start timestamp",
                    "uk": "Почати час",
                    "zh-cn": "启动时间"
                },
                desc: "Start timestamp",
                read: true,
                write: false,
                def: 0
            };
            await this.createDataPoint(`${box}.statusInfo.now.begin_timestamp`, common, "state");
            await this.createDataPoint(`${box}.statusInfo.next.begin_timestamp`, common, "state");
            common = {
                type: "number",
                role: "media.broadcastDate",
                name: {
                    "en": "End timestamp",
                    "de": "Endzeitstempel",
                    "ru": "Конец timetamp",
                    "pt": "Prazos de fim",
                    "nl": "Einde tijd",
                    "fr": "End timestamp",
                    "it": "Tempo di chiusura",
                    "es": "Tiempos finales",
                    "pl": "Końcowy",
                    "uk": "Кінцевий час",
                    "zh-cn": "时间放映"
                },
                desc: "End timestamp",
                read: true,
                write: false,
                def: 0
            };
            await this.createDataPoint(`${box}.statusInfo.now.end_timestamp`, common, "state");
            await this.createDataPoint(`${box}.statusInfo.next.end_timestamp`, common, "state");
            common = {
                type: "string",
                role: "media.elapsed.text",
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
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.statusInfo.now.remaining_time`, common, "state");
            await this.createDataPoint(`${box}.statusInfo.next.remaining_time`, common, "state");
        } catch (e) {
            this.sendLucky(e, "try createStatusInfo");
        }
    },
    async createRemote(box, deviceInfo) {
        try {
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
            if (this.devicesID[box].ssh) {
                common = {
                    name: {
                        "en": "SSH Commands",
                        "de": "SSH Befehle",
                        "ru": "СШ Команды",
                        "pt": "SSH Comandos",
                        "nl": "♪ Commando",
                        "fr": "SSH Commandes",
                        "it": "SSH Comandi",
                        "es": "SSH Comandos",
                        "pl": "SSH Dowództwo",
                        "uk": "СШ Команди",
                        "zh-cn": "卫生 指挥"
                    }
                };
                await this.createDataPoint(`${box}.remote.ssh`, common, "folder");
                common = {
                    type: "string",
                    role: "value",
                    name: {
                        "en": "Send SSH-Command",
                        "de": "SSH-Command senden",
                        "ru": "Отправить SSH-Command",
                        "pt": "Enviar SSH-Command",
                        "nl": "Stuur SSH-Command",
                        "fr": "Envoyer SSH-Command",
                        "it": "Invia SSH-Command",
                        "es": "Enviar SSH-Command",
                        "pl": "SSH-Command",
                        "uk": "Надіслати SSH-Command",
                        "zh-cn": "Send SSH-Command"
                    },
                    desc: "Send SSH-Command",
                    read: true,
                    write: true,
                    def: ""
                };
                await this.createDataPoint(`${box}.remote.ssh.sendCommand`, common, "state");
                common = {
                    type: "string",
                    role: "value",
                    name: {
                        "en": "Response SSH-Command",
                        "de": "Antwort SSH-Command",
                        "ru": "Ответ SSH-Command",
                        "pt": "Resposta SSH-Command",
                        "nl": "Verantwoord SSH-Command",
                        "fr": "Réponse SSH-Command",
                        "it": "Risposta SSH-Command",
                        "es": "Response SSH-Command",
                        "pl": "Strona SSH-Command",
                        "uk": "Відповідь SSH-Command",
                        "zh-cn": "A. 反应"
                    },
                    desc: "Response SSH-Command",
                    read: true,
                    write: true,
                    def: ""
                };
                await this.createDataPoint(`${box}.remote.ssh.responseCommand`, common, "state");
            } else {
                await this.delObjectAsync(`${box}.remote.ssh`, { recursive: true });
            }
            this.log.debug("WEBIF: " + deviceInfo.webifver);
            this.log.debug("WEBIF Match: " + deviceInfo.webifver.match(/wif/ig));
            if (deviceInfo.webifver && deviceInfo.webifver.match(/wif/ig) != null) {
                common = {
                    name: {
                        "en": "Snapshot",
                        "de": "Schnappschuss",
                        "ru": "Снимки",
                        "pt": "Instantâneo",
                        "nl": "Snapshot",
                        "fr": "Snapshot",
                        "it": "Istantanea",
                        "es": "Captura",
                        "pl": "Snapshot",
                        "uk": "Знімок екрана",
                        "zh-cn": "绑架"
                    }
                };
                await this.createDataPoint(`${box}.remote.snapshot`, common, "folder");
                common = {
                    name: {
                        "en": "Pictures",
                        "de": "Bilder",
                        "ru": "Фотографии",
                        "pt": "Fotos",
                        "nl": "Foto's",
                        "fr": "Photos",
                        "it": "Immagini",
                        "es": "Fotos",
                        "pl": "Zdjęcia",
                        "uk": "Фотографії",
                        "zh-cn": "家具和设备"
                    }
                };
                await this.createDataPoint(`${box}.remote.snapshot.pictures`, common, "folder");
                common = {
                    type: "boolean",
                    role: "button",
                    name: {
                        "en": "Create Snapshot",
                        "de": "Erstellen von Snapshots",
                        "ru": "Создать снимок",
                        "pt": "Criar Instantâneo",
                        "nl": "Creatie Snapshot",
                        "fr": "Créer un Snapshot",
                        "it": "Creare un'istantanea",
                        "es": "Crear instantáneas",
                        "pl": "Snapshot",
                        "uk": "Створити Snapshot",
                        "zh-cn": "F. 绑架事件"
                    },
                    desc: "Create Snapshot",
                    read: true,
                    write: true,
                    def: false
                };
                if (this.config.alexa) {
                    if (this.config.text["SNAPSHOT"] && this.config.text["SNAPSHOT"] != "") {
                        common["smartName"] = {};
                        common["smartName"][this.lang] = this.config.text["SNAPSHOT"];
                        common["smartName"]["smartType"] = "SWITCH";
                    }
                }
                await this.createDataPoint(`${box}.remote.snapshot.snapshot`, common, "state");
                common = {
                    type: "boolean",
                    role: "button",
                    name: {
                        "en": "Create OSD Snapshot",
                        "de": "OSD Snapshot erstellen",
                        "ru": "Создание OSD снимка",
                        "pt": "Criar Instantâneo OSD",
                        "nl": "Creëer OSD Snapshot",
                        "fr": "Créer un Snapshot OSD",
                        "it": "Creare un'istantanea OSD",
                        "es": "Crear instantánea OSD",
                        "pl": "Snapshot (ang.)",
                        "uk": "Створення OSD Snapshot",
                        "zh-cn": "D. 设立可持续发展中心"
                    },
                    desc: "Create OSD Snapshot",
                    read: true,
                    write: true,
                    def: false
                };
                if (this.config.alexa) {
                    if (this.config.text["SNAPSHOT_OSD"] && this.config.text["SNAPSHOT_OSD"] != "") {
                        common["smartName"] = {};
                        common["smartName"][this.lang] = this.config.text["SNAPSHOT_OSD"];
                        common["smartName"]["smartType"] = "SWITCH";
                    }
                }
                await this.createDataPoint(`${box}.remote.snapshot.snapshot_osd`, common, "state");
                common = {
                    type: "string",
                    role: "value",
                    name: {
                        "en": "Create Snapshot with Link",
                        "de": "Snapshot mit Link erstellen",
                        "ru": "Создать снимок с Link",
                        "pt": "Criar instantâneo com Link",
                        "nl": "Create Snapshot met Link",
                        "fr": "Créer un Snapshot avec Lien",
                        "it": "Creare Istantanea con Link",
                        "es": "Crear instantánea con enlace",
                        "pl": "Create Snapshot with Link (ang.)",
                        "uk": "Створити Snapshot з посиланням",
                        "zh-cn": "D. 建立与联系的绑架"
                    },
                    desc: "Create Snapshot with Link",
                    read: true,
                    write: true,
                    def: ""
                };
                await this.createDataPoint(`${box}.remote.snapshot.snapshot_link`, common, "state");
            }
            common = {
                type: "number",
                role: "info.status",
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
                read: true,
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
                role: "level.timer",
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
            const powerstates = {
                0: "Toggle StandBy",
                1: "DeepStandBy",
                2: "Reboot",
                3: "Restart Enigma",
                4: "Wakeup",
                5: "Standby"
            };

            if (this.config.mac) {
                powerstates[6] = "WOL";
            }
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
                states: powerstates,
                def: 0
            };
            await this.createDataPoint(`${box}.remote.power.powerstate`, common, "state");
            if (this.config.mac) {
                common = {
                    type: "boolean",
                    role: "button.wakeup",
                    name: {
                        "en": "WAKE-ON-LAN",
                        "de": "WAKE-ON-LAN",
                        "ru": "WAKE-ON-LAN",
                        "pt": "WAKE-ON-LAN",
                        "nl": "WAKKER WORDEN",
                        "fr": "WAKE-ON-LAN",
                        "it": "WAKE-ON-LAN",
                        "es": "WAKE-ON-LAN",
                        "pl": "WAKE-ON-LAN (ANG.)",
                        "uk": "ЗАМОВИТИ",
                        "zh-cn": "WAKE-ON-LAN"
                    },
                    desc: "Wake on LAN",
                    read: true,
                    write: true,
                    def: false
                };
                if (this.config.alexa) {
                    if (this.config.text["WOL"] && this.config.text["WOL"] != "") {
                        common["smartName"] = {};
                        common["smartName"][this.lang] = this.config.text["WOL"];
                        common["smartName"]["smartType"] = "SWITCH";
                    }
                }
                await this.createDataPoint(`${box}.remote.power.WOL`, common, "state");
            }
            common = {};
            common = {
                type: "boolean",
                role: "button.standby",
                name: {
                    "en": "Standby",
                    "de": "Standby",
                    "ru": "Резерв",
                    "pt": "Aguarde",
                    "nl": "Stand-by",
                    "fr": "Standby",
                    "it": "Standby",
                    "es": "Standby",
                    "pl": "Standby",
                    "uk": "Панчохи",
                    "zh-cn": "A. 待命安排"
                },
                desc: "Standby",
                read: true,
                write: true,
                def: false
            };
            if (this.config.alexa) {
                if (this.config.text["STANDBY"] && this.config.text["STANDBY"] != "") {
                    common["smartName"] = {};
                    common["smartName"][this.lang] = this.config.text["STANDBY"];
                    common["smartName"]["smartType"] = "SWITCH";
                }
            }
            await this.createDataPoint(`${box}.remote.power.STANDBY`, common, "state");
            common = {};
            common = {
                type: "boolean",
                role: "button.wakeup",
                name: {
                    "en": "Wakeup from Standby",
                    "de": "Aufwachen von Standby",
                    "ru": "Вакеп от Standby",
                    "pt": "Acorde de Standby",
                    "nl": "Wakker worden van Standby",
                    "fr": "Réveille-toi de Standby",
                    "it": "Svegliarsi da Standby",
                    "es": "Despertarse de Standby",
                    "pl": "Wakeup from Standby (ang.)",
                    "uk": "Змія від Standby",
                    "zh-cn": "A. 待命状态"
                },
                desc: "Wakeup from Standby",
                read: true,
                write: true,
                def: false
            };
            if (this.config.alexa) {
                if (this.config.text["WAKEUP"] && this.config.text["WAKEUP"] != "") {
                    common["smartName"] = {};
                    common["smartName"][this.lang] = this.config.text["WAKEUP"];
                    common["smartName"]["smartType"] = "SWITCH";
                }
            }
            await this.createDataPoint(`${box}.remote.power.WAKEUP`, common, "state");
            common = {};
            common = {
                type: "boolean",
                role: "button.reboot",
                name: {
                    "en": "Reboot Enigma",
                    "de": "Reboot Enigma",
                    "ru": "Перезагрузка Enigma",
                    "pt": "Reiniciar Enigma",
                    "nl": "Herstart Enigma",
                    "fr": "Reboot Enigma",
                    "it": "Reboot Enigma",
                    "es": "Reboot Enigma",
                    "pl": "Reboot Enigma",
                    "uk": "Перезавантаження Enigma",
                    "zh-cn": "Reboot Enigma"
                },
                desc: "Reboot Enigma",
                read: true,
                write: true,
                def: false
            };
            if (this.config.alexa) {
                if (this.config.text["REBOOT_ENIGMA"] && this.config.text["REBOOT_ENIGMA"] != "") {
                    common["smartName"] = {};
                    common["smartName"][this.lang] = this.config.text["REBOOT_ENIGMA"];
                    common["smartName"]["smartType"] = "SWITCH";
                }
            }
            await this.createDataPoint(`${box}.remote.power.REBOOT_ENIGMA`, common, "state");
            common = {};
            common = {
                type: "boolean",
                role: "button.reboot",
                name: {
                    "en": "Reboot",
                    "de": "Neustart",
                    "ru": "Перезагрузка",
                    "pt": "Reiniciar",
                    "nl": "Reboot",
                    "fr": "Reboot",
                    "it": "Reboot",
                    "es": "Reboot",
                    "pl": "Reboot",
                    "uk": "Перезавантаження",
                    "zh-cn": "Reboot"
                },
                desc: "Reboot",
                read: true,
                write: true,
                def: false
            };
            if (this.config.alexa) {
                if (this.config.text["REBOOT"] && this.config.text["REBOOT"] != "") {
                    common["smartName"] = {};
                    common["smartName"][this.lang] = this.config.text["REBOOT"];
                    common["smartName"]["smartType"] = "SWITCH";
                }
            }
            await this.createDataPoint(`${box}.remote.power.REBOOT`, common, "state");
            common = {};
            common = {
                type: "boolean",
                role: "button.standby",
                name: {
                    "en": "Deep-StandBy",
                    "de": "Deep-StandBy",
                    "ru": "Deep-StandBy",
                    "pt": "Deep-StandBy",
                    "nl": "Diep-StandBy",
                    "fr": "Deep-StandBy",
                    "it": "Deep-StandBy",
                    "es": "Deep-StandBy",
                    "pl": "DeepStandBy (ang.)",
                    "uk": "ГлибокоStandBy",
                    "zh-cn": "A. 深入By"
                },
                desc: "Deep-StandBy",
                read: true,
                write: true,
                def: false
            };
            if (this.config.alexa) {
                if (this.config.text["DEEP_STANDBY"] && this.config.text["DEEP_STANDBY"] != "") {
                    common["smartName"] = {};
                    common["smartName"][this.lang] = this.config.text["DEEP_STANDBY"];
                    common["smartName"]["smartType"] = "SWITCH";
                }
            }
            await this.createDataPoint(`${box}.remote.power.DEEP_STANDBY`, common, "state");
            common = {};
            common = {
                type: "boolean",
                role: "button.standby",
                name: {
                    "en": " Toggle Standby",
                    "de": "Toggle Standby",
                    "ru": "Toggle в режиме ожидания",
                    "pt": "Toggle Standby",
                    "nl": "Toggle Standby",
                    "fr": "Toggle Standby",
                    "it": "Toggle Standby",
                    "es": "Toggle Standby",
                    "pl": "Toggle Standby",
                    "uk": "Виброхвост",
                    "zh-cn": "B. ggle待命"
                },
                desc: "Toggle Standby",
                read: true,
                write: true,
                def: false
            };
            if (this.config.alexa) {
                if (this.config.text["TOGGLE_STANDBY"] && this.config.text["TOGGLE_STANDBY"] != "") {
                    common["smartName"] = {};
                    common["smartName"][this.lang] = this.config.text["TOGGLE_STANDBY"];
                    common["smartName"]["smartType"] = "SWITCH";
                }
            }
            await this.createDataPoint(`${box}.remote.power.TOGGLE_STANDBY`, common, "state");
            common = {};
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
            common = {};
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
                states[keys] = cs.KEYIDS[keys] + " - " + keys;
            });
            const new_common = common;
            new_common["states"] = states;
            await this.createDataPoint(`${box}.remote.command.REMOTE_CONTROL`, new_common, "state");
            const commons = [
                {
                    datapoint: "KEY_VOLUMEUP",
                    role: "button.volume.up",
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
                    role: "button.volume.down",
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
                    role: "button.toggle",
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
                    role: "button.mute",
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
                    role: "button.channelup",
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
                    role: "button.channeldown",
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
                    role: "button.ok",
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
                    role: "button.exit",
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
                    role: "button.info",
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
                    role: "button.menu",
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
                    role: "button.pause",
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
                    role: "button.record",
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
                    role: "button.stop",
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
                    role: "button.tv",
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
                    role: "button.radio",
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
                    role: "button.up",
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
                    role: "button.down",
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
                    role: "button.left",
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
                    role: "button.right",
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
                    role: element.role,
                    type: "boolean",
                    desc: element.name + " Button",
                    read: true,
                    write: true,
                    def: false
                };
                if (this.config.alexa) {
                    if (this.config.text[element.datapoint] && this.config.text[element.datapoint] != "") {
                        common["smartName"] = {};
                        common["smartName"][this.lang] = this.config.text[element.datapoint];
                        common["smartName"]["smartType"] = "SWITCH";
                    } else if (
                        this.config.text[element.datapoint] &&
                        this.config.text[element.datapoint] == "" &&
                        common.smartName != null
                    ) {
                        delete common.smartName;
                    }
                }
                await this.createDataPoint(`${box}.remote.command.${element.datapoint}`, common, "state");
            }
            common = {
                type: "number",
                role: "level.volume",
                name: {
                    "en": "Set volumen 0-100%",
                    "de": "Volumen einstellen 0-100%",
                    "ru": "Установить объемн 0-100%",
                    "pt": "Conjunto de volume 0-100%",
                    "nl": "Vertaling: 0-100%",
                    "fr": "Set volumen 0-100%",
                    "it": "Set volumen 0-100%",
                    "es": "Volumen 0-100%",
                    "pl": "Set volume  0-100%",
                    "uk": "Комплекти 0-100%",
                    "zh-cn": "定量 0-100%"
                },
                desc: "Set Volumen 0-100%",
                def: 0,
                min: 0,
                max: 100,
                read: true,
                write: true
            };
            await this.createDataPoint(`${box}.remote.power.SET_VOLUME`, common, "state");
            common = {
                type: "boolean",
                role: "info",
                name: {
                    "en": "Runlevel was created",
                    "de": "Runlevel wurde erstellt",
                    "ru": "Создан Runlevel",
                    "pt": "Runlevel foi criado",
                    "nl": "Runlevel is gemaakt",
                    "fr": "Runlevel a été créé",
                    "it": "Runlevel è stato creato",
                    "es": "Runlevel was created",
                    "pl": "Runlevel został stworzony",
                    "uk": "Запуск був створений",
                    "zh-cn": "设立区域一级"
                },
                desc: "Runlevel was created",
                def: false,
                read: true,
                write: false
            };
            await this.createDataPoint(`${box}.SSH_CREATED`, common, "state");
            common = {
                type: "string",
                role: "info",
                name: {
                    "en": "SSH Scriptname",
                    "de": "SSH Scriptname",
                    "ru": "SSH Scriptname",
                    "pt": "Nome de script SSH",
                    "nl": "SSH Script",
                    "fr": "SSH Scriptname",
                    "it": "SSH Scriptname",
                    "es": "SSH Scriptname",
                    "pl": "SSH Scriptname",
                    "uk": "СШ Письма",
                    "zh-cn": "SSH Script名称"
                },
                desc: "SSH Scriptname",
                def: "",
                read: true,
                write: false
            };
            await this.createDataPoint(`${box}.SSH_SCRIPTNAME`, common, "state");
        } catch (e) {
            this.sendLucky(e, "try createRemote");
        }
    },
    async createBouquetsAndEPG(box, bouquets) {
        try {
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
            common = {
                name: {
                    "en": "Timerlist folder",
                    "de": "Timerlist Ordner",
                    "ru": "Папка Timerlist",
                    "pt": "Pasta de lista de tempo",
                    "nl": "Timerlist map",
                    "fr": "Dossier Timerlist",
                    "it": "Cartella della lista dei tempi",
                    "es": "Carpeta de lista de tiempo",
                    "pl": "Timerlist",
                    "uk": "Папка Timerlist",
                    "zh-cn": "时间名单"
                }
            };
            await this.createDataPoint(`${box}.remote.timerlist`, common, "folder");
            await this.createTimerFolder(box);
            await this.loadBouquets(box, bouquets);
            common = {
                type: "boolean",
                role: "button",
                name: {
                    "en": "Reload BOUQUETS",
                    "de": "Nachladen BOUQUETS",
                    "ru": "Перезагрузить BOUQUETS",
                    "pt": "Recarregar BOUQUES",
                    "nl": "Herladen BOQUET",
                    "fr": "Recharger BOUQUETS",
                    "it": "Reload BOUQUESTI",
                    "es": "Reload BOUQUETS",
                    "pl": "Zbiornik BOUQUETS",
                    "uk": "Завантажити BOUQUETS",
                    "zh-cn": "BOUQUETS"
                },
                desc: "Reload BOUQUETS",
                read: true,
                write: true,
                def: false
            };
            await this.createDataPoint(`${box}.remote.bouquets.RELOAD_BOUQUETS`, common, "state");
            common = {
                type: "string",
                role: "json",
                name: {
                    "en": "JSON BOUQUETS",
                    "de": "JSON BOUQUETS",
                    "ru": "JSON БУКЕТЫ",
                    "pt": "JSON BOUQUETS",
                    "nl": "JSON BOQUET",
                    "fr": "JSON BOUQUETS",
                    "it": "JSON BOUQUESTION",
                    "es": "JSON BOUQUETS",
                    "pl": "JSON BOUQUETS",
                    "uk": "БУКЕТИ",
                    "zh-cn": "JSON BOUQUETS"
                },
                desc: "JSON BOUQUETS",
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.remote.bouquets.JSON_BOUQUETS`, common, "state");
            common = {
                type: "string",
                role: "json",
                name: {
                    "en": "JSON CHANNEL",
                    "de": "JSON CHANNEL",
                    "ru": "JSON КАНАЛ",
                    "pt": "CAPÍTULO JSON",
                    "nl": "JSON CHANNEL",
                    "fr": "JSON CHANNEL",
                    "it": "JSON CHANNELL",
                    "es": "JSON CHANNEL",
                    "pl": "JSON CHAN",
                    "uk": "ДЖСОН ЧАНЕЛЬ",
                    "zh-cn": "JSONCHNEL"
                },
                desc: "JSON CHANNEL",
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.remote.bouquets.JSON_CHANNEL`, common, "state");
            await this.statesLoadTimer(box);
            common = {
                type: "boolean",
                role: "button",
                name: {
                    "en": "Delete expired TIMERS",
                    "de": "Löschen abgelaufen TIMER",
                    "ru": "Удаление истекло ВРЕМЯ",
                    "pt": "Excluir expirado TIMERS",
                    "nl": "Vernietiging TIMER",
                    "fr": "Deleted expired TIMERS",
                    "it": "Cancellare scaduto TIMITI",
                    "es": "Suprimir expirado TIEMPOS",
                    "pl": "Delete wygasł TIMERS",
                    "uk": "Видалити розірване ТИМЕРИ",
                    "zh-cn": "删除 TIMERS"
                },
                desc: "Delete expired TIMERS",
                read: true,
                write: true,
                def: false
            };
            await this.createDataPoint(`${box}.remote.timerlist.DELETE_EXPIRED_TIMERS`, common, "state");
            common = {
                type: "boolean",
                role: "button",
                name: {
                    "en": "Delete selected TIMER",
                    "de": "Ausgewählte TIMER löschen",
                    "ru": "Удалить выбранный TIMER",
                    "pt": "Excluir o TIMER selecionado",
                    "nl": "Verwijder TIMER",
                    "fr": "Supprimer le TIMER sélectionné",
                    "it": "Eliminare il TIMER selezionato",
                    "es": "Eliminar el TIEMPO seleccionado",
                    "pl": "Delete wybrał TIMER",
                    "uk": "Видалити вибраний TIMER",
                    "zh-cn": "删除选定的《反倾销协定》"
                },
                desc: "Delete selected TIMER",
                read: true,
                write: true,
                def: false
            };
            await this.createDataPoint(`${box}.remote.timerlist.DELETE_SELECT_TIMERS`, common, "state");
            common = {
                type: "boolean",
                role: "button",
                name: {
                    "en": "Load Timerlist",
                    "de": "Timerliste laden",
                    "ru": "Load Таймерлист",
                    "pt": "Lista de tempo de carga",
                    "nl": "Laad Timerlist",
                    "fr": "Load Timerlist",
                    "it": "Caricamento",
                    "es": "Plantilla de carga",
                    "pl": "Load Timerlist",
                    "uk": "Завантаження",
                    "zh-cn": "时间名单"
                },
                desc: "Load Timerlist",
                read: true,
                write: true,
                def: false
            };
            await this.createDataPoint(`${box}.remote.timerlist.LOAD_TIMERLIST`, common, "state");
            common = {
                type: "string",
                role: "json",
                name: {
                    "en": "JSON Timerlist",
                    "de": "JSON Timerlist",
                    "ru": "JSON Таймерлист",
                    "pt": "JSON Timerlist",
                    "nl": "JSON Timerlist",
                    "fr": "JSON Timerlist",
                    "it": "JSON Timerlist",
                    "es": "JSON Timerlist",
                    "pl": "JSON Timerlista",
                    "uk": "JSON Список таймерів",
                    "zh-cn": "JSON Timerlist"
                },
                desc: "JSON Timerlist",
                read: true,
                write: false,
                def: ""
            };
            await this.createDataPoint(`${box}.remote.timerlist.JSON_TIMERLIST`, common, "state");
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
                    "en": "Reload BOUQUETS",
                    "de": "Nachladen BOUQUETS",
                    "ru": "Перезагрузить BOUQUETS",
                    "pt": "Recarregar BOUQUES",
                    "nl": "Herladen BOQUET",
                    "fr": "Recharger BOUQUETS",
                    "it": "Reload BOUQUESTI",
                    "es": "Reload BOUQUETS",
                    "pl": "Zbiornik BOUQUETS",
                    "uk": "Завантажити BOUQUETS",
                    "zh-cn": "BOUQUETS"
                },
                desc: "Reload BOUQUETS",
                read: true,
                write: true,
                def: false
            };
            await this.createDataPoint(`${box}.remote.epg.RELOAD_BOUQUETS`, common, "state");
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
            await this.statesSetFolder(box);
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
        } catch (e) {
            this.sendLucky(e, "try createBouquetsAndEPG");
        }
    },
    async createFolderJson(folder, deviceId) {
        try {
            this.log.info("FOLDER: " + folder);
            const movielist = await this.getRequest(`${cs.API.movielist}?dirname=${encodeURI(folder)}`, deviceId);
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
                        await this.createFolderJson(`${folder}${element}/`, deviceId);
                    }
                    this.log.info(element);
                }
            }
        } catch (e) {
            this.sendLucky(e, "try createFolderJson");
        }
    },
    async createDataPoint(ident, common, types, native) {
        try {
            const nativvalue = !native ? {} : native;
            const obj = await this.getObjectAsync(this.namespace + "." + ident);
            if (!obj) {
                await this.setObjectNotExistsAsync(ident, {
                    type: types,
                    common: common,
                    native: nativvalue,
                })
                    .catch((error) => {
                        this.sendLucky(error, "catch createDataPoint");
                    });
            } else {
                delete obj["common"];
                obj["common"] = common;
                await this.setForeignObjectAsync(this.namespace + "." + ident, obj);
            }
        } catch (e) {
            this.sendLucky(e, "try createDataPoint");
        }
    },
    async loadBouquets(box, bouquets) {
        try {
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
        } catch (e) {
            this.sendLucky(e, "try loadBouquets");
        }
    },
    async statesLoadTimer(box, states) {
        try {
            const common = {
                type: "string",
                role: "value",
                name: {
                    "en": "Timer select",
                    "de": "Timer auswählen",
                    "ru": "Таймер выбрать",
                    "pt": "Seleção de temporizador",
                    "nl": "Timer selecteert",
                    "fr": "Timer select",
                    "it": "Seleziona timer",
                    "es": "Timer select",
                    "pl": "Timer selekcjoner",
                    "uk": "Вибір таймера",
                    "zh-cn": "时间选择"
                },
                desc: "Timer select",
                read: true,
                write: true,
                def: ""
            };
            if (states) {
                common["states"] = states;
            }
            await this.createDataPoint(`${box}.remote.timerlist.SET_TIMER`, common, "state");
        } catch (e) {
            this.sendLucky(e, "try statesLoadTimer");
        }
    },
    async statesSetFolder(box, states) {
        try {
            const common = {
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
            if (states) {
                common["states"] = states;
            }
            await this.createDataPoint(`${box}.remote.movielist.SET_FOLDER`, common, "state");
        } catch (e) {
            this.sendLucky(e, "try statesSetFolder");
        }
    },
    async createTimerFolder(box) {
        try {
            const common = {
                name: {
                    "en": "Selected Timer",
                    "de": "Ausgewählte Timer",
                    "ru": "Выбранный таймер",
                    "pt": "Temporizador selecionado",
                    "nl": "Verkocht Timer",
                    "fr": "Selected Timer",
                    "it": "Timer selezionato",
                    "es": "Selected Timer",
                    "pl": "Wybrany Timer",
                    "uk": "Вибраний таймер",
                    "zh-cn": "选定的时间"
                }
            };
            await this.createDataPoint(`${box}.remote.timerlist.timer`, common, "folder");
        } catch (e) {
            this.sendLucky(e, "try createTimerFolder");
        }
    }
};
