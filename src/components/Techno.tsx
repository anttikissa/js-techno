import { log } from '~/lib/log'
import { isServer } from 'solid-js/web'

export default function Techno() {
	let ctx: AudioContext

	async function init() {
		if (ctx) {
			return
		}

		if (isServer) {
			throw new Error('should not run on server')
		}

		ctx = new AudioContext({ sampleRate: 48000 })
		await ctx.audioWorklet.addModule('TechnoProcessor.js')
		let worklet = new AudioWorkletNode(ctx, 'techno-processor')

		worklet.connect(ctx.destination)
	}

	async function play() {
		log('play')

		await init()
		await ctx.resume()
	}

	async function pause() {
		log('pause')

		await init()
		await ctx.suspend()
	}

	return (
		<div class="Techno">
			<button onClick={play}>Play</button>
			<button onClick={pause}>Pause</button>
		</div>
	)
}
