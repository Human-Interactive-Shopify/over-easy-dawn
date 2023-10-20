function getFocusableElements(container) {
	return Array.from(
		container.querySelectorAll(
			"summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe",
		),
	);
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
	summary.setAttribute('role', 'button');
	summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));

	if (summary.nextElementSibling.getAttribute('id')) {
		summary.setAttribute('aria-controls', summary.nextElementSibling.id);
	}

	summary.addEventListener('click', (event) => {
		event.currentTarget.setAttribute(
			'aria-expanded',
			!event.currentTarget.closest('details').hasAttribute('open'),
		);
	});

	if (summary.closest('header-drawer')) return;
	summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
	var elements = getFocusableElements(container);
	var first = elements[0];
	var last = elements[elements.length - 1];

	removeTrapFocus();

	trapFocusHandlers.focusin = (event) => {
		if (event.target !== container && event.target !== last && event.target !== first)
			return;

		document.addEventListener('keydown', trapFocusHandlers.keydown);
	};

	trapFocusHandlers.focusout = function () {
		document.removeEventListener('keydown', trapFocusHandlers.keydown);
	};

	trapFocusHandlers.keydown = function (event) {
		if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
		// On the last focusable element and tab forward, focus the first element.
		if (event.target === last && !event.shiftKey) {
			event.preventDefault();
			first.focus();
		}

		//  On the first focusable element and tab backward, focus the last element.
		if ((event.target === container || event.target === first) && event.shiftKey) {
			event.preventDefault();
			last.focus();
		}
	};

	document.addEventListener('focusout', trapFocusHandlers.focusout);
	document.addEventListener('focusin', trapFocusHandlers.focusin);

	elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
	document.querySelector(':focus-visible');
} catch (e) {
	focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
	const navKeys = [
		'ARROWUP',
		'ARROWDOWN',
		'ARROWLEFT',
		'ARROWRIGHT',
		'TAB',
		'ENTER',
		'SPACE',
		'ESCAPE',
		'HOME',
		'END',
		'PAGEUP',
		'PAGEDOWN',
	];
	let currentFocusedElement = null;
	let mouseClick = null;

	window.addEventListener('keydown', (event) => {
		if (navKeys.includes(event.code.toUpperCase())) {
			mouseClick = false;
		}
	});

	window.addEventListener('mousedown', (event) => {
		mouseClick = true;
	});

	window.addEventListener(
		'focus',
		() => {
			if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

			if (mouseClick) return;

			currentFocusedElement = document.activeElement;
			currentFocusedElement.classList.add('focused');
		},
		true,
	);
}

function pauseAllMedia() {
	document.querySelectorAll('.js-youtube').forEach((video) => {
		video.contentWindow.postMessage(
			'{"event":"command","func":"' + 'pauseVideo' + '","args":""}',
			'*',
		);
	});
	document.querySelectorAll('.js-vimeo').forEach((video) => {
		video.contentWindow.postMessage('{"method":"pause"}', '*');
	});
	document.querySelectorAll('video').forEach((video) => video.pause());
	document.querySelectorAll('product-model').forEach((model) => {
		if (model.modelViewerUI) model.modelViewerUI.pause();
	});
}

function removeTrapFocus(elementToFocus = null) {
	document.removeEventListener('focusin', trapFocusHandlers.focusin);
	document.removeEventListener('focusout', trapFocusHandlers.focusout);
	document.removeEventListener('keydown', trapFocusHandlers.keydown);

	if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
	if (event.code.toUpperCase() !== 'ESCAPE') return;

	const openDetailsElement = event.target.closest('details[open]');
	if (!openDetailsElement) return;

	const summaryElement = openDetailsElement.querySelector('summary');
	openDetailsElement.removeAttribute('open');
	summaryElement.setAttribute('aria-expanded', false);
	summaryElement.focus();
}

class QuantityInput extends HTMLElement {
	constructor() {
		super();
		this.input = this.querySelector('input');
		this.changeEvent = new Event('change', { bubbles: true });

		this.querySelectorAll('button').forEach((button) =>
			button.addEventListener('click', this.onButtonClick.bind(this)),
		);
	}

	onButtonClick(event) {
		event.preventDefault();
		const previousValue = this.input.value;

		event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
		if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
	}
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
	let t;
	return (...args) => {
		clearTimeout(t);
		t = setTimeout(() => fn.apply(this, args), wait);
	};
}

function fetchConfig(type = 'json') {
	return {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
	};
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == 'undefined') {
	window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
	return function () {
		return fn.apply(scope, arguments);
	};
};

Shopify.setSelectorByValue = function (selector, value) {
	for (var i = 0, count = selector.options.length; i < count; i++) {
		var option = selector.options[i];
		if (value == option.value || value == option.innerHTML) {
			selector.selectedIndex = i;
			return i;
		}
	}
};

Shopify.addListener = function (target, eventName, callback) {
	target.addEventListener
		? target.addEventListener(eventName, callback, false)
		: target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
	options = options || {};
	var method = options['method'] || 'post';
	var params = options['parameters'] || {};

	var form = document.createElement('form');
	form.setAttribute('method', method);
	form.setAttribute('action', path);

	for (var key in params) {
		var hiddenField = document.createElement('input');
		hiddenField.setAttribute('type', 'hidden');
		hiddenField.setAttribute('name', key);
		hiddenField.setAttribute('value', params[key]);
		form.appendChild(hiddenField);
	}
	document.body.appendChild(form);
	form.submit();
	document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
	this.countryEl = document.getElementById(country_domid);
	this.provinceEl = document.getElementById(province_domid);
	this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

	Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler, this));

	this.initCountry();
	this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
	initCountry: function () {
		var value = this.countryEl.getAttribute('data-default');
		Shopify.setSelectorByValue(this.countryEl, value);
		this.countryHandler();
	},

	initProvince: function () {
		var value = this.provinceEl.getAttribute('data-default');
		if (value && this.provinceEl.options.length > 0) {
			Shopify.setSelectorByValue(this.provinceEl, value);
		}
	},

	countryHandler: function (e) {
		var opt = this.countryEl.options[this.countryEl.selectedIndex];
		var raw = opt.getAttribute('data-provinces');
		var provinces = JSON.parse(raw);

		this.clearOptions(this.provinceEl);
		if (provinces && provinces.length == 0) {
			this.provinceContainer.style.display = 'none';
		} else {
			for (var i = 0; i < provinces.length; i++) {
				var opt = document.createElement('option');
				opt.value = provinces[i][0];
				opt.innerHTML = provinces[i][1];
				this.provinceEl.appendChild(opt);
			}

			this.provinceContainer.style.display = '';
		}
	},

	clearOptions: function (selector) {
		while (selector.firstChild) {
			selector.removeChild(selector.firstChild);
		}
	},

	setOptions: function (selector, values) {
		for (var i = 0, count = values.length; i < values.length; i++) {
			var opt = document.createElement('option');
			opt.value = values[i];
			opt.innerHTML = values[i];
			selector.appendChild(opt);
		}
	},
};

class MenuDrawer extends HTMLElement {
	constructor() {
		super();

		this.mainDetailsToggle = this.querySelector('details');

		if (navigator.platform === 'iPhone')
			document.documentElement.style.setProperty(
				'--viewport-height',
				`${window.innerHeight}px`,
			);

		this.addEventListener('keyup', this.onKeyUp.bind(this));
		this.addEventListener('focusout', this.onFocusOut.bind(this));
		this.bindEvents();
	}

	bindEvents() {
		this.querySelectorAll('summary').forEach((summary) =>
			summary.addEventListener('click', this.onSummaryClick.bind(this)),
		);
		this.querySelectorAll('button').forEach((button) =>
			button.addEventListener('click', this.onCloseButtonClick.bind(this)),
		);
	}

	onKeyUp(event) {
		if (event.code.toUpperCase() !== 'ESCAPE') return;

		const openDetailsElement = event.target.closest('details[open]');
		if (!openDetailsElement) return;

		openDetailsElement === this.mainDetailsToggle
			? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary'))
			: this.closeSubmenu(openDetailsElement);
	}

	onSummaryClick(event) {
		const summaryElement = event.currentTarget;
		const detailsElement = summaryElement.parentNode;
		const parentMenuElement = detailsElement.closest('.has-submenu');
		const isOpen = detailsElement.hasAttribute('open');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

		function addTrapFocus() {
			trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
			summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
		}

		if (detailsElement === this.mainDetailsToggle) {
			if (isOpen) event.preventDefault();
			isOpen
				? this.closeMenuDrawer(event, summaryElement)
				: this.openMenuDrawer(summaryElement);
		} else {
			setTimeout(() => {
				detailsElement.classList.add('menu-opening');
				summaryElement.setAttribute('aria-expanded', true);
				parentMenuElement && parentMenuElement.classList.add('submenu-open');
				!reducedMotion || reducedMotion.matches
					? addTrapFocus()
					: summaryElement.nextElementSibling.addEventListener(
							'transitionend',
							addTrapFocus,
					  );
			}, 100);
		}
	}

	openMenuDrawer(summaryElement) {
		summaryElement.setAttribute('aria-expanded', true);
		trapFocus(this.mainDetailsToggle, summaryElement);
		document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
	}

	closeMenuDrawer(event, elementToFocus = false) {
		if (event === undefined) return;

		this.mainDetailsToggle.classList.remove('menu-opening');
		this.mainDetailsToggle.removeAttribute('open');
		this.mainDetailsToggle.classList.remove('menu-opening');

		this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach((submenu) => {
			submenu.classList.remove('submenu-open');
		});
		document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
		removeTrapFocus(elementToFocus);
	}

	onFocusOut(event) {
		setTimeout(() => {
			if (
				this.mainDetailsToggle.hasAttribute('open') &&
				!this.mainDetailsToggle.contains(document.activeElement)
			)
				this.closeMenuDrawer();
		});
	}

	onCloseButtonClick(event) {
		const detailsElement = event.currentTarget.closest('details');
		this.closeSubmenu(detailsElement);
	}

	closeSubmenu(detailsElement) {
		const parentMenuElement = detailsElement.closest('.submenu-open');
		parentMenuElement && parentMenuElement.classList.remove('submenu-open');
		detailsElement.classList.remove('menu-opening');
		detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
		removeTrapFocus(detailsElement.querySelector('summary'));
		this.closeAnimation(detailsElement);
	}

	closeAnimation(detailsElement) {
		let animationStart;

		const handleAnimation = (time) => {
			if (animationStart === undefined) {
				animationStart = time;
			}

			const elapsedTime = time - animationStart;

			if (elapsedTime < 400) {
				window.requestAnimationFrame(handleAnimation);
			} else {
				detailsElement.removeAttribute('open');
				if (detailsElement.closest('details[open]')) {
					trapFocus(
						detailsElement.closest('details[open]'),
						detailsElement.querySelector('summary'),
					);
				}
			}
		};

		window.requestAnimationFrame(handleAnimation);
	}
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
	constructor() {
		super();
	}

	openMenuDrawer(summaryElement) {
		this.header = this.header || document.getElementById('shopify-section-oe-header');
		this.header.classList.add('menu-open');

		summaryElement.setAttribute('aria-expanded', true);
		trapFocus(this.mainDetailsToggle, summaryElement);
		document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
	}

	closeMenuDrawer(event, elementToFocus) {
		super.closeMenuDrawer(event, elementToFocus);
		this.header.classList.remove('menu-open');
	}
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
	constructor() {
		super();
		this.querySelector('[id^="ModalClose-"]').addEventListener(
			'click',
			this.hide.bind(this, false),
		);
		this.addEventListener('keyup', (event) => {
			if (event.code.toUpperCase() === 'ESCAPE') this.hide();
		});
		if (this.classList.contains('media-modal')) {
			this.addEventListener('pointerup', (event) => {
				if (
					event.pointerType === 'mouse' &&
					!event.target.closest('deferred-media, product-model')
				)
					this.hide();
			});
		} else {
			this.addEventListener('click', (event) => {
				if (event.target === this) this.hide();
			});
		}
	}

	connectedCallback() {
		if (this.moved) return;
		this.moved = true;
		document.body.appendChild(this);
	}

	show(opener) {
		this.openedBy = opener;
		const popup = this.querySelector('.template-popup');
		document.body.classList.add('overflow-hidden');
		this.setAttribute('open', '');
		if (popup) popup.loadContent();
		trapFocus(this, this.querySelector('[role="dialog"]'));
		window.pauseAllMedia();
	}

	hide() {
		document.body.classList.remove('overflow-hidden');
		document.body.dispatchEvent(new CustomEvent('modalClosed'));
		this.removeAttribute('open');
		removeTrapFocus(this.openedBy);
		window.pauseAllMedia();
	}
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
	constructor() {
		super();

		const button = this.querySelector('button');

		if (!button) return;
		button.addEventListener('click', () => {
			const modal = document.querySelector(this.getAttribute('data-modal'));
			if (modal) modal.show(button);
		});
	}
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
	constructor() {
		super();
		const poster = this.querySelector('[id^="Deferred-Poster-"]');
		if (!poster) return;
		poster.addEventListener('click', this.loadContent.bind(this));
	}

	loadContent(focus = true) {
		window.pauseAllMedia();
		if (!this.getAttribute('loaded')) {
			const content = document.createElement('div');
			content.appendChild(
				this.querySelector('template').content.firstElementChild.cloneNode(true),
			);

			this.setAttribute('loaded', true);
			const deferredElement = this.appendChild(
				content.querySelector('video, model-viewer, iframe'),
			);
			if (focus) deferredElement.focus();
		}
	}
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
	constructor() {
		super();
		this.slider = this.querySelector('[id^="Slider-"]');
		this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
		this.enableSliderLooping = false;
		this.currentPageElement = this.querySelector('.slider-counter--current');
		this.pageTotalElement = this.querySelector('.slider-counter--total');
		this.prevButton = this.querySelector('button[name="previous"]');
		this.nextButton = this.querySelector('button[name="next"]');

		if (!this.slider || !this.nextButton) return;

		this.initPages();
		const resizeObserver = new ResizeObserver((entries) => this.initPages());
		resizeObserver.observe(this.slider);

		this.slider.addEventListener('scroll', this.update.bind(this));
		this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
		this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
	}

	initPages() {
		this.sliderItemsToShow = Array.from(this.sliderItems).filter(
			(element) => element.clientWidth > 0,
		);
		if (this.sliderItemsToShow.length < 2) return;
		this.sliderItemOffset =
			this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
		this.slidesPerPage = Math.floor(
			(this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) /
				this.sliderItemOffset,
		);
		this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
		this.update();
	}

	resetPages() {
		this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
		this.initPages();
	}

	update() {
		const previousPage = this.currentPage;
		this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

		if (this.currentPageElement && this.pageTotalElement) {
			this.currentPageElement.textContent = this.currentPage;
			this.pageTotalElement.textContent = this.totalPages;
		}

		if (this.currentPage != previousPage) {
			this.dispatchEvent(
				new CustomEvent('slideChanged', {
					detail: {
						currentPage: this.currentPage,
						currentElement: this.sliderItemsToShow[this.currentPage - 1],
					},
				}),
			);
		}

		if (this.enableSliderLooping) return;

		if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.slider.scrollLeft === 0) {
			this.prevButton.setAttribute('disabled', 'disabled');
		} else {
			this.prevButton.removeAttribute('disabled');
		}

		if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
			this.nextButton.setAttribute('disabled', 'disabled');
		} else {
			this.nextButton.removeAttribute('disabled');
		}
	}

	isSlideVisible(element, offset = 0) {
		const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset;
		return (
			element.offsetLeft + element.clientWidth <= lastVisibleSlide &&
			element.offsetLeft >= this.slider.scrollLeft
		);
	}

	onButtonClick(event) {
		event.preventDefault();
		const step = event.currentTarget.dataset.step || 1;
		this.slideScrollPosition =
			event.currentTarget.name === 'next'
				? this.slider.scrollLeft + step * this.sliderItemOffset
				: this.slider.scrollLeft - step * this.sliderItemOffset;
		this.slider.scrollTo({
			left: this.slideScrollPosition,
		});
	}
}

customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
	constructor() {
		super();
		this.sliderControlWrapper = this.querySelector('.slider-buttons');
		this.enableSliderLooping = true;

		if (!this.sliderControlWrapper) return;

		this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
		if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

		this.sliderControlLinksArray = Array.from(
			this.sliderControlWrapper.querySelectorAll('.slider-counter__link'),
		);
		this.sliderControlLinksArray.forEach((link) =>
			link.addEventListener('click', this.linkToSlide.bind(this)),
		);
		this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
		this.setSlideVisibility();

		if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
	}

	setAutoPlay() {
		this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay');
		this.autoplaySpeed = this.slider.dataset.speed * 1000;

		this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
		this.addEventListener('mouseover', this.focusInHandling.bind(this));
		this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
		this.addEventListener('focusin', this.focusInHandling.bind(this));
		this.addEventListener('focusout', this.focusOutHandling.bind(this));

		this.play();
		this.autoplayButtonIsSetToPlay = true;
	}

	onButtonClick(event) {
		super.onButtonClick(event);
		const isFirstSlide = this.currentPage === 1;
		const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

		if (!isFirstSlide && !isLastSlide) return;

		if (isFirstSlide && event.currentTarget.name === 'previous') {
			this.slideScrollPosition =
				this.slider.scrollLeft +
				this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
		} else if (isLastSlide && event.currentTarget.name === 'next') {
			this.slideScrollPosition = 0;
		}
		this.slider.scrollTo({
			left: this.slideScrollPosition,
		});
	}

	update() {
		super.update();
		this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
		this.prevButton.removeAttribute('disabled');

		if (!this.sliderControlButtons.length) return;

		this.sliderControlButtons.forEach((link) => {
			link.classList.remove('slider-counter__link--active');
			link.removeAttribute('aria-current');
		});
		this.sliderControlButtons[this.currentPage - 1].classList.add(
			'slider-counter__link--active',
		);
		this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
	}

	autoPlayToggle() {
		this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
		this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
		this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
	}

	focusOutHandling(event) {
		const focusedOnAutoplayButton =
			event.target === this.sliderAutoplayButton ||
			this.sliderAutoplayButton.contains(event.target);
		if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
		this.play();
	}

	focusInHandling(event) {
		const focusedOnAutoplayButton =
			event.target === this.sliderAutoplayButton ||
			this.sliderAutoplayButton.contains(event.target);
		if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
			this.play();
		} else if (this.autoplayButtonIsSetToPlay) {
			this.pause();
		}
	}

	play() {
		this.slider.setAttribute('aria-live', 'off');
		clearInterval(this.autoplay);
		this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
	}

	pause() {
		this.slider.setAttribute('aria-live', 'polite');
		clearInterval(this.autoplay);
	}

	togglePlayButtonState(pauseAutoplay) {
		if (pauseAutoplay) {
			this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
			this.sliderAutoplayButton.setAttribute(
				'aria-label',
				window.accessibilityStrings.playSlideshow,
			);
		} else {
			this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
			this.sliderAutoplayButton.setAttribute(
				'aria-label',
				window.accessibilityStrings.pauseSlideshow,
			);
		}
	}

	autoRotateSlides() {
		const slideScrollPosition =
			this.currentPage === this.sliderItems.length
				? 0
				: this.slider.scrollLeft +
				  this.slider.querySelector('.slideshow__slide').clientWidth;
		this.slider.scrollTo({
			left: slideScrollPosition,
		});
	}

	setSlideVisibility() {
		this.sliderItemsToShow.forEach((item, index) => {
			const button = item.querySelector('a');
			if (index === this.currentPage - 1) {
				if (button) button.removeAttribute('tabindex');
				item.setAttribute('aria-hidden', 'false');
				item.removeAttribute('tabindex');
			} else {
				if (button) button.setAttribute('tabindex', '-1');
				item.setAttribute('aria-hidden', 'true');
				item.setAttribute('tabindex', '-1');
			}
		});
	}

	linkToSlide(event) {
		event.preventDefault();
		const slideScrollPosition =
			this.slider.scrollLeft +
			this.sliderFirstItemNode.clientWidth *
				(this.sliderControlLinksArray.indexOf(event.currentTarget) +
					1 -
					this.currentPage);
		this.slider.scrollTo({
			left: slideScrollPosition,
		});
	}
}

customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
	constructor() {
		super();
		this.addEventListener('change', this.onVariantChange);
	}

	onVariantChange() {
		this.updateOptions();
		this.updateMasterId();
		this.toggleAddButton(true, '', false);
		this.updatePickupAvailability();
		this.removeErrorMessage();

		if (!this.currentVariant) {
			this.toggleAddButton(true, '', true);
			this.setUnavailable();
		} else {
			this.updateMedia();
			this.updateURL();
			this.updateVariantInput();
			this.renderProductInfo();
			this.updateShareUrl();
		}
	}

	updateOptions() {
		this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
	}

	updateMasterId() {
		this.currentVariant = this.getVariantData().find((variant) => {
			return !variant.options
				.map((option, index) => {
					return this.options[index] === option;
				})
				.includes(false);
		});
	}

	updateMedia() {
		if (!this.currentVariant) return;
		if (!this.currentVariant.featured_media) return;

		const mediaGallery = document.getElementById(`MediaGallery-${this.dataset.section}`);
		mediaGallery.setActiveMedia(
			`${this.dataset.section}-${this.currentVariant.featured_media.id}`,
			true,
		);

		const modalContent = document.querySelector(
			`#ProductModal-${this.dataset.section} .product-media-modal__content`,
		);
		if (!modalContent) return;
		const newMediaModal = modalContent.querySelector(
			`[data-media-id="${this.currentVariant.featured_media.id}"]`,
		);
		modalContent.prepend(newMediaModal);
	}

	updateURL() {
		if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
		window.history.replaceState(
			{},
			'',
			`${this.dataset.url}?variant=${this.currentVariant.id}`,
		);
	}

	updateShareUrl() {
		const shareButton = document.getElementById(`Share-${this.dataset.section}`);
		if (!shareButton || !shareButton.updateUrl) return;
		shareButton.updateUrl(
			`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`,
		);
	}

	updateVariantInput() {
		const productForms = document.querySelectorAll(
			`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`,
		);
		productForms.forEach((productForm) => {
			const input = productForm.querySelector('input[name="id"]');
			input.value = this.currentVariant.id;
			input.dispatchEvent(new Event('change', { bubbles: true }));
		});
	}

	updatePickupAvailability() {
		const pickUpAvailability = document.querySelector('pickup-availability');
		if (!pickUpAvailability) return;

		if (this.currentVariant && this.currentVariant.available) {
			pickUpAvailability.fetchAvailability(this.currentVariant.id);
		} else {
			pickUpAvailability.removeAttribute('available');
			pickUpAvailability.innerHTML = '';
		}
	}

	removeErrorMessage() {
		const section = this.closest('section');
		if (!section) return;

		const productForm = section.querySelector('product-form');
		if (productForm) productForm.handleErrorMessage();
	}

	renderProductInfo() {
		fetch(
			`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${
				this.dataset.originalSection
					? this.dataset.originalSection
					: this.dataset.section
			}`,
		)
			.then((response) => response.text())
			.then((responseText) => {
				const html = new DOMParser().parseFromString(responseText, 'text/html');
				const destination = document.getElementById(`price-${this.dataset.section}`);
				const source = html.getElementById(
					`price-${
						this.dataset.originalSection
							? this.dataset.originalSection
							: this.dataset.section
					}`,
				);
				if (source && destination) destination.innerHTML = source.innerHTML;

				const price = document.getElementById(`price-${this.dataset.section}`);

				if (price) price.classList.remove('visibility-hidden');
				this.toggleAddButton(
					!this.currentVariant.available,
					window.variantStrings.soldOut,
				);
			});
	}

	toggleAddButton(disable = true, text, modifyClass = true) {
		const productForm = document.getElementById(`product-form-${this.dataset.section}`);
		if (!productForm) return;
		const addButton = productForm.querySelector('[name="add"]');
		const addButtonText = productForm.querySelector('[name="add"] > span');
		if (!addButton) return;

		if (disable) {
			addButton.setAttribute('disabled', 'disabled');
			if (text) addButtonText.textContent = text;
		} else {
			addButton.removeAttribute('disabled');
			addButtonText.textContent = window.variantStrings.addToCart;
		}

		if (!modifyClass) return;
	}

	setUnavailable() {
		const button = document.getElementById(`product-form-${this.dataset.section}`);
		const addButton = button.querySelector('[name="add"]');
		const addButtonText = button.querySelector('[name="add"] > span');
		const price = document.getElementById(`price-${this.dataset.section}`);
		if (!addButton) return;
		addButtonText.textContent = window.variantStrings.unavailable;
		if (price) price.classList.add('visibility-hidden');
	}

	getVariantData() {
		this.variantData =
			this.variantData ||
			JSON.parse(this.querySelector('[type="application/json"]').textContent);
		return this.variantData;
	}
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
	constructor() {
		super();
	}

	updateOptions() {
		const fieldsets = Array.from(this.querySelectorAll('fieldset'));
		this.options = fieldsets.map((fieldset) => {
			return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked)
				.value;
		});
	}
}

customElements.define('variant-radios', VariantRadios);

const slideOut = (container) => {
	if (!container.classList.contains('is-active')) {
		container.classList.add('is-active');
		container.style.height = 'auto';

		var height = container.clientHeight + 'px';

		container.style.height = '0px';

		setTimeout(function () {
			container.style.height = height;
		}, 0);
	} else {
		container.style.height = '0px';
		container.addEventListener(
			'transitionend',
			function () {
				container.classList.remove('is-active');
			},
			{
				once: true,
			},
		);
	}
};

const fadeIn = (container) => {
	if (!container.classList.contains('is-open')) {
		container.classList.add('is-open');

		setTimeout(function () {
			container.classList.add('is-faded-in');
		}, 0);
	} else {
		container.classList.remove('is-faded-in');

		container.addEventListener(
			'transitionend',
			function () {
				container.classList.remove('is-open');
			},
			{
				once: true,
			},
		);
	}
};

class OEReviews {
	constructor({ data, product, section }) {
		this.reviews = data.data;
		this.product = product;
		this.section = document.getElementById(section);
		this.list = this.section.querySelector('.oe-reviews__list');
		this.loadMoreButton = this.section.querySelector('.oe-reviews__load-more');
		this.reviewsWrapper = this.section.querySelector('.oe-reviews');
		this.page = 1;
		this.perPage = 5;

		this.init();
	}

	init() {
		 if (this.product) {
		 	this.reviews = this.reviews.filter((review) => review.productId === this.product.id);
		 }

		if (this.reviews.length <= this.perPage) {
			this.loadMoreButton.remove();
		}

		this.initReviews();
	}

	initReviews() {
		this.loadMoreButton.addEventListener('click', () => {
			this.handleLoadMore();
		});

		this.renderHeader();
		this.renderReviews();
		this.initModals();
	}

	renderReviews() {
		this.reviews
			.slice(this.perPage * (this.page - 1), this.perPage * this.page)
			.forEach((review) => {
				this.list.insertAdjacentHTML('beforeend', this.reviewMarkup(review));
			});
	}

	handleLoadMore() {
		this.page = this.page + 1;

		this.renderReviews();
		this.initModals();

		if (this.perPage * this.page >= this.reviews.length) {
			this.loadMoreButton.remove();
		}
	}

	initModals() {
		const images = this.section.querySelectorAll(
			'.oe-reviews__review-image:not(.is-initialized)',
		);

		images.forEach((image) => {
			image.classList.add('is-initialized');
			const modal = image.querySelector('.oe-reviews__review-modal');

			image.addEventListener('click', () => {
				modal.classList.add('is-open');
				document
					.getElementById('shopify-section-oe-header')
					.classList.add('shopify-section-oe-header-hidden');
				document.body.classList.add('u-overflow-hidden');
			});

			image
				.querySelector('.oe-reviews__review-modal-close')
				.addEventListener('click', (event) => {
					event.stopPropagation();
					modal.classList.remove('is-open');
					document.body.classList.remove('u-overflow-hidden');
				});
			image
				.querySelector('.oe-reviews__review-modal-overlay')
				.addEventListener('click', (event) => {
					event.stopPropagation();
					modal.classList.remove('is-open');
					document.body.classList.remove('u-overflow-hidden');
				});

			if (image.querySelector('.oe-reviews__review-modal-content-left.has-slider')) {
				const swiper = new Swiper(
					image.querySelector('.oe-reviews__review-modal-content-left.has-slider'),
					{
						slideClass: 'oe-reviews__review-modal-image',
						wrapperClass: 'oe-reviews__review-modal-images',
						slidesPerView: 'auto',
						navigation: {
							nextEl: '.oe-reviews__review-modal-images-next',
							prevEl: '.oe-reviews__review-modal-images-prev',
						},
						centeredSlides: true,
					},
				);
			}
		});
	}

	renderHeader() {
		this.reviewsWrapper.insertAdjacentHTML('afterbegin', this.headerMarkup());
	}

	headerMarkup() {
		const rating =
			Math.round(
				(this.reviews.reduce((count, review) => count + review.rating, 0) /
					this.reviews.length) *
					10,
			) / 10;
		const stars = Math.round(rating);
		const count = this.reviews.length;
		const percentage = Math.ceil(
			(this.reviews.filter((review) => review.isRecommended).length /
				this.reviews.length) *
				100,
		);

		return `
      <div class="oe-reviews__header">
        <div class="oe-reviews__header-left">
          <div class="oe-reviews__header-rating">${rating}</div>
          <div class="oe-reviews__header-stars">
            <span class="oe-reviews__header-stars--gray"></span>
            <span class="oe-reviews__header-stars--orange" style="width: ${
				(100 / 5) * stars
			}%"></span>
          </div>
          <div class="oe-reviews__header-ratings">Based on ${count} reviews</div>
        </div>
        <div class="oe-reviews__header-right">
          <div class="oe-reviews__header-percentage">
            <p class="oe-reviews__header-percentage-text">
              <span class="oe-reviews__header-percentage-value">${percentage}%</span>
              of reviewers would recommend this product to a friend
            </p>
          </div>
        </div>
      </div>
    `;
	}

	reviewMarkup(review) {
		const initials = review.name.split(' ')[0][0] + review.name.split(' ')[1][0];
		const name = review.name;
		const isVerified = review.isVerifiedBuyer;
		const isRecommended = review.isRecommended;
		const stars = review.rating;
		const date = new Date(review.dateCreated).toDateString();
		const title = review.title;
		const text = review.body;
		const images = review.imageUrls !== '' ? review.imageUrls.split(',') : [];

		return `
      <div class="oe-reviews__review">
        <div class="oe-reviews__review-left">
          <div class="oe-reviews__review-user">
            <div class="oe-reviews__review-user-avatar">${initials}</div>
            <div class="oe-reviews__review-user-meta">
              <span class="oe-reviews__review-user-name">${name}</span>
              ${
					isVerified
						? '<span class="oe-reviews__review-user-verified">Verified Buyer</span>'
						: ''
				}
            </div>
          </div>
          ${
				isRecommended
					? '<p class="oe-reviews__review-user-recommended">I recommend this product</p>'
					: ''
			}
        </div>
        <div class="oe-reviews__review-right">
          <div class="oe-reviews__review-header">
            <div class="oe-reviews__review-stars">
              <span class="oe-reviews__review-stars--gray"></span>
              <span class="oe-reviews__review-stars--orange" style="width: ${
					(100 / 5) * stars
				}%"></span>
            </div>
            <div class="oe-reviews__review-date">${date}</div>
          </div>
          <h5 class="oe-reviews__review-title">${title}</h5>
          <p class="oe-reviews__review-text">${text}</p>
          ${
				images.length
					? `
          <div class="oe-reviews__review-images">
            ${images
				.map(
					(image) => `
          <div class="oe-reviews__review-image">
						${image.split('.')[image.split('.').length - 1] === 'mp4' ? `is video <video src="${image}" muted controls="false"></video>` : `<img loading="lazy" width="100" height="100" src="${image}"/>`}
            
            
						<div class="oe-reviews__review-modal">
							<div class="oe-reviews__review-modal-overlay"></div>      
							<div class="oe-reviews__review-modal-content">
								<button class="oe-reviews__review-modal-close">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M1.48.44l21.026 22.64m-21.026 0L22.508.44" stroke="#FFF" stroke-width="4" fill="none" fill-rule="evenodd"/></svg>
								</button>
								<div class="oe-reviews__review-modal-content-left ${images.length > 1 ? 'has-slider' : ''}">
									${images.length > 1
											? '<button class="oe-reviews__review-modal-images-prev"><svg width="50" height="54" viewBox="0 0 50 54" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="53.3333" rx="3" fill="#BDBDBD"></rect><path d="M14.543 27.9673L29.6926 42.8007C30.043 43.1441 30.5108 43.3333 31.0095 43.3333C31.5082 43.3333 31.976 43.1441 32.3264 42.8007L33.442 41.7086C34.168 40.997 34.168 39.8403 33.442 39.1298L20.7205 26.6735L33.4561 14.2034C33.8065 13.8601 34 13.4023 34 12.9143C34 12.4256 33.8065 11.9679 33.4561 11.6243L32.3405 10.5324C31.9898 10.1891 31.5223 9.99992 31.0236 9.99992C30.5249 9.99992 30.0571 10.1891 29.7067 10.5324L14.543 25.3795C14.1918 25.7239 13.9989 26.1838 14 26.6727C13.9989 27.1635 14.1918 27.6231 14.543 27.9673Z" fill="white"></path></svg></button>'
											: ''}
									${images.length > 1
											? '<button class="oe-reviews__review-modal-images-next"><svg width="50" height="54" viewBox="0 0 50 54" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="53.3333" rx="3" fill="#BDBDBD"></rect><path d="M35.457 25.366L20.3074 10.5325C19.957 10.1892 19.4892 10 18.9905 10C18.4918 10 18.024 10.1892 17.6736 10.5325L16.558 11.6246C15.832 12.3363 15.832 13.4929 16.558 14.2035L29.2795 26.6598L16.5439 39.1298C16.1935 39.4732 16 39.9309 16 40.419C16 40.9076 16.1935 41.3653 16.5439 41.709L17.6595 42.8008C18.0102 43.1442 18.4777 43.3333 18.9764 43.3333C19.4751 43.3333 19.9429 43.1442 20.2933 42.8008L35.457 27.9538C35.8082 27.6093 36.0011 27.1495 36 26.6606C36.0011 26.1698 35.8082 25.7102 35.457 25.366Z" fill="white"></path></svg></button>'
											: ''}
									<div class="oe-reviews__review-modal-images">
										${images.map((image) => `
											<div class="oe-reviews__review-modal-image">
												${image.split('.')[image.split('.').length - 1] === 'mp4' ? `<video src="${image}"></video>` : `<img src="${image}" />`}
											</div>
												`
										).join(' ')}
									</div>
								</div>
								<div class="oe-reviews__review-modal-content-right">
									<div class="oe-reviews__review-user">
										<div class="oe-reviews__review-user-avatar">${initials}</div>
										<div class="oe-reviews__review-user-meta">
											<span class="oe-reviews__review-user-name">${name}</span>
														${isVerified ? '<span class="oe-reviews__review-user-verified">Verified Buyer</span>' : ''}
										</div>
									</div>
									<div class="oe-reviews__review-header">
										<div class="oe-reviews__review-stars">
											<span class="oe-reviews__review-stars--gray"></span>
											<span class="oe-reviews__review-stars--orange" style="width: ${(100 / 5) * stars}%"></span>
										</div>
										<div class="oe-reviews__review-date">${date}</div>
									</div>
									<h5 class="oe-reviews__review-title">${title}</h5>
									<p class="oe-reviews__review-text">${text}</p>
								</div>
							</div>
						</div>
          </div>
        `,
				)
				.join(' ')}
                
              </div>
          `
					: ''
			}
        </div>
      </div>
    `;
	}

	modalMarkup() {
		return `
			
		`;
	}
}
