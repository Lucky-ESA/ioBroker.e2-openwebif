/* eslint-disable quotes */
"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
const axios       = require("axios").default;
const wol         = require("wol");
const net         = require("net");
const SSH2Promise = require("ssh2-promise");
const Json2iob    = require("./lib/json2iob");
const helper      = require("./lib/helper");
const cs          = require("./lib/constants");
const fs          = require("fs");
const https       = require("https");

const httpsAgent  = new https.Agent({
    rejectUnauthorized: false
//    cert: fs.readFileSync("./lib/boxcert.cer"),
//    key: fs.readFileSync("./lib/client.key"),
//    ca: fs.readFileSync("./lib/boxcert.cer"),
});
const standbyInterval = 60;
const deepInterval = 3600;
const recordInterval = 60;
let sleepTimer = null;

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
        this.recordInterval = {};
        this.messageInterval = {};
        this.qualityInterval = null;
        this.devicesID = {};
        this.isOnline = {};
        this.currentInterval = {};
        this.folderstates = {};
        this.webif = {};
        this.unloadDevices = [];
        this.counter = 1;
        this.load = {};
        this.loadname = {};
        this.checkPicon = {};
        this.lang = "de";
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        try {
            let isdecode = false;
            // @ts-ignore
            const adapterconfigs = this.adapterConfig;
            if (
                adapterconfigs &&
                adapterconfigs.native &&
                adapterconfigs.native.devices
            ) {
                for (const pw of adapterconfigs.native.devices) {
                    if (pw.password != "" && pw.password.match(/<LUCKY-ESA>/ig) === null) {
                        pw.password = `<LUCKY-ESA>${this.encrypt(pw.password)}`;
                        isdecode = true;
                    } else if (pw.sshpassword != "" && pw.sshpassword.match(/<LUCKY-ESA>/ig) === null) {
                        pw.sshpassword = `<LUCKY-ESA>${this.encrypt(pw.sshpassword)}`;
                        isdecode = true;
                    }
                }
            }
            if (isdecode) {
                this.log.info("Encrypt all passwords done.");
                this.updateConfig(adapterconfigs);
            }
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
                this.log.debug(`Language: ${this.lang}`);
                const id = element.ip.replace(/[.\s]+/g, "_");
                element.password = this.decrypt(element.password.split("<LUCKY-ESA>")[1]);
                element.sshpassword = this.decrypt(element.sshpassword.split("<LUCKY-ESA>")[1]);
                this.currentInterval[id] = 0;
                this.updateInterval[id] = null;
                this.recordInterval[id] = null;
                this.messageInterval[id] = null;
                this.webif[id] = false;
                this.checkPicon[id] = {};
                this.unloadDevices.push(id);
                this.devicesID[id] = element;
                this.load[id] = false;
                this.loadname[id] = "Unknown";
                this.log.info(`DEVICE ID: ${id}`);
                this.setState("info.connection", false, true);
                if (element.ip == "") {
                    this.log.warn("Please enter an IP.");
                    continue;
                }
                if (element.port === 0) {
                    this.log.warn("Please enter an Port. Set port default 80");
                    element.port = 80;
                }
                const data = {};
                if (element.user != "" && element.password != "") {
                    this.log.info(`Use password and username for device ${id}.`);
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
                this.axiosInstance[id] = axios.create({
                    method: "GET",
                    baseURL: url,
                    timeout: 10000,
                    responseType: "json",
                    responseEncoding: "utf-8",
                    ...data,
                });
                this.axiosSnapshot[id] = axios.create({
                    method: "GET",
                    baseURL: url,
                    timeout: 10000,
                    responseType: "stream",
                    ...data,
                });
                this.isOnline[id]  = await this.pingDevice(element.ip, element.port, id);
                const check_folder = await this.getObjectAsync(
                    `${this.namespace}.${id}.STATUS_DEVICE`,
                );
                if (this.isOnline[id] === 2 && typeof check_folder === "object") {
                    this.setWebIf(id);
                    this.subscribeStates(`${id}.remote.*`);
                    this.log.info(`Device ${element.ip} start offline...`);
                    await this.setStateAsync(`${id}.remote.STATUS_FROM_DEVICE`, {
                        val: this.isOnline[id],
                        ack: true
                    });
                    this.setNewInterval(deepInterval, id);
                    continue;
                }
                if (this.isOnline[id] === 0 && typeof check_folder === "object") {
                    this.setWebIf(id);
                    this.subscribeStates(`${id}.remote.*`);
                    this.log.info(`Device ${element.ip} start in standby...`);
                    await this.setStateAsync(`${id}.remote.STATUS_FROM_DEVICE`, {
                        val: this.isOnline[id],
                        ack: false
                    });
                    this.setNewInterval(standbyInterval, id);
                    continue;
                }
                if (this.isOnline[id] === 2) {
                    this.log.info(
                        "Your device with IP "
                        + element.ip + ":"
                        + element.port
                        + " is unreachable. Please check your Instance configuration and restart your adapter.");
                    continue;
                }
                if (this.isOnline[id] === 1) {
                    const deviceInfo = await this.getRequest(cs.API.deviceinfo, id);
                    if (deviceInfo == null && !deviceInfo.boxtype) {
                        this.setWebIf(id);
                        this.log.warn(`Connected to ${element.ip} device failed`);
                        this.subscribeStates(`${id}.remote.*`);
                        continue;
                    }
                    this.log.info(`Create DeviceInfos for device ${id}.`);
                    await this.createDeviceInfo(id, deviceInfo.boxtype, deviceInfo);
                    this.log.info(`Create Remote Folder for device ${id}.`);
                    await this.createRemote(id, deviceInfo);
                    const statusInfo = await this.getRequest(cs.API.getcurrent, id);
                    if (!statusInfo || statusInfo.info == null) {
                        this.setWebIf(id);
                        this.log.warn(`Cannot find Status from ${element.ip} device`);
                        this.subscribeStates(`${id}.remote.*`);
                        continue;
                    }
                    this.log.info(`Create StatusInfos for device ${id}.`);
                    await this.createStatusInfo(id, statusInfo);
                    const bouquets = await this.getRequest(cs.API.bouquets, id);
                    if (!bouquets || !bouquets["bouquets"]) {
                        this.log.warn(`Cannot find Bouquets from ${element.ip} device`);
                    } else {
                        this.log.info(`Create Bouquets and EPG for device ${id}.`);
                        await this.createBouquetsAndEPG(id, bouquets);
                    }
                    if (element.sshuser != "" && element.sshpassword != "") {
                        await this.connect_ssh(id);
                    }
                }
                this.setWebIf(id);
                this.subscribeStates(`${id}.remote.*`);
                this.log.info(`Start Interval with ${this.config.interval} seconds for device ${id}...`);
                this.checkDevice(id);
            }
            this.cleanupQuality();
            this.qualityInterval = this.setInterval(() => {
                this.cleanupQuality();
            }, 60 * 60 * 24 * 1000);
        } catch (e) {
            this.sendLucky(e, "try onReady");
        }
    }

    async setWebIf(id) {
        const readwebif = await this.getStateAsync(`${id}.deviceInfo.webifver`);
        if (
            readwebif &&
            readwebif.val != null &&
            (readwebif.val).toString().match(/wif/ig) != null
        ) {
            this.webif[id] = true;
        }
    }

    async checkDevice(id) {
        try {
            const connection = await this.getStateAsync("info.connection");
            if (
                JSON.stringify(this.isOnline).match(/:1/ig) != null &&
                connection &&
                connection.val === false
            ) {
                this.setState("info.connection", true, true);
            } else if (
                JSON.stringify(this.isOnline).match(/:1/ig) == null &&
                connection &&
                connection.val === true
            ) {
                this.setState("info.connection", false, true);
            }
            const STATUS_DEVICE = await this.getStateAsync(`${id}.STATUS_DEVICE`);
            if (STATUS_DEVICE != this.isOnline[id]) {
                this.setState(`${id}.STATUS_DEVICE`, {
                    val: this.isOnline[id],
                    ack: true
                });
            }
            const STATUS_FROM_DEVICE = await this.getStateAsync(`${id}.remote.STATUS_FROM_DEVICE`);
            if (STATUS_FROM_DEVICE != this.isOnline[id]) {
                this.setState(`${id}.remote.STATUS_FROM_DEVICE`, {
                    val: this.isOnline[id],
                    ack: true
                });
            }
            if (this.isOnline[id] === 1) {
                if (this.currentInterval[id] != this.config.interval) {
                    this.setNewInterval(this.config.interval, id);
                }
                if (this.recordInterval[id] == null) {
                    this.recordInterval[id] = this.setInterval(async () => {
                        this.log.debug(`Start check record device ${id}`);
                        this.checkRecording(id);
                    }, recordInterval * 1000);
                }
            } else if (this.isOnline[id] === 0) {
                if (this.currentInterval[id] != standbyInterval) {
                    this.setNewInterval(standbyInterval, id);
                }
            } else {
                if (this.currentInterval[id] != deepInterval) {
                    this.setNewInterval(deepInterval, id);
                }
            }
        } catch (e) {
            this.sendLucky(e, "try checkDevice");
        }
    }

    async setNewInterval(times, id) {
        if (this.currentInterval[id] != times) {
            this.currentInterval[id] = times;
            await this.deleteInterval(id, false, true);
            this.setState(`${id}.CURRENT_INTERVAL`, {
                val: times,
                ack: true
            });
            this.updateInterval[id] = this.setInterval(async () => {
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
                    this.log.debug(`reject: ${reject} device: ${id}`);
                }
                resolve(2);
            });
        });
    }

    async updateDevice(id) {
        try{
            if (this.load[id]) {
                this.log.debug(`in Process: ${this.loadname[id]}`);
                return;
            }
            const powerstate = await this.getRequest(cs.API.powerstate, id);
            this.log.debug(`INFO powerstate: ${JSON.stringify(powerstate)}`);
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
            if (!powerstate.instandby && this.isOnline[id] != 1) {
                this.log.debug(`Device ${id} is online.`);
                this.isOnline[id] = 1;
                if (this.currentInterval[id] != this.config.interval) {
                    this.log.debug(`Device ${id} is online. Set default interval`);
                    this.setNewInterval(this.config.interval, id);
                }
            }
            const getcurrent = await this.getRequest(cs.API.getcurrent, id);
            if (!getcurrent || getcurrent.info == null) {
                this.log.warn(`Cannot find Infos from ${this.devicesID[id].ip} device`);
                return;
            }
            this.inProgress(true, "updateDevice", id);
            const iconcheck = getcurrent.now.sref.replace(/:/g, "_").slice(0, -1);
            if (this.checkPicon[id] != iconcheck) {
                this.checkPicon[id] = iconcheck;
                const picon = `http://${this.devicesID[id].ip}:${this.devicesID[id].port}/picon/${iconcheck}.png`;
                this.setState(`${id}.statusInfo.next.picon`, {
                    val: picon,
                    ack: true
                });
                this.setState(`${id}.statusInfo.now.picon`, {
                    val: picon,
                    ack: true
                });
            }
            if (getcurrent.next && getcurrent.next.remaining) {
                this.setState(`${id}.statusInfo.next.remaining_time`, {
                    val: (await this.convertRemaining(getcurrent.next.remaining)).toString(),
                    ack: true
                });
            }
            if (getcurrent.now && getcurrent.now.remaining) {
                this.setState(`${id}.statusInfo.now.remaining_time`, {
                    val: (await this.convertRemaining(getcurrent.now.remaining)).toString(),
                    ack: true
                });
            }
            if (getcurrent.now && getcurrent.now.begin_timestamp && getcurrent.now.duration_sec) {
                this.setState(`${id}.statusInfo.now.end_timestamp`, {
                    val: getcurrent.now.begin_timestamp + getcurrent.now.duration_sec,
                    ack: true
                });
                this.setState(`${id}.statusInfo.now.event_percent`, {
                    val: Math.round((getcurrent.now.duration_sec - getcurrent.now.remaining) * 100 / getcurrent.now.duration_sec),
                    ack: true
                });
            }
            if (getcurrent.next && getcurrent.next.begin_timestamp && getcurrent.next.duration_sec) {
                this.setState(`${id}.statusInfo.next.end_timestamp`, {
                    val: getcurrent.next.begin_timestamp + getcurrent.next.duration_sec,
                    ack: true
                });
            }
            const tunersignal = await this.getRequest(cs.API.tunersignal, id);
            if (tunersignal) {
                getcurrent.tunerinfo = tunersignal;
            }
            this.log.debug(`getcurrent + tunerinfo: ${JSON.stringify(getcurrent)}`);
            await this.json2iob.parse(`${id}.statusInfo`, getcurrent, {
                forceIndex: true,
                preferedArrayName: null,
                channelName: null,
                autoCast: true,
                checkvalue: false,
                checkType: true,
            });
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
                return `${("0" + minutes).slice(-2)}:"${("0" + seconds).slice(-2)}`;
            }
            return `${("0" + hours).slice(-2)}:${("0" + minutes).slice(-2)}:${("0" + seconds).slice(-2)}`;
        } catch (e) {
            this.sendLucky(e, "try convertRemaining");
            return "0";
        }
    }

    getRequest(path, id) {
        this.log.debug(`Request: ${path}`);
        try {
            return this.axiosInstance[id](encodeURI(path))
                .then((response) => {
                    this.log.debug(`Response: ${JSON.stringify(response.data)}`);
                    this.isOnline[id] = 1;
                    return response.data;
                })
                .catch((error) => {
                    this.isOnline[id] = 2;
                    this.log.debug(`getRequest: ${error}`);
                    error.response && this.log.debug(`Request: ${JSON.stringify(error.response.data)}`);
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
                this.updateInterval[id] && this.clearInterval(this.updateInterval[id]);
                this.messageInterval[id] && this.clearInterval(this.messageInterval[id]);
                this.recordInterval[id] && this.clearInterval(this.recordInterval[id]);
            }
            this.qualityInterval && this.clearInterval(this.qualityInterval);
            sleepTimer && this.clearTimeout(sleepTimer);
            callback();
        } catch (e) {
            this.sendLucky(e, "try onUnload");
            callback();
        }
    }

    async sendCommand(path, id, deviceid) {
        try {
            this.log.debug(`path: ${path}`);
            const res = await this.getRequest(path, deviceid);
            this.log.debug(`response sendCommand: ${JSON.stringify(res)}`);
            if (id) this.setAckFlag(id, res, {val: false});
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
                if (command === "WOL" || (command === "powerstate" && state.val === 6)) {
                    this.wakeonlan(state, id, deviceId);
                    return;
                }
                if (command === "STATUS_FROM_DEVICE" && state.val === 1) {
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
                        this.changeStatus(state, id, deviceId);
                        break;
                    case "SET_VOLUME":
                        this.setVolumen(state, id, deviceId);
                        break;
                    case "powerstate":
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
                        this.createsnapshot(id, command, state, deviceId);
                        break;
                    case "sendCommand":
                        this.sendSSH(id, state, deviceId);
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
                const admin_path = `${__dirname}/../../iobroker-data/files/e2-openwebif.admin/`;
                const file_data = `${admin_path}_data.json`;
                const files = fs.readdirSync(`${admin_path}img/`);
                let files_arr = [];
                if (files.toString() != "") {
                    files_arr = files.toString().split(",");
                }
                const all_dp = await this.getObjectListAsync({
                    startkey: `${this.namespace}.${deviceId}.remote.snapshot.pictures.`,
                    endkey: `${this.namespace}.${deviceId}.remote.snapshot.pictures.\u9999`
                });
                this.log.debug(`all_dp: ${JSON.stringify(all_dp)}`);
                if (all_dp && all_dp.rows) {
                    for (const element of all_dp.rows) {
                        this.log.debug(`element: ${JSON.stringify(element)}`);
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
                                this.log.debug(`Found file: ${element.value.native.picname}`);
                            } else {
                                this.log.debug(`Cannot found file: ${element.value.native.picname}`);
                                await this.delObjectAsync(id);
                                this.log.info(`Delete datapoint: ${id}`);
                            }
                        } else {
                            this.log.debug(`Cannot found file name: ${element.id}`);
                        }
                    }
                } else {
                    this.log.info(`Cannot read: ${this.namespace}.${deviceId}.remote.snapshot.pictures`);
                }
                let data;
                if (fs.existsSync(file_data)) {
                    data = fs.readFileSync(file_data);
                    data = JSON.parse(data.toString("utf8"));
                    this.log.debug(`Data: ${JSON.stringify(data)}`);
                }
                this.log.debug(`Files: ${files}`);
                files.forEach(async (file) => {
                    try {
                        if (data && data[`img/${file}`]) {
                            this.log.info(`Found file in iobroker database: ${file}`);
                        } else {
                            this.log.info(`Cannot found file in iobroker database! An attempt is made to delete the file: ${file}`);
                            await this.delFileAsync("e2-openwebif.admin", `img/${file}`, (error) => {
                                if (!error) {
                                    this.log.info(`File deleted: img/${file}`);
                                } else {
                                    this.log.warn(`File not deleted: img/${file}`);
                                }
                            });
                        }
                    } catch (e) {
                        this.sendLucky(e, "try deletesnapshot foreach");
                    }
                });
                //end cleanup img/ folder and datapoints
                const obj = await this.getObjectAsync(id);
                this.log.debug(`deletesnapshot obj: ${JSON.stringify(obj)}`);
                if (obj && obj.native && obj.native.img && obj.native.img != "") {
                    if (fs.existsSync(admin_path + obj.native.img)) {
                        await this.delFileAsync("e2-openwebif.admin", obj.native.img, async (error) => {
                            if (!error) {
                                this.log.info(`File deleted: ${obj.native.img}`);
                                try {
                                    await this.delObjectAsync(id);
                                    this.log.info(`Delete datapoint: ${id}`);
                                    this.setAckFlag(id, {result: true});
                                } catch (e) {
                                    this.log.info(`Error delete datapoint: ${e}`);
                                }
                            } else {
                                this.log.warn(`File not deleted: ${obj.native.img}`);
                            }
                        });
                    } else {
                        this.log.info(`Cannot find the file: ${id}`);
                    }
                } else {
                    this.log.info(`Cannot find the file name: ${id}`);
                }
            }
        } catch (e) {
            this.sendLucky(e, "try deletesnapshot");
        }
    }

    async createsnapshot(id, command, state, deviceId) {
        try {
            this.log.debug(`COMMAND: ${command}`);
            let url = `/grab?command=-o&r=1080&format=png&jpgquali=100`;
            if (command === "snapshot_osd") {
                url += `&mode=osd`;
            } else if (command === "snapshot_link") {
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
            this.log.debug(`URL: ${url}`);
            const res = await this.axiosSnapshot[deviceId](encodeURI(url))
                .then((response) => {
                    if (response && response.status === 200) {
                        const writer = fs.createWriteStream("/tmp/image.jpg");
                        response.data.pipe(writer);
                        return new Promise((resolve, reject) => {
                            this.log.debug("Start Promise");
                            writer.on("finish", async () => {
                                this.log.debug("Finish");
                                if (fs.existsSync("/tmp/image.jpg")) {
                                    const pic = fs.readFileSync("/tmp/image.jpg");
                                    const current_time = Date.now();
                                    const picname = `screenshot_${current_time}.jpg`;
                                    const picpath = `img/${picname}`;
                                    const address = `http://${this.config.your_ip}/e2-openwebif.admin/${picpath}`;
                                    this.log.debug(`picpath: ${picpath}`);
                                    this.log.debug(`address: ${address}`);
                                    await this.writeFileAsync("e2-openwebif.admin", picpath, pic, async (error) => {
                                        try {
                                            if(!error) {
                                                this.log.debug("OK");
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
                                                await this.setStateAsync(`${deviceId}.remote.snapshot.pictures.${current_time}`, {
                                                    val: address,
                                                    ack: true
                                                });
                                                resolve(true);
                                            } else {
                                                this.log.debug("NOK");
                                                reject(error);
                                            }
                                        } catch (e) {
                                            this.sendLucky(e, "try writeFile createsnapshot");
                                        }
                                    });
                                    resolve(true);
                                } else {
                                    reject("Cannot create /tmp/image.jpg");
                                }
                            });
                            writer.on("error", (error) => {
                                reject(error);
                            });
                        });
                    }
                })
                .catch((e) => {
                    this.sendLucky(e, "try axiosSnapshot");
                });
            this.log.debug(`res: ${res}`);
            if (res) {
                this.log.info("Create Screenshot");
                if (command === "snapshot" || command === "snapshot_osd") {
                    this.setAckFlag(id, {result: true}, {val: false});
                } else {
                    this.setAckFlag(id, {result: true});
                }
            } else {
                this.log.info("Cannot create Screenshot");
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
                if (command === "SET_TIMER") {
                    this.setAckFlag(id, cleanup);
                } else {
                    this.setAckFlag(id, cleanup, {val: false});
                }
                if (cleanup && cleanup.result) {
                    this.log.info("Cleanup timerlist");
                    await this.delObjectAsync(`${deviceId}.remote.timerlist.timer`, { recursive: true });
                    await this.createTimerFolder(deviceId);
                } else {
                    this.log.info("Cannot cleanup timerlist");
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
                    this.log.debug(`new_states: ${JSON.stringify(new_states)}`);
                    await this.statesLoadTimer(deviceId, new_states);
                    this.setState(`${deviceId}.remote.timerlist.JSON_TIMERLIST`, {
                        val: JSON.stringify(timer.timers),
                        ack: true
                    });
                } else {
                    this.log.info("Cannot Create Select Timerlist");
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
                    this.log.debug(`new_states: ${JSON.stringify(del)}`);
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
                    this.log.info("Timerlist is empty");
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
                            autoCast: true,
                            checkvalue: true,
                            checkType: true,
                        });
                    }
                    this.log.debug(`timer_json: ${JSON.stringify(timer_json)}`);
                } else {
                    this.log.info(`Cannot read Timerlist for ${deviceId}`);
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
            if (!bouquets || bouquets["bouquets"] == null) {
                this.log.warn(`Cannot find Bouquets from ${this.devicesID[deviceId].ip} device`);
            } else {
                this.setAckFlag(id, {result: true}, {val: false});
                this.log.info("Create Bouquets and EPG");
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
                    this.log.debug(`vol: ${JSON.stringify(vol)}`);
                } else {
                    this.log.info(`Cannot set Volumen: ${state.val} for ${deviceId}`);
                }
            } else {
                this.log.info("Cannot set Volumen");
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
                    if (id.split(".").pop() == "powerstate") {
                        this.setAckFlag(id, power);
                    } else {
                        this.setAckFlag(id, power, {val: false});
                    }
                    this.log.debug(`power: ${JSON.stringify(power)}`);
                } else if (state.val === 6) {
                    state.val = true;
                    this.wakeonlan(state, id, deviceId);
                    this.setAckFlag(id, {result: true}, {val: false});
                } else {
                    this.log.info(`Cannot set Powerstate: ${state.val}`);
                }
            } else {
                this.log.info("Cannot set Powerstate");
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
                this.setAckFlag(id, setRec, {val: false});
                this.log.debug(`setRec: ${JSON.stringify(setRec)}`);
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
                this.log.debug(`state.val: ${JSON.stringify(state.val)}`);
                const rec = await this.getObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_RECORDING`);
                this.setAckFlag(id, rec);
                if (rec && rec.native && rec.native.epg && rec.native.epg[state.val]) {
                    this.log.debug(`rec.native.epg: ${JSON.stringify(rec.native.epg)}`);
                    this.json2iob.parse(`${deviceId}.remote.epg.channel`, rec.native.epg[state.val], {
                        forceIndex: true,
                        preferedArrayName: null,
                        channelName: null,
                        autoCast: true,
                        checkvalue: false,
                        checkType: true,
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
                    this.log.debug(`epgservice.events: ${JSON.stringify(epgservice.events)}`);
                    for (const element of epgservice.events) {
                        new_states[val_arr] = `${element.begin} - ${element.sname} ${element.title}`;
                        ++val_arr;
                    }
                    this.log.debug(`new_states: ${JSON.stringify(new_states)}`);
                    if (channel && channel.common && channel.common.states) {
                        delete channel.common.states;
                    }
                    if (channel && channel.native && channel.native.epg) {
                        delete channel.native.epg;
                    }
                    if (channel && channel.common) {
                        channel.common.states = new_states;
                        channel.native.epg = epgservice.events;
                        await this.setObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_RECORDING`, channel);
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
                this.isOnline[deviceId] = 2;
                await this.deleteInterval(id, true, false);
                this.setNewInterval(deepInterval, deviceId);
                this.setState(`${deviceId}.STATUS_DEVICE`, {
                    val: this.isOnline[deviceId],
                    ack: true
                });
            } else if (state && state.val === 1) {
                this.log.debug(`Set Status online. Change interval to ${this.config.interval} sec.`);
                await this.sleep(this.config.boottime * 1000);
                this.checkdeepstandby(deviceId);
            }
            this.setAckFlag(id, {result: true});
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
                        this.setAckFlag(id, {result: true});
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
                this.log.debug(`Response your Request: ${JSON.stringify(resp)}`);
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
            const path = `?text=${send_message.val}&type=${send_type.val}&timeout=${send_timeout.val}`;
            const return_message = await this.getRequest(`${cs.SET.message}${path}`, deviceId);
            this.setAckFlag(id, return_message, {val: false});
            this.log.info(`return_message: ${JSON.stringify(return_message)}`);
            if (return_message && return_message.result && send_type.val == 0) {
                const res = await this.getRequest(`${cs.PATH.COMMAND}108`, deviceId);
                this.log.debug(`command 108: ${JSON.stringify(res)}`);
                this.messageInterval[deviceId] = this.setInterval(async () => {
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
            this.messageInterval[deviceId] && this.clearInterval(this.messageInterval[deviceId]);
            const answer_message = await this.getRequest(`${cs.PATH.MESSAGEANSWER}`, deviceId);
            this.log.debug(`answer_message: ${JSON.stringify(answer_message)}`);
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
            const getlocations = await this.getRequest(cs.API.getlocations, deviceId);
            if (
                getlocations &&
                getlocations.locations &&
                Array.isArray(getlocations.locations)
            ) {
                for (const element of getlocations.locations) {
                    if (!this.folderstates[element]) {
                        await this.createFolderJson(element, deviceId);
                        this.log.debug(`PFAD: ${element}`);
                    }
                }
                this.log.debug(`this.folderstate: ${JSON.stringify(this.folderstates)}`);
                if (this.folderstates) {
                    await this.statesSetFolder(deviceId, this.folderstates);
                    this.setAckFlag(id, getlocations, {val: false});
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
            this.log.debug(`state.val: ${state.val}`);
            const ZAPandEPG = await this.getRequest(`${cs.SET[val]}${encodeURI(state.val)}`, deviceId);
            this.setAckFlag(id, ZAPandEPG);
            this.log.debug(`ZAPandEPG: ${JSON.stringify(ZAPandEPG)}`);
            if (val === "epgbouquet" && ZAPandEPG && ZAPandEPG.events) {
                this.setState(`${deviceId}.remote.epg.EPG_JSON`, {
                    val: JSON.stringify(ZAPandEPG),
                    ack: true
                });
                const new_states = {};
                const channel = await this.getObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_CHANNEL`);
                this.log.debug(`ZAPandEPG event: ${JSON.stringify(ZAPandEPG.events)}`);
                for (const element of ZAPandEPG.events) {
                    if (element && element.sname && new_states[element.sref] == null) {
                        new_states[element.sref] = element.sname;
                    }
                }
                this.log.debug(`new_states: ${JSON.stringify(new_states)}`);
                if (channel && channel.common && channel.common.states) {
                    delete channel.common.states;
                }
                if (channel && channel.common) {
                    channel.common["states"] = new_states;
                    await this.setObjectAsync(`${this.namespace}.${deviceId}.remote.epg.SET_EPG_CHANNEL`, channel);
                }
            }
        } catch (e) {
            this.sendLucky(e, "try setZAPAndEPG");
        }
    }

    async setBouquestAndEPG(state, dp, id, deviceId) {
        try {
            if (state && state.val) {
                const getservices = await this.getRequest(`${cs.SET.getservices}${encodeURI(state.val)}`, deviceId);
                this.setAckFlag(id, getservices);
                if (getservices && getservices.services) {
                    this.log.debug(`getservices: ${JSON.stringify(getservices)}`);
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
                        await this.setObjectAsync(`${this.namespace}.${deviceId}.remote.${dp}`, channel);
                    }
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
            const simple_api = await this.getForeignObjectAsync(`system.adapter.${this.config.simple_api}`);
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
            if (
                this.devicesID[deviceId] == null ||
                this.devicesID[deviceId].ip == "" ||
                this.devicesID[deviceId].sshuser == ""
            ) {
                this.log.info("Missing IP or Username!");
                return;
            }
            const sshconfig2 = {};
            sshconfig2[deviceId] = {
                host: this.devicesID[deviceId].ip,
                username: this.devicesID[deviceId].sshuser,
                password: this.devicesID[deviceId].sshpassword
            };
            const boxfile = `${this.adapterDir}/lib/iobroker.sh`;
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
            let scriptname;
            const random = await this.getStateAsync(`${deviceId}.SSH_SCRIPTNAME`);
            if (random && random.val == "") {
                scriptname = `${deviceId}_${await this.makeRandomString(5)}`;
                this.setState(`${deviceId}.SSH_SCRIPTNAME`, {
                    val: scriptname,
                    ack: true
                });
            } else if (random && random.val != "") {
                scriptname = random.val;
            } else {
                this.log.info(`Cannot create filename`);
                return;
            }
            const ssh2 = {};
            ssh2[deviceId] = new SSH2Promise(sshconfig2[deviceId]);
            await ssh2[deviceId].connect().then(async () => {
                try {
                    this.log.info(`Connection established for device ${deviceId}.`);
                    let resp = "";
                    resp = await this.commandToSSH2(ssh2[deviceId], `/home/${scriptname}.sh`);
                    resp = resp.replace(/(\r\n|\r|\n)/g, "");
                    data = data.toString().replace(/<device>/g, scriptname);
                    this.log.debug(`Replace ${data} device ${deviceId}`);
                    this.log.debug(`Response ${resp} device ${deviceId}`);
                    if (resp === "iobroker" && this.devicesID[deviceId].ssh) {
                        this.log.debug(`Set SSH_CREATED true for device ${deviceId}`);
                        this.setState(`${deviceId}.SSH_CREATED`, {
                            val: true,
                            ack: true
                        });
                    } else if (resp != "iobroker" && this.devicesID[deviceId].ssh) {
                        if (resp != "iobroker missing") {
                            resp = await this.commandToSSH2(ssh2[deviceId], `echo "${data}" > /home/${scriptname}.sh`);
                            resp = await this.commandToSSH2(ssh2[deviceId], `chmod 775 /home/${scriptname}.sh`);
                            resp = resp.replace(/(\r\n|\r|\n)/g, "");
                            if (resp === "OK") {
                                this.log.info(`Set chmod 775 for /home/${scriptname}.sh`);
                            } else {
                                this.log.info(`Error set chmod 775: ${resp}`);
                                ssh2.close();
                                return;
                            }
                        }
                        resp = await this.commandToSSH2(ssh2[deviceId], `/home/${scriptname}.sh 1 ${get_url}`);
                        resp = resp.replace(/(\r\n|\r|\n)/g, "");
                        if (resp === "OK") {
                            this.log.info(`Create files and symlinks for device ${deviceId}`);
                            this.setState(`${deviceId}.SSH_CREATED`, {
                                val: true,
                                ack: true
                            });
                        } else {
                            this.log.info(`Error create files and symlinks: ${resp} for device ${deviceId}`);
                            ssh2.close();
                            return;
                        }
                    } else if (resp == "iobroker" && !this.devicesID[deviceId].ssh) {
                        resp = await this.commandToSSH2(ssh2[deviceId], `/home/${scriptname}.sh 2`);
                        resp = resp.replace(/(\r\n|\r|\n)/g, "");
                        if (resp === "OK") {
                            this.log.info(`Delete files and symlinks for device ${deviceId}`);
                        } else {
                            this.log.info(`Error delete files and symlinks: ${resp} for device ${deviceId}`);
                            ssh2.close();
                            return;
                        }
                        resp = await this.commandToSSH2(ssh2[deviceId], `rm /home/${scriptname}.sh 2`);
                        resp = resp.replace(/(\r\n|\r|\n)/g, "");
                        if (resp === "OK") {
                            this.log.info(`Delete /home/${scriptname}.sh for device ${deviceId}`);
                            this.setState(`${deviceId}.SSH_CREATED`, {
                                val: false,
                                ack: true
                            });
                        } else {
                            this.log.info(`Error delete /home/${scriptname}.sh: - ${resp} for device ${deviceId}`);
                            ssh2[deviceId].close();
                            return;
                        }
                    } else {
                        this.log.info(`Set false for device ${deviceId}`);
                        this.setState(`${deviceId}.SSH_CREATED`, {
                            val: false,
                            ack: true
                        });
                    }
                } catch (e) {
                    this.sendLucky(e, "try connect_ssh connect");
                }
            });
            ssh2[deviceId].close();
        } catch (e) {
            this.sendLucky(e, "try connect_ssh");
        }
    }

    async sendSSH(id, state, deviceId) {
        try {
            if (state && state.val && state.val != "" && this.devicesID[deviceId].ssh) {
                const sshconfig2 = {};
                const ssh2 = {};
                sshconfig2[deviceId] = {
                    host: this.devicesID[deviceId].ip,
                    username: this.devicesID[deviceId].sshuser,
                    password: this.devicesID[deviceId].sshpassword
                };
                ssh2[deviceId] = new SSH2Promise(sshconfig2[deviceId]);
                await ssh2[deviceId].connect().then(async () => {
                    try {
                        this.log.info(`Connection established for device ${deviceId}.`);
                        let resp = "";
                        resp = await this.commandToSSH2(ssh2[deviceId], state.val);
                        resp = resp.replace(/(\r\n|\r|\n)/g, "");
                        this.setState(`${deviceId}.remote.ssh.responseCommand`, {
                            val: resp,
                            ack: true
                        });
                        this.setAckFlag(id, {result: true});
                    } catch (e) {
                        this.sendLucky(e, "try sendSSH connect");
                    }
                });
                ssh2[deviceId].close();
            }
        } catch (e) {
            this.sendLucky(e, "try sendSSH");
        }
    }

    async commandToSSH2(ssh2, command) {
        this.log.debug(`commandToSSH2: ${command}`);
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

    async inProgress(work, workname, id) {
        try {
            this.load[id] = work;
            this.loadname[id] = workname;
        } catch (e) {
            this.inProgress(e, "try checkRecording");
        }
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
                    this.log.debug(`Starttime ${timeISO}`);
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
                this.log.info("Cannot read Timerlist");
            }
        } catch (e) {
            this.sendLucky(e, "try checkRecording");
        }
    }

    async sendLucky(error, func) {
        try {
            this.log.warn(`${func}: ${error}`);
            if (this.config.lucky) {
                const obj = await this.getForeignObjectAsync(`system.host.${this.host}`);
                const npm = await this.getForeignStateAsync(`system.host.${this.host}.versions.npmCurrent`);
                let npmVal;
                if (npm && npm.val) {
                    npmVal = npm.val;
                } else {
                    npmVal = "UNKNOWN";
                }
                if (obj && obj.common && obj.common) {
                    const defaultHeaders = {
                        "x-Adapter": "Openwebif",
                        "x-Adapter-Version": this.version,
                        "x-contoller": obj.common.installedVersion,
                        "x-Node": obj.native.process.versions.node,
                        "x-NPM": npmVal,
                        "x-Language": this.lang,
                        "x-Errorinfo": this.config.errorinfo,
                        "x-ErrorReport": "TryError",
                        "x-Function": func
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
            }
        } catch (error) {
            this.log.error(`sendLucky: ${error}`);
        }
    }

    async setAckFlag(id, res, value) {
        try {
            this.log.debug(`Set ack=True: ${JSON.stringify(res)}`);
            if (id && res && res.result) {
                this.setState(id, {
                    ack: true,
                    ...value
                });
            }
        } catch (e) {
            this.sendLucky(e, "try setAckFlag");
        }
    }

    async makeRandomString(length) {
        try {
            let result             = "";
            const characters       = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            const charactersLength = characters.length;
            for ( let i = 0; i < length; i++ ) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        } catch (e) {
            this.sendLucky(e, "try makeRandomString");
            return "gzW5M";
        }
    }

    sleep(ms) {
        return new Promise((resolve) => {
            sleepTimer = setTimeout(resolve, ms);
        });
    }

    async deleteInterval(deviceId, rec, upd) {
        try {
            if (upd) {
                this.updateInterval[deviceId] && this.clearInterval(this.updateInterval[deviceId]);
                this.updateInterval[deviceId] = null;
            }
            if (rec) {
                this.recordInterval[deviceId] && this.clearInterval(this.recordInterval[deviceId]);
                this.recordInterval[deviceId] = null;
            }
        } catch (e) {
            this.sendLucky(e, "try deleteInterval");
        }
    }

    async cleanupQuality() {
        this.log.debug("Start cleanup quality");
        const quality = {
            0:"0x00 - good",
            1:"0x01 - general problem",
            2:"0x02 - no connection problem",
            16:"0x10 - substitute value from controller",
            17:"0x11 - general problem by instance",
            18:"0x12 - instance not connected",
            32:"0x20 - substitute initial value",
            64:"0x40 - substitute value from device or instance",
            65:"0x41 - general problem by device",
            66:"0x42 - device not connected",
            68:"0x44 - device reports error",
            128:"0x80 - substitute value from sensor",
            129:"0x81 - general problem by sensor",
            130:"0x82 - sensor not connected",
            132:"0x84 - sensor reports error"
        };
        try {
            for (const deviceId of this.unloadDevices) {
                const all_dp = await this.getObjectListAsync({
                    startkey: `${this.namespace}.${deviceId}.`,
                    endkey: `${this.namespace}.${deviceId}.\u9999`
                });
                const dp_array = [];
                if (all_dp && all_dp.rows) {
                    for (const dp of all_dp.rows) {
                        if (dp.value.type === "state") {
                            const states = await this.getStateAsync(dp.id);
                            if (states && states.q != null && states.q != 0) {
                                this.log.debug(`Datapoints: ${dp.id} - ${JSON.stringify(states)}`);
                                if (quality[states.q]) {
                                    const isfind = dp_array.find((mes) => mes.message === quality[states.q]);
                                    if (isfind) {
                                        this.log.debug(`Found: ${JSON.stringify(isfind)}`);
                                        ++isfind.counter;
                                        isfind.dp[isfind.counter] = dp.id;
                                    } else {
                                        this.log.debug(`Founds: ${JSON.stringify(isfind)}`);
                                        const new_array = {
                                            message: quality[states.q],
                                            quality: states.q,
                                            counter: 1,
                                            dp: {1: dp.id}
                                        };
                                        dp_array.push(new_array);
                                    }
                                    if (quality[states.q] === "0x20 - substitute initial value") {
                                        await this.setStateAsync(`${dp.id}`, {
                                            ack: true
                                        });
                                    }
                                } else {
                                    this.log.info(`Missing quality ${states.q}`);
                                }
                            }
                        }
                    }
                }
                await this.setStateAsync(`${deviceId}.DP_QUALITY`, {
                    val: Object.keys(dp_array).length > 0
                        ? JSON.stringify(dp_array)
                        : JSON.stringify({message: "No Message"}),
                    ack: true
                });
            }
        } catch (e) {
            this.sendLucky(e, "try cleanupQuality");
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