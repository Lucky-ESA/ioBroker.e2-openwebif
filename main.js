/* eslint-disable quotes */
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
const { isNativeError } = require("util/types");

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
        this.statesLoadTimer = helper.statesLoadTimer;
        this.statesSetFolder = helper.statesSetFolder;
        this.createTimerFolder = helper.createTimerFolder;
        this.axiosInstance = {};
        this.axiosSnapshot = {};
        this.updateInterval = {};
        this.offlineInterval = {};
        this.recordInterval = {};
        this.messageInterval = {};
        this.devicesID = {};
        this.isOnline = {};
        this.isSame = {};
        this.folderstates = {};
        this.unloadDevices = [];
        this.counter = 1;
        this.load = {};
        this.loadname = {};
        this.lang = "de";
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        try {
            const obj = await this.getForeignObjectAsync("system.config");
            if (obj && obj.common && obj.common.language) {
                try {
                    this.lang = obj.common.language === this.lang ? this.lang : obj.common.language;
                } catch (e) {
                    this.sendLucky(e, "try getForeignObjectAsync");
                }
            }
            for (const element of this.config.devices) {
                if (!element.activ) {
                    break;
                }
                this.log.info("Language: " + this.lang);
                const id = element.ip.replace(/[.\s]+/g, "_");
                this.isSame[id] = 4;
                this.updateInterval[id] = null;
                this.offlineInterval[id] = null;
                this.recordInterval[id] = null;
                this.messageInterval[id] = null;
                this.unloadDevices.push(id);
                this.devicesID[id] = element;
                this.load[id] = false;
                this.loadname[id] = "Unknown";
                this.log.info("INFO: " + id);
                this.setState("info.connection", false, true);
                if (element.ip == "") {
                    this.log.warn("Please enter an IP.");
                    break;
                }
                if (element.port === 0) {
                    this.log.warn("Please enter an Port. Set port default 80");
                    element.port = 80;
                }
                const data = {};
                if (element.user != "" && element.password != "") {
                    this.log.info("Use password and username.");
                    data.withCredentials = true;
                    data.auth = {
                        username: element.user,
                        password: element.password
                    };
                }
                let webadd = "http://";
                if (element.https) {
                    this.log.info("Use HTTPS.");
                    data["httpsAgent"] = httpsAgent;
                    webadd = "https://";
                }
                const url = `${webadd}${element.ip}:${element.port}`;
                // @ts-ignore
                this.axiosInstance[id] = axios.create({
                    method: "GET",
                    baseURL: url,
                    timeout: 10000,
                    responseType: "json",
                    charset: "utf-8",
                    responseEncoding: "utf-8",
                    ...data,
                });
                this.axiosSnapshot[id] = axios.create({
                    method: "GET",
                    baseURL: url,
                    timeout: 10000,
                    "content-type": "image/jpeg",
                    responseType: "stream",
                    ...data,
                });
                this.isOnline[id]  = await this.pingDevice(element.ip, element.port, id);
                const check_folder = await this.getObjectAsync(
                    this.namespace + "." + id + ".STATUS_DEVICE",
                );
                if (this.isOnline[id] === 2 && typeof check_folder === "object") {
                    this.subscribeStates(`${id}.remote.*`);
                    this.log.info(`Device ${element.ip} start offline...`);
                    await this.setStateAsync(`${id}.remote.STATUS_FROM_DEVICE`, {
                        val: this.isOnline[id],
                        ack: false
                    });
                    break;
                }
                if (this.isOnline[id] === 0 && typeof check_folder === "object") {
                    this.subscribeStates(`${id}.remote.*`);
                    this.log.info(`Device ${element.ip} start in standby...`);
                    await this.setStateAsync(`${id}.remote.STATUS_FROM_DEVICE`, {
                        val: this.isOnline[id],
                        ack: false
                    });
                    break;
                }
                if (this.isOnline[id] === 2) {
                    this.log.info(`
                    Your device with IP ${element.ip}:${element.port} is unreachable. 
                    Please check your Instance configuration and restart your adapter.
                `);
                    break;
                }
                const powerstate = await this.getRequest(cs.API.powerstate, id);
                this.log.debug("powerstate: " + JSON.stringify(powerstate));
                if (powerstate && powerstate.instandby) {
                    this.log.info(`
                    Your device with IP ${element.ip}:${element.port} is in standby. 
                    Please wakeup your device and restart your adapter.
                `);
                    break;
                }
                if (powerstate && powerstate.instandby === false) {
                    const deviceInfo = await this.getRequest(cs.API.deviceinfo, id);
                    if (deviceInfo == null && !deviceInfo.boxtype) {
                        this.log.warn(`Connected to ${element.ip} device failed`);
                        break;
                    }
                    this.log.info(`Create DeviceInfos`);
                    await this.createDeviceInfo(id, deviceInfo.boxtype, deviceInfo);
                    this.log.info(`Create Remote Folder`);
                    await this.createRemote(id, deviceInfo);
                    const statusInfo = await this.getRequest(cs.API.getcurrent, id);
                    if (!statusInfo || statusInfo.info == null) {
                        this.log.warn(`Cannot find Status from ${element.ip} device`);
                        return;
                    }
                    this.log.info(`Create StatusInfos`);
                    await this.createStatusInfo(id, statusInfo);
                    const bouquets = await this.getRequest(cs.API.bouquets, id);
                    if (!bouquets || !bouquets["bouquets"]) {
                        this.log.warn(`Cannot find Bouquets from ${element.ip} device`);
                    } else {
                        this.log.info(`Create Bouquets and EPG`);
                        await this.createBouquetsAndEPG(id, bouquets);
                    }
                    if (element.sshuser != "" && element.sshpassword != "" && element.ssh) {
                        await this.connect_ssh(id);
                    }
                }
                this.subscribeStates(`${id}.remote.*`);
                this.log.info(`Start Interval with ${this.config.interval} seconds...`);
                this.checkDevice(id);
            }
        } catch (e) {
            this.sendLucky(e, "try onReady");
        }
    }

    async checkDevice(id) {
        try {
            if (this.isSame[id] != this.isOnline[id]) {
                this.isSame[id] = this.isOnline[id];
                this.log.debug("indexOf: " + JSON.stringify(this.isOnline).indexOf(":1"));
                this.log.debug("indexOf: " + JSON.stringify(this.isOnline));
                if (JSON.stringify(this.isOnline).indexOf(":1") > 0) {
                    this.setState("info.connection", true, true);
                } else {
                    this.setState("info.connection", false, true);
                }
                this.setState(`${id}.STATUS_DEVICE`, {
                    val: this.isOnline[id],
                    ack: true
                });
                if (this.isOnline[id] === 0) {
                    this.setState(`${id}.remote.STATUS_FROM_DEVICE`, {
                        val: this.isOnline[id],
                        ack: true
                    });
                }
            }
            if (this.isOnline[id] === 1) {
                if (!this.offlineInterval[id]) {
                    this.setNewInterval(this.config.interval, true, id);
                }
                if (this.recordInterval[id] == null) {
                    this.recordInterval[id] = setInterval(async () => {
                        this.log.debug(`Check record device ${id}`);
                        this.checkRecording(id);
                    }, 60 * 1000);
                }
            } else if (this.isOnline[id] === 0) {
                this.isOnline[id]  = await this.pingDevice(this.devicesID[id].ip, this.devicesID[id].port, id);
                const powerstate = await this.getRequest(cs.API.powerstate, id);
                if (powerstate) {
                    if (powerstate && powerstate.instandby) {
                        this.isOnline[id] = 0;
                        this.offlineInterval[id] && clearInterval(this.offlineInterval[id]);
                        this.offlineInterval[id] = null;
                        this.recordInterval[id] && clearInterval(this.recordInterval[id]);
                        this.recordInterval[id] = null;
                        this.setNewInterval(this.config.interval, false, id);
                    } else {
                        this.isOnline[id] = 1;
                        if (!this.updateInterval[id]) {
                            this.setNewInterval(60, false, id);
                        }
                    }
                } else {
                    this.isOnline[id] = 2;
                    this.offlineInterval[id] && clearInterval(this.offlineInterval[id]);
                    this.offlineInterval[id] = null;
                    this.recordInterval[id] && clearInterval(this.recordInterval[id]);
                    this.recordInterval[id] = null;
                    if (!this.updateInterval[id]) {
                        this.setNewInterval(60, false, id);
                    }
                }
            } else {
                this.offlineInterval[id] && clearInterval(this.offlineInterval[id]);
                this.offlineInterval[id] = null;
                if (!this.updateInterval[id]) {
                    this.setNewInterval(60, false, id);
                }
            }
        } catch (e) {
            this.sendLucky(e, "try checkDevice");
        }
    }

    setNewInterval(times, val, id) {
        this.updateInterval[id] && clearInterval(this.updateInterval[id]);
        this.updateInterval[id] = null;
        this.setState(`${id}.CURRENT_INTERVAL`, {
            val: times,
            ack: true
        });
        if (val) {
            this.offlineInterval[id] = setInterval(async () => {
                //this.log.debug(`Check device standby`);
                this.updateDevice(id);
            }, times * 1000);
        } else {
            this.updateInterval[id] = setInterval(async () => {
                this.log.debug(`Check device deepstandby ${id}`);
                if (this.isOnline[id] === 2) {
                    this.checkdeepstandby(id);
                } else {
                    this.updateDevice(id);
                }
            }, times * 1000);
        }
    }

    async checkdeepstandby(id) {
        try {
            this.isOnline[id]  = await this.pingDevice(this.devicesID[id].ip, this.devicesID[id].port, id);
            if (this.isOnline[id] != 2) {
                this.updateInterval[id] && clearInterval(this.updateInterval[id]);
                this.updateInterval[id] = null;
                this.offlineInterval[id] && clearInterval(this.offlineInterval[id]);
                this.offlineInterval[id] = null;
                this.checkDevice(id);
            }
        } catch (e) {
            this.sendLucky(e, "try checkdeepstandby");
        }
    }

    async pingDevice(ip, port, id) {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection(port, ip);
            socket.setTimeout(1000);
            socket.on("connect", async () => {
                this.log.debug("Connected");
                const powerstate = await this.getRequest(cs.API.powerstate, id);
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
                    this.log.debug("reject: " + reject + " device: " + id);
                }
                resolve(2);
            });
        });
    }

    async updateDevice(id) {
        try{
            if (this.load[id]) {
                this.log.debug("in Process: " + this.loadname[id]);
                return;
            }
            const powerstate = await this.getRequest(cs.API.powerstate, id);
            //this.log.debug("INFO powerstate: " + JSON.stringify(powerstate));
            if (!powerstate) {
                this.log.debug(`Device ${id} is offline`);
                this.isOnline[id] = 2;
                this.checkDevice(id);
                return;
            }
            if (powerstate && powerstate.instandby) {
                this.log.debug(`Device ${id} is in standby`);
                this.isOnline[id] = 0;
                this.checkDevice(id);
                return;
            }
            const getcurrent = await this.getRequest(cs.API.getcurrent, id);
            if (!getcurrent || getcurrent.info == null) {
                this.log.warn(`Cannot find Status from ${this.devicesID[id].ip} device`);
                return;
            }
            this.inProgress(true, "updateDevice", id);
            const picon = "http://" +
            this.devicesID[id].ip
            + ":" +
            this.devicesID[id].port
            + "/picon/" +
            getcurrent.now.sref.replace(/:/g, "_").slice(0, -1)
            + ".png";
            await this.setStateAsync(`${id}.statusInfo.next.picon`, {
                val: picon,
                ack: true
            });
            await this.setStateAsync(`${id}.statusInfo.now.picon`, {
                val: picon,
                ack: true
            });
            if (getcurrent.next && getcurrent.next.remaining) {
                await this.setStateAsync(`${id}.statusInfo.next.remaining_time`, {
                    val: (await this.convertRemaining(getcurrent.next.remaining)).toString(),
                    ack: true
                });
            }
            if (getcurrent.now && getcurrent.now.remaining) {
                await this.setStateAsync(`${id}.statusInfo.now.remaining_time`, {
                    val: (await this.convertRemaining(getcurrent.now.remaining)).toString(),
                    ack: true
                });
            }
            const tunersignal = await this.getRequest(cs.API.tunersignal, id);
            if (tunersignal && tunersignal.tunernumber != null) {
                if (tunersignal.snr_db && typeof tunersignal.snr_db === "number") {
                    getcurrent.tunerinfo = tunersignal;
                }
            }
            //this.log.debug("INFO getcurrent: " + JSON.stringify(getcurrent));
            //this.log.debug("INFO tunersignal: " + JSON.stringify(tunersignal));
            if (
                getcurrent.info &&
                getcurrent.info.pmtpid &&
                typeof getcurrent.info.pmtpid === "number"
            ) {
                await this.json2iob.parse(`${id}.statusInfo`, getcurrent, {
                    forceIndex: true,
                    preferedArrayName: null,
                    channelName: null,
                });
            }
            this.inProgress(false, "Unknown", id);
        } catch (e) {
            this.sendLucky(e, "try updateDevice");
            this.inProgress(false, "Unknown", id);
        }
    }

    async convertRemaining(sec) {
        try {
            if (sec == 0) {
                return "0";
            }
            sec = Number(sec);
            const hours = Math.floor(sec / 3600);
            const minutes = Math.floor((sec - (hours * 3600)) / 60);
            const seconds = sec - (hours * 3600) - (minutes * 60);
            if (minutes === 0 && hours === 0) {
                return ("0" + seconds).slice(-2);
            }
            if (hours === 0) {
                return ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
            }
            return ("0" + hours).slice(-2) + ":" +
            ("0" + minutes).slice(-2) + ":" +
            ("0" + seconds).slice(-2);
        } catch (e) {
            this.sendLucky(e, "try convertRemaining");
            return "0";
        }
    }

    getRequest(path, id) {
        //this.log.debug("Request: " + path);
        try {
            return this.axiosInstance[id](path)
                .then((response) => {
                    //this.log.debug(JSON.stringify(response.data));
                    this.isOnline[id] = 1;
                    return response.data;
                })
                .catch((error) => {
                    this.isOnline[id] = 2;
                    this.log.debug("getRequest: " + error);
                    error.response && this.log.debug("Request: " + JSON.stringify(error.response.data));
                    this.inProgress(false, "Unknown", id);
                    return false;
                });
        } catch (e) {
            this.sendLucky(e, "try getRequest");
            return "0";
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            for (const id of this.unloadDevices) {
                this.updateInterval[id] && clearInterval(this.updateInterval[id]);
                this.offlineInterval[id] && clearInterval(this.offlineInterval[id]);
                this.messageInterval[id] && clearInterval(this.messageInterval[id]);
                this.recordInterval[id] && clearInterval(this.recordInterval[id]);
            }
            callback();
        } catch (e) {
            this.sendLucky(e, "try onUnload");
            callback();
        }
    }

    async sendCommand(path, id, deviceid) {
        try {
            this.log.debug("path: " + path);
            const res = await this.getRequest(path, deviceid);
            this.log.debug("response sendCommand: " + JSON.stringify(res));
            if (id) this.setAckFlag(id, res);
        } catch (e) {
            this.sendLucky(e, "try sendCommand");
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    async onStateChange(id, state) {
        try {
            if (state && !state.ack) {
                let command = id.split(".").pop();
                const deviceId = id.split(".")[2];
                this.log.debug(`command: ${command} deviceID: ${deviceId}`);
                if (command === "WOL" || (command === "setPowerStates" && state.val === 6)) {
                    this.wakeonlan(state, id, deviceId);
                    return;
                }
                if (command === "STATUS_FROM_DEVICE" && state.val === 1) {
                    this.isOnline[deviceId] = Number(state.val);
                    this.changeStatus(state, id, deviceId);
                    return;
                }
                if (this.isOnline[deviceId] === 2) {
                    this.log.info(`Receiver ${this.devicesID[deviceId].ip} is Offline. Cannot send a request!`);
                    return;
                }
                if (this.isOnline[deviceId] === 0) {
                    this.log.info(`Receiver ${this.devicesID[deviceId].ip} is in standby!`);
                }
                if (cs.KEYIDS[command] != null && state.val) {
                    this.sendCommand(`${cs.PATH["COMMAND"]}${cs.KEYIDS[command]}`, id, deviceId);
                    return;
                }
                const secsplit = id.split(".")[id.split(".").length - 2];
                if (secsplit === "pictures") command = "pictures";
                switch (command) {
                    case "REMOTE_CONTROL":
                        if (cs.KEYIDS[state.val] != null && state.val) {
                            this.sendCommand(`${cs.PATH["COMMAND"]}${cs.KEYIDS[state.val]}`, id, deviceId);
                            return;
                        }
                        break;
                    case "pictures":
                        this.deletesnapshot(state, id, deviceId);
                        break;
                    case "SET_BOUQUETS":
                        this.setBouquestAndEPG(state, "bouquets.SET_CHANNEL", id, deviceId);
                        break;
                    case "SET_CHANNEL":
                        this.setZAPAndEPG(state, "zap", id, deviceId);
                        break;
                    case "SET_EPG_BOUQUETS":
                        this.setZAPAndEPG(state, "epgbouquet", id, deviceId);
                        break;
                    case "LOAD_FOLDER":
                        this.setFolder(id, deviceId);
                        break;
                    case "SET_EPG_CHANNEL":
                        this.setChannelInfoEPG(state, id, deviceId);
                        break;
                    case "SET_FOLDER":
                        this.setMovies(state, id, deviceId);
                        break;
                    case "SET_EPG_RECORDING":
                        this.setRecordingInfoEPG(state, id, deviceId);
                        break;
                    case "CREATE_RECORDING_TIME":
                        this.createRecordingEPG(state, id, deviceId);
                        break;
                    case "sendMessage":
                        this.sendMessageToDevice(state, id, deviceId);
                        break;
                    case "request":
                        this.sentRequest(state, id, deviceId);
                        break;
                    case "your_request":
                        this.sentRequest(state, id, deviceId);
                        break;
                    case "STATUS_FROM_DEVICE":
                        this.isOnline[deviceId] = Number(state.val);
                        this.changeStatus(state, id, deviceId);
                        break;
                    case "SET_VOLUME":
                        this.setVolumen(state, id, deviceId);
                        break;
                    case "setPowerStates":
                        this.setPowerStates(state, id, deviceId);
                        break;
                    case "STANDBY":
                        state.val = 5;
                        this.setPowerStates(state, id, deviceId);
                        break;
                    case "WAKEUP":
                        state.val = 4;
                        this.setPowerStates(state, id, deviceId);
                        break;
                    case "REBOOT_ENIGMA":
                        state.val = 3;
                        this.setPowerStates(state, id, deviceId);
                        break;
                    case "REBOOT":
                        state.val = 2;
                        this.setPowerStates(state, id, deviceId);
                        break;
                    case "DEEP_STANDBY":
                        state.val = 1;
                        this.setPowerStates(state, id, deviceId);
                        break;
                    case "TOGGLE_STANDBY":
                        state.val = 0;
                        this.setPowerStates(state, id, deviceId);
                        break;
                    case "RELOAD_BOUQUETS":
                        this.reloadBouquest(id, deviceId);
                        break;
                    case "DELETE_EXPIRED_TIMERS":
                    case "DELETE_SELECT_TIMERS":
                    case "LOAD_TIMERLIST":
                    case "SET_TIMER":
                        this.commandTimer(command, state, id, deviceId);
                        break;
                    case "snapshot":
                    case "snapshot_link":
                    case "snapshot_osd":
                        this.createsnapshot(command, state, deviceId);
                        break;
                    case "sendCommand":
                        this.sendSSH(state, deviceId);
                        break;
                    case "answer":
                    case "message":
                    case "timeout":
                    case "type":
                        break;
                    default:
                        this.log.debug(`received unknown command ${command} for device ${deviceId}`);
                }
            }
        } catch (e) {
            this.sendLucky(e, "try onStateChange");
        }
    }

    async deletesnapshot(state, id, deviceId) {
        try {
            if (state.val === "delete") {
                //start cleanup img/ folder and datapoints
                const admin_path = __dirname + "/../../iobroker-data/files/e2-openwebif.admin/";
                const file_data = admin_path + "_data.json";
                const files = fs.readdirSync(admin_path + "img/");
                let files_arr = [];
                if (files.toString() != "") {
                    files_arr = files.toString().split(",");
                }
                const all_dp = await this.getObjectListAsync({
                    startkey: `${this.namespace}.192_168_2_188.remote.snapshot.pictures.`,
                    endkey: `${this.namespace}.192_168_2_188.remote.snapshot.pictures.\u9999`
                });
                //this.log.debug("all_dp: " + JSON.stringify(all_dp));
                if (all_dp && all_dp.rows) {
                    for (const element of all_dp.rows) {
                        //this.log.debug("element: " + JSON.stringify(element));
                        if (
                            element &&
                            element.value &&
                            element.value.type &&
                            element.value.type === "state" &&
                            element.value.native &&
                            element.value.native.picname &&
                            element.value.native.picname!= ""
                        ) {
                            if (files_arr.includes(element.value.native.picname)) {
                                this.log.debug("Found file: " + element.value.native.picname);
                            } else {
                                this.log.debug("Cannot found file: " + element.value.native.picname);
                                await this.delObjectAsync(id);
                                this.log.info("Delete datapoint: " + id);
                            }
                        } else {
                            this.log.debug("Cannot found file name: " + element.id);
                        }
                    }
                } else {
                    this.log.info(`Cannot read: ${this.namespace}.192_168_2_188.remote.snapshot.pictures`);
                }
                let data;
                if (fs.existsSync(file_data)) {
                    data = fs.readFileSync(file_data);
                    data = JSON.parse(data.toString("utf8"));
                    this.log.debug("Data: " + JSON.stringify(data));
                }
                this.log.debug("Files: " + files);
                files.forEach(async (file) => {
                    try {
                        if (data && data["img/" + file]) {
                            this.log.info("Found file in iobroker database: " + file);
                        } else {
                            this.log.info("Cannot found file in iobroker database! An attempt is made to delete the file: " + file);
                            await this.delFileAsync("e2-openwebif.admin", "img/" + file, async (error) => {
                                if (!error) {
                                    this.log.info("File deleted: img/" + file);
                                } else {
                                    this.log.warn("File not deleted:: img/" + file);
                                }
                            });
                        }
                    } catch (e) {
                        this.sendLucky(e, "try deletesnapshot foreach");
                    }
                });
                //end cleanup img/ folder
                const obj = await this.getObjectAsync(id);
                this.log.debug("deletesnapshot obj: " + JSON.stringify(obj));
                if (obj && obj.native && obj.native.img && obj.native.img != "") {
                    if (fs.existsSync(admin_path + obj.native.img)) {
                        await this.delFileAsync("e2-openwebif.admin", obj.native.img, async (error) => {
                            if (!error) {
                                this.log.info("File deleted: " + obj.native.img);
                                try {
                                    await this.delObjectAsync(id);
                                    this.log.info("Delete datapoint: " + id);
                                } catch (e) {
                                    this.log.info("Error delete datapoint: " + e);
                                }
                            } else {
                                this.log.warn("File not deleted:: " + obj.native.img);
                            }
                        });
                    } else {
                        this.log.info("Cannot find the file: " + id);
                    }
                } else {
                    this.log.info("Cannot find the file name: " + id);
                }
            }
        } catch (e) {
            this.sendLucky(e, "try deletesnapshot");
        }
    }

    async createsnapshot(command, state, deviceId) {
        try {
            let url = `/grab?command=-o&r=1080&format=png&jpgquali=100`;
            if (command === "snapshot_link") {
                url += `/&mode=osd`;
            } else if (command === "snapshot_osd") {
                url = state.val;
            }
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
            const res = await this.axiosSnapshot[deviceId](url)
                .then((response) => {
                    if (response && response.status === 200) {
                        const writer = fs.createWriteStream("/tmp/image.jpg");
                        response.data.pipe(writer);
                        return new Promise((resolve, reject) => {
                            writer.on('finish', () => {
                                if (fs.existsSync("/tmp/image.jpg")) {
                                    const pic = fs.readFileSync('/tmp/image.jpg');
                                    const current_time = Date.now();
                                    const picname = "screenshot_" + current_time + ".jpg";
                                    const picpath = "img/" + picname;
                                    const address = `http://${this.config.your_ip}/e2-openwebif.admin${picpath}`;
                                    this.writeFile("e2-openwebif.admin", picpath, pic, async (error) => {
                                        try {
                                            if(!error) {
                                                this.log.debug(`OK`);
                                                const states = {};
                                                states["states"] = {};
                                                states["states"][address] = address;
                                                states["states"]["delete"] = "delete";
                                                const common = {
                                                    type: "string",
                                                    role: "info",
                                                    icon: picpath,
                                                    name: picpath,
                                                    desc: "Create Pictures",
                                                    read: true,
                                                    write: true,
                                                    def: address,
                                                    ...states
                                                };
                                                const native = {
                                                    img: picpath,
                                                    picname: picname,
                                                    path: "e2-openwebif.admin"
                                                };
                                                await this.createDataPoint(`${deviceId}.remote.snapshot.pictures.${current_time}`, common, "state", native);
                                                this.setState(`${deviceId}.remote.snapshot.pictures.${current_time}`, {
                                                    val: `http://${this.config.your_ip}/e2-openwebif.admin${picpath}`,
                                                    ack: true
                                                });
                                                resolve(true);
                                            } else {
                                                this.log.debug(`NOK`);
                                                reject(error);
                                            }
                                        } catch (e) {
                                            this.sendLucky(e, "try createsnapshot");
                                        }
                                    });
                                } else {
                                    reject("Cannot create /tmp/image.jpg");
                                }
                                resolve(true);
                            });
                            writer.on('error', (error) => {
                                reject(error);
                            });
                        });
                    }
                })
                .catch(function (e) {
                    throw new Error(e);
                });
            if (res) {
                this.log.info(`Create Screenshot`);
            } else {
                this.log.info(`Cannot create Screenshot`);
            }
        } catch (e) {
            this.sendLucky(e, "try createsnapshot");
        }
    }

    async commandTimer(command, state, id, deviceId) {
        try {
            await this.inProgress(true, "commandTimer", deviceId);
            if (command === "DELETE_EXPIRED_TIMERS") {
                const cleanup = await this.getRequest(cs.SET.timercleanup, deviceId);
                this.setAckFlag(id, cleanup);
                if (cleanup && cleanup.result) {
                    this.log.info(`Cleanup timerlist`);
                    await this.delObjectAsync(`${deviceId}.remote.timerlist.timer`, { recursive: true });
                    await this.createTimerFolder(deviceId);
                } else {
                    this.log.info(`Cannot cleanup timerlist`);
                }
            } else if (command === "LOAD_TIMERLIST") {
                const timer = await this.getRequest(cs.SET.timerlist, deviceId);
                this.setAckFlag(id, timer);
                if (timer && timer.timers != null && Object.keys(timer.timers).length > 0) {
                    this.log.debug(`Create Select Timerlist for ${deviceId}`);
                    const new_states = {};
                    for (const element of timer.timers) {
                        new_states[`${element.serviceref}.${element.begin}.${element.end}.${element.eit}`] = element.name;
                    }
                    this.log.debug("new_states: " + JSON.stringify(new_states));
                    await this.statesLoadTimer(deviceId, new_states);
                    this.setState(`${deviceId}.remote.timerlist.JSON_TIMERLIST`, {
                        val: JSON.stringify(timer.timers),
                        ack: true
                    });
                } else {
                    this.log.info(`Cannot Create Select Timerlist`);
                }
            } else if (command === "DELETE_SELECT_TIMERS") {
                const set_timer = await this.getStateAsync(`${deviceId}.remote.timerlist.SET_TIMER`);
                if (set_timer && set_timer.val != null) {
                    this.log.debug(`Split ${set_timer.val}`);
                    const arr = (set_timer.val).toString().split(".");
                    let del = null;
                    this.log.debug(`Count ${Object.keys(arr).length}`);
                    if (arr != null && Object.keys(arr).length == 4) {
                        del = await this.getRequest(`${cs.PATH.TIMERDELETE}${arr[0]}&begin=${arr[1]}&end=${arr[2]}`, deviceId);
                    }
                    this.log.debug("new_states: " + JSON.stringify(del));
                    this.log.debug(`${cs.PATH.TIMERDELETE}${arr[0]}&begin=${arr[1]}&end=${arr[2]}`);
                    if (del && del.result) {
                        this.log.info(`Delete ${set_timer.val}`);
                        await this.delObjectAsync(`${deviceId}.remote.timerlist.timer`, { recursive: true });
                        await this.createTimerFolder(deviceId);
                        this.commandTimer("LOAD_TIMERLIST", state, id, deviceId);
                    } else {
                        this.log.info(`Cannot delete ${set_timer.val}`);
                    }
                } else {
                    this.log.info(`Timerlist is empty`);
                }
            } else if (command === "SET_TIMER") {
                const arr = state.val.split(".");
                let timer_json = {};
                const timer = await this.getRequest(cs.SET.timerlist, deviceId);
                this.setAckFlag(id, timer);
                if (timer && timer.timers != null && Object.keys(timer.timers).length > 0) {
                    for (const element of timer.timers) {
                        if (element.eit == arr[3]) {
                            timer_json = element;
                        }
                    }
                    if (timer_json && timer_json.eit) {
                        await this.json2iob.parse(`${deviceId}.remote.timerlist.timer`, timer_json, {
                            forceIndex: true,
                            preferedArrayName: null,
                            channelName: null,
                        });
                    }
                    this.log.debug("timer_json: " + JSON.stringify(timer_json));
                } else {
                    this.log.info(`Cannot read Timerlist für ${deviceId}`);
                }
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try commandTimer");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async reloadBouquest(id, deviceId) {
        try {
            await this.inProgress(true, "reloadBouquest", deviceId);
            const bouquets = await this.getRequest(cs.API.bouquets, deviceId);
            this.setAckFlag(id, bouquets);
            if (!bouquets || !bouquets["bouquets"]) {
                this.log.warn(`Cannot find Bouquets from ${this.config.ip} device`);
            } else {
                this.log.info(`Create Bouquets and EPG`);
                await this.loadBouquets(deviceId, bouquets);
                this.setState(`${deviceId}.remote.bouquets.JSON_BOUQUETS`, {
                    val: JSON.stringify(bouquets["bouquets"]),
                    ack: true
                });
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try reloadBouquest");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async setVolumen(state, id, deviceId) {
        try {
            if (state) {
                if (state.val == 0 || (state.val > 0 && state.val < 101))  {
                    const vol = await this.getRequest(`${cs.PATH.SETVOLUME}${state.val}`, deviceId);
                    this.setAckFlag(id, vol);
                    this.log.debug("vol: " + JSON.stringify(vol));
                } else {
                    this.log.info(`Cannot set Volumen: ${state.val} for ${deviceId}`);
                }
            } else {
                this.log.info(`Cannot set Volumen`);
            }
        } catch (e) {
            this.sendLucky(e, "try setVolumen");
        }
    }

    async setPowerStates(state, id, deviceId) {
        try {
            if (state) {
                if (state.val == 0 || (state.val > 0 && state.val < 6))  {
                    const power = await this.getRequest(`${cs.PATH.POWER}${state.val}`, deviceId);
                    this.setAckFlag(id, power);
                    this.log.debug("power: " + JSON.stringify(power));
                } else if (state.val === 6) {
                    state.val = true;
                    this.wakeonlan(state, id, deviceId);
                } else {
                    this.log.info(`Cannot set Powerstate: ${state.val}`);
                }
            } else {
                this.log.info(`Cannot set Powerstate`);
            }
        } catch (e) {
            this.sendLucky(e, "try setPowerStates");
        }
    }

    async createRecordingEPG(state, id, deviceId) {
        try {
            await this.inProgress(true, "createRecordingEPG", deviceId);
            if (state && state.val) {
                const eventid = await this.getStateAsync(`${deviceId}.remote.epg.channel.id`);
                const sRef = await this.getStateAsync(`${deviceId}.remote.epg.channel.sref`);
                if (!eventid || eventid.val == null) {
                    this.log.info("Missing eventid");
                    this.inProgress(false, "Unknown", deviceId);
                    return;
                }
                if (!sRef || sRef.val == null) {
                    this.log.info("Missing sRef");
                    this.inProgress(false, "Unknown", deviceId);
                    return;
                }
                const setRec = await this.getRequest(`${cs.SET.timeraddbyeventid}?sRef=${sRef.val}&eventid=${eventid.val}`, deviceId);
                this.setAckFlag(id, setRec);
                this.log.debug("setRec: " + JSON.stringify(setRec));
                this.setState(`${deviceId}.remote.epg.RECORDING_RESPONSE`, {
                    val: JSON.stringify(setRec),
                    ack: true
                });
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try createRecordingEPG");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async setRecordingInfoEPG(state, id, deviceId) {
        try {
            await this.inProgress(true, "setRecordingEPG", deviceId);
            if (state && state.val != "") {
                this.log.debug("state.val: " + JSON.stringify(state.val));
                const rec = await this.getObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_RECORDING`);
                this.setAckFlag(id, rec);
                if (rec && rec.native && rec.native.epg && rec.native.epg[state.val]) {
                    this.log.debug("rec.native.epg: " + JSON.stringify(rec.native.epg));
                    this.json2iob.parse(`${deviceId}.remote.epg.channel`, rec.native.epg[state.val], {
                        forceIndex: true,
                        preferedArrayName: null,
                        channelName: null,
                    });
                }
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try setRecordingInfoEPG");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async setChannelInfoEPG(state, id, deviceId) {
        try {
            await this.inProgress(true, "setChannelInfoEPG", deviceId);
            if (state && state.val != "") {
                const epgservice = await this.getRequest(`${cs.SET.epgservice}${state.val}`, deviceId);
                this.setAckFlag(id, epgservice);
                if (epgservice && epgservice.events) {
                    const new_states = {};
                    let val_arr = 0;
                    const channel = await this.getObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_RECORDING`);
                    if (!channel) {
                        return;
                    }
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
                        channel.common.states = new_states;
                        channel.native.epg = epgservice.events;
                        await this.setForeignObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_RECORDING`, channel);
                    }
                }
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try setChannelInfoEPG");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async setMovies(state, id, deviceId) {
        try {
            await this.inProgress(true, "setMovies", deviceId);
            this.log.debug(`setMovies: ${state.val}`);
            if (state && state.val != null) {
                const movielist = await this.getRequest(`${cs.SET.movielist}${state.val}`, deviceId);
                this.setAckFlag(id, movielist);
                if (movielist && movielist.movies) {
                    this.setState(`${deviceId}.remote.movielist.MOVIELIST`, {
                        val: JSON.stringify(movielist.movies),
                        ack: true
                    });
                }
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try setMovies");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async changeStatus(state, id, deviceId) {
        try {
            if (state && state.val === 2) {
                this.log.debug(`Set Status deepstandby. Change interval to 60 min.`);
                this.updateInterval[deviceId] && clearInterval(this.updateInterval[deviceId]);
                this.offlineInterval[deviceId] && clearInterval(this.offlineInterval[deviceId]);
                this.updateInterval[deviceId] = null;
                this.offlineInterval[deviceId] = null;
                this.isOnline[deviceId] = 2;
                this.setNewInterval(3600, false, deviceId);
            } else if (state && state.val === 1) {
                this.log.debug(`Set Status online. Change interval to ${this.config.interval} sec.`);
                this.updateInterval[deviceId] && clearInterval(this.updateInterval[deviceId]);
                this.offlineInterval[deviceId] && clearInterval(this.offlineInterval[deviceId]);
                this.updateInterval[deviceId] = null;
                this.offlineInterval[deviceId] = null;
                this.isOnline[deviceId] = 2;
                this.setNewInterval(this.config.interval, true, deviceId);
            }
            const res = {result: true};
            this.setAckFlag(id, res);
        } catch (e) {
            this.sendLucky(e, "try changeStatus");
        }
    }

    async wakeonlan(state, id, deviceId) {
        try {
            if (this.isOnline[deviceId] !== 2) {
                this.log.info(`Receiver ${this.devicesID[deviceId].ip} is in standby or Online!`);
                return;
            }
            if (state && state.val && this.devicesID[deviceId].mac != null) {
                wol.wake(this.devicesID[deviceId].mac.toLowerCase(), (err, res) => {
                    if (err) {
                        this.log.info(`WOL ERROR: ${err}`);
                    } else {
                        this.log.info(`Send WOL: ${res}`);
                        const isSend = {result: true};
                        this.setAckFlag(id, isSend);
                    }
                });
            }
        } catch (e) {
            this.sendLucky(e, "try wakeonlan");
        }
    }

    async sentRequest(state, id, deviceId) {
        try {
            if (this.isOnline[deviceId] === 0) {
                this.log.info(`Receiver ${this.devicesID[deviceId].ip} is in standby!`);
                return;
            }
            await this.inProgress(true, "sendRequest", deviceId);
            if (state && state.val) {
                const resp = await this.getRequest(state.val, deviceId);
                this.setAckFlag(id, resp);
                this.log.debug(JSON.stringify(resp));
                this.setState(`${deviceId}.remote.control.response`, {
                    val: JSON.stringify(resp),
                    ack: true
                });
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try sentRequest");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async sendMessageToDevice(state, id, deviceId) {
        try {
            if (!state.val) {
                return;
            }
            await this.inProgress(true, "sendMessageToDevice", deviceId);
            const send_message = await this.getStateAsync(`${deviceId}.remote.message.message`);
            const send_timeout = await this.getStateAsync(`${deviceId}.remote.message.timeout`);
            const send_type = await this.getStateAsync(`${deviceId}.remote.message.type`);
            if (!send_message || send_message.val == "") {
                this.inProgress(false, "Unknown", deviceId);
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
            const return_message = await this.getRequest(`${cs.SET.message}${encodeurl(path)}`, deviceId);
            this.setAckFlag(id, return_message);
            this.log.info("return_message: " + JSON.stringify(return_message));
            if (return_message && return_message.result && send_type.val == 0) {
                const res = await this.getRequest(`${cs.PATH.COMMAND}108`, deviceId);
                this.log.debug("command 108: " + JSON.stringify(res));
                this.messageInterval[deviceId] = setInterval(async () => {
                    this.answerMessage(deviceId);
                }, (Number(send_timeout.val) + 1) * 1000);
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try sendMessageToDevice");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async answerMessage(deviceId) {
        try {
            this.messageInterval[deviceId] && clearInterval(this.messageInterval[deviceId]);
            const answer_message = await this.getRequest(`${cs.PATH.MESSAGEANSWER}`, deviceId);
            this.log.debug("answer_message: " + JSON.stringify(answer_message));
            if (answer_message && answer_message.result != null) {
                if (!answer_message.result) {
                    this.sendCommand(`${cs.PATH["COMMAND"]}${cs.KEYIDS["KEY_EXIT"]}`, deviceId);
                }
                this.setState(`${deviceId}.remote.message.answer`, {
                    val: answer_message.message ? answer_message.message : "No Answer",
                    ack: true
                });
            }
        } catch (e) {
            this.sendLucky(e, "try answerMessage");
        }
    }

    async setFolder(id, deviceId) {
        try {
            await this.inProgress(true, "setFolder", deviceId);
            const getlocations = await this.getRequest(`${cs.API.getlocations}`, deviceId);
            this.setAckFlag(id, getlocations);
            if (
                getlocations &&
                getlocations.locations &&
                Array.isArray(getlocations.locations)
            ) {
                for (const element of getlocations.locations) {
                    if (!this.folderstates[element]) {
                        await this.createFolderJson(element, deviceId);
                        this.log.debug("PFAD: " + element);
                    }
                }
                this.log.debug("this.folderstate: " + JSON.stringify(this.folderstates));
                if (this.folderstates) {
                    await this.statesSetFolder(deviceId, this.folderstates);
                }
            }
            this.inProgress(false, "Unknown", deviceId);
        } catch (e) {
            this.sendLucky(e, "try setFolder");
            this.inProgress(false, "Unknown", deviceId);
        }
    }

    async setZAPAndEPG(state, val, id, deviceId) {
        try {
            this.log.debug("state.val: " + state.val);
            const ZAPandEPG = await this.getRequest(`${cs.SET[val]}${encodeurl(state.val)}`, deviceId);
            this.setAckFlag(id, ZAPandEPG);
            this.log.debug("ZAPandEPG: " + JSON.stringify(ZAPandEPG));
            if (val === "epgbouquet" && ZAPandEPG && ZAPandEPG.events) {
                this.setState(`${deviceId}.remote.epg.EPG_JSON`, {
                    val: JSON.stringify(ZAPandEPG),
                    ack: true
                });
                const new_states = {};
                const channel = await this.getObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_CHANNEL`);
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
                await this.setForeignObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_CHANNEL`, channel);
            }
        } catch (e) {
            this.sendLucky(e, "try setZAPAndEPG");
        }
    }

    async setBouquestAndEPG(state, dp, id, deviceId) {
        try {
            if (state && state.val) {
                const getservices = await this.getRequest(`${cs.SET.getservices}${encodeurl(state.val)}`, deviceId);
                this.setAckFlag(id, getservices);
                if (getservices && getservices.services) {
                    this.log.debug("getservices: " + JSON.stringify(getservices));
                    const new_states = {};
                    const channel = await this.getObjectAsync(`${this.namespace}.${deviceId}.remote.${dp}`);
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
                    await this.setForeignObjectAsync(`${this.namespace}.${deviceId}.remote.${dp}`, channel);
                    this.setState(`${deviceId}.remote.bouquets.JSON_CHANNEL`, {
                        val: JSON.stringify(getservices.services),
                        ack: true
                    });
                }
            } else {
                this.log.info(`Cannot set ${state.val}`);
            }
        } catch (e) {
            this.sendLucky(e, "try setBouquestAndEPG");
        }
    }

    async connect_ssh(deviceId) {
        try {
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
            let port = 8087;
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
            const get_url = `http://${this.config.your_ip}:${port}/set/${this.namespace}.${deviceId}.remote.STATUS_FROM_DEVICE?value=`;
            const sshconfig2 = {
                host: this.devicesID[deviceId].ip,
                username: this.devicesID[deviceId].sshuser,
                password: this.devicesID[deviceId].sshpassword
            };
            const boxfile = this.adapterDir + "/lib/iobroker.sh";
            let data;
            if (fs.existsSync(boxfile)) {
                try {
                    data = fs.readFileSync(boxfile);
                    this.log.debug(`Data: ${data}`);
                } catch (e) {
                    this.log.info(`Cannot read file "${boxfile}": ${e}`);
                    this.sendLucky(e, "try connect_ssh existsSync");
                    return;
                }
            } else {
                this.log.info(`Cannot read file ${boxfile}`);
                return;
            }
            const ssh2 = new SSH2Promise(sshconfig2);
            //const ssh_dp = await this.getStateAsync(`${deviceId}.SSH_CREATED`);
            //const ssh_connection = ssh_dp && ssh_dp.val ? ssh_dp.val : false;
            await ssh2.connect().then(async () => {
                try {
                    this.log.info("Connection established");
                    let resp = "";
                    resp = await this.commandToSSH2(ssh2, "/home/" + deviceId + ".sh");
                    resp = resp.replace(/(\r\n|\r|\n)/g, "");
                    data = data.toString().replace(/<device>/g, deviceId);
                    //this.log.debug(`Replace ${data}`);
                    this.log.debug(`Response ${resp}`);
                    if (resp === "iobroker" && this.devicesID[deviceId].ssh) {
                        this.log.info(`Set true`);
                        this.setState(`${deviceId}.SSH_CREATED`, {
                            val: true,
                            ack: true
                        });
                    } else if (resp != "iobroker" && this.devicesID[deviceId].ssh) {
                        if (resp != "iobroker missing") {
                            resp = await this.commandToSSH2(ssh2, `echo '${data}' > /home/${deviceId}.sh`);
                            resp = await this.commandToSSH2(ssh2, "chmod 775 /home/" + deviceId + ".sh");
                            resp = resp.replace(/(\r\n|\r|\n)/g, "");
                            if (resp === "OK") {
                                this.log.info("Set chmod 775 for /home/" + deviceId + ".sh");
                            } else {
                                this.log.info("Error set chmod 775: " + resp);
                                ssh2.close();
                                return;
                            }
                        }
                        resp = await this.commandToSSH2(ssh2, "/home/" + deviceId + ".sh 1 " + get_url);
                        resp = resp.replace(/(\r\n|\r|\n)/g, "");
                        if (resp === "OK") {
                            this.log.info("Create files and symlinks");
                            this.setState(`${deviceId}.SSH_CREATED`, {
                                val: true,
                                ack: true
                            });
                        } else {
                            this.log.info("Error create files and symlinks: " + resp);
                            ssh2.close();
                            return;
                        }
                    } else if (resp == "iobroker" && !this.devicesID[deviceId].ssh) {
                        resp = await this.commandToSSH2(ssh2, "/home/" + deviceId + ".sh 2");
                        resp = resp.replace(/(\r\n|\r|\n)/g, "");
                        if (resp === "OK") {
                            this.log.info("Delete files and symlinks");
                        } else {
                            this.log.info("Error delete files and symlinks: " + resp);
                            ssh2.close();
                            return;
                        }
                        resp = await this.commandToSSH2(ssh2, "rm /home/" + deviceId + ".sh 2");
                        resp = resp.replace(/(\r\n|\r|\n)/g, "");
                        if (resp === "OK") {
                            this.log.info("Delete /home/" + deviceId + ".sh");
                            this.setState(`${deviceId}.SSH_CREATED`, {
                                val: false,
                                ack: true
                            });
                        } else {
                            this.log.info("Error delete /home/" + deviceId + ".sh: " + resp);
                            ssh2.close();
                            return;
                        }
                    } else {
                        this.log.info(`Set false`);
                        this.setState(`${deviceId}.SSH_CREATED`, {
                            val: false,
                            ack: true
                        });
                    }
                } catch (e) {
                    this.sendLucky(e, "try connect_ssh connect");
                }
            });
            ssh2.close();
        } catch (e) {
            this.sendLucky(e, "try connect_ssh");
        }
    }

    async sendSSH(state, deviceId) {
        try {
            if (state && state.val && state.val != "" && this.devicesID[deviceId].ssh) {
                const sshconfig2 = {
                    host: this.devicesID[deviceId].ip,
                    username: this.devicesID[deviceId].sshuser,
                    password: this.devicesID[deviceId].sshpassword
                };
                const ssh2 = new SSH2Promise(sshconfig2);
                await ssh2.connect().then(async () => {
                    try {
                        this.log.info("Connection established");
                        let resp = "";
                        resp = await this.commandToSSH2(ssh2, state.val);
                        resp = resp.replace(/(\r\n|\r|\n)/g, "");
                        this.setState(`${deviceId}.remote.ssh.responseCommand`, {
                            val: resp,
                            ack: true
                        });
                    } catch (e) {
                        this.sendLucky(e, "try sendSSH connect");
                    }
                });
                ssh2.close();
            }
        } catch (e) {
            this.sendLucky(e, "try sendSSH");
        }
    }

    async commandToSSH2(ssh2, command) {
        this.log.debug(command);
        try {
            const res = await ssh2.exec(command);
            if (res == "") {
                return "OK";
            } else {
                return res;
            }
        } catch (e) {
            //this.sendLucky(e, "try commandToSSH2");
            return e;
        }
    }

    async inProgress(work, workname, id) {
        this.load[id] = work;
        this.loadname[id] = workname;
    }

    async checkRecording(box) {
        try {
            const timer = await this.getRequest(cs.SET.timerlist, box);
            let count_rec = 0;
            let count_rec_err = 0;
            let count_rec_open = 0;
            let count_rec_done = 0;
            if (timer && timer.timers != null && Object.keys(timer.timers).length > 0) {
                for (const element of timer.timers) {
                    if (element && element.state != null) {
                        if (element.state == 0) ++count_rec_open;
                        else if (element.state == 1) ++count_rec_err;
                        else if (element.state == 2) ++count_rec;
                        else if (element.state == 3) ++count_rec_done;
                    }
                }
                const next_timer = timer.timers[0];
                if (next_timer && next_timer.state != null && next_timer.state == 0) {
                    this.setState(`${box}.statusInfo.info.recording_next_start`, {
                        val: next_timer.realbegin ? next_timer.realbegin : "-",
                        ack: true
                    });
                    this.setState(`${box}.statusInfo.info.recording_next_end`, {
                        val: next_timer.realend ? next_timer.realend : "-",
                        ack: true
                    });
                    this.setState(`${box}.statusInfo.info.recording_next_channel`, {
                        val: next_timer.servicename ? next_timer.servicename : "-",
                        ack: true
                    });
                    const actual_date = new Date(next_timer.begin * 1000);
                    const timeISO = new Date(actual_date.getTime() - (actual_date.getTimezoneOffset() * 60000))
                        .toISOString()
                        .replace("T", " ")
                        .replace(/\..+/, "");
                    this.log.info(`Starttime ${timeISO}`);
                }
                this.setState(`${box}.statusInfo.info.recordings_activ`, {
                    val: count_rec,
                    ack: true
                });
                this.setState(`${box}.statusInfo.info.recordings_open`, {
                    val: count_rec_open,
                    ack: true
                });
                this.setState(`${box}.statusInfo.info.recordings_done`, {
                    val: count_rec_done,
                    ack: true
                });
                this.setState(`${box}.statusInfo.info.recordings_error`, {
                    val: count_rec_err,
                    ack: true
                });
            } else {
                this.log.info(`Cannot read Timerlist`);
            }
        } catch (e) {
            this.sendLucky(e, "try checkRecording");
        }
    }

    async sendLucky(error, func) {
        try {
            this.log.error(`${func}: ${error}`);
            //system.host.iobroker.versions.nodeNewest
            //system.host.iobroker.versions.npmCurrent
            if (this.config.lucky) {
                const defaultHeaders = {
                    "x-Adapter": "Openwebif",
                    "x-Adapter-Version": this.version,
                    "x-Node": "16.16",
                    "x-NPM": "8.7.2",
                    "x-Language": this.lang,
                    "x-Errorinfo": this.config.errorinfo,
                    "x-ErrorReport": "TryError",
                    "x-Function": func,
                };
                const response = await axios({
                    method: "get",
                    url: "https://luckyskills.de/ioBroker/openwebif/",
                    headers: defaultHeaders,
                    params: {
                        Report: "ErrorReport"
                    },
                    data: {
                        error: JSON.stringify(error)
                    }
                });
                this.log.debug(`response sendLucky: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            this.log.error(`sendLucky: ${error}`);
        }
    }

    async setAckFlag(id, res) {
        try {
            if (id && res && res.result) {
                this.setState(`${id}`, {
                    ack: true
                });
            }
        } catch (e) {
            this.sendLucky(e, "try setAckFlag");
        }
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