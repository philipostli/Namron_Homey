'use strict'

const SrZigBeeDriver = require('../../lib/SrZigBeeDriver')

class MyDriver extends SrZigBeeDriver {

  async onInit() {

    const card = this.homey.flow.getActionCard('change_regulator_cycle_time');
    card.registerRunListener( async (args) => {
        args.device.setSettings({regulatorCycleTime: String(this.tuya.readEnum(args.cycle_time))}).catch(this.error);
    });

  }

}

module.exports = MyDriver