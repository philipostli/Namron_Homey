const {
  returnCapabilityValue, 
  setupDevice 
}                               = require('./utils');

module.exports = {
    capability: 'switch',
    init:function(device, node){  
      this.registerCapability(device, node);
      return this;
    },
    switch_count:0,
    registerCapability:function(device, node){ 
      console.log('switch .....');
      //开关
      device.registerCapability('onoff', 'SWITCH_BINARY');
      device.registerReportListener(
        'SWITCH_BINARY',
        'SWITCH_BINARY_REPORT',
        (payload) => {
          console.log('开关:SWITCH_BINARY_REPORT', payload);
          if (payload['Current Value'] === 'on/enable') { 
          } else if (payload['Current Value'] === 'off/disable') { 
            device.setCapabilityValue('meter_power', 0.0); 
            device.setCapabilityValue('measure_power', 0.0);
          }

          //this.switch_count += 1;
          //if (this.switch_count % 2 == 0){
            let mode_changed = device.getStoreValue('regulator_mode_changed') || false;
            console.log('open switch', mode_changed);
            if (mode_changed){ 
              console.log('do change-restartApp:');
              device.restartApp(node);  
            }
          //} 

        }
      );
      return this;
    } 
}
