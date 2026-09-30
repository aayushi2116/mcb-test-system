import { IHardwareController } from './hardwareInterface';
import { MockHardwareController } from './mockHardwareService';

class HardwareServiceManager {
  private controller: IHardwareController;

  constructor() {
    // Current prototype uses MockHardwareController.
    // In future production environment, this can inspect an environment variable
    // (e.g. VITE_HARDWARE_MODE === 'PLC_USB') and instantiate RealHardwareController.
    this.controller = new MockHardwareController();
  }

  public getController(): IHardwareController {
    return this.controller;
  }

  public setController(customController: IHardwareController): void {
    this.controller = customController;
  }
}

export const hardwareService = new HardwareServiceManager().getController();
