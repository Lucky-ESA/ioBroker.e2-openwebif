"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
const axios       = require("axios");
const wol         = require("wol");
const net         = require("net");
const SSH2Promise = require("ssh2-promise");
const Json2iob    = require("./lib/json2iob");
const helper      = require("./lib/helper");
const cs          = require("./lib/constants");
const encodeurl   = require("encodeurl");
const fs          = require("fs");
const https       = require("https");
const httpsAgent  = new https.Agent({
    rejectUnauthorized: false
//    cert: fs.readFileSync('./lib/boxcert.cer'),
//    key: fs.readFileSync('./lib/client.key'),
//    ca: fs.readFileSync('./lib/boxcert.cer'),
});

class E2Openwebif extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "e2-openwebif",
        });

        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.json2iob = new Json2iob(this);
        this.createDataPoint = helper.createDataPoint;
        this.createDeviceInfo = helper.createDeviceInfo;
        this.createRemote = helper.createRemote;
        this.createStatusInfo = helper.createStatusInfo;
        this.createBouquetsAndEPG = helper.createBouquetsAndEPG;
        this.createFolderJson = helper.createFolderJson;
        this.loadBouquets = helper.loadBouquets;
        this.updateInterval = null;
        this.offlineInterval = null;
        this.messageInterval = null;
        this.isOnline = 0;
        this.isSame = 4;
        this.folderstates = {};
        this.counter = 1;
        this.load = false;
        this.loadname = "Unknown";
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        this.setState("info.connection", false, true);
        if (this.config.ip == "") {
            this.log.warn("Please enter an IP.");
            return;
        }
        if (this.config.port === 0) {
            this.log.warn("Please enter an Port. Set port default 80");
            this.config.port = 80;
        }
        const data = {};
        if (this.config.user != "" && this.config.password != "") {
            this.log.info("Use password and username.");
            data.withCredentials = true;
            data.auth = {
                username: this.config.user,
                password: this.config.password
            };
        }
        let webadd = "http://";
        if (this.config.https) {
            this.log.info("Use HTTPS.");
            data["httpsAgent"] = httpsAgent;
            webadd = "https://";
        }
        const url = `${webadd}${this.config.ip}:${this.config.port}`;
        // @ts-ignore
        this.axiosInstance = axios.create({
            method: "GET",
            baseURL: url,
            timeout: 10000,
            ...data,
        });
        this.isOnline  = await this.pingDevice(this.config.ip, this.config.port);
        if (this.isOnline === 2 && (this.config.adaptername == null || this.config.adaptername === "object")) {
            this.log.info(`
                Your device with IP ${this.config.ip}:${this.config.port} is unreachable. 
                Please check your Instance configuration and restart your adapter.
            `);
            return;
        }
        const powerstate = await this.getRequest(cs.API.powerstate);
        this.log.debug("powerstate: " + JSON.stringify(powerstate));
        if ((powerstate && powerstate.instandby) && !this.config.adaptername) {
            this.log.info(`
                Your device with IP ${this.config.ip}:${this.config.port} is in standby. 
                Please wake your device and restart your adapter.
            `);
            return;
        }
        if (powerstate && powerstate.instandby === false) {
            const deviceInfo = await this.getRequest(cs.API.deviceinfo);
            if (deviceInfo == null && !deviceInfo.boxtype) {
                this.log.warn(`Connected to ${this.config.ip} device faild`);
                return;
            }
            if (!this.config.adaptername) {
                this.config.adaptername = deviceInfo && deviceInfo.boxtype != null
                    ? deviceInfo.boxtype
                    : "enigma2";
                this.log.info(`Set adaptername ${this.config.adaptername}. Restart now...`);
                try {
                    await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, {
                        native: { adaptername: this.config.adaptername }
                    });
                }
                catch (e) {
                    this.log.error(`Could not set adaptername ${deviceInfo.boxtype}`);
                }
            } else {
                this.log.info(`Adaptername is ${this.config.adaptername}.`);
            }
            this.log.info(`Create DeviceInfos`);
            await this.createDeviceInfo(deviceInfo.boxtype, deviceInfo);
            this.log.info(`Create Remote Folder`);
            await this.createRemote(deviceInfo.boxtype);
            const statusInfo = await this.getRequest(cs.API.getcurrent);
            if (!statusInfo || statusInfo.info == null) {
                this.log.warn(`Cannot find Status from ${this.config.ip} device`);
                return;
            }
            this.log.info(`Create StatusInfos`);
            await this.createStatusInfo(this.config.adaptername, statusInfo);
            const bouquets = await this.getRequest(cs.API.bouquets);
            if (!bouquets || !bouquets["bouquets"]) {
                this.log.warn(`Cannot find Bouquets from ${this.config.ip} device`);
            } else {
                this.log.info(`Create Bouquets and EPG`);
                await this.createBouquetsAndEPG(this.config.adaptername, bouquets);
            }
            await this.connect_ssh();
        }
        this.subscribeStates(`${this.config.adaptername}.remote.*`);
        this.log.info(`Start Interval with ${this.config.interval} seconds...`);
        this.checkDevice();
    }

    async checkDevice() {
        if (this.isSame != this.isOnline) {
            this.isSame = this.isOnline;
            if (this.isOnline === 1) {
                this.setState("info.connection", true, true);
            } else {
                this.setState("info.connection", false, true);
            }
            this.setState(`${this.config.adaptername}.STATUS_DEVICE`, {
                val: this.isOnline,
                ack: true
            });
            if (this.isOnline === 0) {
                this.setState(`${this.config.adaptername}.remote.STATUS_FROM_DEVICE`, {
                    val: this.isOnline,
                    ack: true
                });
            }
        }
        if (this.isOnline === 1) {
            if (!this.offlineInterval) {
                this.setNewInterval(this.config.interval, true);
            }
        } else if (this.isOnline === 0) {
            this.isOnline  = await this.pingDevice(this.config.ip, this.config.port);
            const powerstate = await this.getRequest(cs.API.powerstate);
            if (powerstate) {
                if (powerstate && powerstate.instandby) {
                    this.isOnline = 0;
                    this.offlineInterval && clearInterval(this.offlineInterval);
                    this.offlineInterval = null;
                    this.setNewInterval(this.config.interval);
                } else {
                    this.isOnline = 1;
                    if (!this.updateInterval) {
                        this.setNewInterval(60);
                    }
                }
            } else {
                this.isOnline = 2;
                this.offlineInterval && clearInterval(this.offlineInterval);
                this.offlineInterval = null;
                if (!this.updateInterval) {
                    this.setNewInterval(60);
                }
            }
        } else {
            this.offlineInterval && clearInterval(this.offlineInterval);
            this.offlineInterval = null;
            if (!this.updateInterval) {
                this.setNewInterval(60);
            }
        }
    }

    setNewInterval(times, val) {
        this.updateInterval && clearInterval(this.updateInterval);
        this.updateInterval = null;
        if (val) {
            this.offlineInterval = setInterval(async () => {
                this.log.debug(`Check device standby`);
                this.updateDevice();
            }, times * 1000);
        } else {
            this.updateInterval = setInterval(async () => {
                this.log.debug(`Check device deepstandby`);
                if (this.isOnline === 2) {
                    this.checkdeepstandby();
                } else {
                    this.updateDevice();
                }
            }, times * 1000);
        }
    }

    async checkdeepstandby() {
        this.isOnline  = await this.pingDevice(this.config.ip, this.config.port);
        if (this.isOnline != 2) {
            this.updateInterval && clearInterval(this.updateInterval);
            this.updateInterval = null;
            this.offlineInterval && clearInterval(this.offlineInterval);
            this.offlineInterval = null;
            this.checkDevice();
        }
    }

    async pingDevice(ip, port) {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection(port, ip);
            socket.setTimeout(1000);
            socket.on("connect", async () => {
                this.log.debug("Connected");
                const powerstate = this.getRequest(cs.API.powerstate);
                let status = 1;
                if (powerstate && powerstate["instandby"]) {
                    status = 0;
                }
                socket.end();
                resolve(status);
            });
            socket.on("timeout", () => {
                this.log.debug("Disconnected");
                socket.destroy();
                resolve(2);
            });
            socket.on("error", () => {
                this.log.debug("Offline");
                socket.destroy();
                if (reject) {
                    this.log.debug("reject: " + reject);
                }
                resolve(2);
            });
        });
    }

    async updateDevice() {
        if (this.load) {
            this.log.debug("in Process: " + this.loadname);
            return;
        }
        const powerstate = await this.getRequest(cs.API.powerstate);
        this.log.debug("powerstate: " + JSON.stringify(powerstate));
        if (!powerstate) {
            this.log.debug(`Device is offline`);
            this.isOnline = 2;
            this.checkDevice();
            return;
        }
        if (powerstate && powerstate.instandby) {
            this.log.debug(`Device is in standby`);
            this.isOnline = 0;
            this.checkDevice();
            return;
        }
        const getcurrent = await this.getRequest(cs.API.getcurrent);
        if (!getcurrent || getcurrent.info == null) {
            this.log.warn(`Cannot find Status from ${this.config.ip} device`);
            return;
        }
        const picon = "http://" +
            this.config.ip +
            ":" +
            this.config.port +
            "/picon/" +
            getcurrent.now.sref.replace(/:/g, "_").slice(0, -1) +
            ".png";
        this.setState(`${this.config.adaptername}.statusInfo.next.picon`, {
            val: picon,
            ack: true
        });
        this.setState(`${this.config.adaptername}.statusInfo.now.picon`, {
            val: picon,
            ack: true
        });
        let remain = "";
        if (getcurrent && getcurrent.next && getcurrent.next.remaining) {
            remain = new Date(Date.now(getcurrent.next.remaining) - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .replace("T", " ")
                .replace("Z", "");
            this.setState(`${this.config.adaptername}.statusInfo.next.remaining_time`, {
                val: remain,
                ack: true
            });
        }
        if (getcurrent && getcurrent.next && getcurrent.next.remaining) {
            remain = new Date(Date.now(getcurrent.now.remaining) - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .replace("T", " ")
                .replace("Z", "");
            this.setState(`${this.config.adaptername}.statusInfo.now.remaining_time`, {
                val: remain,
                ack: true
            });
        }
        const tunersignal = await this.getRequest(cs.API.tunersignal);
        if (tunersignal) {
            getcurrent.info = tunersignal;
        }
        this.log.debug("INFO: " + JSON.stringify(getcurrent.info));
        this.json2iob.parse(`${this.config.adaptername}.statusInfo`, getcurrent, {
            forceIndex: true,
            preferedArrayName: null,
            channelName: null,
        });
    }

    async getRequest(path) {
        this.log.debug("Request: " + path);
        return await this.axiosInstance(path)
            .then((response) => {
                this.log.debug(JSON.stringify(response.data));
                this.isOnline = 1;
                return response.data;
            })
            .catch((error) => {
                this.isOnline = 2;
                this.log.debug("getRequest: " + error);
                error.response && this.log.debug("Request: " + JSON.stringify(error.response.data));
                this.inProgress(false, "Unknown");
                return false;
            });
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.updateInterval && clearInterval(this.updateInterval);
            this.offlineInterval && clearInterval(this.offlineInterval);
            this.messageInterval && clearInterval(this.messageInterval);
            callback();
        } catch (e) {
            callback();
        }
    }

    async sendCommand(path) {
        this.log.info("path: " + path);
        const res = await this.getRequest(path);
        this.log.info("Path2" + path);
        this.log.info("sendCommand2: " + JSON.stringify(res));
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    async onStateChange(id, state) {
        if (state && !state.ack && state.val != null) {
            const command = id.split(".").pop();
            this.log.debug(`command: ${command}`);
            if (command === "change_ip") {
                this.changeIP(state);
            }
            if (command === "WOL" || (command === "setPowerStates" && state.val === 6)) {
                this.wakeonlan(state);
            }
            if (this.isOnline === 2) {
                this.log.info(`Receiver ${this.config.ip} is Offline. Cannot send a request!`);
                return;
            }
            if (this.isOnline === 0) {
                this.log.info(`Receiver ${this.config.ip} is in standby!`);
            }
            if (cs.KEYIDS[command] && state.val) {
                this.log.info("WER2: " + state.val);
                this.sendCommand(`${cs.PATH["COMMAND"]}${cs.KEYIDS[command]}`);
                return;
            }
            switch (command) {
                case "SET_BOUQUETS":
                    this.setBouquestAndEPG(state, "bouquets.SET_CHANNEL");
                    break;
                case "SET_CHANNEL":
                    this.setZAPAndEPG(state, "zap");
                    break;
                case "SET_EPG_BOUQUETS":
                    this.setZAPAndEPG(state, "epgbouquet");
                    break;
                case "LOAD_FOLDER":
                    this.setFolder();
                    break;
                case "SET_EPG_CHANNEL":
                    this.setChannelInfoEPG(state);
                    break;
                case "SET_FOLDER":
                    this.setMovies(state);
                    break;
                case "SET_EPG_RECORDING":
                    this.setRecordingInfoEPG(state);
                    break;
                case "CREATE_RECORDING_TIME":
                    this.createRecordingEPG(state);
                    break;
                case "sendMessage":
                    this.sendMessageToDevice(state);
                    break;
                case "request":
                    this.sentRequest(state);
                    break;
                case "your_request":
                    this.sentRequest(state);
                    break;
                case "STATUS_FROM_DEVICE":
                    this.changeStatus(state);
                    break;
                case "SET_VOLUME":
                    this.setVolumen(state);
                    break;
                case "setPowerStates":
                    this.setPowerStates(state);
                    break;
                case "STANDBY":
                    state.val = 5;
                    this.setPowerStates(state);
                    break;
                case "WAKEUP":
                    state.val = 4;
                    this.setPowerStates(state);
                    break;
                case "REBOOT_ENIGMA":
                    state.val = 3;
                    this.setPowerStates(state);
                    break;
                case "REBOOT":
                    state.val = 2;
                    this.setPowerStates(state);
                    break;
                case "DEEP_STANDBY":
                    state.val = 1;
                    this.setPowerStates(state);
                    break;
                case "TOGGLE_STANDBY":
                    state.val = 0;
                    this.setPowerStates(state);
                    break;
                default:
                    this.log.info(`received unknown command ${command}`);
            }
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    async setVolumen(state) {
        if (state) {
            if (state.val == 0 || (state.val > 0 && state.val < 101))  {
                const vol = await this.getRequest(`${cs.PATH.SETVOLUME}${state.val}`);
                this.log.debug("vol: " + JSON.stringify(vol));
            } else {
                this.log.info(`Cannot set Volumen: ${state.val}`);
            }
        } else {
            this.log.info(`Cannot set Volumen`);
        }
    }

    async setPowerStates(state) {
        if (state) {
            if (state.val == 0 || (state.val > 0 && state.val < 6))  {
                const power = await this.getRequest(`${cs.PATH.POWER}${state.val}`);
                this.log.debug("power: " + JSON.stringify(power));
            } else if (state.val === 6) {
                state.val = true;
                this.wakeonlan(state);
            } else {
                this.log.info(`Cannot set Powerstate: ${state.val}`);
            }
        } else {
            this.log.info(`Cannot set Powerstate`);
        }
    }

    async createRecordingEPG(state) {
        await this.inProgress(true, "createRecordingEPG");
        if (state && state.val) {
            const eventid = await this.getStateAsync(`${this.config.adaptername}.remote.epg.channel.id`);
            const sRef = await this.getStateAsync(`${this.config.adaptername}.remote.epg.channel.sref`);
            if (!eventid || !eventid.val != null) {
                this.log.info("Missing eventid");
                this.inProgress(false, "Unknown");
                return;
            }
            if (!sRef || !sRef.val != null) {
                this.log.info("Missing sRef");
                this.inProgress(false, "Unknown");
                return;
            }
            const setRec = await this.getRequest(`${cs.SET.timeraddbyeventid}?sRef=${sRef.val}&eventid=${eventid.val}`);
            this.log.debug("setRec: " + JSON.stringify(setRec));
            this.setState(`${this.config.adaptername}.remote.epg.RECORDING_RESPONSE`, {
                val: JSON.stringify(setRec),
                ack: true
            });
        }
        this.inProgress(false, "Unknown");
    }

    async setRecordingInfoEPG(state) {
        await this.inProgress(true, "setRecordingEPG");
        if (state && state.val != "") {
            this.log.debug("state.val: " + JSON.stringify(state.val));
            const rec = await this.getObjectAsync(`${this.namespace}.${this.config.adaptername}.remote.epg.SET_EPG_RECORDING`);
            this.log.debug("rec.native.epg: " + JSON.stringify(rec.native.epg));
            if (rec && rec.native && rec.native.epg && rec.native.epg[state.val]) {
                this.json2iob.parse(`${this.config.adaptername}.remote.epg.channel`, rec.native.epg[state.val], {
                    forceIndex: true,
                    preferedArrayName: null,
                    channelName: null,
                });
            }
        }
        this.inProgress(false, "Unknown");
    }

    async setChannelInfoEPG(state) {
        await this.inProgress(true, "setChannelInfoEPG");
        if (state && state.val != "") {
            const epgservice = await this.getRequest(`${cs.SET.epgservice}${state.val}`);
            if (epgservice && epgservice.events) {
                const new_states = {};
                let val_arr = 0;
                const channel = await this.getObjectAsync(`${this.namespace}.${this.config.adaptername}.remote.epg.SET_EPG_RECORDING`);
                this.log.debug("epgservice.events: " + JSON.stringify(epgservice.events));
                for (const element of epgservice.events) {
                    new_states[val_arr] = element.begin + " - " + element.sname + " " + element.title;
                    ++val_arr;
                }
                this.log.debug("new_states: " + JSON.stringify(new_states));
                if (channel && channel.common && channel.common.states) {
                    delete channel.common.states;
                }
                if (channel && channel.common && channel.common.states) {
                    delete channel.common.states;
                }
                if (channel && channel.native && channel.native.epg) {
                    delete channel.native.epg;
                }
                if (channel && channel.common) {
                    channel.common["states"] = new_states;
                    channel.native["epg"] = epgservice.events;
                }
                await this.setForeignObjectAsync(`${this.namespace}.${this.config.adaptername}.remote.epg.SET_EPG_RECORDING`, channel);
            }
        }
        this.inProgress(false, "Unknown");
    }

    async setMovies(state) {
        await this.inProgress(true, "setMovies");
        this.log.info(`setMovies: ${state.val}`);
        if (state && state.val != null) {
            const movielist = await this.getRequest(`${cs.SET.movielist}${state.val}`);
            if (movielist && movielist.movies) {
                this.setState(`${this.config.adaptername}.remote.movielist.MOVIELIST`, {
                    val: JSON.stringify(movielist.movies),
                    ack: true
                });
            }
        }
        this.inProgress(false, "Unknown");
    }

    async changeStatus(state) {
        if (state && state.val == 2) {
            this.log.debug(`Set Status deepstandby. Change interval to 60 min.`);
            this.updateInterval && clearInterval(this.updateInterval);
            this.offlineInterval && clearInterval(this.offlineInterval);
            this.updateInterval = null;
            this.offlineInterval = null;
            this.isOnline = 2;
            this.setNewInterval(3600);
        } else if (state && state.val == 1) {
            this.log.debug(`Set Status online. Change interval to ${this.config.interval} sec.`);
            this.updateInterval && clearInterval(this.updateInterval);
            this.offlineInterval && clearInterval(this.offlineInterval);
            this.updateInterval = null;
            this.offlineInterval = null;
            this.isOnline = 2;
            this.setNewInterval(this.config.interval, true);
        }
    }

    async changeIP(state) {
        if (state && state.val && state.val != null) {
            this.ioPack.native.ip = state.val;
            this.ioPack.native.adaptername = null;
            this.updateConfig(this.ioPack);
            //this.restart();
        }
    }

    async wakeonlan(state) {
        if (this.isOnline !== 2) {
            this.log.info(`Receiver ${this.config.ip} is in standby or Online!`);
            return;
        }
        if (state && state.val && this.config.mac != null) {
            wol.wake(this.config.mac.toLowerCase(), (err, res) => {
                if (err) {
                    this.log.info(`WOL ERROR: ${err}`);
                } else {
                    this.log.info(`Send WOL: ${res}`);
                }
            });
        }
    }

    async sentRequest(state) {
        if (this.isOnline === 0) {
            this.log.info(`Receiver ${this.config.ip} is in standby!`);
            return;
        }
        await this.inProgress(true, "sendRequest");
        if (state && state.val) {
            const resp = await this.getRequest(state.val);
            this.log.debug(JSON.stringify(resp));
            this.setState(`${this.config.adaptername}.remote.control.response`, {
                val: JSON.stringify(resp),
                ack: true
            });
        }
        this.inProgress(false, "Unknown");
    }

    async sendMessageToDevice(state) {
        if (!state.val) {
            return;
        }
        await this.inProgress(true, "sendMessageToDevice");
        const send_message = await this.getStateAsync(`${this.config.adaptername}.remote.message.message`);
        const send_timeout = await this.getStateAsync(`${this.config.adaptername}.remote.message.timeout`);
        const send_type = await this.getStateAsync(`${this.config.adaptername}.remote.message.type`);
        if (!send_message || send_message.val == "") {
            this.inProgress(false, "Unknown");
            this.log.info("Message is empty");
            return;
        }
        if (!send_type) {
            this.log.info("Cannot find type!");
            return;
        }
        if (!send_timeout) {
            this.log.info("Cannot find timeout!");
            return;
        }
        const path = "?text=" + send_message.val + "&type=" + send_type.val + "&timeout=" + send_timeout.val;
        const return_message = await this.getRequest(`${cs.SET.message}${encodeurl(path)}`);
        this.log.info("return_message: " + JSON.stringify(return_message));
        if (return_message && return_message.result && send_type.val == 0) {
            await this.getRequest(`${cs.PATH.COMMAND}108`);
            this.messageInterval = setInterval(async () => {
                this.answerMessage();
            }, (send_timeout.val + 1) * 1000);
        }
        this.inProgress(false, "Unknown");
    }

    async answerMessage() {
        this.messageInterval && clearInterval(this.messageInterval);
        const answer_message = await this.getRequest(`${cs.PATH.MESSAGEANSWER}`);
        this.log.info("answer_message: " + JSON.stringify(answer_message));
        if (answer_message && answer_message.result != null) {
            if (!answer_message.result) {
                this.sendCommand(`${cs.PATH["COMMAND"]}${cs.KEYIDS["KEY_EXIT"]}`);
            }
            this.setState(`${this.config.adaptername}.remote.message.answer`, {
                val: answer_message.message ? answer_message.message : "No Answer",
                ack: true
            });
        }
    }

    async setFolder() {
        await this.inProgress(true, "setFolder");
        const getlocations = await this.getRequest(`${cs.API.getlocations}`);
        if (
            getlocations &&
            getlocations.locations &&
            Array.isArray(getlocations.locations)
        ) {
            for (const element of getlocations.locations) {
                if (!this.folderstates[element]) {
                    await this.createFolderJson(element);
                    this.log.debug("PFAD: " + element);
                }
            }
            this.log.debug("this.folderstate: " + JSON.stringify(this.folderstates));
            if (this.folderstates) {
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
                    def: "",
                    states: this.folderstates
                };
                await this.createDataPoint(`${this.config.adaptername}.remote.movielist.SET_FOLDER`, common, "state");
            }
        }
        this.inProgress(false, "Unknown");
    }

    async setZAPAndEPG(state, val) {
        this.log.debug("state.val: " + state.val);
        const ZAPandEPG = await this.getRequest(`${cs.SET[val]}${encodeurl(state.val)}`);
        this.log.debug("ZAPandEPG: " + JSON.stringify(ZAPandEPG));
        if (val === "epgbouquet" && ZAPandEPG && ZAPandEPG.events) {
            this.setState(`${this.config.adaptername}.remote.epg.EPG_JSON`, {
                val: JSON.stringify(ZAPandEPG),
                ack: true
            });
            const new_states = {};
            const channel = await this.getObjectAsync(`${this.namespace}.${this.config.adaptername}.remote.epg.SET_EPG_CHANNEL`);
            this.log.debug("ZAPandEPG event: " + JSON.stringify(ZAPandEPG.events));
            for (const element of ZAPandEPG.events) {
                if (element && element.sname && new_states[element.sref] == null) {
                    new_states[element.sref] = element.sname;
                }
            }
            this.log.debug("new_states: " + JSON.stringify(new_states));
            if (channel && channel.common && channel.common.states) {
                delete channel.common.states;
            }
            if (channel && channel.common) {
                channel.common["states"] = new_states;
            }
            await this.setForeignObjectAsync(`${this.namespace}.${this.config.adaptername}.remote.epg.SET_EPG_CHANNEL`, channel);
        }
    }

    async setBouquestAndEPG(state, dp) {
        if (state && state.val) {
            const getservices = await this.getRequest(`${cs.SET.getservices}${encodeurl(state.val)}`);
            if (getservices && getservices.services) {
                this.log.debug("getservices: " + JSON.stringify(getservices));
                const new_states = {};
                const channel = await this.getObjectAsync(`${this.namespace}.${this.config.adaptername}.remote.${dp}`);
                for (const element of getservices.services) {
                    if (element && element.servicename) {
                        new_states[element.servicereference] = element.servicename;
                    }
                }
                if (channel && channel.common && channel.common.states) {
                    delete channel.common.states;
                }
                if (channel && channel.common) {
                    channel.common["states"] = new_states;
                }
                await this.setForeignObjectAsync(`${this.namespace}.${this.config.adaptername}.remote.${dp}`, channel);
            }
        } else {
            this.log.info(`Cannot set ${state.val}`);
        }
    }

    async connect_ssh() {
        if (this.config.your_ip == "") {
            const obj_host = await this.getForeignObjectAsync(`system.host.${this.host}`);
            if (
                !obj_host ||
                obj_host.common == null ||
                obj_host.common.address == null ||
                obj_host.common.address[0] == null
            ) {
                this.log.info("Cannot find Host IP!");
                return;
            }
            this.config.your_ip = obj_host.common.address[0];
        }
        if (this.config.simple_api == "") {
            this.log.info("Please select simple-api in your config!");
            return;
        }
        const simple_api = await this.getForeignObjectAsync("system.adapter." + this.config.simple_api);
        let port = 0;
        if (
            !simple_api ||
            !simple_api.native ||
            !simple_api.native.port
        ) {
            this.log.info("Cannot find Adapter simple-api.x!");
            return;
        } else {
            port = simple_api.native.port;
        }
        if (simple_api.native.auth || simple_api.native.secure) {
            this.log.info("Use simple-api.0 w/o authorization!");
            return;
        }
        port = 8087;
        const get_url = `http://${this.config.your_ip}:${port}/set/${this.namespace}.${this.config.adaptername}.remote.STATUS_FROM_DEVICE?value=`;
        const sshconfig2 = {
            host: this.config.ip,
            username: this.config.user,
            password: this.config.password
        };
        const boxfile = this.adapterDir + "/lib/iobroker.sh";
        let data;
        if (fs.existsSync(boxfile)) {
            try {
                data = fs.readFileSync(boxfile);
                this.log.debug(`Data: ${data}`);
            } catch (e) {
                this.log.info(`Cannot read file "${boxfile}": ${e}`);
                return;
            }
        } else {
            this.log.info(`Cannot read file ${boxfile}`);
            return;
        }
        const ssh2 = new SSH2Promise(sshconfig2);
        //const ssh_dp = await this.getStateAsync(`${this.config.adaptername}.SSH_CREATED`);
        //const ssh_connection = ssh_dp && ssh_dp.val ? ssh_dp.val : false;
        await ssh2.connect().then(async () => {
            this.log.info("Connection established");
            let resp = "";
            resp = await this.commandToSSH2(ssh2, "/home/iobroker.sh");
            this.log.info(resp);
            if (!resp && resp != "iobroker" && this.config.ssh) {
                resp = await this.commandToSSH2(ssh2, `echo '${data}' > /home/iobroker.sh`);
                resp = await this.commandToSSH2(ssh2, "chmod 775 /home/iobroker.sh");
                if (resp === "OK") {
                    this.log.info("Set chmod 775 for /home/iobroker.sh");
                } else {
                    this.log.info("Error set chmod 775: " + resp);
                    ssh2.close();
                    return;
                }
                resp = await this.commandToSSH2(ssh2, "/home/iobroker.sh 1 " + get_url);
                if (resp === "OK") {
                    this.log.info("Create files and symlinks");
                    this.setState(`${this.config.adaptername}.SSH_CREATED`, {
                        val: true,
                        ack: true
                    });
                } else {
                    this.log.info("Error create files and symlinks: " + resp);
                    ssh2.close();
                    return;
                }
            } else if (!resp && resp == "iobroker" && !this.config.ssh) {
                resp = await this.commandToSSH2(ssh2, "/home/iobroker.sh 2");
                if (resp === "OK") {
                    this.log.info("Delete files and symlinks");
                } else {
                    this.log.info("Error delete files and symlinks: " + resp);
                    ssh2.close();
                    return;
                }
                resp = await this.commandToSSH2(ssh2, "rm /home/iobroker.sh 2");
                if (resp === "OK") {
                    this.log.info("Delete /home/iobroker.sh");
                    this.setState(`${this.config.adaptername}.SSH_CREATED`, {
                        val: false,
                        ack: true
                    });
                } else {
                    this.log.info("Error delete /home/iobroker.sh: " + resp);
                    ssh2.close();
                    return;
                }
            }
        });
        ssh2.close();
    }

    async commandToSSH2(ssh2, command) {
        this.log.info(command);
        try {
            const res = await ssh2.exec(command);
            if (res == "") {
                return "OK";
            } else {
                return res;
            }
        } catch (e) {
            return e;
        }
    }

    async inProgress(work, workname) {
        this.load = work;
        this.loadname = workname;
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new E2Openwebif(options);
} else {
    // otherwise start the instance directly
    new E2Openwebif();
}