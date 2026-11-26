import type { Readable } from 'stream'
import type { URL } from 'url'
import { proto } from '../../WAProto/index.js'
import type { MediaType } from '../Defaults'
import type { BinaryNode } from '../WABinary'
import type { GroupMetadata } from './GroupMetadata'
import type { CacheStore } from './Socket'

// export the WAMessage Prototypes
export { proto as WAProto }
export type WAMessage = proto.IWebMessageInfo & {
	key: WAMessageKey
	messageStubParameters?: any
	category?: string
	retryCount?: number
}
export type WAMessageContent = proto.IMessage
export type WAContactMessage = proto.Message.IContactMessage
export type WAContactsArrayMessage = proto.Message.IContactsArrayMessage
export type WAMessageKey = proto.IMessageKey & {
	remoteJidAlt?: string
	remoteJidUsername?: string
	participantAlt?: string
	participantUsername?: string
	server_id?: string
	addressingMode?: string
	isViewOnce?: boolean // TODO: remove out of the message key, place in WebMessageInfo
}
export type WATextMessage = proto.Message.IExtendedTextMessage
export type WAContextInfo = proto.IContextInfo
export type WALocationMessage = proto.Message.ILocationMessage
export type WAGenericMediaMessage =
	| proto.Message.IVideoMessage
	| proto.Message.IImageMessage
	| proto.Message.IAudioMessage
	| proto.Message.IDocumentMessage
	| proto.Message.IStickerMessage
export const WAMessageStubType = proto.WebMessageInfo.StubType
export const WAMessageStatus = proto.WebMessageInfo.Status
import type { ILogger } from '../Utils/logger'
export type WAMediaPayloadURL = { url: URL | string }
export type WAMediaPayloadStream = { stream: Readable }
export type WAMediaUpload = Buffer | WAMediaPayloadStream | WAMediaPayloadURL
/** Set of message types that are supported by the library */
export type MessageType = keyof proto.Message

export enum WAMessageAddressingMode {
	PN = 'pn',
	LID = 'lid'
}

export type MessageWithContextInfo =
	| 'imageMessage'
	| 'contactMessage'
	| 'locationMessage'
	| 'extendedTextMessage'
	| 'documentMessage'
	| 'audioMessage'
	| 'videoMessage'
	| 'call'
	| 'contactsArrayMessage'
	| 'liveLocationMessage'
	| 'templateMessage'
	| 'stickerMessage'
	| 'groupInviteMessage'
	| 'templateButtonReplyMessage'
	| 'productMessage'
	| 'listMessage'
	| 'orderMessage'
	| 'listResponseMessage'
	| 'buttonsMessage'
	| 'buttonsResponseMessage'
	| 'interactiveMessage'
	| 'interactiveResponseMessage'
	| 'pollCreationMessage'
	| 'requestPhoneNumberMessage'
	| 'messageHistoryBundle'
	| 'eventMessage'
	| 'newsletterAdminInviteMessage'
	| 'albumMessage'
	| 'stickerPackMessage'
	| 'pollResultSnapshotMessage'
	| 'messageHistoryNotice'

export type DownloadableMessage = { mediaKey?: Uint8Array | null; directPath?: string | null; url?: string | null }

export type MessageReceiptType =
	| 'read'
	| 'read-self'
	| 'hist_sync'
	| 'peer_msg'
	| 'sender'
	| 'inactive'
	| 'played'
	| undefined

export type MediaConnInfo = {
	auth: string
	ttl: number
	hosts: { hostname: string; maxContentLengthBytes: number }[]
	fetchDate: Date
}

export interface WAUrlInfo {
	'canonical-url': string
	'matched-text': string
	title: string
	description?: string
	jpegThumbnail?: Buffer
	highQualityThumbnail?: proto.Message.IImageMessage
	originalThumbnailUrl?: string
}

// types to generate WA messages
type Mentionable = {
	/** list of jids that are mentioned in the accompanying text */
	mentions?: string[]
	/** mention all */
	mentionAll?: boolean
}
type Contextable = {
	/** add contextInfo to the message */
	contextInfo?: proto.IContextInfo
}
type ViewOnce = {
	viewOnce?: boolean
}

type Editable = {
	edit?: WAMessageKey
}
type WithDimensions = {
	width?: number
	height?: number
}

export type PollMessageOptions = {
	name: string
	selectableCount?: number
	values: string[]
	/** 32 byte message secret to encrypt poll selections */
	messageSecret?: Uint8Array
	toAnnouncementGroup?: boolean
}

export type EventMessageOptions = {
	name: string
	description?: string
	startDate: Date
	endDate?: Date
	location?: WALocationMessage
	call?: 'audio' | 'video'
	isCancelled?: boolean
	isScheduleCall?: boolean
	extraGuestsAllowed?: boolean
	messageSecret?: Uint8Array<ArrayBufferLike>
}

export type AlbumMessageOptions = {
	/** Number of images expected in the album */
	expectedImageCount?: number
	/** Number of videos expected in the album */
	expectedVideoCount?: number
}

type SharePhoneNumber = {
	sharePhoneNumber: boolean
}

type RequestPhoneNumber = {
	requestPhoneNumber: boolean
}

export type AnyMediaMessageContent = (
	| ({
			image: WAMediaUpload
			caption?: string
			jpegThumbnail?: string
	  } & Mentionable &
			Contextable &
			WithDimensions)
	| ({
			video: WAMediaUpload
			caption?: string
			gifPlayback?: boolean
			jpegThumbnail?: string
			/** if set to true, will send as a `video note` */
			ptv?: boolean
	  } & Mentionable &
			Contextable &
			WithDimensions)
	| {
			audio: WAMediaUpload
			/** if set to true, will send as a `voice note` */
			ptt?: boolean
			/** optionally tell the duration of the audio */
			seconds?: number
			/** if set to true, loudness-normalize the audio via ffmpeg before sending */
			normalizeAudio?: boolean
	  }
	| ({
			sticker: WAMediaUpload
			isAnimated?: boolean
	  } & WithDimensions)
	| ({
			document: WAMediaUpload
			mimetype: string
			fileName?: string
			caption?: string
	  } & Contextable)
) & { mimetype?: string } & Editable & {
		/** key of the parent albumMessage to associate this media with */
		albumParentKey?: WAMessageKey
	}

export type ButtonReplyInfo = {
	displayText: string
	id: string
	index: number
}

/** a button sent with a native-flow interactive message */
export type ButtonInfo =
	| {
			/** quick-reply button (default): tapping sends the id back to the bot */
			type?: 'reply'
			/** id returned to the bot when the user taps this button */
			id: string
			/** label shown on the button */
			displayText: string
	  }
	| {
			/** opens a URL in the browser when tapped; nothing is sent back to the bot */
			type: 'url'
			/** label shown on the button */
			displayText: string
			/** URL opened when the button is tapped */
			url: string
			/** optional merchant URL shown by some clients */
			merchantUrl?: string
	  }
	| {
			/** opens the dialer with the number filled in when tapped */
			type: 'call'
			/** label shown on the button */
			displayText: string
			/** phone number to call, in international format */
			phoneNumber: string
	  }
	| {
			/** copies text to the clipboard when tapped */
			type: 'copy'
			/** label shown on the button */
			displayText: string
			/** text copied to the clipboard when the button is tapped */
			copyCode: string
	  }
	| {
			/** opens a URL in WhatsApp's in-app webview when tapped */
			type: 'webview'
			/** label shown on the button */
			displayText: string
			/** URL opened in the in-app webview */
			url: string
	  }
	| {
			/** opens the location picker; the picked location is sent back to the bot as a location message */
			type: 'location'
			/** label shown on the button */
			displayText: string
	  }
	| {
			/** opens the WhatsApp address form; the filled address is sent back to the bot */
			type: 'address'
			/** label shown on the button */
			displayText: string
	  }
	| {
			/** opens a WhatsApp Flow (interactive form) identified by its Flow ID */
			type: 'flow'
			/** label shown on the button (the Flow call-to-action) */
			displayText: string
			/** Flow ID from Meta Business */
			flowId: string
			/** optional Flow token, defaults to 'unused' */
			flowToken?: string
			/** optional first Flow screen, defaults to 'WELCOME' */
			screen?: string
	  }

/** a row in a single-select list section */
export type ListSectionRow = {
	/** row title shown in the list */
	title: string
	/** optional row description */
	description?: string
	/** id returned to the bot when the user taps this row */
	id: string
}

/** a section in a single-select list */
export type ListSection = {
	/** section title shown in the list */
	title: string
	rows: ListSectionRow[]
}

/** a single-select list sent with a native-flow interactive message */
export type ListInfo = {
	/** title shown in the list header */
	title: string
	/** label of the button that opens the list */
	buttonText: string
	sections: ListSection[]
}

/** a product snapshot shown in an interactive message header */
export type ProductHeaderInfo = {
	/** catalog product id */
	productId: string
	/** product title */
	title?: string
	/** product description */
	description?: string
	/** ISO currency code, e.g. 'IDR' */
	currencyCode?: string
	/** price multiplied by 1000, e.g. Rp10.000 = 10000000 */
	priceAmount1000?: number
	/** retailer/product SKU id */
	retailerId?: string
	/** product URL */
	url?: string
	/** product image, uploaded like other header media */
	productImage?: WAMediaUpload
	/** JID of the business that owns the catalog */
	businessOwnerJid?: string
}

/** a card in a carousel sent with a native-flow interactive message */
export type CarouselCardInfo = {
	/** text shown on the card */
	text: string
	/** optional image shown in the card header */
	image?: WAMediaUpload
	/** optional video shown in the card header */
	video?: WAMediaUpload
	/** optional document shown in the card header */
	document?: WAMediaUpload
	/** optional location shown in the card header */
	location?: WALocationMessage
	/** optional product snapshot shown in the card header */
	product?: ProductHeaderInfo
	/** optional title shown in the card header */
	headerTitle?: string
	/** optional subtitle shown in the card header */
	headerSubtitle?: string
	/** optional footer text shown on the card */
	footer?: string
	/** optional audio attached to the card footer */
	footerAudio?: WAMediaUpload
	/** buttons shown on the card, at most 3 */
	buttons: ButtonInfo[]
}

/** a carousel of cards sent with a native-flow interactive message */
export type CarouselInfo = {
	cards: CarouselCardInfo[]
}

export type GroupInviteInfo = {
	inviteCode: string
	inviteExpiration: number
	text: string
	jid: string
	subject: string
}

export type WASendableProduct = Omit<proto.Message.ProductMessage.IProductSnapshot, 'productImage'> & {
	productImage: WAMediaUpload
}

export type AnyRegularMessageContent = (
	| ({
			text: string
			linkPreview?: WAUrlInfo | null
	  } & Mentionable &
			Contextable &
			Editable)
	| AnyMediaMessageContent
	| { event: EventMessageOptions }
	| ({
			poll: PollMessageOptions
	  } & Mentionable &
			Contextable &
			Editable)
	| ({
			album: AlbumMessageOptions
	  } & Contextable &
			Mentionable)
	| {
			contacts: {
				displayName?: string
				contacts: proto.Message.IContactMessage[]
			}
	  }
	| {
			location: WALocationMessage
	  }
	| { react: proto.Message.IReactionMessage }
	| {
			buttonReply: ButtonReplyInfo
			type: 'template' | 'plain'
	  }
	| ({
			/** text shown above the buttons */
			text: string
			/** optional image shown in the header above the text */
			image?: WAMediaUpload
			/** optional video shown in the header above the text */
			video?: WAMediaUpload
			/** optional document shown in the header above the text */
			document?: WAMediaUpload
			/** optional location shown in the header above the text */
			location?: WALocationMessage
			/** optional product snapshot shown in the header above the text */
			product?: ProductHeaderInfo
			/** optional title shown in the header */
			headerTitle?: string
			/** optional subtitle shown in the header */
			headerSubtitle?: string
			/** optional footer text shown below the buttons */
			footer?: string
			/** optional audio attached to the footer */
			footerAudio?: WAMediaUpload
			/** quick-reply buttons, at most 3 */
			buttons: ButtonInfo[]
	  } & Mentionable &
			Contextable)
	| ({
			/** text shown above the list button */
			text: string
			/** optional image shown in the header above the text */
			image?: WAMediaUpload
			/** optional video shown in the header above the text */
			video?: WAMediaUpload
			/** optional document shown in the header above the text */
			document?: WAMediaUpload
			/** optional location shown in the header above the text */
			location?: WALocationMessage
			/** optional product snapshot shown in the header above the text */
			product?: ProductHeaderInfo
			/** optional title shown in the header */
			headerTitle?: string
			/** optional subtitle shown in the header */
			headerSubtitle?: string
			/** optional footer text shown below the list button */
			footer?: string
			/** optional audio attached to the footer */
			footerAudio?: WAMediaUpload
			/** single-select list opened by the button */
			list: ListInfo
	  } & Mentionable &
			Contextable)
	| ({
			/** text shown above the carousel */
			text: string
			/** optional footer text shown below the carousel */
			footer?: string
			/** optional audio attached to the footer */
			footerAudio?: WAMediaUpload
			/** carousel of cards, at most 10 */
			carousel: CarouselInfo
	  } & Mentionable &
			Contextable)
	| {
			groupInvite: GroupInviteInfo
	  }
	| {
			listReply: Omit<proto.Message.IListResponseMessage, 'contextInfo'>
	  }
	| {
			pin: WAMessageKey
			type: proto.PinInChat.Type
			/**
			 * 24 hours, 7 days, 30 days
			 */
			time?: 86400 | 604800 | 2592000
	  }
	| {
			product: WASendableProduct
			businessOwnerJid?: string
			body?: string
			footer?: string
	  }
	| SharePhoneNumber
	| RequestPhoneNumber
) &
	ViewOnce

export type AnyMessageContent =
	| AnyRegularMessageContent
	| {
			forward: WAMessage
			force?: boolean
	  }
	| {
			/** Delete your message or anyone's message in a group (admin required) */
			delete: WAMessageKey
	  }
	| {
			/** Keep a message in chat so it is not removed by disappearing messages */
			keep: WAMessageKey
			/** defaults to KEEP_FOR_ALL; use UNDO_KEEP_FOR_ALL to un-keep */
			keepType?: proto.KeepType
	  }
	| {
			disappearingMessagesInChat: boolean | number
	  }
	| {
			limitSharing: boolean
	  }

export type GroupMetadataParticipants = Pick<GroupMetadata, 'participants'>

type MinimalRelayOptions = {
	/** override the message ID with a custom provided string */
	messageId?: string
	/** should we use group metadata cache, or fetch afresh from the server; default assumed to be "true" */
	useCachedGroupMetadata?: boolean
}

export type MessageRelayOptions = MinimalRelayOptions & {
	/** only send to a specific participant; used when a message decryption fails for a single user */
	participant?: { jid: string; count: number }
	/** additional attributes to add to the WA binary node */
	additionalAttributes?: { [_: string]: string }
	additionalNodes?: BinaryNode[]
	/** should we use the devices cache, or fetch afresh from the server; default assumed to be "true" */
	useUserDevicesCache?: boolean
	/** jid list of participants for status@broadcast */
	statusJidList?: string[]
	/** jid list of recipients for a broadcast list (xxx@broadcast) */
	broadcastJidList?: string[]
}

export type MiscMessageGenerationOptions = MinimalRelayOptions & {
	/** optional, if you want to manually set the timestamp of the message */
	timestamp?: Date
	/** the message you want to quote */
	quoted?: WAMessage
	/** disappearing messages settings */
	ephemeralExpiration?: number | string
	/** timeout for media upload to WA server */
	mediaUploadTimeoutMs?: number
	/** jid list of participants for status@broadcast */
	statusJidList?: string[]
	/** jid list of recipients for a broadcast list (xxx@broadcast) */
	broadcastJidList?: string[]
	/** backgroundcolor for status */
	backgroundColor?: string
	/** font type for status */
	font?: number
	/** if it is broadcast */
	broadcast?: boolean
}
export type MessageGenerationOptionsFromContent = MiscMessageGenerationOptions & {
	userJid: string
}

export type WAMediaUploadFunction = (
	encFilePath: string,
	opts: { fileEncSha256B64: string; mediaType: MediaType; timeoutMs?: number }
) => Promise<{ mediaUrl: string; directPath: string; meta_hmac?: string; ts?: number; fbid?: number }>

export type MediaGenerationOptions = {
	logger?: ILogger
	mediaTypeOverride?: MediaType
	upload: WAMediaUploadFunction
	/** cache media so it does not have to be uploaded again */
	mediaCache?: CacheStore

	mediaUploadTimeoutMs?: number

	options?: RequestInit

	backgroundColor?: string

	font?: number
}
export type MessageContentGenerationOptions = MediaGenerationOptions & {
	getUrlInfo?: (text: string) => Promise<WAUrlInfo | undefined>
	getProfilePicUrl?: (jid: string, type: 'image' | 'preview') => Promise<string | undefined>
	getCallLink?: (type: 'audio' | 'video', event?: { startTime: number }) => Promise<string | undefined>
	jid?: string
}
export type MessageGenerationOptions = MessageContentGenerationOptions & MessageGenerationOptionsFromContent

/**
 * Type of message upsert
 * 1. notify => notify the user, this message was just received
 * 2. append => append the message to the chat history, no notification required
 */
export type MessageUpsertType = 'append' | 'notify'

export type MessageUserReceipt = proto.IUserReceipt

export type WAMessageUpdate = { update: Partial<WAMessage>; key: WAMessageKey }

export type WAMessageCursor = { before: WAMessageKey | undefined } | { after: WAMessageKey | undefined }

export type MessageUserReceiptUpdate = { key: WAMessageKey; receipt: MessageUserReceipt }

export type MediaDecryptionKeyInfo = {
	iv: Uint8Array
	cipherKey: Uint8Array
	macKey?: Uint8Array
}

export type MinimalMessage = Pick<WAMessage, 'key' | 'messageTimestamp'>
