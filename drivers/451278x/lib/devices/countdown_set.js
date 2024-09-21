'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        payload2['countdown_set'] = (payload).toString()
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('+++++++++set countdown_set Success payload:', typeof payload, payload)
        }).catch(device.error)
    },
}