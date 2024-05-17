'use strict'
module.exports = {
    setConfig(device, payload) {
        device.log('_____________set systemMode ', typeof payload, payload)
        let payload2 = {}
        payload2['systemMode'] = payload
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('_____________set systemMode success', typeof payload, payload)
            device.setStoreValue('last_system_mode', payload);
            // device.updateSetpointTempLimit()
        }).catch(device.error)
    },
}