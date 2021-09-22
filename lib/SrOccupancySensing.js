'use strict'

const { Cluster, ZCLDataTypes, zclTypes } = require(
  'zigbee-clusters')
const OccupancySensing = require(
  'zigbee-clusters/lib/clusters/occupancySensing')

class SrOccupancySensing extends OccupancySensing {

  static get COMMANDS () {
    return {
      setOccupancy: {
        id: 0,
        args: {
          value: ZCLDataTypes.map8('occupied'),
        },
      },
    }
  }

}

module.exports = SrOccupancySensing
