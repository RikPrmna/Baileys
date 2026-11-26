import { getNormalizeAudioCommand, normalizeAudioMedia } from '../../Utils/messages-media'

/** builds a minimal valid WAV buffer (mono 16-bit PCM sine tone) */
const makeWavBuffer = (seconds = 0.5, sampleRate = 8000) => {
	const numSamples = Math.floor(seconds * sampleRate)
	const dataSize = numSamples * 2
	const buffer = Buffer.alloc(44 + dataSize)
	buffer.write('RIFF', 0)
	buffer.writeUInt32LE(36 + dataSize, 4)
	buffer.write('WAVE', 8)
	buffer.write('fmt ', 12)
	buffer.writeUInt32LE(16, 16)
	buffer.writeUInt16LE(1, 20) // PCM
	buffer.writeUInt16LE(1, 22) // mono
	buffer.writeUInt32LE(sampleRate, 24)
	buffer.writeUInt32LE(sampleRate * 2, 28)
	buffer.writeUInt16LE(2, 32)
	buffer.writeUInt16LE(16, 34)
	buffer.write('data', 36)
	buffer.writeUInt32LE(dataSize, 40)
	for (let i = 0; i < numSamples; i++) {
		const sample = Math.floor(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 16000)
		buffer.writeInt16LE(sample, 44 + i * 2)
	}

	return buffer
}

describe('audio loudness normalization', () => {
	it('builds an ffmpeg loudnorm command targeting ogg/opus', () => {
		const cmd = getNormalizeAudioCommand('/tmp/in.wav', '/tmp/out.ogg')
		expect(cmd).toContain('ffmpeg -i /tmp/in.wav')
		expect(cmd).toContain('loudnorm=I=-16:TP=-1.5:LRA=11')
		expect(cmd).toContain('-c:a libopus')
		expect(cmd).toContain('/tmp/out.ogg')
	})

	it('normalizes a valid audio buffer into a non-empty ogg/opus buffer', async () => {
		const input = makeWavBuffer()
		const result = await normalizeAudioMedia(input)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect((result as Buffer).length).toBeGreaterThan(0)
		// ogg container magic bytes
		expect((result as Buffer).subarray(0, 4).toString()).toBe('OggS')
	})

	it('falls back to the original buffer when the input is not valid audio', async () => {
		const input = Buffer.from('this is not audio data')
		const result = await normalizeAudioMedia(input)
		expect(result).toEqual(input)
	})
})
