const FAQ_LIST_FILTERS_SELECTOR = '.js-faq-section';
const FAQ_NAVIGATION_SELECTOR = '.js-faq-navigation';

class OEFaqFilters {
	constructor(element) {
		this.section = element;
		this.buttons = this.section.querySelectorAll('.oe-faq-blog__list-filter');
		this.accordions = this.section.querySelectorAll('.js-oe-accordion');

		if (this.buttons.length) {
			this.init();
		}
	}

	init() {
		this.buttons.forEach((button) => {
			button.addEventListener('click', () => {
				this.buttons.forEach((button) => button.classList.remove('is-active'));

				button.classList.add('is-active');

				this.toggleAccordions(button.dataset.filterId);
			});
		});

		setTimeout(() => {
			this.buttons[0].click();
		});
	}

	toggleAccordions(filter) {
		this.accordions.forEach((accordion) =>
			accordion.classList.toggle('is-hidden', !accordion.dataset.tags.includes(filter)),
		);
	}
}

class OEFaqNavigation {
	constructor(element) {
		this.navigation = element;
		this.sections = document.querySelectorAll('.js-faq-section');

		if (this.sections.length) {
			this.init();
		}
	}

	init() {
		this.sections.forEach((section) => {
			const sectionId = section.id;
			const sectionName = section.querySelector('.oe-faq-blog__list-title').innerText;

			this.createButton(sectionId, sectionName);
		});

		this.initButtons();
	}

	createButton(id, name) {
		this.navigation.insertAdjacentHTML('beforeend', this.getButtonHtml(id, name));
	}

	getButtonHtml(id, name) {
		return `
			<button class="oe-faq-blog__navigation-button" data-section-id="${id}">${name}</button>
		`;
	}

	initButtons() {
		const buttons = this.navigation.querySelectorAll('.oe-faq-blog__navigation-button');

		if (buttons.length) {
			buttons.forEach((button) => {
				button.addEventListener('click', () => {
					window.scrollTo({
						top: document
							.querySelector(`#${button.dataset.sectionId}`)
							.getBoundingClientRect().top,
						behavior: 'smooth',
					});
				});
			});
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const filters = document.querySelectorAll(FAQ_LIST_FILTERS_SELECTOR);

	if (filters.length) {
		filters.forEach((filter) => {
			const filt = new OEFaqFilters(filter);
		});
	}

	const navigations = document.querySelectorAll(FAQ_NAVIGATION_SELECTOR);

	if (navigations.length) {
		navigations.forEach((navigation) => {
			const navi = new OEFaqNavigation(navigation);
		});
	}
});
