const convert = require('color-convert');

// {"0": 255, "1": 0, "2": 244, "3": 255}
// Channel 4c-1
module.exports = class plibAnim {
  static convertToDMX(step, isLed) {
    const DEVICE_MAP = {
      1: 0, // d.001
      2: 400 // d.400
    };
    
    let deviceId = DEVICE_MAP[step.deviceId] || 0;
    let convertedOpacity, convertedColor, dmxFormat = {};

    if (step.to.opacity === 0) {
      convertedOpacity = 0;
      convertedColor = [0, 0, 0];
    } else {
      convertedColor = this._convertHexToRgb(step.to.color);
      convertedOpacity = this._convertOpacity(step.to.opacity);
    }

    if (!isLed) {
      dmxFormat[deviceId]   = convertedOpacity;
      dmxFormat[++deviceId] = convertedColor[0];
      dmxFormat[++deviceId] = convertedColor[1];
      dmxFormat[++deviceId] = convertedColor[2];
    } else {
      dmxFormat[deviceId] = convertedColor[0];
      dmxFormat[++deviceId] = convertedColor[1];
      dmxFormat[++deviceId] = convertedColor[2];
    }
    

    console.log('dmxFormat', dmxFormat);
    return dmxFormat;
  }

  static convertLedColorToDMX(channel,color) {
    let dmxFormat = {};
    let convertedColor = this._convertHexToRgb(color);
    console.log('convertedColor', convertedColor);

    dmxFormat[channel] = convertedColor[0];
    dmxFormat[++channel] = convertedColor[1];
    dmxFormat[++channel] = convertedColor[2];

    return dmxFormat;
  }

  static _convertOpacity(opacity) {
    return (opacity * 100) * 255 / 100;
  }

  static _convertHexToRgb(c) {
    if (this._validHex(c)) {
      return convert.hex.rgb(c);
    }
    return convert.keyword.rgb(c) || `Color "${c}" is invalid.`;
  }
  
  static _validHex(c) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(c);
  }
}
