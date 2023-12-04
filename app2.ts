import sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

import {Log} from 'homey-log';
import Homey from 'homey';
import {debug} from 'zigbee-clusters';
import TuyaThermostatDevice from './lib/TuyaThermostatDevice';

interface FlowActionArgs {
  device: TuyaThermostatDevice;
}

interface ModeFlowActionArgs extends FlowActionArgs {
  mode: string;
}

interface SensorTypeFlowActionArgs extends FlowActionArgs {
  type: string;
}

class ConnecteApp extends Homey.App {
  onInit(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.homeyLog = new Log({homey: this.homey});

    if (Homey.env.DEBUG_ZB === '1') {
      debug(true);
    }

    // Register flow conditions
    this.homey.flow.getConditionCard('tuya_thermostat_load_status_condition')
      .registerRunListener((args: FlowActionArgs) => {
        return args.device.getCapabilityValue('tuya_thermostat_load_status');
      });
    this.homey.flow.getConditionCard('set_tuya_child_lock_condition')
      .registerRunListener((args: FlowActionArgs) => {
        return args.device.getCapabilityValue('tuya_child_lock');
      });

    // Register flow actions
    this.homey.flow.getActionCard('set_tuya_thermostat_mode')
      .registerRunListener((args: ModeFlowActionArgs) => {
        this.logActionTrigger('set_tuya_thermostat_mode');
        args.device.setMode(Number(args.mode)).catch(this.error);
      });
    this.homey.flow.getActionCard('set_tuya_thermostat_sensor_type_changed')
      .registerRunListener((args: SensorTypeFlowActionArgs) => {
        this.logActionTrigger('set_tuya_thermostat_sensor_type_changed');
        args.device.setSensorType(Number(args.type)).catch(this.error);
      });
    this.homey.flow.getActionCard('set_tuya_child_lock_true')
      .registerRunListener((args: FlowActionArgs) => {
        this.logActionTrigger('set_tuya_child_lock_true');
        args.device.setChildLock(true).catch(this.error);
      });
    this.homey.flow.getActionCard('set_tuya_child_lock_false')
      .registerRunListener((args: FlowActionArgs) => {
        this.logActionTrigger('set_tuya_child_lock_false');
        args.device.setChildLock(false).catch(this.error);
      });
    this.homey.flow.getActionCard('toggle_tuya_child_lock')
      .registerRunListener((args: FlowActionArgs) => {
        this.logActionTrigger('toggle_tuya_child_lock');
        args.device.setChildLock(!args.device.getCapabilityValue('tuya_child_lock')).catch(this.error);
      });

    this.log('Connecte has been initialized');

    return Promise.resolve();
  }

  private logActionTrigger(action: string): void {
    this.log('Triggered flow action', action);
  }
}

module.exports = ConnecteApp;
