/**
 * Voice Activity Detector that uses frequency domain analysis to detect speech
 * @class
 */
export class VoiceActivityDetector {
  /**
   * Creates a new VoiceActivityDetector
   * @param {{
   *   energyThreshold?: number,
   *   minSpeechFrames?: number,
   *   minSilenceFrames?: number,
   *   smoothingTimeConstant?: number
   * }} options
   */
  constructor({
    energyThreshold = 0.2,
    minSpeechFrames = 5,
    minSilenceFrames = 10,
    smoothingTimeConstant = 0.1
  } = {}) {
    this.energyThreshold = energyThreshold;
    this.minSpeechFrames = minSpeechFrames;
    this.minSilenceFrames = minSilenceFrames;
    this.smoothingTimeConstant = smoothingTimeConstant;
    this.consecutiveSpeechFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.isSpeaking = false;
    this.smoothedEnergy = 0;
  }

  /**
   * Process audio frequency data to detect voice activity
   * @param {Float32Array} frequencyData Normalized frequency domain data from AudioAnalysis
   * @returns {{isSpeaking: boolean, energy: number}}
   */
  process(frequencyData) {
    // Calculate average energy across all frequency bands
    const currentEnergy = Array.from(frequencyData).reduce((sum, value) => sum + value, 0) / frequencyData.length;
    
    // Apply smoothing to reduce false positives
    this.smoothedEnergy = this.smoothedEnergy * this.smoothingTimeConstant + 
                         currentEnergy * (1 - this.smoothingTimeConstant);

    // Check if energy is above threshold
    const isFrameActive = this.smoothedEnergy > this.energyThreshold;

    if (isFrameActive) {
      this.consecutiveSpeechFrames++;
      this.consecutiveSilenceFrames = 0;
      
      // If we've seen enough speech frames, mark as speaking
      if (!this.isSpeaking && this.consecutiveSpeechFrames >= this.minSpeechFrames) {
        this.isSpeaking = true;
      }
    } else {
      this.consecutiveSilenceFrames++;
      this.consecutiveSpeechFrames = 0;
      
      // If we've seen enough silence frames, mark as not speaking
      if (this.isSpeaking && this.consecutiveSilenceFrames >= this.minSilenceFrames) {
        this.isSpeaking = false;
      }
    }

    return {
      isSpeaking: this.isSpeaking,
      energy: this.smoothedEnergy
    };
  }

  /**
   * Reset the detector state
   */
  reset() {
    this.consecutiveSpeechFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.isSpeaking = false;
    this.smoothedEnergy = 0;
  }
}

globalThis.VoiceActivityDetector = VoiceActivityDetector;
