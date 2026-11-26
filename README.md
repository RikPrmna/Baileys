<h1 align='center'><img alt="Baileys logo" src="https://raw.githubusercontent.com/WhiskeySockets/Baileys/refs/heads/master/Media/logo.png" height="75"/></h1>

<div align='center'>Baileys is a WebSockets-based TypeScript library for interacting with the WhatsApp Web API.</div>

> [!NOTE]
> This is a fork of [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) (based on 7.0.0-rc14) maintained by [RikPrmna](https://github.com/RikPrmna), with additional send APIs:
>
> | Feature | This fork | Upstream |
> | --- | :---: | :---: |
> | Quick-reply button messages | ✅ | ❌ |
> | CTA buttons (URL / call / copy) | ✅ | ❌ |
> | Single-select list messages | ✅ | ❌ |
> | Carousel messages | ✅ | ❌ |
> | Image/video/document/location/text headers on buttons, lists & cards | ✅ | ❌ |
> | Keep-in-chat messages (keep/unkeep) | ✅ | ❌ |
> | Broadcast-list relay (`broadcastJidList`) | ✅ | ❌ |
> | Audio loudness normalization (`normalizeAudio`) | ✅ | ❌ |
>
> Everything else is upstream Baileys; see the sections below and the upstream guide at https://baileys.wiki.

> [!CAUTION]
> NOTICE OF BREAKING CHANGE.
>
> As of 7.0.0, multiple breaking changes were introduced into the library.
>
> Please check out https://whiskey.so/migrate-latest for more information.


## Install

Install this fork from GitHub (the npm package `@whiskeysockets/baileys` is upstream and does not include the fork features above):
```
yarn add github:RikPrmna/Baileys
```
or with the full URL:
```
yarn add https://github.com/RikPrmna/Baileys
```

Then import your code using:
```ts
import makeWASocket from '@whiskeysockets/baileys'
```

## Example

Do check out & run [example.ts](Example/example.ts) to see an example usage of the library.
The script covers most common use cases.
To run the example script, download or clone the repo and then type the following in a terminal:
1. ``` cd path/to/Baileys ```
2. ``` yarn ```
3. ``` yarn example ```

## Usage & Guide

For general Baileys usage (connecting, events, sending messages, groups, and more), see the upstream guide at https://baileys.wiki and join the WhiskeySockets Discord [here](https://discord.gg/WeJM5FP9GG).

## Fork Features

### Button Message
- Sends a native-flow interactive message with 1-3 quick-reply buttons
- `id` is returned to the bot when the user taps the button, as `templateButtonReplyMessage.selectedId`
- Optionally show an image, video, document or location in the header above the text (only one of them; see [Headers](#headers)), plus optional `headerTitle` / `headerSubtitle` text
```ts
await sock.sendMessage(
    jid,
    {
        text: 'Pick a category:',
        footer: 'My Store', // optional
        image: { url: './Media/header.jpg' }, // optional, or use `video` instead
        buttons: [
            { id: 'cat:media', displayText: 'Media' },
            { id: 'cat:apk', displayText: 'APK' }
        ]
    }
)
```

### List Message
- Sends a native-flow interactive message with a single-select list opened by a button
- Requires at least 1 section with at least 1 row each
- `id` is returned to the bot when the user picks a row, as JSON in `interactiveResponseMessage.nativeFlowResponseMessage.paramsJson`
- Optionally show an image, video, document or location in the header above the text (only one of them; see [Headers](#headers)), plus optional `headerTitle` / `headerSubtitle` text
```ts
await sock.sendMessage(
    jid,
    {
        text: 'Pick a platform:',
        footer: 'My Store', // optional
        video: { url: './Media/header.mp4' }, // optional, or use `image` instead
        list: {
            title: 'Pick a platform',
            buttonText: 'Pick a platform',
            sections: [
                {
                    title: 'Social Media',
                    rows: [
                        { id: 'platform:tiktok', title: 'TikTok', description: '2,422 services' },
                        { id: 'platform:instagram', title: 'Instagram' }
                    ]
                }
            ]
        }
    }
)
```

### CTA Buttons
- Buttons can also be call-to-action buttons that act on the user's phone without sending anything back to the bot; they can be mixed with quick-reply buttons in one message
- `{ type: 'url', displayText, url, merchantUrl? }` opens a URL; `{ type: 'call', displayText, phoneNumber }` opens the dialer; `{ type: 'copy', displayText, copyCode }` copies text to the clipboard
```ts
await sock.sendMessage(
    jid,
    {
        text: 'Your order is ready to pay:',
        footer: 'Mahiru Store',
        buttons: [
            { type: 'url', displayText: 'Pay Now', url: 'https://example.com/pay' },
            { type: 'copy', displayText: 'Copy Code', copyCode: 'ORD-123' },
            { id: 'cek:123', displayText: 'Check Status' }
        ]
    }
)
```

### Carousel Message
- Sends a horizontally scrolling set of cards; each card has its own text, optional header, footer and buttons (at most 10 cards, at most 3 buttons per card)
```ts
await sock.sendMessage(
    jid,
    {
        text: 'Service catalog:',
        footer: 'Mahiru Store',
        carousel: {
            cards: [
                {
                    text: 'Service A\nRp10.000',
                    image: { url: './Media/a.jpg' },
                    buttons: [{ id: 'beli:a', displayText: 'Buy A' }]
                },
                {
                    text: 'Service B\nRp20.000',
                    image: { url: './Media/b.jpg' },
                    buttons: [{ type: 'url', displayText: 'Details', url: 'https://example.com/b' }]
                }
            ]
        }
    }
)
```

### Headers
- Button, list and carousel-card messages accept one optional header: `image`, `video`, `document` or `location` (provide at most one), plus optional `headerTitle` / `headerSubtitle` text
```ts
await sock.sendMessage(
    jid,
    {
        text: 'Pick one:',
        image: { url: './Media/header.jpg' },
        headerTitle: 'Menu',
        buttons: [{ id: 'h:1', displayText: 'One' }]
    }
)
```

### Keep Message
- Keeps a message in chat so it is not removed by disappearing messages
- `keepType` defaults to `KEEP_FOR_ALL`; use `UNDO_KEEP_FOR_ALL` to un-keep
```ts
await sock.sendMessage(
    jid,
    {
        keep: messageKey // key of the message to keep
    }
)
```

### Audio Loudness Normalization
- Add `normalizeAudio: true` to an audio message to loudness-normalize it before sending (uses `ffmpeg` loudnorm; falls back to the original audio if normalization fails)
```ts
await sock.sendMessage(
    jid,
    {
        audio: { url: './Media/audio.mp3' },
        mimetype: 'audio/mp4',
        normalizeAudio: true
    }
)
```

### Broadcast-List Relay
- To relay a message to specific broadcast-list recipients, pass `broadcastJidList` (list of recipient JIDs) in the message options; recipients must have your number saved to receive it

# Get Support

For issues with the fork-specific features (buttons, lists, keep, broadcast relay, audio normalization), please open an issue in this repository.

For general Baileys questions and upstream issues, see the upstream project: [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) and the guide at https://baileys.wiki.

# Disclaimer
This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates.
The official WhatsApp website can be found at whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

The maintainers of Baileys do not in any way condone the use of this application in practices that violate the Terms of Service of WhatsApp. The maintainers of this application call upon the personal responsibility of its users to use this application in a fair way, as it is intended to be used.
Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.

# License
Copyright (c) 2026 Rajeh Taher/WhiskeySockets

Licensed under the MIT License:
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Thus, the maintainers of the project can't be held liable for any potential misuse of this project.
