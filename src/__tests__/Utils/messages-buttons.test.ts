import type { MessageContentGenerationOptions } from '../../Types'
import { generateWAMessageContent } from '../../Utils/messages'

const baseOptions: MessageContentGenerationOptions = {
	upload: async () => {
		throw new Error('upload should not be called for a buttons message')
	}
}

describe('generateWAMessageContent with buttons', () => {
	it('builds an interactiveMessage with a nativeFlowMessage for quick-reply buttons', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Pilih kategori:',
				footer: 'Mahiru Store',
				buttons: [
					{ id: 'store:layanan:media', displayText: 'Media' },
					{ id: 'store:layanan:apk', displayText: 'APK' }
				]
			},
			baseOptions
		)

		const interactive = content.interactiveMessage
		expect(interactive).toBeDefined()
		expect(interactive?.body?.text).toBe('Pilih kategori:')
		expect(interactive?.footer?.text).toBe('Mahiru Store')

		const flow = interactive?.nativeFlowMessage
		expect(flow?.messageVersion).toBe(1)
		expect(flow?.buttons).toHaveLength(2)
		expect(flow?.buttons?.[0]?.name).toBe('quick_reply')
		expect(JSON.parse(flow?.buttons?.[0]?.buttonParamsJson || '{}')).toEqual({
			display_text: 'Media',
			id: 'store:layanan:media'
		})
		expect(JSON.parse(flow?.buttons?.[1]?.buttonParamsJson || '{}')).toEqual({
			display_text: 'APK',
			id: 'store:layanan:apk'
		})
	})

	it('omits the footer when none is given', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Sudah bayar?',
				buttons: [{ id: 'done:1', displayText: 'Selesai' }]
			},
			baseOptions
		)

		expect(content.interactiveMessage?.body?.text).toBe('Sudah bayar?')
		expect(content.interactiveMessage?.footer).toBeNull()
		expect(content.interactiveMessage?.nativeFlowMessage?.buttons).toHaveLength(1)
	})

	it('rejects an empty buttons array', async () => {
		await expect(generateWAMessageContent({ text: 'Pilih:', buttons: [] }, baseOptions)).rejects.toMatchObject({
			output: { statusCode: 400 }
		})
	})

	it('rejects more than 3 buttons', async () => {
		await expect(
			generateWAMessageContent(
				{
					text: 'Pilih:',
					buttons: [
						{ id: 'b1', displayText: 'Satu' },
						{ id: 'b2', displayText: 'Dua' },
						{ id: 'b3', displayText: 'Tiga' },
						{ id: 'b4', displayText: 'Empat' }
					]
				},
				baseOptions
			)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})

	it('still builds a plain text message without buttons', async () => {
		const content = await generateWAMessageContent({ text: 'halo' }, baseOptions)

		expect(content.extendedTextMessage?.text).toBe('halo')
		expect(content.interactiveMessage).toBeNull()
	})

	it('uploads an optional header image for a buttons message', async () => {
		const uploadOptions: MessageContentGenerationOptions = {
			upload: async () => ({ mediaUrl: 'https://example.com/media', directPath: '/v/test' })
		}
		// 1x1 JPEG
		const image = Buffer.from(
			'/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAAQABADAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AvwEf/9k=',
			'base64'
		)

		const content = await generateWAMessageContent(
			{
				text: 'Lihat gambar ini:',
				image,
				buttons: [{ id: 'img:ok', displayText: 'OK' }]
			},
			uploadOptions
		)

		const header = content.interactiveMessage?.header
		expect(header?.hasMediaAttachment).toBe(true)
		expect(header?.imageMessage?.url).toBe('https://example.com/media')
		expect(header?.imageMessage?.directPath).toBe('/v/test')
		expect(content.interactiveMessage?.body?.text).toBe('Lihat gambar ini:')
		expect(content.interactiveMessage?.nativeFlowMessage?.buttons).toHaveLength(1)
	})

	it('uploads an optional header video for a buttons message', async () => {
		const uploadOptions: MessageContentGenerationOptions = {
			upload: async () => ({ mediaUrl: 'https://example.com/media', directPath: '/v/test' })
		}

		const content = await generateWAMessageContent(
			{
				text: 'Lihat video ini:',
				video: Buffer.from('fake-mp4-bytes'),
				buttons: [{ id: 'vid:ok', displayText: 'OK' }]
			},
			uploadOptions
		)

		const header = content.interactiveMessage?.header
		expect(header?.hasMediaAttachment).toBe(true)
		expect(header?.videoMessage?.url).toBe('https://example.com/media')
		expect(header?.videoMessage?.directPath).toBe('/v/test')
		expect(content.interactiveMessage?.body?.text).toBe('Lihat video ini:')
		expect(content.interactiveMessage?.nativeFlowMessage?.buttons).toHaveLength(1)
	})

	it('rejects a buttons message with both image and video headers', async () => {
		await expect(
			generateWAMessageContent(
				{
					text: 'Pilih:',
					image: Buffer.from('fake-jpeg-bytes'),
					video: Buffer.from('fake-mp4-bytes'),
					buttons: [{ id: 'b1', displayText: 'Satu' }]
				},
				baseOptions
			)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})
})

describe('generateWAMessageContent with list', () => {
	const listMessage = {
		text: 'Pilih medsos:',
		footer: 'Mahiru Store',
		list: {
			title: 'Pilih medsos',
			buttonText: 'Pilih medsos',
			sections: [
				{
					title: 'Sosial Media',
					rows: [
						{ id: 'store:platform:tiktok', title: 'TikTok', description: '2.422 layanan' },
						{ id: 'store:platform:instagram', title: 'Instagram' }
					]
				}
			]
		}
	}

	it('builds an interactiveMessage with a single_select native-flow button', async () => {
		const content = await generateWAMessageContent(listMessage, baseOptions)

		const interactive = content.interactiveMessage
		expect(interactive).toBeDefined()
		expect(interactive?.body?.text).toBe('Pilih medsos:')
		expect(interactive?.footer?.text).toBe('Mahiru Store')

		const flow = interactive?.nativeFlowMessage
		expect(flow?.messageVersion).toBe(1)
		expect(flow?.buttons).toHaveLength(1)
		expect(flow?.buttons?.[0]?.name).toBe('single_select')
		expect(JSON.parse(flow?.buttons?.[0]?.buttonParamsJson || '{}')).toEqual({
			title: 'Pilih medsos',
			button_text: 'Pilih medsos',
			sections: [
				{
					title: 'Sosial Media',
					rows: [
						{ id: 'store:platform:tiktok', title: 'TikTok', description: '2.422 layanan' },
						{ id: 'store:platform:instagram', title: 'Instagram', description: '' }
					]
				}
			]
		})
	})

	it('rejects a list without sections', async () => {
		await expect(
			generateWAMessageContent(
				{ text: 'Pilih:', list: { title: 'Pilih', buttonText: 'Pilih', sections: [] } },
				baseOptions
			)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})

	it('rejects a section without rows', async () => {
		await expect(
			generateWAMessageContent(
				{
					text: 'Pilih:',
					list: { title: 'Pilih', buttonText: 'Pilih', sections: [{ title: 'Kosong', rows: [] }] }
				},
				baseOptions
			)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})

	it('uploads an optional header image for a list message', async () => {
		const uploadOptions: MessageContentGenerationOptions = {
			upload: async () => ({ mediaUrl: 'https://example.com/media', directPath: '/v/test' })
		}
		// 1x1 JPEG
		const image = Buffer.from(
			'/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAAQABADAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AvwEf/9k=',
			'base64'
		)

		const content = await generateWAMessageContent({ ...listMessage, image }, uploadOptions)

		const header = content.interactiveMessage?.header
		expect(header?.hasMediaAttachment).toBe(true)
		expect(header?.imageMessage?.url).toBe('https://example.com/media')
		expect(header?.imageMessage?.directPath).toBe('/v/test')
		expect(content.interactiveMessage?.body?.text).toBe('Pilih medsos:')
		expect(content.interactiveMessage?.nativeFlowMessage?.buttons?.[0]?.name).toBe('single_select')
	})

	it('uploads an optional header video for a list message', async () => {
		const uploadOptions: MessageContentGenerationOptions = {
			upload: async () => ({ mediaUrl: 'https://example.com/media', directPath: '/v/test' })
		}

		const content = await generateWAMessageContent(
			{ ...listMessage, video: Buffer.from('fake-mp4-bytes') },
			uploadOptions
		)

		const header = content.interactiveMessage?.header
		expect(header?.hasMediaAttachment).toBe(true)
		expect(header?.videoMessage?.url).toBe('https://example.com/media')
		expect(header?.videoMessage?.directPath).toBe('/v/test')
		expect(content.interactiveMessage?.body?.text).toBe('Pilih medsos:')
		expect(content.interactiveMessage?.nativeFlowMessage?.buttons?.[0]?.name).toBe('single_select')
	})

	it('rejects a list message with both image and video headers', async () => {
		await expect(
			generateWAMessageContent(
				{
					...listMessage,
					image: Buffer.from('fake-jpeg-bytes'),
					video: Buffer.from('fake-mp4-bytes')
				},
				baseOptions
			)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})
})
