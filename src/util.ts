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

const defaultPermissions = {
	origins: [
		"https://www.youtube.com/*",
		"https://music.youtube.com/*",
		"https://youtu.be/*"
	]
}

export const getSetting = (name: string, value?: any) => {
	return new Promise<any>((resolve, reject) => {
		browser.storage.local.get(name)
			.then(result => {
				let option = result[name]
				if (option == undefined && value != undefined) {
					option = value
				}
				resolve(option)
			})
	})
}

export const setSetting = (name: string, value: any) => {
	return new Promise<void>((resolve, reject) => {
		const settings = <any>{}
		settings[name] = value
		browser.storage.local.set(settings)
			.then(() => {
				resolve()
			})
	})
}

export const hasDefaultPermissions = () => {
	return new Promise<boolean>((resolve, reject) => {
		browser.permissions.contains(defaultPermissions).then(hasPermissions => {
			resolve(hasPermissions)
		})
	})
}

export const requestDefaultPermissions = () => {
	return new Promise<boolean>((resolve, reject) => {
		browser.permissions.request(defaultPermissions)
			.then((response) => {
				resolve(response)
			})
	})
}

export const detectBrowser = () => {
	try {
		browser.runtime.getBrowserInfo()
		return 'firefox'
	} catch (error) {
		return 'chromium'
	}
}