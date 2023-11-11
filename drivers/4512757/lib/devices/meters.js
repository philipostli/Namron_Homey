module.exports = {
    init: function (device) {
        this.registerCapability(device)
    },
    registerCapability: function (device) {
        device.registerCapability('meter_power', 'METER');
    },
    startReport: function (device) {
        device.registerReportListener('METER', 'METER_REPORT',
            (payload) => {
                device.log('---- METER_REPORT: ', payload)
                //device.log('The data has been processed: ', payload)
                //The data has been processed
                //device.setCapabilityValue('meter_power', payload['Meter Value (Parsed)']); 
            }
        );
    },
}
