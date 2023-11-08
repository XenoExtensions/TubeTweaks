// Copyright (C) 2023 Marcus Huber (xenorio) <dev@xenorio.xyz>
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import browser from "webextension-polyfill";
import { getSetting, hasDefaultPermissions, detectBrowser } from "./util";

console.log(`Running in a ${detectBrowser()} browser. If this is wrong, please create a GitHub issue!`);

(async () => {
	if (!await hasDefaultPermissions()) {
		browser.tabs.create({
			url: '/html/permissions.html',
			active: true
		})
	}
})()

if (detectBrowser() != 'chromium') {
	browser.webRequest.onBeforeRequest.addListener(async (details) => {

		if (!(await getSetting('global.enabled', true))) {
			return {};
		}

		if (
			details.url.includes('.png') ||
			details.url.includes('.ico') ||
			details.url.includes('.gif')
		) {
			return {};
		}

		if ((details.url.includes('youtu.be') || details.url.includes('youtube.com')) && details.url.includes('si=') && await getSetting('shareAntiTrack.preventLoading', true)) {
			const newUrl = replaceURL(details.url);
			if (details.url != newUrl) {
				return { redirectUrl: newUrl }
			}
		}

		if (
			!details.url.includes("www.youtube.com/youtubei/v1/share/get_share_panel")
		) {
			return {}
		}

		let filter = browser.webRequest.filterResponseData(details.requestId);
		let decoder = new TextDecoder("utf-8");
		let encoder = new TextEncoder();
		let content = '';

		filter.ondata = event => {
			content += decoder.decode(event.data, { stream: true });
		};

		filter.onstop = async () => {

			if (
				details.url.includes("www.youtube.com/youtubei/v1/share/get_share_panel")
			) {
				if (await getSetting('shareAntiTrack.enabled', true)) {
					let matches
					matches = content.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g) || []
					for (let match of matches) {
						content = content.replaceAll(match, replaceURL(match))
					}
					matches = content.match(/https(%3A|:)\/\/((www|music|shorts)\.)?(youtube\.com|youtu\.be)\/((watch|live|shorts)\/)?([-a-zA-Z0-9_%])*/g) || []
					for (let match of matches) {
						content = content.replaceAll(match, replaceURL(match))
					}
				}
				if (await getSetting('shareAntiTrack.hostChange', false)) {
					content = content.replace(/youtu\.be\//g, 'www.youtube.com/watch?v=')
				}
			}

			filter.write(encoder.encode(content));
			filter.close();
		}

		return {};
	},
		{ urls: ["<all_urls>"] },
		["blocking"]
	);
}

function replaceURL(inputURL: string) {
	let encode = false
	let url
	try {
		url = new URL(inputURL)
	} catch (error) {
		url = new URL(decodeURIComponent(inputURL))
		encode = true
	}

	if (url.hostname.endsWith("youtube.com") || url.hostname.endsWith("youtu.be")) {
		let params = url.searchParams

		for (let param of params.keys()) {
			if (param == 'si') {
				params.delete(param)
			}
		}

		url.search = params.toString()
	}

	const output = encode ? encodeURIComponent(url.toString()) : url.toString()
	console.log(`Replacing ${inputURL} with ${output}`)

	return output
}

