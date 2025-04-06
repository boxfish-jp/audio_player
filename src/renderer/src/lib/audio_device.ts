export interface AudioDevice {
    deviceId: string;
    label: string;
    kind: MediaDeviceKind;
  }
  
  export class AudioDeviceManager {
    private static _instance: AudioDeviceManager;
    private _audioOutputDevices: AudioDevice[] = [];
    
    private constructor() {}
    
    static instance() {
      if (!AudioDeviceManager._instance) {
        AudioDeviceManager._instance = new AudioDeviceManager();
      }
      return AudioDeviceManager._instance;
    }
    
    async refreshDevices(): Promise<AudioDevice[]> {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this._audioOutputDevices = devices
          .filter(device => device.kind === 'audiooutput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `出力デバイス (${device.deviceId})`,
            kind: device.kind
          }));
        return this._audioOutputDevices;
      } catch (error) {
        console.error('オーディオデバイスの取得に失敗しました:', error);
        return [];
      }
    }
    
    getOutputDevices(): AudioDevice[] {
      return this._audioOutputDevices;
    }
    
    getDefaultDevice(): AudioDevice | undefined {
      return this._audioOutputDevices.find(device => device.deviceId === 'default');
    }
  }