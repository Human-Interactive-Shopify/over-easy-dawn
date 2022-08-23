const ACCORDION_SELECTOR = '.js-oe-accordion';

class OEAccordion {
	constructor(element) {
		this.accordion = element;
		this.accordionToggle = this.accordion.querySelector('.oe-accordion__header');
		this.accordionContent = this.accordion.querySelector('.oe-accordion__content');

		if (this.accordion) {
			this.init();
		}
	}

	init() {
		if (this.accordionToggle) {
			this.accordionToggle.addEventListener('click', () => {
				this.accordion.classList.toggle('is-active');
				slideOut(this.accordionContent);
			});
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const accordions = document.querySelectorAll(ACCORDION_SELECTOR);

	if (accordions.length) {
		accordions.forEach((accordion) => {
			const acc = new OEAccordion(accordion);
		});
	}
});
