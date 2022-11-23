'use strict'

const { ZwaveLightDevice } = require('homey-zwavedriver')

class DimLight extends ZwaveLightDevice {

  cur_meter_power = 0;
  
  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()

    this.registerCapability('onoff', 'SWITCH_MULTILEVEL')
    this.registerCapability('dim', 'SWITCH_MULTILEVEL')
    this.registerCapability('measure_power', 'METER')
    this.registerCapability('meter_power', 'METER')

    this.registerReportListener('BASIC', 'BASIC_REPORT', report => {
      if (report && report.hasOwnProperty('Current Value')) {
        if (this.hasCapability('onoff')) this.setCapabilityValue('onoff',
          report['Current Value'] > 0)
        if (this.hasCapability('dim')) this.setCapabilityValue('dim',
          report['Current Value'] / 99)
      }
    })
    
    this.registerReportListener( 'METER', 'METER_REPORT',
      (payload) => {
        const Properties1 = payload['Properties1'] || {};
        const size = Properties1['Size'] || 4;
        const precision = Properties1['Precision'] || 2;

        const meterValue2 = payload['Meter Value'];
 
        if (Buffer.isBuffer(meterValue2)) {
          payload['Meter Value (Parsed)'] = meterValue2.readIntBE(0, size);
          payload['Meter Value (Parsed)'] /= 10 ** precision;
        }

        if (Properties1['Scale'] === 0) {
            this.cur_meter_power = payload['Meter Value (Parsed)'] || 0;
        } else { 
            this.cur_meter_power = payload['Meter Value (Parsed)'] || 0;
        }
      }
    );  


    setInterval(() => {
      this.calcu_kwh();
    }, 10000); 
    
  }
  
  calcu_kwh() {
    let kwh = this.getStoreValue('total_kwh') || 0;   
    let cur_meter_power = this.cur_meter_power;
    let kwh10s =  cur_meter_power / 1000 / 60 / 6;   
    kwh = kwh + kwh10s;
    this.setStoreValue('total_kwh', kwh); 
    this.setCapabilityValue('meter_power', kwh);  
  }

}

module.exports = DimLight
