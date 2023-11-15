const {
    returnCapabilityValue, 
    updateTempCapOptions,
    PuCapability
}                               = require('./utils');
  
module.exports = { 
  startReport:function(device){
    device.registerReportListener('CONFIGURATION', 'CONFIGURATION_REPORT', 
      (payload) => { 
        //console.log('d', '');console.log('d', '');console.log('d', '');
        //console.log('d', '~~~~~~~~~~~~~~~CONFIGURATION_REPORT', payload);
        //console.log('d', '');console.log('d', '');console.log('d', '');
        const pu = payload['Parameter Number (Raw)']; 
        const puInt = payload['Parameter Number'];
        const level = payload['Level (Raw)'];
        const levelInt = level.readIntBE(0, 1);
        const config = payload['Configuration Value (Raw)'];
        const configInt = config.readIntBE(0, levelInt);
         
        if (Buffer.isBuffer(pu)) { 
          var obj = device.appkits['pu'+puInt];
          //console.log('CONFIGURATION->update pu=', puInt, pu, obj);
          if (obj != undefined){
            obj['update'].call(this, device, payload, configInt);
          } 
      }
    });
  }
} 
 