import Homey from 'homey';
import { API } from './api/blauhoff';

class BlauhoffBattery extends Homey.Device {

  api: API = new API(this);

  getSettings = (): { accessId: string; accessToken: string; userToken: string } => {
    const { accessId, accessToken, userToken } = this.getSettings();
    return {
      accessId,
      accessToken,
      userToken,
    };
  }

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('BlauhoffBattery has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('BlauhoffBattery has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('BlauhoffBattery settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('BlauhoffBattery was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('BlauhoffBattery has been deleted');
  }

}

module.exports = BlauhoffBattery;
