'use strict'

const { ZwaveLightDevice } = require('homey-zwavedriver')

class SwitchLight extends ZwaveLightDevice {

  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()

    this.registerCapability('onoff', 'SWITCH_BINARY')
    this.registerCapability('measure_power', 'METER')
    this.registerCapability('meter_power', 'METER')
  }

}

module.exports = SwitchLight
