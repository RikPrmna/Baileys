import { proto } from '../../../WAProto/index.js'
import type { MessageContentGenerationOptions } from '../../Types'
import { generateWAMessageContent } from '../../Utils/messages'

const baseOptions: MessageContentGenerationOptions = {
	upload: async () => {
		throw new Error('upload should not be called for a keep message')
	}
}

const key = {
	remoteJid: '1234567890@s.whatsapp.net',
	fromMe: false,
	id: 'ABCD1234'
}

describe('generateWAMessageContent with keep', () => {
	it('builds a keepInChatMessage defaulting to KEEP_FOR_ALL', async () => {
		const content = await generateWAMessageContent({ keep: key }, baseOptions)

		expect(content.keepInChatMessage).toBeDefined()
		expect(content.keepInChatMessage?.key).toEqual(key)
		expect(content.keepInChatMessage?.keepType).toBe(proto.KeepType.KEEP_FOR_ALL)
		expect(typeof content.keepInChatMessage?.timestampMs).toBe('number')
	})

	it('builds an UNDO_KEEP_FOR_ALL keepInChatMessage when requested', async () => {
		const content = await generateWAMessageContent(
			{ keep: key, keepType: proto.KeepType.UNDO_KEEP_FOR_ALL },
			baseOptions
		)

		expect(content.keepInChatMessage?.keepType).toBe(proto.KeepType.UNDO_KEEP_FOR_ALL)
	})

	it('rejects a keep key without an id', async () => {
		await expect(
			generateWAMessageContent({ keep: { remoteJid: '1234567890@s.whatsapp.net', fromMe: false } }, baseOptions)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})
})
