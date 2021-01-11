'use strict'

const SrZigBeeDriver = require('../../lib/SrZigBeeDriver')

class MyDriver extends SrZigBeeDriver {

  onInit () {
    super.onInit()

    this._moveHueActionCard = this.getActionCard(
      '3802962_move_hue')
    this._moveHueActionCard.registerRunListener(async (args, state) => {
      return args.device.moveHueRunListener(args, state)
    })

    this._moveSaturationActionCard = this.getActionCard(
      '3802962_move_saturation')
    this._moveSaturationActionCard.registerRunListener(async (args, state) => {
      return args.device.moveSaturationRunListener(args, state)
    })

    this._levelStepActionCard = this.getActionCard('3802962_level_step_with_onoff')
    this._levelStepActionCard.registerRunListener((args, state) => {
      return args.device.levelStepRunListener(args, state)
    })

    this._levelMoveActionCard = this.getActionCard('3802962_level_move_with_onoff')
    this._levelMoveActionCard.registerRunListener((args, state) => {
      return args.device.levelMoveRunListener(args, state)
    })

    this._levelStopActionCard = this.getActionCard('3802962_level_stop_with_onoff')
    this._levelStopActionCard.registerRunListener((args, state) => {
      return args.device.levelStopRunListener(args, state)
    })

    this._stepColorTemperatureActionCard = this.getActionCard(
      '3802962_step_color_temperature')
    this._stepColorTemperatureActionCard.registerRunListener((args, state) => {
      return args.device.stepColorTemperatureRunListener(args, state)
    })

    this._moveColorTemperatureActionCard = this.getActionCard(
      '3802962_move_color_temperature')
    this._moveColorTemperatureActionCard.registerRunListener((args, state) => {
      return args.device.moveColorTemperatureRunListener(args, state)
    })

    this._stopMoveStepActionCard = this.getActionCard(
      '3802962_stop_move_step')
    this._stopMoveStepActionCard.registerRunListener((args, state) => {
      return args.device.stopMoveStepRunListener(args, state)
    })

    this._recallSceneActionCard = this.getActionCard('3802962_recall_scene')
    this._recallSceneActionCard.registerRunListener((args, state) => {
      return args.device.recallSceneRunListener(args, state)
    })

    this._storeSceneActionCard = this.getActionCard('3802962_store_scene')
    this._storeSceneActionCard.registerRunListener((args, state) => {
      return args.device.storeSceneRunListener(args, state)
    })
  }

}

module.exports = MyDriver
