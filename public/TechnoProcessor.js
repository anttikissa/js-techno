const SAMPLERATE = 48000.0
const SAMPLE_DUR = 1.0 / SAMPLERATE // ~0.02ms
const TWO_PI = 6.2831853

// Define a phasor that runs from 0 to 1 at a given frequency
/**
 * @param {number} phase
 * @param {number} freq
 * @returns {number}
 */
function phasor(phase, freq) {
	phase += freq * SAMPLE_DUR // Increment by one sample
	phase -= Math.trunc(phase) // When it reaches 1 go back to 0
	return phase
}

/**
 * @param {number} t
 * @param {number} amp
 * @param {number} exp
 * @returns {number}
 */
function envelope(t, amp, exp) {
	let env = Math.pow(1.0 - t, exp) // Exponentially decay from 1 to 0
	env *= amp // Decay from amp to 0
	return env
}

let tSamples = 0 // Accumulated samples
let kickPhase = 0.0
let bassPhase = 0.0
let chordPhase1 = 0.0
let chordPhase2 = 0.0
let chordPhase3 = 0.0

/**
 * @param {Float32Array} buffer
 */
function makeSomeTechno(buffer) {
	for (let i = 0; i < 128; i++) {
		let tSeconds = tSamples++ * SAMPLE_DUR // Current time
		let tBeats = tSeconds * 2.0 // Current beat @ 120 BPM
		let tBeatFrac = tBeats - Math.trunc(tBeats) // Time within beat (0-1)
		let bar = tBeats / 4.0 // Current bar (in 4/4 time)
		let tSixteenths = tBeats * 4.0 // Current 16th note
		let tSixteenthFrac = tSixteenths - Math.trunc(tSixteenths) // Time within 16th (0-1)

		// Noise
		let noise = Math.random() * 2 - 1
		noise *= 0.005

		// Kick
		let kickFreq = 50.0 + envelope(tBeatFrac, 900.0, 50.0) // Freq decay 950->50Hz
		kickPhase = phasor(kickPhase, kickFreq)
		let kick = Math.sin(kickPhase * TWO_PI) // Sine wave
		kick *= envelope(tBeatFrac, 0.15, 3.0) // Shape the amplitude

		// Bass
		let bassFreq = 50.0 // Hz
		bassPhase = phasor(bassPhase, bassFreq)
		let bass = Math.sin(bassPhase * TWO_PI) // Sine wave
		bass = Math.tanh(bass * 1.5) // More saturation
		bass *= 0.2 - envelope(tBeatFrac, 0.2, 0.5) // "Sidechaining"

		let sample = noise + kick + bass
		let volume = 1

		// if (tSamples < 100) {
		// 	console.log('sample', sample)
		// }

		let abs = Math.abs(sample)
		let limit = 0.2
		if (abs > limit) {
			// console.log('clip at', tSamples, 'sample', sample)
			sample = Math.sign(sample) * limit
		}

		buffer[i] = sample * volume
	}
}

class TechnoProcessor extends AudioWorkletProcessor {
	constructor() {
		super()
	}

	process(_inputs, outputs) {
		let buffer = new Float32Array(128)

		makeSomeTechno(buffer)

		outputs[0][0].set(buffer)
		return true
	}
}

registerProcessor('techno-processor', TechnoProcessor)
