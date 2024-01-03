const {
    setConfiguratrion
} = require('./utils');

module.exports = {
    device: null,
    node: null,
    pu: 127,
    capability: 'regulator_percentage',
    init: function (device, node) {
        device.appkits['pu' + this.pu] = this;
        this.startReport(device);
        return this;
    },
    registerCapability: function () {
        return this;
    },

    startReport: function (device) {
        device.registerCapabilityListener(this.capability,
            async (payload) => {
                console.log('regulator_percentage SET 2:', payload);
                setConfiguratrion(device, null, this.pu, 4, false, payload * 100);
                device.setStoreValue('regulator_percentage', payload * 100);
                device.showMessage('Set ' + payload * 100 + '%');
            }
        );

        device.configurationGet({index: this.pu})
        .then((payload) => {
            device.log('+++++++++++++++++++configurationGet', payload)
            const mode = payload['Configuration Value (Raw)'];
            if (Buffer.isBuffer(mode)) {
                const vNew = mode.readIntBE(payload.Level.Size - 1, 1);
                device.log('+++++++++++++++++++vNew', vNew)
                device.setStoreValue('regulator_percentage', vNew / 100);
            }
        })

        return this;
    },
    setConfig: function (device, payload) {
        this.log('++++++++++++++++++setConfig', payload)
        setConfiguratrion(device, null, this.pu, 4, false, payload * 100);
    },

    update: function (device, payload, config) {
        if (!device.hasCapability('regulator_percentage')) return;

        let runModeCapValue = device.getCapabilityValue('regulator_percentage');
        let v = (Math.round(config / 10) * 10).toFixed(0);
        console.log('regulator_percentage REV:', runModeCapValue, config, v);
        let vNew = parseInt(v, 10);
        device.setStoreValue('regulator_percentage', vNew / 100);
        device.setCapabilityValue('regulator_percentage', vNew / 100);
    }
}  