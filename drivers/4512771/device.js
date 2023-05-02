'use strict'

const { ZigBeeDevice } = require('homey-zigbeedriver')

const { CLUSTER, Cluster } = require('zigbee-clusters')

/*
    1030, 0x0406, Occupancy Sensing, endpoint 1
    1280, 0x0500, IAS Zone, endpoint 2
    1026, 0x0402, Temperature Sensor, endpoint 3
    1029, 0x0405, Humidity, endpoint 4
    1024, 0x0400, Illuminance, endpoint 5
 */
class Sensor_4512771 extends ZigBeeDevice {

  onNodeInit ({ zclNode }) {

    // this.enableDebug()
    // this.printNode()

    if (this.hasCapability('alarm_battery')) {
      this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION)
    }

    if (this.hasCapability('measure_battery')) {
      this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION)
    }

    if (this.hasCapability('alarm_motion')) {
      this.registerCapability('alarm_motion', CLUSTER.OCCUPANCY_SENSING, {
        get: 'occupancy',
        report: 'occupancy',
        reportParser (value) {
          const newValue = value['occupied']
          if (typeof newValue === 'boolean') { return newValue }
          return false
        },
      })
    }

    if (this.hasCapability('measure_temperature')) {
      this.registerCapability('measure_temperature',
        CLUSTER.TEMPERATURE_MEASUREMENT)
    }

    if (this.hasCapability('measure_humidity')) {
      this.registerCapability('measure_humidity',
        CLUSTER.RELATIVE_HUMIDITY_MEASUREMENT)
    }

    if (this.hasCapability('measure_luminance')) {
      this.registerCapability('measure_luminance',
        CLUSTER.ILLUMINANCE_MEASUREMENT)
    }
  }

}

module.exports = Sensor_4512771

