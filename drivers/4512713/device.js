'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

class MyRemote extends ZwaveDevice {

  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()

    this.registerCapability('measure_battery', 'BATTERY')

    this.registerReportListener('CENTRAL_SCENE',
      'CENTRAL_SCENE_NOTIFICATION', report => {

        this.log('CENTRAL_SCENE => report: ', report)

        if (report && report.hasOwnProperty('Scene Number')
          && report.hasOwnProperty('Properties1')
          && report.Properties1.hasOwnProperty('Key Attributes')) {

          const sceneNumber = report['Scene Number']
          const keyAttributes = report.Properties1['Key Attributes']

          if (keyAttributes === 'Key Pressed 1 time') {

            if (sceneNumber === 1) {

              this.driver.onFlowTrigger.trigger(this, null, null)
              this.homey.app.onButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'pressed' })

            } else if (sceneNumber === 2) {

              this.driver.offFlowTrigger.trigger(this, null, null)
              this.homey.app.offButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'pressed' })

            } else if (sceneNumber === 3) {

              this.driver.levelUpFlowTrigger.trigger(this, null, null)
              this.homey.app.brightnessTypeButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'pressed', 'type': 'up' })

            } else if (sceneNumber === 4) {

              this.driver.levelDownFlowTrigger.trigger(this, null, null)
              this.homey.app.brightnessTypeButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'pressed', 'type': 'down' })
            }

          } else if (keyAttributes === 'Key Held Down') {

            if (sceneNumber === 1) {

              this.driver.onKeyHeldDownFlowTrigger.trigger(this, null, null)
              this.homey.app.onButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'held_down' })

            } else if (sceneNumber === 2) {

              this.driver.offKeyHeldDownFlowTrigger.trigger(this, null, null)
              this.homey.app.offButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'held_down' })

            } else if (sceneNumber === 3) {

              this.driver.levelUpKeyHeldDownFlowTrigger.trigger(this, null,
                null)
              this.homey.app.brightnessTypeButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'held_down', 'type': 'up' })

            } else if (sceneNumber === 4) {

              this.driver.levelDownKeyHeldDownFlowTrigger.trigger(this, null,
                null)
              this.homey.app.brightnessTypeButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'held_down', 'type': 'down' })
            }

          } else if (keyAttributes === 'Key Released') {

            if (sceneNumber === 1) {

              this.driver.onKeyReleasedFlowTrigger.trigger(this, null, null)
              this.homey.app.onButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'released' })

            } else if (sceneNumber === 2) {

              this.driver.offKeyReleasedFlowTrigger.trigger(this, null, null)
              this.homey.app.offButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'released' })

            } else if (sceneNumber === 3) {

              this.driver.levelUpKeyReleasedFlowTrigger.trigger(this, null,
                null)
              this.homey.app.brightnessTypeButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'released', 'type': 'up' })

            } else if (sceneNumber === 4) {

              this.driver.levelDownKeyReleasedFlowTrigger.trigger(this, null,
                null)
              this.homey.app.brightnessTypeButtonModeTriggerCard.
                trigger(this, null, { 'mode': 'released', 'type': 'down' })
            }
          }
        }
      },
    )
  }

}

module.exports = MyRemote
