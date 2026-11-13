import type { Color } from "../types/global.ts";

interface HidCollection {
  outputReports: { reportId: number }[];
  children: HidCollection[];
}

export interface LightbarDevice extends EventTarget {
  readonly opened: boolean;
  readonly productName: string;
  readonly collections: HidCollection[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: Uint8Array<ArrayBuffer>): Promise<void>;
}

export interface LightbarInputReportEvent extends Event {
  readonly device: LightbarDevice;
  readonly reportId: number;
  readonly data: DataView;
}

export interface LightbarHid extends EventTarget {
  requestDevice(options: {
    filters: { vendorId: number; productId: number }[];
  }): Promise<LightbarDevice[]>;
}

export function lightbarHid(): LightbarHid | undefined {
  return (navigator as Navigator & { hid?: LightbarHid }).hid;
}

function reportIds(collections: HidCollection[]): number[] {
  return collections.flatMap((collection) => [
    ...collection.outputReports.map((report) => report.reportId),
    ...reportIds(collection.children),
  ]);
}

export class DualSenseLightbar {
  readonly device: LightbarDevice;
  private readonly bluetooth: boolean;
  private sequence = 0;

  constructor(device: LightbarDevice) {
    this.device = device;
    const ids = reportIds(device.collections);
    if (!ids.includes(0x02) && !ids.includes(0x31)) {
      throw new Error("This device has no supported DualSense output report.");
    }
    this.bluetooth = !ids.includes(0x02);
  }

  private async send(common: Uint8Array<ArrayBuffer>) {
    const reportId = this.bluetooth ? 0x31 : 0x02;
    // WebHID sends the report ID separately from the payload.
    const payload = new Uint8Array(this.bluetooth ? 77 : 62);
    payload.set(common, this.bluetooth ? 2 : 0);
    if (this.bluetooth) {
      payload[0] = this.sequence << 4;
      this.sequence = (this.sequence + 1) % 16;
      payload[1] = 0x10;
      // Bluetooth CRC covers the output prefix, report ID, and all but the CRC.
      let crc = 0xffffffff;
      for (const byte of [0xa2, reportId, ...payload.subarray(0, 73)]) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) {
          crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
      }
      new DataView(payload.buffer).setUint32(73, (~crc) >>> 0, true);
    }
    await this.device.sendReport(reportId, payload);
  }

  async initialize() {
    if (!this.device.opened) await this.device.open();
    // Release the Bluetooth startup animation before programming RGB.
    const common = new Uint8Array(47);
    common[38] = 0x02;
    common[41] = 0x02;
    await this.send(common);
  }

  async setColor(color: Color) {
    const common = new Uint8Array(47);
    common[1] = 0x04;
    common.set(color, 44);
    await this.send(common);
  }

  async close() {
    if (this.device.opened) await this.device.close();
  }
}
