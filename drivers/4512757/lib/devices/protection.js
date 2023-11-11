const {
    returnCapabilityValue,
    updateTempCapOptions,
    PuCapability
}                               = require('./utils');

module.exports = {

  startReport:function(device){
    console.log('T7E_ZV~~~~~~~~~~~~~~~PROTECTION_REPORT', 'start report ....');
    device.registerReportListener('PROTECTION', 'PROTECTION_REPORT',
      (payload) => {
        console.log('T7E_ZV~~~~~~~~~~~~~~~PROTECTION_REPORT', payload);

        let state = 0;
        const pu = payload['Level']['Local Protection State'];
        if (Buffer.isBuffer(pu)) {
          state = pu.readIntBE(0, 1);
        }
        else {
          state = pu;
        }

        if (state == 0){
            device.setCapabilityValue('child_lock', false);
        }
        else if (state == 1){
            device.setCapabilityValue('child_lock', true);
        }
    });
    console.log('T7E_ZV~~~~~~~~~~~~~~~PROTECTION_REPORT', 'end report ....');

  }
}
