'use strict'

const HzcSwitch2GangZigBeeDevice = require('../../lib/SrSwitch2GangZigBeeDevice')

class s726_zg_smartplug_zb_Device extends HzcSwitch2GangZigBeeDevice {
  async onNodeInit ({ zclNode }) {
    
    super.onNodeInit( { zclNode })

    
    this.app_inited = false
    this.params = {}

    
    await this.addCapability('onoff'); 
    await this.addCapability('meter_power'); 
    await this.addCapability('measure_power');
    //await this.addCapability('s726_zg_voltage_overload_alarm')  
    //await this.addCapability('s726_zg_current_overload_alarm')
    //await this.addCapability('alarm_contact')

    await this.addCapability('rms_voltage')
    await this.addCapability('rms_current')

    await this.addCapability('ac_alarm')
    await this.addCapability('device_temperature_alarm')
    
    await this.registerSwitchOnoff(1)
    await this.registerMeterPowerMeasurePower(1)

    await this.registerRmsVoltage(1)
    await this.registerRmsCurrent(1)

    //this.registerAlarm()
    this.registerAcAlarm()
    this.registerDeviceTemperatureAlarm()
 
    this._init_app() 
  } 
  

  onDeleted(){
		this.log("s726_zg_smartplug_zb_Device, channel ", " removed")
	} 
}

module.exports = s726_zg_smartplug_zb_Device;