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

import $ from "jquery"
import browser from "webextension-polyfill";
import { getSetting, setSetting, detectBrowser } from "../util";

const toggleExtensionButton = $('#toggleExtensionButton');
let extensionEnabled = true;

(async () => {

	if (detectBrowser() == 'chromium') {
		$('.disabled-chromium').hide()
	}

	getSetting('global.enabled', true)
		.then(isEnabled => {
			if (!isEnabled) {
				toggleExtensionButtonSwitch()
			}
		})
})();

toggleExtensionButton.on('click', event => {
	toggleExtensionButtonSwitch()
});

$('.navbar-burger').on('click', () => {
	$('.navbar-burger').toggleClass('is-active')
	$('.navbar-menu').toggleClass('is-active')
})

$('.options-button').on('click', () => {
	browser.runtime.openOptionsPage()
})

function toggleExtensionButtonSwitch() {
	extensionEnabled = !extensionEnabled
	if (extensionEnabled) {
		toggleExtensionButton.html('Enabled')
		toggleExtensionButton.addClass('is-primary')
		toggleExtensionButton.removeClass('is-danger')
	} else {
		toggleExtensionButton.html('Disabled')
		toggleExtensionButton.addClass('is-danger')
		toggleExtensionButton.removeClass('is-primary')
	}
	setSetting('global.enabled', extensionEnabled);
}