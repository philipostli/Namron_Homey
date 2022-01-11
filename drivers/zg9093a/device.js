'use strict'

const moment = require('moment-timezone')
const { ZigBeeDevice } = require('homey-zigbeedriver')
const { CLUSTER, Cluster } = require('zigbee-clusters')
const { getInt16 } = require('../../lib/SrUtils')
const SrTimeCluster = require('../../lib/SrTimeCluster')
const SrThermostatCluster = require('../../lib/SrThermostatCluster')
const SrThermostatBoundCluster = require('../../lib/SrThermostatBoundCluster')

Cluster.addCluster(SrTimeCluster)
Cluster.addCluster(SrThermostatCluster)

const timeDiffSeconds = 946684800

class ZG9093ADevice extends ZigBeeDevice {

  onNodeInit ({ zclNode, node }) {
    super.onNodeInit({ zclNode: zclNode, node: node })

    this.enableDebug()
    this.printNode()

    this._setUpSystemCapabilities().catch(this.error)
    this._setUpMeasureTemperatureCapability()
    this._setUpTargetTemperatureCapability()
    this._setUpModesCapability()

    this._setTime()
    this._getTime()
  }

  async onSettings ({ oldSettings, newSettings, changedKeys }) {

    this.log(`onSettings newSettings & changedKeys`, newSettings, changedKeys)

    this._setTime()
    this._setWeeklySchedule(newSettings)
  }

  _thermostatCluster () { return this.zclNode.endpoints[1].clusters.thermostat }

  _timeCluster () { return this.zclNode.endpoints[1].clusters.time }

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
          pollInterval: 60 * 60 * 1000, // ms
        },
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 10, // Minimally once every 5 minutes, second
            maxInterval: 60000, // Maximally once every ~16 hours
            minChange: 10,
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
          pollInterval: 60 * 60 * 1000, // unit ms, 5 minutes
        },
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 10, // Minimally once every 5 seconds
            maxInterval: 60000, // Maximally once every ~16 hours
            minChange: 10,
          },
        },
      })
    }

  }

  _setUpThermostatBoundCluster () {

    this.zclNode.endpoints[1].bind(CLUSTER.THERMOSTAT.NAME,
      new SrThermostatBoundCluster({
        onGetWeeklyScheduleResponse: payload => {
          this.log(`_onGetWeeklyScheduleResponse payload `, payload)
        },
        endpoint: 1,
      }))
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
        pollInterval: 60 * 60 * 1000, // unit ms, 5 minutes
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 10, // Minimally once every 5 seconds
          maxInterval: 60000, // Maximally once every ~16 hours
          minChange: 50,
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
        pollInterval: 60 * 60 * 1000, // unit ms, 5 minutes
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 10, // Minimally once every 5 seconds
          maxInterval: 60000, // Maximally once every ~16 hours
          minChange: 100,
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
        pollInterval: 60 * 60 * 1000, // unit ms, 5 minutes
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

  _setTime () {

    const timezone = this.homey.clock.getTimezone()
    const date1970Milliseconds = Date.now() + moment.tz(timezone).utcOffset() *
      60 * 1000
    const date2000Seconds = Math.floor(
      date1970Milliseconds / 1000 - timeDiffSeconds)
    this.log(`will set time `,
      new Date((date2000Seconds + timeDiffSeconds) * 1000))
    this._timeCluster().writeAttributes({
      time: date2000Seconds,
    }).then(() => {
      this.log(`set time success`)
    }).catch(err => {
      this.log(`set time error `, err)
    })

  }

  _getTime () {

    this._timeCluster().readAttributes('time').then(value => {
      this.log(`get time `, value,
        new Date((value.time + timeDiffSeconds) * 1000))
    }).catch(err => {
      this.log(`get time error`)
    })
  }

  _getWeeklySchedule () {

    let payload = {
      daysToReturn: ['fri'],
      modeToReturn: ['heat'],
    }

    this._thermostatCluster().getWeeklySchedule(payload).then(value => {
      this.log(`getWeeklySchedule success, `, value)
    }).catch(this.error)
  }

  _setWeeklySchedule (settings) {

    let dayOfWeek = this._getDayOfWeekWithSettings(settings)

    const payload = {
      numberOfTransition: 'four',
      dayOfWeek: dayOfWeek,
      mode: ['heat'],
      transitionTime1: this._getTransitionTimeWithSettings(settings, 'first'),
      heatSet1: this._getHeatSetWithSettings(settings, 'first'),
      transitionTime2: this._getTransitionTimeWithSettings(settings, 'second'),
      heatSet2: this._getHeatSetWithSettings(settings, 'second'),
      transitionTime3: this._getTransitionTimeWithSettings(settings, 'third'),
      heatSet3: this._getHeatSetWithSettings(settings, 'third'),
      transitionTime4: this._getTransitionTimeWithSettings(settings, 'fourth'),
      heatSet4: this._getHeatSetWithSettings(settings, 'fourth'),
    }
    this._thermostatCluster().setWeeklySchedule(payload).then(value => {
      this.log(`setWeeklySchedule `, value)
    }).catch(this.error)
  }

  _getDayOfWeekWithSettings (settings) {

    console.assert(settings.hasOwnProperty('repeat'), `no repeat`)

    let repeat = settings['repeat']

    switch (repeat) {
      case 'everyday':
        return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      case 'weekday':
        return ['mon', 'tue', 'wed', 'thu', 'fri']
      case 'weekend':
        return ['sun', 'sat']
      case 'sunday':
        return ['sun']
      case 'monday':
        return ['mon']
      case 'tuesday':
        return ['tue']
      case 'wednesday':
        return ['wed']
      case 'thursday':
        return ['thu']
      case 'friday':
        return ['fri']
      case 'saturday':
        return ['sat']
      default:
        break
    }

    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  }

  _getTransitionTimeWithSettings (settings, leading) {

    let hourKey = `${leading}_hour`
    let minuteKey = `${leading}_minute`

    console.assert(settings.hasOwnProperty(hourKey), `no ${hourKey}`)
    console.assert(settings.hasOwnProperty(minuteKey), `no ${minuteKey}`)

    let hour = settings[hourKey]
    let minute = settings[minuteKey]
    return hour * 60 + minute
  }

  _getHeatSetWithSettings (settings, leading) {

    let targetKey = `${leading}_target`
    console.assert(settings.hasOwnProperty(targetKey), `no ${targetKey}`)

    return settings[targetKey] * 100.0
  }

}

module.exports = ZG9093ADevice
