'use strict'
const { CLUSTER, Cluster } = require('zigbee-clusters')
const { 
  getOptBaseTime
}                               = require('./utils');
const getInt16 = function(number) {
  const int16 = new Int16Array(1)
  int16[0] = number
  return int16[0]
}
module.exports = {  
  init(device){ 
    this.registerCapability(device); 
  },
  registerCapability(device){ 

    if (!device.hasCapability('t7e_zg_regulator_percentage')) return
    
    device.registerCapability('t7e_zg_regulator_percentage', CLUSTER.THERMOSTAT, {
      get: 'pIHeatingDemand', report: 'pIHeatingDemand', reportParser: value => {

        //device.log(`+++++++++ Regulator report `, value)

        return value  

      }, getOpts: {
        getOnStart: true, 
        pollInterval: getOptBaseTime,  
        getOnOnline: true,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 0,  
          maxInterval: 300,  
          minChange: 1,
        },
      },
    })

    device.registerCapabilityListener('t7e_zg_regulator_percentage', async value => {

      //device.log(`========== regulator  set `, value)   

      let payload = {}
      payload['pIHeatingDemand'] = parseFloat(value)  
  
      //device.log('======set pIHeatingDemand payload : ', payload)

      device.thermostatCluster().writeAttributes(payload).catch(this.error)
       
      device.setStoreValue('t7e_zg_regulator_percentage', value);
      //throw new RangeError("Set " + value + "%")
   
      device.showMessage("Set " + value + "%")
       
    })  


  },  
}  