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

describe('generateWAMessageContent with CTA buttons', () => {
	it('builds cta_url, cta_call and cta_copy buttons mixed with quick-reply', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Pesananmu siap dibayar:',
				buttons: [
					{ type: 'url', displayText: 'Bayar Sekarang', url: 'https://example.com/pay' },
					{ type: 'copy', displayText: 'Salin Kode', copyCode: 'ORD-123' },
					{ id: 'cek:123', displayText: 'Cek Status' }
				]
			},
			baseOptions
		)

		const flowButtons = content.interactiveMessage?.nativeFlowMessage?.buttons
		expect(flowButtons).toHaveLength(3)
		expect(flowButtons?.[0]?.name).toBe('cta_url')
		expect(JSON.parse(flowButtons?.[0]?.buttonParamsJson || '{}')).toEqual({
			display_text: 'Bayar Sekarang',
			url: 'https://example.com/pay'
		})
		expect(flowButtons?.[1]?.name).toBe('cta_copy')
		expect(JSON.parse(flowButtons?.[1]?.buttonParamsJson || '{}')).toEqual({
			display_text: 'Salin Kode',
			copy_code: 'ORD-123'
		})
		expect(flowButtons?.[2]?.name).toBe('quick_reply')
		expect(JSON.parse(flowButtons?.[2]?.buttonParamsJson || '{}')).toEqual({
			display_text: 'Cek Status',
			id: 'cek:123'
		})
	})

	it('builds a cta_call button', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Butuh bantuan?',
				buttons: [{ type: 'call', displayText: 'Hubungi Admin', phoneNumber: '6282130301023' }]
			},
			baseOptions
		)

		const flowButtons = content.interactiveMessage?.nativeFlowMessage?.buttons
		expect(flowButtons?.[0]?.name).toBe('cta_call')
		expect(JSON.parse(flowButtons?.[0]?.buttonParamsJson || '{}')).toEqual({
			display_text: 'Hubungi Admin',
			phone_number: '6282130301023'
		})
	})
})

describe('generateWAMessageContent with extended headers', () => {
	const uploadOptions: MessageContentGenerationOptions = {
		upload: async () => ({ mediaUrl: 'https://example.com/media', directPath: '/v/test' })
	}

	it('uploads an optional header document for a buttons message', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Lihat dokumen ini:',
				document: Buffer.from('fake-pdf-bytes'),
				buttons: [{ id: 'doc:ok', displayText: 'OK' }]
			},
			uploadOptions
		)

		const header = content.interactiveMessage?.header
		expect(header?.hasMediaAttachment).toBe(true)
		expect(header?.documentMessage?.url).toBe('https://example.com/media')
	})

	it('sets a header location without uploading', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Kita ketemu di sini:',
				location: { degreesLatitude: -6.2, degreesLongitude: 106.8, name: 'Jakarta' },
				buttons: [{ id: 'loc:ok', displayText: 'OK' }]
			},
			baseOptions
		)

		const header = content.interactiveMessage?.header
		expect(header?.hasMediaAttachment).toBe(true)
		expect(header?.locationMessage?.name).toBe('Jakarta')
	})

	it('sets header title and subtitle', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Isi pesan',
				headerTitle: 'Judul Header',
				headerSubtitle: 'Subjudul Header',
				buttons: [{ id: 't:ok', displayText: 'OK' }]
			},
			baseOptions
		)

		const header = content.interactiveMessage?.header
		expect(header?.title).toBe('Judul Header')
		expect(header?.subtitle).toBe('Subjudul Header')
		expect(header?.hasMediaAttachment).toBeFalsy()
	})

	it('rejects more than one header media', async () => {
		await expect(
			generateWAMessageContent(
				{
					text: 'Pilih:',
					image: Buffer.from('fake-jpeg-bytes'),
					document: Buffer.from('fake-pdf-bytes'),
					buttons: [{ id: 'b1', displayText: 'Satu' }]
				},
				baseOptions
			)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})
})

describe('generateWAMessageContent with carousel', () => {
	const uploadOptions: MessageContentGenerationOptions = {
		upload: async () => ({ mediaUrl: 'https://example.com/media', directPath: '/v/test' })
	}

	it('builds a carouselMessage with cards', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Katalog layanan:',
				carousel: {
					cards: [
						{
							text: 'Layanan A',
							buttons: [{ id: 'beli:a', displayText: 'Beli' }]
						},
						{
							text: 'Layanan B',
							buttons: [{ type: 'url', displayText: 'Detail', url: 'https://example.com/b' }]
						}
					]
				}
			},
			baseOptions
		)

		const carousel = content.interactiveMessage?.carouselMessage
		expect(content.interactiveMessage?.body?.text).toBe('Katalog layanan:')
		expect(carousel?.cards).toHaveLength(2)
		expect(carousel?.cards?.[0]?.body?.text).toBe('Layanan A')
		expect(carousel?.cards?.[0]?.nativeFlowMessage?.buttons?.[0]?.name).toBe('quick_reply')
		expect(carousel?.cards?.[1]?.body?.text).toBe('Layanan B')
		expect(carousel?.cards?.[1]?.nativeFlowMessage?.buttons?.[0]?.name).toBe('cta_url')
	})

	it('uploads card header images', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Katalog:',
				carousel: {
					cards: [
						{
							text: 'Layanan A',
							image: Buffer.from('fake-jpeg-bytes'),
							buttons: [{ id: 'beli:a', displayText: 'Beli' }]
						}
					]
				}
			},
			uploadOptions
		)

		const header = content.interactiveMessage?.carouselMessage?.cards?.[0]?.header
		expect(header?.hasMediaAttachment).toBe(true)
		expect(header?.imageMessage?.url).toBe('https://example.com/media')
	})

	it('rejects a carousel without cards', async () => {
		await expect(
			generateWAMessageContent({ text: 'Katalog:', carousel: { cards: [] } }, baseOptions)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})

	it('rejects a carousel card without buttons', async () => {
		await expect(
			generateWAMessageContent(
				{ text: 'Katalog:', carousel: { cards: [{ text: 'Kosong', buttons: [] }] } },
				baseOptions
			)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})
})

describe('generateWAMessageContent with location/address/flow buttons', () => {
	it('builds send_location and address_message buttons', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Kirim alamatmu:',
				buttons: [
					{ type: 'location', displayText: 'Kirim Lokasi' },
					{ type: 'address', displayText: 'Isi Alamat' }
				]
			},
			baseOptions
		)

		const flowButtons = content.interactiveMessage?.nativeFlowMessage?.buttons
		expect(flowButtons?.[0]?.name).toBe('send_location')
		expect(flowButtons?.[0]?.buttonParamsJson).toBe('{}')
		expect(flowButtons?.[1]?.name).toBe('address_message')
		expect(flowButtons?.[1]?.buttonParamsJson).toBe('{}')
	})

	it('builds a webview button', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Buka dashboard:',
				buttons: [{ type: 'webview', displayText: 'TerixRouter', url: 'https://terix.web.id' }]
			},
			baseOptions
		)

		const flowButtons = content.interactiveMessage?.nativeFlowMessage?.buttons
		expect(flowButtons?.[0]?.name).toBe('webview')
		expect(JSON.parse(flowButtons?.[0]?.buttonParamsJson || '{}')).toEqual({
			display_text: 'TerixRouter',
			url: 'https://terix.web.id'
		})
	})

	it('builds a flow_message button with defaults', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Isi form:',
				buttons: [{ type: 'flow', displayText: 'Buka Form', flowId: '1234567890' }]
			},
			baseOptions
		)

		const flowButtons = content.interactiveMessage?.nativeFlowMessage?.buttons
		expect(flowButtons?.[0]?.name).toBe('flow_message')
		expect(JSON.parse(flowButtons?.[0]?.buttonParamsJson || '{}')).toEqual({
			flow_token: 'unused',
			flow_id: '1234567890',
			flow_cta: 'Buka Form',
			flow_action: 'navigate',
			flow_action_payload: { screen: 'WELCOME' }
		})
	})
})

describe('generateWAMessageContent with product header and footer audio', () => {
	const uploadOptions: MessageContentGenerationOptions = {
		upload: async () => ({ mediaUrl: 'https://example.com/media', directPath: '/v/test' })
	}

	it('builds a product header with uploaded image', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Produk unggulan:',
				product: {
					productId: 'prod-1',
					title: 'Layanan A',
					currencyCode: 'IDR',
					priceAmount1000: 10000000,
					productImage: Buffer.from('fake-jpeg-bytes')
				},
				buttons: [{ id: 'beli:1', displayText: 'Beli' }]
			},
			uploadOptions
		)

		const header = content.interactiveMessage?.header
		expect(header?.hasMediaAttachment).toBe(true)
		expect(header?.productMessage?.product?.productId).toBe('prod-1')
		expect(header?.productMessage?.product?.title).toBe('Layanan A')
		expect(header?.productMessage?.product?.priceAmount1000).toBe(10000000)
		expect(header?.productMessage?.product?.productImage?.url).toBe('https://example.com/media')
	})

	it('rejects a product header combined with another header media', async () => {
		await expect(
			generateWAMessageContent(
				{
					text: 'Pilih:',
					image: Buffer.from('fake-jpeg-bytes'),
					product: { productId: 'prod-1' },
					buttons: [{ id: 'b1', displayText: 'Satu' }]
				},
				baseOptions
			)
		).rejects.toMatchObject({ output: { statusCode: 400 } })
	})

	it('attaches uploaded audio to the footer', async () => {
		const content = await generateWAMessageContent(
			{
				text: 'Dengarkan:',
				footer: 'Mahiru Beta',
				footerAudio: Buffer.from('fake-audio-bytes'),
				buttons: [{ id: 'f:1', displayText: 'OK' }]
			},
			uploadOptions
		)

		const footer = content.interactiveMessage?.footer
		expect(footer?.text).toBe('Mahiru Beta')
		expect(footer?.hasMediaAttachment).toBe(true)
		expect(footer?.audioMessage?.url).toBe('https://example.com/media')
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
