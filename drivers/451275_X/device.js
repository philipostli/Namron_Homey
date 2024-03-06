'use strict';

const {ZigBeeDevice} = require("homey-zigbeedriver");
const {CLUSTER, Cluster} = require('zigbee-clusters')


const appkit = require('./lib/');

const destructConstProps = function ({
                                         ID, NAME, ATTRIBUTES, COMMANDS,
                                     }) {
    return Object.freeze({
        ID, NAME, ATTRIBUTES, COMMANDS,
    });
}

const HzcThermostatCluster = require('../../lib/SrThermostatCluster')
const HzcThermostatUserInterfaceConfigurationCluster =
    require('../../lib/SrThermostatUserInterfaceConfigurationCluster')
Cluster.addCluster(HzcThermostatCluster)
Cluster.addCluster(HzcThermostatUserInterfaceConfigurationCluster)

CLUSTER['THERMOSTAT_USER_INTERFACE_CONFIGURATION'] =
    destructConstProps(HzcThermostatUserInterfaceConfigurationCluster)


const getInt16 = function (number) {
    const int16 = new Int16Array(1)
    int16[0] = number
    return int16[0]
}

const {
    getOptBaseTime, TIP_CHANGED
} = require('./lib/devices/utils');


class t7e_zg_thermostat extends ZigBeeDevice {


    onEndDeviceAnnounce() {
    }

    async onNodeInit({zclNode, node}) {
        super.onNodeInit({zclNode: zclNode, node: node})
        //this.enableDebug();
        //this.printNode();
        this.disableDebug()

        this.isOnline = 0
        this.meter_multiplier = 0.001;
        this.power_multiplier = 0.1;
        this.target_temp_setpoint_min = 5
        this.target_temp_setpoint_max = 40

        this._start()
    };


    //read device attribute flag, to init app ui
    //  sensorMode: [a, f, a2, af, ... , p]
    async _start() {
        this.setAvailable();

        //this.log("+++ App start: check sensorMode, systemMode, thermostatRunningMode ")

        await this.thermostatCluster().readAttributes(['sensorMode', 'systemMode', 'thermostatRunningMode',
            'absMinHeatSetpointLimit', 'absMaxHeatSetpointLimit',
            'absMinCoolSetpointLimit', 'absMaxCoolSetpointLimit']).then(value => {
            this.log(`++++++ APP start thermostat = `, value)

            if (value.hasOwnProperty('systemMode')) {
                this._setModeUI(value['systemMode'])
            }
            if (value.hasOwnProperty('thermostatRunningMode')) {
                this._setModeUI(value['thermostatRunningMode'])
            }

            if (value.hasOwnProperty('sensorMode')) {
                let sensorMode = value['sensorMode'] || 'a'
                this.setStoreValue('sensor_mode', sensorMode)
                this.setSettings({sensor_mode: sensorMode})

                this._initUiModule();
            }

            if (value.hasOwnProperty('absMinHeatSetpointLimit')) {
                let temp = parseFloat((getInt16(value['absMinHeatSetpointLimit']) / 100).toFixed(1))
                this.target_temp_setpoint_min = temp
            }
            if (value.hasOwnProperty('absMaxHeatSetpointLimit')) {
                let temp = parseFloat((getInt16(value['absMaxHeatSetpointLimit']) / 100).toFixed(1))
                this.target_temp_setpoint_max = temp
            }

        }).catch(err => {
            //this.error('Error: read sensor mode failed', err);
            //this.log('-------start.err: ', err)

            let errMsg = "" + err
            if (errMsg === "Error: device_not_found" || errMsg === "reason: Error: device_not_found") {
                //this.log('----------device removed')
                //device removed
                return
            }


            this.showMessage("" + err);

            //this.setUnavailable('App read sensor mode failed, Please try again.')
            this.setStoreValue('zb_first_init', true)

            this.homey.setTimeout(async () => {
                this._start()
            }, 5000)
        })

    }

    //init UI component module
    async _initUiModule() {

        //this.onDeleted()
        //super.onDeleted()

        if (this.getStoreValue('regulator_mode_changed') === true) {
            await this.showMessage(TIP_CHANGED)
        }

        try {
            let reg_mode = this.getStoreValue('sensor_mode') || 'a';
            ////this.log('restartApp->w:', reg_mode);

            if (!this.hasCapability('onoff')) {
                await this.addCapability("onoff");
            }
            if (!this.hasCapability('measure_power')) {
                await this.addCapability("measure_power");
            }
            if (!this.hasCapability('meter_power')) {
                await this.addCapability("meter_power");
            }
            //if (!this.hasCapability('t7e_zg_sensor_mode')){ await  this.addCapability('t7e_zg_sensor_mode') }
            if (!this.hasCapability('t7e_zg_window_state')) {
                await this.addCapability('t7e_zg_window_state');
            }
            //if (!this.hasCapability('t7e_zg_fault')) { await this.addCapability('t7e_zg_fault') }
            //if (!this.hasCapability('t7e_zg_datetime')) { await this.addCapability('t7e_zg_datetime') }
            if (this.hasCapability('t7e_zg_datetime')) {
                await this.removeCapability('t7e_zg_datetime')
            }

            if (!this.hasCapability('child_lock')) {
                await this.addCapability("child_lock");
            }

            //regulator heat mode
            if (reg_mode === 'p' || reg_mode === 'fp') {

                //remove
                if (this.hasCapability('target_temperature')) {
                    await this.removeCapability('target_temperature')
                }
                if (this.hasCapability('measure_temperature')) {
                    await this.removeCapability('measure_temperature')
                }
                if (this.hasCapability('eco_mode')) {
                    await this.removeCapability('eco_mode')
                }
                if (this.hasCapability('frost')) {
                    await this.removeCapability('frost')
                }

                //add
                if (!this.hasCapability('t7e_zg_regulator_percentage')) {
                    await this.addCapability('t7e_zg_regulator_percentage');
                }

                this.setSettings({
                    sensor_mode: 'p',
                    thermostat_regulator_mode: '1',
                });

                //this.setCapabilityValue('t7e_zg_sensor_mode', 'p')

                let rp = this.getStoreValue('t7e_zg_regulator_percentage') || 0.2;
                this.setCapabilityValue('t7e_zg_regulator_percentage', rp);

                if (this.isFirstInit()) {
                    this.driver.triggerRegulator(this)
                }

            }

            //thermostat SE mode
            else {

                //remove
                if (this.hasCapability('t7e_zg_regulator_percentage')) {
                    await this.removeCapability('t7e_zg_regulator_percentage')
                }

                //add
                if (!this.hasCapability('target_temperature')) {
                    await this.addCapability("target_temperature");
                }
                if (!this.hasCapability('measure_temperature')) {
                    await this.addCapability("measure_temperature");
                }
                if (!this.hasCapability('eco_mode')) {
                    await this.addCapability("eco_mode");
                }
                if (!this.hasCapability('frost')) {
                    await this.addCapability("frost");
                }

                let settings = this.getSettings();
                let mode1 = settings.sensor_mode;
                if (mode1 === 'p') {
                    mode1 = 'a';
                    this.setSettings({
                        sensor_mode: mode1,
                    });
                }
                //this.setCapabilityValue('t7e_zg_sensor_mode', mode1)
                this.setSettings({
                    thermostat_regulator_mode: '0',
                });

            }

        } catch (err) {
            //this.log('restartApp ERROR', err);
        }

        await this._initCapabilityAndListener();

        this.setStoreValue('app_initing', false)
    }

    async _initCapabilityAndListener() {
        this._setUpSystemCapabilities().catch(this.error)
        this._setUpMeasureTemperatureCapability()
        this._setUpTargetTemperatureCapability()

        appkit.regulator_percentage.init(this)
        appkit.window_status.init(this)
        appkit.eco_mode.init(this)
        appkit.child_lock.init(this)
        appkit.frost.init(this)
        appkit.sensor_mode.init(this)
        appkit.fault.init(this)


        await this._onHandlerReport()

        this.setStoreValue('regulator_mode_changed', false);

        ////this.log('+++++ setAvailable AND ready ')
        await this.setAvailable()
        await this.unsetWarning()

        //this._getAttributes();
        this._loopTipInfo()


        this.setDatetime()
    }


    async showMessage(msg) {
        await this.unsetWarning();
        await this.setWarning(msg).catch(this.error);
    }

    //==========================================================================================
    //        Report handler
    async _onHandlerReport() {

        this.onoffCluster().on('attr.onOff', async value => {
            //this.log(' ############# report onoff: ', value)
            this.setCapabilityValue('onoff', value)
        })

        this.thermostatCluster().on('attr.frost', async value => {
            this.log(`-- rev frost 1 onoff = `, value)
            this.driver.triggerMyFlow(this, value || false);
        })

        this.thermostatCluster().on('attr.occupiedHeatingSetpoint', async value => {
            //this.log(`-----------event: occupiedHeatingSetpoint report `, value)
            let temp = parseFloat((getInt16(value) / 100).toFixed(1))
            if (this.hasCapability('target_temperature')) {
                if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                    this.setCapabilityValue('target_temperature', temp)
                }
            }
        })
        this.thermostatCluster().on('attr.occupiedCoolingSetpoint', async value => {
            //this.log(`-----------event: occupiedCoolingSetpoint report `, value)
            let temp = parseFloat((getInt16(value) / 100).toFixed(1))
            if (this.hasCapability('target_temperature')) {
                if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                    this.setCapabilityValue('target_temperature', temp)
                }
            }
        })

        //target temp limit report
        this.thermostatCluster().on('attr.absMinHeatSetpointLimit', async value => {
            this.log('--report min setpoint temp: ', value)
            let temp = parseFloat((getInt16(value) / 100).toFixed(1))
            this.target_temp_setpoint_min = temp
            this.updateSetpointTempLimit()
        })
        this.thermostatCluster().on('attr.absMaxHeatSetpointLimit', async value => {
            this.log('--report max setpoint temp: ', value)
            let temp = parseFloat((getInt16(value) / 100).toFixed(1))
            this.target_temp_setpoint_max = temp

            this.updateSetpointTempLimit()
        })

        this.thermostatCluster().on('attr.systemMode', async value => {
            this._setModeUI(value)
        })


        this.thermostatCluster().on('attr.syncTimeReq', async value => {
            if (value === true || value === 1) {
                this.setDatetime()
            }
        })

        this.thermostatCluster().on('attr.fault', async value => {

            let thefault = '0'
            const res = value.getBits();
            if (res.length > 0) {
                thefault = res[res.length - 1];
                ////this.log('@@@@ falut = ', res, thefault, res.length)
                if (thefault === undefined) {
                    thefault = '0'
                }
            }
        })


        this.thermostatCluster().on('attr.regulator', async value => {
            ////this.log('==========report regulator: ', value)
            this.setSettings({regulator: '' + value})
        })

        this.thermostatCluster().on('attr.windowCheck', async value => {
            ////this.log('===========report windowCheck: ', value)
            this.setSettings({window_check: value})
        })

        this.thermostatCluster().on('attr.sensorMode', async value => {
            this.setSettings({sensor_mode: value})
            this._checkModeStatus(value)
        })

        this.thermostatCluster().on('attr.backlight', async value => {
            ////this.log('==========report backlight: ', value)
            this.setSettings({lcd_backlight_wait: '' + value})
        })
    }


    setDatetime() {
        let st = parseInt(Date.now() / 1000)
        this.thermostatCluster().writeAttributes({
            syncTime: st,
        }).then(() => {
            //this.log(`##### set time success: `, st)
        }).catch(err => {
            //this.log(`##### set time error `, st, err)
            this.showMessage("" + err)
        })

    }


    //==========================================================================================
    //  Instances

    thermostatCluster() {
        return this.zclNode.endpoints[1].clusters.thermostat
    }

    //onoffCluster() { return this.zclNode.endpoints[1].clusters.thermostatOnoff }
    onoffCluster() {
        return this.zclNode.endpoints[1].clusters.onOff
    }

    //child lock
    thermostatUserInterfaceConfiguration() {
        return this.zclNode.endpoints[1].clusters.thermostatUserInterfaceConfiguration
    }

    basicCluster() {
        return this.zclNode.endpoints[1].clusters.basic
    }

    meterCluster() {
        return this.zclNode.endpoints[1].clusters.metering
    }

    electricalMeasurementCluster() {
        return this.zclNode.endpoints[1].clusters.electricalMeasurement
    }


    //================================================================================================================
    //    setup

    //set onoff, power, kwh
    async _setUpSystemCapabilities() {

        //this.log('----------registerCapability onoff for CLUSTER.ON_OFF ')

        this.registerCapability('onoff', CLUSTER.ON_OFF)

        this.registerCapabilityListener('onoff', async isOn => {
            //this.log('========== onoff toggle: ', isOn)

            //init
            let initing = this.getStoreValue('app_initing') || false

            let modeChanged = this.getStoreValue('regulator_mode_changed')
            if (modeChanged === true) {
                if (initing === false) {
                    this.setStoreValue('app_initing', true)
                    await this._start()
                }
                return;
            }


            //send command
            if (isOn) {
                await this.onoffCluster().setOn().catch((err) => {
                    this.setCapabilityValue('onoff', !isOn)
                })
            } else {
                await this.onoffCluster().setOff().catch((err) => {
                    this.setCapabilityValue('onoff', !isOn)
                })
            }

            //Power off, then set measure_power to 0
            if (isOn === false) {
                if (this.hasCapability('measure_power')) {
                    this.setCapabilityValue('measure_power', 0.0)
                }
                if (this.hasCapability('meter_power')) {
                    this.setCapabilityValue('meter_power', 0.0)
                }
            }
        })

        // meter_power
        if (this.hasCapability('meter_power')) {

            try {
                const {
                    multiplier, divisor
                } = await this.zclNode.endpoints[this.getClusterEndpoint(
                    CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
                    ['multiplier', 'divisor']).catch(this.error)

                //this.log('multiplier-divisor ', multiplier, divisor)


                if (multiplier && divisor) {
                    this.meter_multiplier = multiplier / divisor;
                }
            } catch (error) {
                //this.log('-------error: ', error)
            }

            this.registerCapability('meter_power', CLUSTER.METERING, {
                get: 'currentSummationDelivered',
                report: 'currentSummationDelivered',
                reportParser: value => {

                    //this.log(`+++++++++++ currentSummationDelivered report: `, value)
                    return value * this.meter_multiplier
                },
                getOpts: {
                    getOnStart: true, pollInterval: getOptBaseTime,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 0.001,
                    },
                },
            })
        }

        // measure_power
        if (this.hasCapability('measure_power')) {

            this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'activePower', report: 'activePower', reportParser: value => {
                    //this.log('+++++++++++ activePower report: ', value)
                    return value * this.power_multiplier
                }, getOpts: {
                    getOnStart: true, pollInterval: getOptBaseTime,
                }, reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 0.1,
                    },
                },
            })
        }

    }

    //Current temp
    _setUpMeasureTemperatureCapability() {

        if (!this.hasCapability('measure_temperature')) return

        this.thermostatCluster().on('attr.localTemperature', async value => {
            //this.log('==========report localTemperature: ', value)
            this.isOnline = 0

            let temp = parseFloat((getInt16(value) / 100).toFixed(1))
            ////this.log(`localTemperature report `, value, temp)
            if (temp < -10) temp = -10
            if (temp > 60) temp = 60

            if (this.hasCapability('measure_temperature')) {
                this.setCapabilityValue('measure_temperature', temp)
            }

        })

    }

    _setUpTargetTemperatureCapability() {

        if (!this.hasCapability('target_temperature')) return


        this.registerCapabilityListener('target_temperature', async value => {

            ////this.log(`---------- occupiedHeatingSetpoint setParser `, value)
            let payload = {}

            let curMode = this.getStoreValue('last_system_mode') || 'heat'
            if (curMode === 'heat') {
                payload['occupiedHeatingSetpoint'] = value * 100
            } else if (curMode === 'cool') {
                payload['occupiedCoolingSetpoint'] = value * 100
            }

            this.thermostatCluster().writeAttributes(payload).catch(this.error)
        })


        this.updateSetpointTempLimit()

    }

    //  others

    async onSettings({oldSettings, newSettings, changedKeys}) {
        this._setDeviceSettings(newSettings, changedKeys);
    }

    async _setDeviceSettings(newSettings, changedKeys) {

        ////this.log('+++++ settings ： ', newSettings, changedKeys);

        changedKeys.forEach(element => {
            ////this.log("-----------------------config:", element);

            let o = appkit[element];
            if (o != undefined) {
                if (o['setConfig']) {
                    o.setConfig(this, newSettings[element]);
                }
            }
        })

    }

    //init get device attributes.
    async _getAttributes() {
        //this.log('+++++++++++++++++++ Refresh state from device.')

        if (this.thermostatUserInterfaceConfiguration() === null || this.thermostatUserInterfaceConfiguration() === undefined) {
            //this.log('&&&&&&&&&&&&& instance is removed')
            return
        }

        //await this.basicCluster().readAttributes('appVersion', 'dateCode', 'hwVersion','appProfileVersion','locationDesc','swBuildId').then(value => {
        //  //this.log('+++++++++++ basic : ', value)
        //})

        //child lock
        await this.thermostatUserInterfaceConfiguration().readAttributes(['keypadLockout']).then(value => {
            //this.log(`+++++++ child lock = `, value)
            if (value.hasOwnProperty('keypadLockout')) {
                let isOpen = value['keypadLockout'] === 'level1Lockout'
                this.setCapabilityValue('child_lock', isOpen ? true : false)
                this.isOnline = 0
            }
        }).catch(this.error)

        // target_temperature
        if (this.hasCapability('target_temperature')) {
            await this.thermostatCluster().readAttributes(['occupiedHeatingSetpoint', 'occupiedCoolingSetpoint']).then(value => {

                //this.log(`+++++++ occupiedHeatingSetpoint after mode `, value)
                let curMode = this.getStoreValue('last_system_mode') || 'heat'
                if (curMode === 'heat') {
                    const temp = parseFloat(
                        (value['occupiedHeatingSetpoint'] / 100).toFixed(1))
                    if (this.hasCapability('target_temperature')) {
                        if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                            this.setCapabilityValue('target_temperature', temp)
                        }
                    }

                } else if (curMode === 'cool') {
                    const temp = parseFloat(
                        (value['occupiedCoolingSetpoint'] / 100).toFixed(1))
                    if (this.hasCapability('target_temperature')) {
                        if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                            this.setCapabilityValue('target_temperature', temp)
                        }
                    }
                }

            }).catch(this.error)
        }

        //measure_temperature
        if (this.hasCapability('measure_temperature')) {
            try {
                await this.thermostatCluster().readAttributes(['localTemperature']).then(value => {

                    //this.log(`++++++++++ localTemperature`, value)
                    const temp = parseFloat(
                        (value['localTemperature'] / 100).toFixed(1))

                    if (temp > -20) {
                        if (this.hasCapability('measure_temperature')) {
                            this.setCapabilityValue('measure_temperature', temp)
                        }
                    }

                }).catch(this.error)
            } catch (error) {
                ////this.log('++++++++++measure_temperature: ', error)
            }

        }


        //frost flag
        if (this.hasCapability('frost')) {
            await this.thermostatCluster().readAttributes(['frost']).then(value => {
                //this.log(`++++++ thermostat frost = `, value)

                if (value.hasOwnProperty('frost')) {
                    this.setCapabilityValue('frost', value['frost'])
                }

            }).catch(this.error)
        }

        //t7e_zg_regulator_percentage
        if (this.hasCapability('t7e_zg_regulator_percentage')) {
            await this.thermostatCluster().readAttributes(['pIHeatingDemand']).then(value => {
                //this.log(`++++++ thermostat pIHeatingDemand = `, value)

                if (value.hasOwnProperty('pIHeatingDemand')) {
                    this.setCapabilityValue('t7e_zg_regulator_percentage', value['pIHeatingDemand'] / 100)
                }

            }).catch(this.error)
        }

        //fault
        if (this.hasCapability('t7e_zg_fault')) {
            await this.thermostatCluster().readAttributes(["fault"]).then(value => {
                //this.log('++++++++++ fault report ', value)
                if (value.hasOwnProperty('fault')) {
                    let thefault = '0'
                    const faultValue = value['fault']
                    if (faultValue.length > 0) {
                        const res = faultValue.getBits();
                        thefault = res[res.length - 1];
                        ////this.log('@@@@ falut = ', res, thefault, res.length)
                        if (thefault === undefined) {
                            thefault = '0'
                        }
                    }
                    this.setCapabilityValue('t7e_zg_fault', thefault)
                }
            })
        }

        //others
        await this.thermostatCluster().readAttributes(['windowState', 'backlight', 'thermostatProgramOperModel', 'regulator', 'backlightSwitch', 'sensorMode']).then(value => {
            //this.log(`$$$$$$$$$$$$$$$$$$$$$$$ thermostat attrs = `, value)

            if (value.hasOwnProperty('windowState')) {
                this.setCapabilityValue('t7e_zg_window_state', value['windowState'] ? "opened" : "closed")
            }

            if (value.hasOwnProperty('backlight')) {
                this.setSettings({backlight: value['backlight'].toString()})
            }


            if (value.hasOwnProperty('thermostatProgramOperModel')) {
                try {
                    const res = value['thermostatProgramOperModel'].getBits();
                    this.log('--- App read attr: ', new Date(), res)
                    if (this.hasCapability('eco_mode')) {
                        this.setCapabilityValue('eco_mode', res.includes('eco') ? true : false).catch(this.error)
                        //this.log('-----set eco : ', res.includes('eco') ? true : false)
                    }
                } catch (ex) {
                }
            }

            if (value.hasOwnProperty('regulator')) {
                const regValue = value['regulator'].toString()
                this.setSettings({regulator: regValue})
            }

            if (value.hasOwnProperty('backlightSwitch')) {
                this.setSettings({window_check: value['backlightSwitch'] === true})
            }

            if (value.hasOwnProperty('sensorMode')) {
                this.setSettings({sensor_mode: value['sensorMode']})
                this._checkModeStatus(value['sensorMode'])
            }

        }).catch(this.error)


        await this.onoffCluster().readAttributes(['onOff']).then(async value => {
            ////this.log('$$$$$$$$$ onoff read: ', value)
            if (value.hasOwnProperty('onOff')) {
                this.setCapabilityValue('onoff', value.onOff)
            }
        })


        //kwh
        try {
            const {
                multiplier, divisor, currentSummationDelivered
            } = await this.zclNode.endpoints[this.getClusterEndpoint(
                CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
                ['multiplier', 'divisor', 'currentSummationDelivered'])

            if (multiplier && divisor) {
                this.meter_multiplier = multiplier / divisor;
            }

            this.setCapabilityValue('meter_power', this.meter_multiplier * currentSummationDelivered)

        } catch (error) {
        }

        //power
        try {
            const {
                acPowerMultiplier, acPowerDivisor, activePower
            } = await this.zclNode.endpoints[this.getClusterEndpoint(
                CLUSTER.ELECTRICAL_MEASUREMENT)].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
                ['acPowerMultiplier', 'acPowerDivisor', 'activePower'])

            if (acPowerMultiplier && acPowerDivisor) {
                this.power_multiplier = acPowerMultiplier / acPowerDivisor;
            }

            this.setCapabilityValue('measure_power', this.power_multiplier * activePower)

        } catch (error) {
        }
    }

    _setModeUI(mode) {
        if (mode === 'heat' || mode === 'cool') {
            this.setSettings({systemMode: mode})
            this.setStoreValue('last_system_mode', mode);
        }
    }

    async _getPowerKwh() {
        await this.meterCluster().readAttributes(['currentSummationDelivered']).then(value => {

            //this.log(`+++++++ 主动读 read meter kwh return: `, value)

        }).catch(this.error)

        await this.electricalMeasurementCluster().readAttributes(['activePower']).then(value => {

            //this.log(`+++++++ 主动读 read activePower w return: `, value)

        }).catch(this.error)
    }

    async _checkModeStatus(value) {
        //模式改变(A,F.... <-> P)
        //this.log('********* device cur mode: ', value)
        let changed = false
        let m = this.getStoreValue('sensor_mode') || 'a'
        this.log('_checkModeStatus+++++++++++++++++++++++++++++++', m, value)
        if ((m === 'p' || m === 'fp') && value !== 'p' && value !== 'fp') {
            changed = true
            this.setSettings({
                thermostat_regulator_mode: '0',
            });
        } else if ((m !== 'p' && m !== 'fp') && (value === 'p' || value === 'fp')) {
            changed = true
            this.setSettings({
                thermostat_regulator_mode: '1',
            });
        }

        if (changed == true) {
            this.setStoreValue('regulator_mode_changed', true)
        }
    }

    async _loopTipInfo() {


        try {

            //5分钟
            if (this.isOnline >= 5) {
                this.log('--device offline : ', this.isOnline)
                if (this.hasCapability("onoff")) {
                    this.setCapabilityValue('onoff', false)
                }
            }


            let modeChanged = this.getStoreValue('regulator_mode_changed') || false
            if (modeChanged === true) {
                ////this.log('--------mode changed: ', modeChanged, TIP_CHANGED)
                this.unsetWarning();
                this.showMessage(TIP_CHANGED)

            } else {
                await this._getAttributes()
            }

            //this._getLastStatus()

            //this._getPowerKwh()


        } catch (error) {
            this.isOnline += 1

            let errMsg = "-" + error

            //this.log('---------------loop error: ', error)
            if (errMsg.includes('node_object_not_found')) {
                this.setUnavailable('Perhaps device is left network')
                return
            }
            if (errMsg.includes('Device is not responding')) {
                this.setUnavailable('Device is not responding, make sure the device has power.')
                return
            }
            if (errMsg.includes('Missing Zigbee Node')) {
                this.setUnavailable('Perhaps device is left network')
                return
            }
        }

        this.homey.setTimeout(async () => {
            this._loopTipInfo()

        }, 60000);

    }


    error(msg, err) {
        this.log('xxx', msg, err)
        let errMsg = "-" + err

        //this.log('---------------loop error: ', error)
        if (errMsg.includes('node_object_not_found')) {
            this.setUnavailable('Perhaps device is left network')
        }
        if (errMsg.includes('Device is not responding')) {
            this.setUnavailable('Device is not responding, make sure the device has power.')
        }
        if (errMsg.includes('Missing Zigbee Node')) {
            this.setUnavailable('Perhaps device is left network')
        }
    }


    async updateSetpointTempLimit() {
        if (!this.hasCapability('target_temperature')) return

        let target_temp = this.getCapabilityValue('target_temperature')


        let min = this.target_temp_setpoint_min
        let max = this.target_temp_setpoint_max
        let step = 0.5

        let capOptions = {};
        this.log('--温度选项: old: ', capOptions);
        if ((min !== undefined ? min : capOptions.min) >= (max !== undefined ? max : capOptions.max)) {
            return
        }

        try {
            if (min || max || step) {
                capOptions.min = min
                capOptions.max = max
                capOptions.step = step
                capOptions.decimals = step >= 0.5 ? 1 : 2
                await this.setCapabilityOptions('target_temperature', capOptions).then(result => {
                    this.log('---set target_temperature min-max: OK ', capOptions)

                    //温度范围内控制更新
                    if (target_temp > max) {
                        this.setCapabilityValue('target_temperature', max)
                    }

                }).catch(error => {
                    this.log('---set target_temperature min-max: ', error)
                })
            }
        } catch (err) {
            this.log('updateSetpointTempLimit ERROR', err);
        }
    }

    async turnFrostRunListener(args, state) {
        this.log('HHHHHHHHHH++++++++++++++++++++++', args.frost,)
        await this.thermostatCluster()
        .writeAttributes({frost: args.frost})
        .then(() => {
            this.setCapabilityValue('frost', args.frost);
        })
    }

}


module.exports = t7e_zg_thermostat;
