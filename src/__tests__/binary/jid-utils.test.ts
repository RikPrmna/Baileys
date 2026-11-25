import { isJidBroadcast, isJidStatusBroadcast } from '../../WABinary'

describe('broadcast JID classification used by relay routing', () => {
	it('treats a broadcast list JID as broadcast but not as status', () => {
		expect(isJidBroadcast('1234567890@broadcast')).toBe(true)
		expect(isJidStatusBroadcast('1234567890@broadcast')).toBe(false)
	})

	it('treats status@broadcast as both broadcast and status', () => {
		expect(isJidBroadcast('status@broadcast')).toBe(true)
		expect(isJidStatusBroadcast('status@broadcast')).toBe(true)
	})

	it('does not treat groups, users, or newsletters as broadcast', () => {
		expect(isJidBroadcast('1234567890@g.us')).toBe(false)
		expect(isJidBroadcast('1234567890@s.whatsapp.net')).toBe(false)
		expect(isJidBroadcast('1234567890@newsletter')).toBe(false)
		expect(isJidBroadcast(undefined)).toBeFalsy()
	})
})
