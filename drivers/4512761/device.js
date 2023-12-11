'use strict'

const { ZigBeeDevice } = require('homey-zigbeedriver')
const { CLUSTER } = require('zigbee-clusters')

class MyLight extends ZigBeeDevice {

  async onNodeInit ({ zclNode, node }) {
    super.onNodeInit({ zclNode, node })

    const {
      divisor,
    } = await this.zclNode.endpoints[this.getClusterEndpoint(
      CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
      ['multiplier', 'divisor'] )
    this.log('divisor ' + divisor)
    let safeDivisor = divisor
    if (typeof divisor !== 'number' || divisor <= 0) {
      safeDivisor = 3600000
    }

    this.registerCapability('onoff', CLUSTER.ON_OFF)
    this.registerCapability('meter_power', CLUSTER.METERING, {
      get: 'currentSummationDelivered',
      report: 'currentSummationDelivered',
      reportParser: value => value / safeDivisor,
    })
    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
      get: 'activePower',
      report: 'activePower',
      reportParser: value => {
        return value / 10
      },
    })
  }

}

module.exports = MyLight
