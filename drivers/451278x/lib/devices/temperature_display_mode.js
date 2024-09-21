'use strict'
module.exports = {
    async setConfig(device, payload) {

        if (device.hasCapability('sensor_mode')) {
            let mode = device.getCapabilityValue('sensor_mode');
            if (mode !== 'a') {
                await device.setWarning("In Regulator Heating mode, the temperature display mode cannot be switched.").catch(this.error);
                return
            }
        }
        let payload2 = {}

        //regulator set min
        payload2['temperatureDisplayMode'] = payload == 0 ? 'temperature_display_mode_c' : 'temperature_display_mode_f';

        device.thermostatUserInterfaceConfiguration().writeAttributes(payload2).then(() => {
            device.log('+++---temperatureDisplayMode set success', payload2)
            // device._start()
        }).catch(this.error)
    },

}