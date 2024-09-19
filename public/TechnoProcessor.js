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

let delayLine = new Float32Array(SAMPLERATE) // Store max 1 second of samples
let delayIndex = 0

/**
 * @param {number} input
 * @param {number} feedback
 * @param {number} delayTime
 * @returns {number}
 */
function processDelay(input, feedback, delayTime) {
	// Write current input retaining some of the previous output as feedback
	delayLine[delayIndex] = input + delayLine[delayIndex] * feedback
	delayIndex++ // Move to next sample
	delayIndex %= Math.floor(delayTime * SAMPLERATE) // Wrap if exceeding delay time
	return delayLine[delayIndex] // Read delayed output
}

// Rhythm pattern in sixteenth notes
// 1 = play chord, 0 = don't play chord
let chordPattern = [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0]

let tSamples = 0 // Accumulated samples
let kickPhase = 0.0
let bassPhase = 0.0
let chordPhase1 = 0.0
let chordPhase2 = 0.0
let chordPhase3 = 0.0

// Additive sawtooth wave
function saw6(phase) {
	return (
		Math.sin(phase) +
		Math.sin(phase * 2.0) * 0.5 +
		Math.sin(phase * 3.0) * 0.33 +
		Math.sin(phase * 4.0) * 0.25 +
		Math.sin(phase * 5.0) * 0.2 +
		Math.sin(phase * 6.0) * 0.16
	)
}

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

		// Chords
		let chordFreq = bassFreq * 4.0 // 200Hz, 2 octaves above bass
		if (bar % 4 === 2 || bar % 4 === 3) chordFreq *= 2.0 / 3.0 // Perfect 5th down
		chordPhase1 = phasor(chordPhase1, chordFreq)
		chordPhase2 = phasor(chordPhase2, (chordFreq * 3.0) / 2.0) // Perfect 5th
		chordPhase3 = phasor(chordPhase3, (chordFreq * 6.0) / 5.0) // Minor 3rd
		let chord =
			saw6(chordPhase1 * TWO_PI) +
			saw6(chordPhase2 * TWO_PI) +
			saw6(chordPhase3 * TWO_PI)
		let chordPatternIndex = (tSixteenths | 0) % 16 // 0-15
		let chordHit = chordPattern[chordPatternIndex] // 0 or 1 if chord should play
		chord *= envelope(tSixteenthFrac, 0.1, 3.0) * chordHit
		chord = chord + processDelay(chord, 0.5, 0.375) * 0.4 // Dotted 8th feedback delay

		// Collect stuff
		let sample = noise + kick + bass + chord
		let volume = 1

		// if (tSamples < 100) {
		// 	console.log('sample', sample)
		// }

		let abs = Math.abs(sample)
		let limit = 0.7
		if (abs > limit) {
			console.log('clip at', tSamples, 'sample', sample)
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
