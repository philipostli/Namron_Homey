'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

const CapabilityToThermostatSetpointType = {
  'manual_mode': 'Heating 1',
  'auto_mode': 'Energy Save Heating',
  'dry_mode': 'Dry Air',
  'off_mode': 'Heating 1',
  'away_mode': 'Away Heating',
}

const CapabilityToThermostatMode = {
  'manual_mode': 'Heat',
  'auto_mode': 'Energy Save Heat',
  'dry_mode': 'Dry Air',
  'off_mode': 'Off',
  'away_mode': 'AWAY',
}

const ThermostatModeToCapability = {
  'Heat': 'manual_mode',
  'Energy Save Heat': 'auto_mode',
  'Dry Air': 'dry_mode',
  'Off': 'off_mode',
  'AWAY': 'away_mode',
}

class MyThermostat extends ZwaveDevice {

  async onNodeInit ({ node }) {

    this.enableDebug()
    this.printNode()

    this.registerCapability('measure_power', 'METER')
    this.registerCapability('meter_power', 'METER')

    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT')
    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL')

    this.registerThermostatModeCapability()
  }

  registerThermostatModeCapability () {

    this.registerCapability('my_4512744_thermostat_mode', 'THERMOSTAT_MODE', {
      get: 'THERMOSTAT_MODE_GET',
      getOpts: {
        getOnStart: true,
      },
      set: 'THERMOSTAT_MODE_SET',
      setParser: (value) => {

        this.log('THERMOSTAT_MODE_SET ', value)
        if (!CapabilityToThermostatMode.hasOwnProperty(value)) {
          return null
        }
        const mode = CapabilityToThermostatMode[value]
        if (typeof mode !== 'string') {
          return null
        }

        if (CapabilityToThermostatSetpointType.hasOwnProperty(value)) {

          this.thermostatSetpointType = CapabilityToThermostatSetpointType[value]

          clearTimeout(this.refreshTargetTemperatureTimeout)
          this.refreshTargetTemperatureTimeout = setTimeout(() => {

            this.log('Refresh Capability Value')
            this.refreshCapabilityValue('target_temperature',
              'THERMOSTAT_SETPOINT')
          }, 1000)
        }

        return {
          'Level': {
            'No of Manufacturer Data fields': 0,
            'Mode': mode,
          },
          'Manufacturer Data': Buffer.from([]),
        }
      },
      report: 'THERMOSTAT_MODE_REPORT',
      reportParser: report => {

        this.log('CONFIGURATION_REPORT ', report)

        if (report
          && report.hasOwnProperty('Level')
          && report['Level'].hasOwnProperty('Mode')) {

          const mode = report['Level']['Mode']
          if (typeof mode === 'string' &&
            ThermostatModeToCapability.hasOwnProperty(mode)) {

            const capabilityMode = ThermostatModeToCapability[mode]
            this.log('Capability Mode ', capabilityMode)

            if (CapabilityToThermostatSetpointType.hasOwnProperty(capabilityMode)) {

              this.thermostatSetpointType = CapabilityToThermostatSetpointType[capabilityMode]

              clearTimeout(this.refreshTargetTemperatureTimeout)
              this.refreshTargetTemperatureTimeout = setTimeout(() => {

                this.log('Refresh Capability Value')
                this.refreshCapabilityValue('target_temperature',
                  'THERMOSTAT_SETPOINT')
              }, 1000)
            }

            return capabilityMode
          }
        }

        return null
      },
    })
  }

}

module.exports = MyThermostat
