import sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

const Homey = require('homey')

class MyApp extends Homey.App {

  onInit () {
    this.log('MyApp is running...')

    this.setUpZigbeeFlowTriggerCards()
    this.setUpZwaveFlowTriggerCards()

    this.setUpZwaveFlowActionCards()

    // const manifest = Homey.manifest
    // this.log(manifest.flow.triggers[6])
  }

  setUpZigbeeFlowTriggerCards () {

    this.switchButtonOnOffG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_switch_button_on_off_g4')
    this.switchButtonOnOffG4TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.mode === state.mode
      })

    this.saturationButtonModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_saturation_button_mode_g4')
    this.saturationButtonModeG4TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.mode === state.mode
      })

    this.hueMovedG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_hue_moved_g4')
    this.hueMovedG4TriggerCard.registerRunListener().registerRunListener(
      async (args, state) => {
        return args.group === state.group
      })

    this.sceneButtonModeG4S7TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_scene_button_mode_g4_s7')
    this.sceneButtonModeG4S7TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.scene === state.scene &&
          args.mode === state.mode
      })

    this.brightnessButtonTypeModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_brightness_button_type_mode_g4')
    this.brightnessButtonTypeModeG4TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.type === state.type &&
          args.mode === state.mode
      })

    this.whiteButtonTypeModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_white_button_type_mode_g4')
    this.whiteButtonTypeModeG4TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.type === state.type &&
          args.mode === state.mode
      })

    this.whiteMovedG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_white_moved_g4')
    this.whiteMovedG4TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group
      })

    this.onButtonPressedTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_on_button_pressed')
    this.onButtonPressedTriggerCard.registerRunListener(
      async (args, state) => {
        return true
      })

    this.offButtonPressedTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_off_button_pressed')
    this.offButtonPressedTriggerCard.registerRunListener(
      async (args, state) => {
        return true
      })

    this.brightnessTypeButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_brightness_type_button_mode')
    this.brightnessTypeButtonModeTriggerCard.registerRunListener(
      async (args, state) => {
        return args.type === state.type && args.mode === state.mode
      })

    this.switchButtonOnOffTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_switch_button_on_off')
    this.switchButtonOnOffTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode
      })

    this.brightnessButtonModeZgTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_brightness_button_mode_zg')
    this.brightnessButtonModeZgTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode
      })

    this.onButtonModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_on_button_mode_g4')
    this.onButtonModeG4TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.mode === state.mode
      })

    this.offButtonModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_off_button_mode_g4')
    this.offButtonModeG4TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.mode === state.mode
      })

    this.sceneButtonModeS2ZgTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_scene_button_mode_s2_zg')
    this.sceneButtonModeS2ZgTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode && args.scene === state.scene
      })

    this.onButtonModeG2TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_on_button_mode_g2')
    this.onButtonModeG2TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.mode === state.mode
      })

    this.offButtonModeG2TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_off_button_mode_g2')
    this.offButtonModeG2TriggerCard.registerRunListener(
      async (args, state) => {
        return args.group === state.group && args.mode === state.mode
      })

    this.brightnessMovedTriggerCard = this.homey.flow.getDeviceTriggerCard('sr_brightness_moved')
    this.brightnessMovedTriggerCard.registerRunListener(
      async (args, state) => {
        return true
      })

    this.hueMovedTriggerCard = this.homey.flow.getDeviceTriggerCard('sr_hue_moved')
    this.hueMovedTriggerCard.registerRunListener(
      async (args, state) => {
        return true
      })

    this.whiteMovedTriggerCard = this.homey.flow.getDeviceTriggerCard('sr_white_moved')
    this.whiteMovedTriggerCard.registerRunListener(
      async (args, state) => {
        return true
      })
  }

  setUpZwaveFlowTriggerCards () {

    this.brightnessButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_brightness_button_mode')
    this.brightnessButtonModeTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode
      })

    this.switchButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_switch_button_mode')
    this.switchButtonModeTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode
      })

    this.onButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_on_button_mode')
    this.onButtonModeTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode
      })

    this.offButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_off_button_mode')
    this.offButtonModeTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode
      })

    // 'sr_brightness_type_button_mode' exists in the Zigbee flow

    this.allOnButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_all_on_button_mode')
    this.allOnButtonModeTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode
      })

    this.allOffButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_all_off_button_mode')
    this.allOffButtonModeTriggerCard.registerRunListener(
      async (args, state) => {
        return args.mode === state.mode
      })

    // 'sr_on_button_mode_g4' exists in the Zigbee flow
    // 'sr_off_button_mode_g4' exists in the Zigbee flow

    this.sceneButtonModeS2TriggerCard = this.homey.flow.getDeviceTriggerCard(
      'sr_scene_button_mode_s2')
    this.sceneButtonModeS2TriggerCard.registerRunListener(
      async (args, state) => {
        return args.scene === state.scene && args.mode === state.mode
      })

    // 'sr_on_button_mode_g2' exists in the Zigbee flow
    // 'sr_off_button_mode_g2' exists in the Zigbee flow
  }

  setUpZwaveFlowActionCards() {

    this.zwStartDimChangeV4ActionCard = this.homey.flow.getActionCard('sr_zw_start_dim_change_v4')
    this.zwStartDimChangeV4ActionCard.registerRunListener(async (args, state) => {
      return args.device.startDimChange(args, state)
    })

    this.zwStopDimChangeActionCard = this.homey.flow.getActionCard('sr_zw_stop_dim_change')
    this.zwStopDimChangeActionCard.registerRunListener(async (args, state) => {
      return args.device.stopDimChange(args, state)
    })
  }

}

module.exports = MyApp
