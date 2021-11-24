'use strict'

const { ZigBeeDevice } = require('homey-zigbeedriver')
const { CLUSTER, Cluster } = require('zigbee-clusters')
const { getInt16 } = require('../../lib/SrUtils')
const SrTimeCluster = require('../../lib/SrTimeCluster')
const SrThermostatCluster = require('../../lib/SrThermostatCluster')

Cluster.addCluster(SrTimeCluster)
Cluster.addCluster(SrThermostatCluster)

class ZG9093ADevice extends ZigBeeDevice {

  onNodeInit ({ zclNode, node }) {
    super.onNodeInit({ zclNode: zclNode, node: node })

    this.enableDebug()
    this.printNode()

    this._setUpSystemCapabilities().catch(this.error)
    this._setUpMeasureTemperatureCapability()
    this._setUpTargetTemperatureCapability()
    this._setUpModesCapability()

    this._readLocalTime()
  }

  _thermostatCluster () { return this.zclNode.endpoints[1].clusters.thermostat }

  async _setUpSystemCapabilities () {

    // onoff
    this.registerCapabilityListener('onoff', isOn => {

      this._thermostatCluster().writeAttributes({
        systemMode: isOn ? 'heat' : 'off',
      }).catch(this.error)
    })

    // meter_power
    if (this.hasCapability('meter_power')) {

      const {
        divisor,
      } = await this.zclNode.endpoints[this.getClusterEndpoint(
        CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
        'multiplier', 'divisor')
      this.log('divisor ' + divisor)

      this.registerCapability('meter_power', CLUSTER.METERING, {
        get: 'currentSummationDelivered',
        report: 'currentSummationDelivered',
        reportParser: value => {

          this.log(`currentSummationDelivered `, value)
          return value / divisor
        },
        getOpts: {
          getOnStart: true,
          pollInterval: 300000, // ms
        },
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 300, // Minimally once every 5 minutes, second
            maxInterval: 60000, // Maximally once every ~16 hours
            minChange: 1,
          },
        },
      })
    }

    // measure_power
    if (this.hasCapability('measure_power')) {

      this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
        get: 'activePower',
        report: 'activePower',
        reportParser: value => {

          return value / 10
        },
        getOpts: {
          getOnStart: true,
          pollInterval: 60000,
        },
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 300, // Minimally once every 5 seconds
            maxInterval: 60000, // Maximally once every ~16 hours
            minChange: 1,
          },
        },
      })
    }

  }

  _setUpMeasureTemperatureCapability () {

    this.registerCapability('measure_temperature', CLUSTER.THERMOSTAT, {
      get: 'localTemperature',
      report: 'localTemperature',
      reportParser: value => {

        let temp = parseFloat((getInt16(value) / 100).toFixed(1))
        this.log(`localTemperature report `, value)
        return temp
      },
      getOpts: {
        getOnStart: true,
        pollInterval: 60000,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 300, // Minimally once every 5 seconds
          maxInterval: 60000, // Maximally once every ~16 hours
          minChange: 1,
        },
      },
    })
  }

  _setUpTargetTemperatureCapability () {

    this.registerCapability('target_temperature', CLUSTER.THERMOSTAT, {
      get: 'occupiedHeatingSetpoint',
      report: 'occupiedHeatingSetpoint',
      reportParser: value => {

        let temp = parseFloat((getInt16(value) / 100).toFixed(1))
        this.log(`occupiedHeatingSetpoint report `, value)
        return temp
      },
      getOpts: {
        getOnStart: true,
        pollInterval: 60000,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 300, // Minimally once every 5 seconds
          maxInterval: 60000, // Maximally once every ~16 hours
          minChange: 1,
        },
      },
      set: 'occupiedHeatingSetpoint',
      setParser: value => {

        this.log(`occupiedHeatingSetpoint setParser `, value)
        let payload = {
          occupiedHeatingSetpoint: value * 100,
        }
        this._thermostatCluster().writeAttributes(payload).catch(this.error)
        return null
      },
    })
  }

  _setUpModesCapability () {

    this.registerCapability('zg9030a_modes', CLUSTER.THERMOSTAT, {
      get: 'systemMode',
      getOpts: {
        getOnStart: true,
        pollInterval: 60000,
      },
      set: 'systemMode',
      setParser: value => {

        this.log(`systemMode set `, value)
        let payload = {
          systemMode: value,
        }
        this._thermostatCluster().writeAttributes(payload).catch(this.error)
        return null
      },
      report: 'systemMode',
      reportParser: value => {

        // Refresh onoff
        let isOn = value != 'off'
        this.setCapabilityValue('onoff', isOn).catch(this.error)

        if (isOn === false) {

          this.setCapabilityValue('target_temperature', 5)

        } else {

          // Refresh heating setpoint
          this._thermostatCluster().
            readAttributes('occupiedHeatingSetpoint').
            then(value => {

              this.log(`occupiedHeatingSetpoint after mode `, value)
              const temp = parseFloat(
                (value['occupiedHeatingSetpoint'] / 100).toFixed(1))
              return this.setCapabilityValue('target_temperature', temp)
            }).
            catch(this.error)
        }

        this.log(`systemMode report `, value)
        return value
      },
    })
  }

  _readLocalTime () {

    this._getWeeklySchedule()
    this._setWeeklySchedule()
  }

  _getWeeklySchedule () {

    let payload = {
      daysToReturn: 0x7F,
      modeToReturn: 1,
    }

    this._thermostatCluster().getWeeklySchedule(payload).then(value => {
      this.log(`getWeeklySchedule `, value)
    }).catch(this.error)
  }

  _setWeeklySchedule () {

    let payload = {
      numberOfTransition: 4,
      dayOfWeek: 0x7F,
      mode: 1,
      transitionTime1: 360,
      heatSet1: 1100,
      transitionTime2: 720,
      heatSet2: 1200,
      transitionTime3: 1080,
      heatSet3: 1300,
      transitionTime4: 1440,
      heatSet4: 1400,
    }
    this._thermostatCluster().setWeeklySchedule(payload).then(value => {
      this.log(`setWeeklySchedule `, value)
    }).catch(this.error)
  }

}

module.exports = ZG9093ADevice
