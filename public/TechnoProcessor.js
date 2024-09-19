/**
 * @param {Float32Array} buffer
 */
function makeSomeTechno(buffer) {
	for (let i = 0; i < 128; i++) {
		let sample = Math.random() * 2 - 1;
		sample *= 0.02

		buffer[i] = sample
	}
}

// Define a phasor that runs from 0 to 1 at a given frequency
// float phasor(float phase, float freq) {
// 	phase += freq * SAMPLE_DUR; // Increment by one sample
// 	phase -= trunc(phase);      // When it reaches 1 go back to 0
// 	return phase;
// }

class TechnoProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
	}

	process(_inputs, outputs) {
		let buffer = new Float32Array(128)

		makeSomeTechno(buffer)

		outputs[0][0].set(buffer);
		return true;
	}
}

registerProcessor("techno-processor", TechnoProcessor);
