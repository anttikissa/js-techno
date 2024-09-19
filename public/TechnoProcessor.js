/**
 * @param {Float32Array} buffer
 */
function makeSomeTechno(buffer) {
	for (let i = 0; i < 128; i++) {
		let sample = Math.random() * 2 - 1;
		sample *= 0.05

		buffer[i] = sample
	}
}

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
