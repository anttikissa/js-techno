import { log } from '~/lib/log'
import { isServer } from 'solid-js/web'

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

export default function Techno() {
	let ctx: AudioContext

	let worklet: AudioWorkletNode

	async function addModule() {
		if (!ctx) {
			await init()
		}

		if (worklet) {
			worklet.disconnect()
		}

		await ctx.audioWorklet.addModule('TechnoProcessor.js')
		worklet = new AudioWorkletNode(ctx, 'techno-processor')
		worklet.connect(ctx.destination)
	}

	async function init() {
		if (ctx) {
			return
		}

		if (isServer) {
			throw new Error('should not run on server')
		}

		ctx = new AudioContext({ sampleRate: 48000 })
		await addModule()
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

	async function refresh() {
		// await sleep(200)

		// Reloading module doesn't work
		// await addModule()

		window.location.reload()
	}

	return (
		<div class="Techno">
			<button onClick={play}>Play</button>
			<button onClick={pause}>Pause</button>
			<button onClick={refresh}>Refresh</button>
		</div>
	)
}
