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

import $ from 'jquery'
import { getSetting } from '../util'

// How fast we should check for element changes (ms)
const updateInterval = 50

// Identifiers for all elements to target
const elementIdentifiers = [
	'#share-url', // Input field on desktop
	'.unified-share-url-input' // Input field on mobile
]

// Element has been found, update URL
async function handleTargetElement(targetElement: HTMLInputElement) {

	// Set up a copy of the current URL to work on
	let url = new URL(targetElement.value)

	if (await getSetting('shareAntiTrack.enabled', true)) {
		let params = url.searchParams
		// Remove all parameters that are not allowed
		for (let param of params.keys()) {
			if (param == 'si') {
				params.delete(param)
			}
		}
		url.search = params.toString()
	}

	if (await getSetting('shareAntiTrack.hostChange', true) && url.hostname != 'www.youtube.com') {
		const paths = url.pathname.split("/").slice(1);

		let videoId;

		if (paths.length > 1) {
			videoId = paths[1];
		} else {
			videoId = paths[0];
		}

		url.hostname = 'www.youtube.com'
		url.searchParams.set("v", videoId);
		console.log(videoId)
		url.pathname = url.pathname.replace(`/${videoId}`, '')

	}

	let newValue = url.toString()

	// Abort if everything is already correct
	if (targetElement.value == newValue) return;

	// Update element
	targetElement.value = newValue
}

// Repeatedly look for the element, and if it's there, change it
setInterval(async () => {

	if (!(await getSetting('global.enabled', true))) {
		return;
	}

	// Gather all elements which should be modified based on their ID
	for (let identifier of elementIdentifiers) {
		$(`${identifier}`).each((i, element) => {
			handleTargetElement(<HTMLInputElement>element)
		})
	}

}, updateInterval)
