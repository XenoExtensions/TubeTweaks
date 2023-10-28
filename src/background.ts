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

		if(
			details.url.includes('.png') ||
			details.url.includes('.ico') ||
			details.url.includes('.gif')
		) {
			return {};
		}

		if ((details.url.includes('youtu.be') || details.url.includes('youtube.com')) && await getSetting('shareAntiTrack.preventLoading', true)) {
			const newUrl = replaceURL(details.url);
			if (details.url != newUrl) {
				return { redirectUrl: newUrl }
			}
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
					let matches = <string[]>[]
					matches = matches.concat(content.match(/https?:\/\/(youtu\.be|youtube\.com)\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g) || [])
					matches = matches.concat(content.match(/https?%3A\/\/(youtu\.be|youtube\.com)\/\b(([-a-zA-Z0-9_]|%2F|%3F|%3D|%26)*)/g) || [])
					for (let match of matches) {
						content = content.replaceAll(match, replaceURL(match))
					}
				}
				if (await getSetting('shareAntiTrack.hostChange', false)) {
					content = content.replace(/youtu\.be\//g, 'www.youtube.com?v=')
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
	let params = url.searchParams

	for (let param of params.keys()) {
		if (param == 'si') {
			params.delete(param)
		}
	}

	url.search = params.toString()

	return encode ? encodeURIComponent(url.toString()) : url.toString()
}

