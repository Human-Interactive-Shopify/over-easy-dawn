/*
 ** API
 **
 ** Useful functions for implementing variant selection / extra features.
 **
 **
 ** UI module
 **
 ** ui.apiQuerySelectorDataTag / ui.apiQuerySelectorAllDataTag
 ** -- Get element with certain data tag/value/parent
 ** -- Example: Get all buttons with data-smartrr-button and value product.id inside the form
 ** -- ui.apiQuerySelectorAllDataTag('data-smartrr-button', ui.$form, {{ product.id }});
 **
 ** ui.apiGetValue / ui.apiSetValue / ui.apiGetAttribute / ui.apiSetText
 ** -- Get and set values and attributes. Note use apiGetAttribute if you set value
 ** -- -- on an element that normally does not have a value
 **
 ** ui.apiHide / ui.apiShow
 ** -- Hide/Show elements.
 **
 ** ui.apiGetRelevantPriceElements
 ** -- Gets relevant Pricing elements. Useful when you want to add functionality to them.
 ** -- Pricing element works even on product pages without Subscription as long as it can find the form
 **
 **
 ** LOGIC Module
 **
 ** ui.logic.apiGetVariantByName / ui.logic.apiGetVariantById
 ** -- Useful when handling variant selection. Based on the value of the input/select, you
 ** -- -- can call the respective function to get the variant.
 **
 ** ui.logic.apiIsOTP
 ** -- check if the current state is One Time Purchase.
 **
 ** ui.logic.apiChangeVariant / ui.logic.apiChangeGroup / ui.logic.apiChangePlan
 ** -- Call when you wish to wish any of these parameters.
 ** -- Please be wary of infinite loops when calling inside the callback functions!
 **
 ** ui.logic.apiGetPriceDetails
 ** -- Get variant related prices based on current state
 ** -- return.regular: variant price.
 ** -- return.subscribe: the current price that will be added to cart.
 ** -- -- Could be subscribe&save price or one-time-purchase price.
 **
 ** ui.logic.apiShowComparePrice / ui.logic.apiGetComparePriceUnformatted / ui.logic.apiGetComparePrice
 ** -- apiShowComparePrice: Should compare price be shown?
 ** -- apiGetComparePriceUnformatted: get price in USD cents
 ** -- apiGetComparePrice: get price formatted to the product page's set format.
 **
 */

if (typeof window.initSmartrr === 'undefined') {
	window.initSmartrr = function (uniqueId, manual = false) {
		function UIHandler(productInfo) {
			productInfo.ui = this;
			this.productInfo = productInfo;
			productInfo.logic = new LogicHandler(productInfo);

			this.logic = productInfo.logic;
			this.tagList = this.apiSetupTagList();

			this.$form = this.apiQuerySelectorDataTag(
				this.tagList.FORM.tag,
				document,
				this.tagList.FORM.value,
			);

			if (this.$form === null) {
				/*
          If form wasn't explicitly labeled by merchant with FORM.tag, then we will search for a form
          inside our fieldset "smartrr-purchase-options" defined at smartrr-product.liquid.ts 
        */
				var fieldset = this.apiQuerySelectorDataTag(
					this.tagList.PURCHASE_OPTIONS,
					document,
					this.tagList.FORM.value,
				);
				if (fieldset && typeof fieldset.closest !== 'undefined') {
					var newForm = fieldset.closest('form');
					if (newForm) {
						this.$form = newForm;
					}
				}
			}

			if (!this.$form) {
			}

			productInfo.uiImplementDetectChange(this);

			var that = this;
			/* Handle the group selector. In this case, it is radio input. This is the default case and assumed to be so by the UI Handler. */
			var groupInputs = this.apiQuerySelectorAllDataTag(
				this.tagList.SELLING_PLAN_GROUP_INPUT,
				this.$form,
			);
			groupInputs.forEach(function (input) {
				input.addEventListener('click', function () {
					that.logic.apiChangeGroup(input.value);
				});
			});
		}

		UIHandler.prototype = Object.assign({}, UIHandler.prototype, {
			apiSetupTagList: function () {
				var tagList = {
					FORM: {
						tag: String(this.productInfo.formTag),
						value: String(this.productInfo.uniqueId),
					},

					SELLING_PLAN_INPUT: 'data-smartrr-selling-plan-input',
					PURCHASE_OPTIONS: 'data-smartrr-purchase-options',
					NO_PLANS: 'data-smartrr-no-plans',
					SELLING_PLAN_GROUPS: 'data-smartrr-selling-plan-groups',
					SELLING_PLAN_GROUP: 'data-smartrr-selling-plan-group-id',
					SELLING_PLAN_GROUP_INPUT: 'data-smartrr-selling-plan-group-input',
					SELLING_PLAN_GROUP_FREQUENCY_INPUT:
						'data-smartrr-selling-plan-select-label-input',
					SELLING_PLAN_GROUP_CONTENT: 'data-smartrr-selling-plan-group-contents',

					PRICING: {
						PRODUCT_ID: 'data-smartrr-product-id',
						SELECTOR: 'data-smartrr-price-style',
						CONSTANT: 'data-smartrr-constant',
						COMPARE: 'data-smartrr-compare-price',
						REGULAR: 'data-smartrr-regular-price',
						SUBSCRIBE: 'data-smartrr-subscribe-price',
						QUANTITY: 'data-use-quantity',
					},
				};
				return tagList;
			},

			apiSetupNiceSelect: function (nice, onActiveCallback) {
				var displayDiv = this.apiQuerySelectorDataTag('data-smartrr-ns-display', nice);
				var list = this.apiQuerySelectorAllDataTag('data-smartrr-ns-plan', nice);
				var defaultLi = this.apiQuerySelectorDataTag('data-ns-plan-default', nice);

				function useNiceCallback(_li) {
					while (displayDiv.firstChild) {
						displayDiv.removeChild(displayDiv.firstChild);
					}

					displayDiv.appendChild(_li.cloneNode(true));

					onActiveCallback(_li, nice);
				}

				if (defaultLi) {
					useNiceCallback(defaultLi, nice);
				} else if (list.length > 0) {
					useNiceCallback(list[0], nice);
				}

				list.forEach(function (li) {
					li.addEventListener('click', function () {
						useNiceCallback(li, nice);
					});
				});

				if (typeof window.smartrrNiceSelectList === 'undefined') {
					window.smartrrNiceSelectList = {
						current: null,
						list: [],
					};
					document.addEventListener('click', function (event) {
						var prevCurrent = window.smartrrNiceSelectList.current;

						if (prevCurrent) {
							prevCurrent.classList.remove('smartrr-ns-open');
							window.smartrrNiceSelectList.current = null;
						}

						window.smartrrNiceSelectList.list.forEach(function (container) {
							if (prevCurrent === container) {
								return;
							}

							if (container === event.target || container.contains(event.target)) {
								window.smartrrNiceSelectList.current = container;
								container.classList.add('smartrr-ns-open');
								return;
							}
						});
					});
				}
				window.smartrrNiceSelectList.list.push(nice);
			},

			apiQuerySelectorDataTag: function (dataTag, parent, value) {
				var selector = '[' + dataTag + ']';
				if (value) {
					selector = '[' + dataTag + '="' + String(value) + '"]';
				}
				return parent
					? parent.querySelector(selector)
					: document.querySelector(selector);
			},

			apiQuerySelectorAllDataTag: function (dataTag, parent, value) {
				var selector = '[' + dataTag + ']';
				if (value) {
					selector = '[' + dataTag + '="' + String(value) + '"]';
				}
				return Array.from(
					parent
						? parent.querySelectorAll(selector)
						: document.querySelectorAll(selector),
				);
			},

			apiGetValue: function (elem) {
				return elem.value;
			},

			apiSetValue: function (elem, value) {
				elem.value = value;
			},

			apiGetAttribute: function (elem, attribute) {
				return elem.getAttribute(attribute);
			},

			apiSetText: function (elem, text) {
				elem.textContent = text;
			},

			apiOnPlanChanged: function (currentInfo) {
				this.apiSetValue(
					this.apiQuerySelectorDataTag(this.tagList.SELLING_PLAN_INPUT, this.$form),
					currentInfo.planId,
				);

				this.productInfo.uiOnPlanChange &&
					this.productInfo.uiOnPlanChange(this, currentInfo);

				this.apiUpdatePrices(currentInfo);
			},

			apiOnGroupChanged: function (currentInfo) {
				var inputs = this.apiQuerySelectorAllDataTag(
					this.tagList.SELLING_PLAN_GROUP_INPUT,
					this.$form,
				);

				console.log(currentInfo);

				var that = this;
				inputs &&
					inputs.forEach(function (input) {
						if (that.apiGetValue(input) === currentInfo.groupId) {
							input.checked = true;
						}
					});

				var groups = this.apiQuerySelectorAllDataTag(
					this.tagList.SELLING_PLAN_GROUP,
					this.$form,
				);
				var groupContents = this.apiQuerySelectorAllDataTag(
					this.tagList.SELLING_PLAN_GROUP_CONTENT,
					this.$form,
				);

				groupContents.forEach(function (group) {
					var groupId = that.apiGetAttribute(
						group,
						that.tagList.SELLING_PLAN_GROUP_CONTENT,
					);
					if (groupId === currentInfo.groupId) {
						that.apiShow(group);
					} else {
						that.apiHide(group);
					}
				});

				groups.forEach(function (group) {
					var groupId = that.apiGetAttribute(group, that.tagList.SELLING_PLAN_GROUP);
					if (groupId === '') {
						return;
					}
					var spa = that.logic.apiGetAnySellingPlanAllocationByVariantGroupId(
						currentInfo.variantId,
						groupId,
					);
					if (!!spa) {
						that.apiShow(group);
					} else {
						that.apiHide(group);
					}
				});

				this.productInfo.uiOnGroupChange &&
					this.productInfo.uiOnGroupChange(this, currentInfo);

				currentInfo = this.logic.apiGetCurrentCopy();

				if (currentInfo.groupId === '') {
					this.logic.apiChangePlan('');
					return;
				}

				if (currentInfo.planId === '') {
					var firstPlan = this.apiGetFirstPlan(currentInfo);
					this.logic.apiChangePlan(firstPlan);
				} else {
					this.logic.apiChangePlan(currentInfo.planId);
				}
			},

			apiOnVariantChanged: function (currentInfo) {
				if (currentInfo.groupId === '') {
					var firstGroup = this.apiGetFirstGroup(currentInfo);
					this.logic.apiChangeGroup(firstGroup);
				} else {
					this.logic.apiChangeGroup(currentInfo.groupId);
				}

				this.productInfo.uiOnVariantChange &&
					this.productInfo.uiOnVariantChange(this, currentInfo);
			},

			apiGetFirstPlan: function (currentInfo) {
				if (currentInfo.groupId === '') {
					return '';
				}

				var plans = this.apiQuerySelectorAllDataTag(
					this.tagList.SELLING_PLAN_GROUP_FREQUENCY_INPUT,
					this.$form,
					currentInfo.groupId,
				);

				if (plans.length) {
					return this.apiGetValue(plans[0]);
				} else {
					var firstPlan = this.logic.apiGetAnySellingPlanAllocationByVariantGroupId(
						currentInfo.variantId,
						currentInfo.groupId,
					);
					if (firstPlan) {
						return String(firstPlan.selling_plan_id);
					}
				}
				return '';
			},

			apiGetFirstGroup: function (currentInfo) {
				var allGroups = this.apiQuerySelectorAllDataTag(
					this.tagList.SELLING_PLAN_GROUP,
					this.$form,
				);

				var that = this;
				groups = allGroups.filter(function (group) {
					var groupId = that.apiGetAttribute(group, that.tagList.SELLING_PLAN_GROUP);
					if (groupId === '') {
						return true;
					}
					var spa = that.logic.apiGetAnySellingPlanAllocationByVariantGroupId(
						currentInfo.variantId,
						groupId,
					);
					return !!spa;
				});

				return groups.length
					? this.apiGetAttribute(groups[0], this.tagList.SELLING_PLAN_GROUP)
					: '';
			},

			apiHide: function ($el) {
				if ($el) {
					$el.classList.add('hide');
				}
			},

			apiShow: function ($el) {
				if ($el) {
					$el.classList.remove('hide');
				}
			},

			apiGetRelevantPriceElements: function () {
				var $pricedivs = this.apiQuerySelectorAllDataTag(this.tagList.PRICING.SELECTOR);
				var that = this;
				$pricedivs = $pricedivs.filter(function ($div) {
					return (
						String(that.apiGetAttribute($div, that.tagList.PRICING.PRODUCT_ID)) ===
						String(that.productInfo.uniqueId)
					);
				});
				return $pricedivs;
			},

			apiUpdatePrices: function (currentInfo) {
				/*
          PRICING: {
            PRODUCT_ID: 'data-smartrr-product-id',
            SELECTOR: 'data-smartrr-price-style',
            CONSTANT: 'data-smartrr-constant',
            REGULAR: 'data-smartrr-regular-price',
            SUBSCRIBE: 'data-smartrr-subscribe-price',
          }
        */
				var that = this;

				var $pricedivs = this.apiGetRelevantPriceElements();

				$pricedivs.forEach(function ($div) {
					var style = that.apiGetAttribute($div, that.tagList.PRICING.SELECTOR);
					var constant = that.apiGetAttribute($div, that.tagList.PRICING.CONSTANT);
					var regular = that.apiQuerySelectorDataTag(
						that.tagList.PRICING.REGULAR,
						$div,
					);
					var subscribe = that.apiQuerySelectorDataTag(
						that.tagList.PRICING.SUBSCRIBE,
						$div,
					);
					var compare = that.apiQuerySelectorDataTag(
						that.tagList.PRICING.COMPARE,
						$div,
					);
					var priceEditCallback = that.productInfo.uiModifyPrice;

					var useQuantity = that.apiGetAttribute($div, that.tagList.PRICING.QUANTITY);

					var qty = Number(useQuantity ? that.productInfo.uiGetQuantity(that) : 1);

					that.apiSetText(compare, that.logic.apiGetComparePrice(qty));
					that.apiHide(compare);

					switch (style) {
						case 'original':
						case 'original-compare':
							that.apiHide(regular);
							if (style.includes('compare') && that.logic.apiShowComparePrice()) {
								that.apiShow(compare);
							}
							that.apiSetText(
								subscribe,
								that.logic.apiGetDiscountPrice(
									$div,
									priceEditCallback,
									currentInfo.variantId,
									'',
									'',
									qty,
								),
							);
							break;
						case 'strike':
						case 'strike-compare':
							if (currentInfo.groupId === '') {
								if (
									style.includes('compare') &&
									that.logic.apiShowComparePrice()
								) {
									that.apiShow(compare);
								}
								if (constant) {
									that.apiSetText(
										regular,
										that.logic.apiGetRegularPrice(
											$div,
											priceEditCallback,
											currentInfo.variantId,
											constant,
											'',
											qty,
										),
									);
									that.apiSetText(
										subscribe,
										that.logic.apiGetDiscountPrice(
											$div,
											priceEditCallback,
											currentInfo.variantId,
											constant,
											'',
											qty,
										),
									);
									that.apiShow(regular);
								} else {
									that.apiHide(regular);
									that.apiSetText(
										subscribe,
										that.logic.apiGetDiscountPrice(
											$div,
											priceEditCallback,
											currentInfo.variantId,
											'',
											'',
											qty,
										),
									);
								}
							} else {
								if (constant) {
									if (constant === currentInfo.groupId) {
										that.apiSetText(
											regular,
											that.logic.apiGetRegularPrice(
												$div,
												priceEditCallback,
												currentInfo.variantId,
												currentInfo.groupId,
												currentInfo.planId,
												qty,
											),
										);
										that.apiSetText(
											subscribe,
											that.logic.apiGetDiscountPrice(
												$div,
												priceEditCallback,
												currentInfo.variantId,
												currentInfo.groupId,
												currentInfo.planId,
												qty,
											),
										);
									} else {
										that.apiSetText(
											regular,
											that.logic.apiGetRegularPrice(
												$div,
												priceEditCallback,
												currentInfo.variantId,
												constant,
												'',
												qty,
											),
										);
										that.apiSetText(
											subscribe,
											that.logic.apiGetDiscountPrice(
												$div,
												priceEditCallback,
												currentInfo.variantId,
												constant,
												'',
												qty,
											),
										);
									}
								} else {
									that.apiSetText(
										regular,
										that.logic.apiGetRegularPrice(
											$div,
											priceEditCallback,
											currentInfo.variantId,
											currentInfo.groupId,
											currentInfo.planId,
											qty,
										),
									);
									that.apiSetText(
										subscribe,
										that.logic.apiGetDiscountPrice(
											$div,
											priceEditCallback,
											currentInfo.variantId,
											currentInfo.groupId,
											currentInfo.planId,
											qty,
										),
									);
								}
								that.apiShow(regular);
							}
							break;
						case 'overwrite':
						case 'overwrite-compare':
							that.apiHide(regular);
							if (currentInfo.groupId === '') {
								if (
									style.includes('compare') &&
									that.logic.apiShowComparePrice()
								) {
									that.apiShow(compare);
								}
								if (constant) {
									that.apiSetText(
										subscribe,
										that.logic.apiGetDiscountPrice(
											$div,
											priceEditCallback,
											currentInfo.variantId,
											constant,
											'',
											qty,
										),
									);
								} else {
									that.apiSetText(
										subscribe,
										that.logic.apiGetDiscountPrice(
											$div,
											priceEditCallback,
											currentInfo.variantId,
											'',
											'',
											qty,
										),
									);
								}
							} else {
								if (constant) {
									if (constant === currentInfo.groupId) {
										that.apiSetText(
											subscribe,
											that.logic.apiGetDiscountPrice(
												$div,
												priceEditCallback,
												currentInfo.variantId,
												currentInfo.groupId,
												currentInfo.planId,
												qty,
											),
										);
									} else {
										that.apiSetText(
											subscribe,
											that.logic.apiGetDiscountPrice(
												$div,
												priceEditCallback,
												currentInfo.variantId,
												constant,
												'',
												qty,
											),
										);
									}
								} else {
									that.apiSetText(
										subscribe,
										that.logic.apiGetDiscountPrice(
											$div,
											priceEditCallback,
											currentInfo.variantId,
											currentInfo.groupId,
											currentInfo.planId,
											qty,
										),
									);
								}
							}
							break;
					}
				});
			},
		});

		function LogicHandler(productInfo) {
			this.ui = productInfo.ui;
			this.productInfo = productInfo;

			this.current = {
				variantId: '',
				groupId: '',
				planId: '',
			};
		}

		LogicHandler.prototype = Object.assign({}, LogicHandler.prototype, {
			apiGetCurrentCopy: function () {
				return JSON.parse(JSON.stringify(this.current));
			},

			apiGetVariants: function () {
				return this.productInfo.product.variants;
			},

			apiGetVariantByName: function (name) {
				return this.apiGetVariants().find(function (variant) {
					return variant.title === name;
				});
			},

			apiGetVariantById: function (id) {
				return this.apiGetVariants().find(function (variant) {
					return String(variant.id) === String(id);
				});
			},

			apiGetSellingPlanGroups: function () {
				var spg = this.productInfo.product.selling_plan_groups;
				var that = this;
				if (spg && spg.length > 0) {
					return spg.filter(function (group) {
						return (
							group.app_id === that.productInfo.appId &&
							!group.name.includes(that.productInfo.hiddenGroup)
						);
					});
				}
				return undefined;
			},

			apiGetSellingPlanGroupById: function (id) {
				var groups = this.apiGetSellingPlanGroups();
				if (groups) {
					return groups.find(function (group) {
						return String(group.id) === String(id);
					});
				}
				return undefined;
			},

			apiGetSellingPlansByGroupId: function (groupId) {
				var group = this.apiGetSellingPlanGroupById(groupId);
				if (group) {
					return group.selling_plans;
				}
				return undefined;
			},

			apiGetSellingPlanById: function (groupId, sellingPlanId) {
				var plans = this.apiGetSellingPlansByGroupId(groupId);
				if (plans) {
					return plans.find(function (plan) {
						return String(plan.id) === String(sellingPlanId);
					});
				}
			},

			apiGetSellingPlanAllocationsByVariantId: function (variantId) {
				var variant = this.apiGetVariantById(variantId);
				if (variant) {
					return variant.selling_plan_allocations;
				}
				return undefined;
			},

			apiGetAnySellingPlanAllocationByVariantGroupId: function (variantId, groupId) {
				var spas = this.apiGetSellingPlanAllocationsByVariantId(variantId);
				if (spas) {
					return spas.find(function (plan) {
						return String(plan.selling_plan_group_id) === String(groupId);
					});
				}
				return undefined;
			},

			apiGetSellingPlanAllocationByVariantGroupPlanId: function (
				variantId,
				groupId,
				planId,
			) {
				var spa = this.apiGetSellingPlanAllocationsByVariantId(variantId);
				if (spa) {
					return spa.find(function (plan) {
						return (
							String(plan.selling_plan_group_id) === String(groupId) &&
							String(plan.selling_plan_id) === String(planId)
						);
					});
				}
				return undefined;
			},

			apiHasValidSellingPlanAllocations: function (variantId) {
				var hasValidSPA = false;
				var SPAList = this.apiGetSellingPlanAllocationsByVariantId(variantId);
				var that = this;

				SPAList.forEach(function (SPA) {
					var groupId = SPA.selling_plan_group_id;
					if (that.apiGetSellingPlanGroupById(groupId)) {
						hasValidSPA = true;
					}
				});

				return hasValidSPA;
			},

			apiIsOTP: function () {
				return (
					this.current.variantId !== '' &&
					this.current.groupId === '' &&
					this.current.planId === ''
				);
			},

			apiChangePlan: function (newplanId) {
				if (newplanId === '' && this.current.groupId === '') {
					this.current.planId = '';
					this.ui.apiOnPlanChanged(this.apiGetCurrentCopy());
					return true;
				}
				if (
					this.apiGetSellingPlanAllocationByVariantGroupPlanId(
						this.current.variantId,
						this.current.groupId,
						newplanId,
					)
				) {
					this.current.planId = String(newplanId);
					this.ui.apiOnPlanChanged(this.apiGetCurrentCopy());
					return true;
				}
				return false;
			},

			apiChangeGroup: function (newGroupId) {
				console.log('apiChangeGroup', newGroupId);
				if (newGroupId === '') {
					this.current.groupId = '';
					this.current.planId = '';
					this.ui.apiOnGroupChanged(this.apiGetCurrentCopy());
					return true;
				} else {
					console.log('else');
					if (
						this.apiGetAnySellingPlanAllocationByVariantGroupId(
							this.current.variantId,
							newGroupId,
						)
					) {
						var plans = this.apiGetSellingPlansByGroupId(newGroupId);
						if (plans && plans.length > 0) {
							this.current.groupId = String(newGroupId);
							if (
								this.apiGetSellingPlanAllocationByVariantGroupPlanId(
									this.current.variantId,
									this.current.groupId,
									this.current.planId,
								)
							) {
								this.ui.apiOnGroupChanged(this.apiGetCurrentCopy());
							} else {
								this.current.planId = '';
								this.ui.apiOnGroupChanged(this.apiGetCurrentCopy());
							}
							return true;
						}
					}
				}
				return false;
			},

			apiChangeVariant: function (newVariantId) {
				var variant = this.apiGetVariantById(newVariantId);
				if (variant) {
					this.current.variantId = String(newVariantId);
					if (
						this.apiGetAnySellingPlanAllocationByVariantGroupId(
							this.current.variantId,
							this.current.groupId,
						)
					) {
						this.current.groupId = this.current.groupId;
					} else {
						this.current.groupId = '';
						this.current.planId = '';
					}
					this.ui.apiOnVariantChanged(this.apiGetCurrentCopy());
				}
			},

			apiSetupVariantAndGroup: function (newVariantId, newGroupId) {
				if (String(newGroupId) !== '') {
					if (
						this.apiGetAnySellingPlanAllocationByVariantGroupId(
							newVariantId,
							newGroupId,
						)
					) {
						this.current.variantId = String(newVariantId);
						this.current.groupId = String(newGroupId);
						this.apiChangeVariant(newVariantId);
						return;
					}
				}
				this.current.variantId = String(newVariantId);
				this.apiChangeVariant(newVariantId);
			},

			apiShowComparePrice: function () {
				var variant = this.apiGetVariantById(this.current.variantId);
				return (
					variant &&
					variant.compare_at_price &&
					variant.compare_at_price > variant.price
				);
			},

			apiGetComparePriceUnformatted: function (_qty) {
				var variant = this.apiGetVariantById(this.current.variantId);
				return variant && variant.compare_at_price
					? variant.compare_at_price * _qty
					: undefined;
			},

			apiGetComparePrice: function (_qty) {
				var variant = this.apiGetVariantById(this.current.variantId);
				return this.apiFormatMoney(
					variant && variant.compare_at_price
						? variant.compare_at_price * _qty
						: undefined,
				);
			},

			apiCalculateDiscount: function (compare, current) {
				if (typeof compare !== 'undefined') {
					return ((compare - current) * 100) / compare;
				} else {
					return 0;
				}
			},

			apiCalculateSaveAmount: function (compare, current) {
				if (typeof compare !== 'undefined') {
					return compare - current;
				} else {
					return 0;
				}
			},

			apiAddDiscountPercentage: function (money) {
				var self = this;

				money.discount = {
					regular: self.apiCalculateDiscount(money.regular, money.regular),
					subscribe: self.apiCalculateDiscount(money.regular, money.subscribe),
					adjustment: money.adjustment.map(function (adj) {
						return self.apiCalculateDiscount(money.regular, adj);
					}),
				};

				return money;
			},

			apiAddSaveValue: function (money) {
				var self = this;

				money.save = {
					regular: self.apiCalculateSaveAmount(money.regular, money.regular),
					subscribe: self.apiCalculateSaveAmount(money.regular, money.subscribe),
					adjustment: money.adjustment.map(function (adj) {
						return self.apiCalculateSaveAmount(money.regular, adj);
					}),
				};

				return money;
			},

			apiGetPriceDetails: function (_variantId, _groupId, _planId, _qty) {
				var self = this;

				if (_variantId === '') {
					return self.apiAddSaveValue(
						self.apiAddDiscountPercentage({
							regular: undefined,
							subscribe: undefined,
							adjustment: [],
						}),
					);
				}
				if (_groupId === '') {
					return self.apiAddSaveValue(
						self.apiAddDiscountPercentage({
							regular: undefined,
							subscribe: this.apiGetVariantById(_variantId).price * _qty,
							adjustment: [],
						}),
					);
				}
				if (_planId === '') {
					var spa = this.apiGetAnySellingPlanAllocationByVariantGroupId(
						_variantId,
						_groupId,
					);

					return self.apiAddSaveValue(
						self.apiAddDiscountPercentage({
							regular: this.apiGetVariantById(_variantId).price * _qty,
							subscribe: spa ? spa.price * _qty : undefined,
							adjustment: spa.price_adjustments.map(function (adj) {
								return adj.price * _qty;
							}),
						}),
					);
				}
				var spa = this.apiGetSellingPlanAllocationByVariantGroupPlanId(
					_variantId,
					_groupId,
					_planId,
				);
				return self.apiAddSaveValue(
					self.apiAddDiscountPercentage({
						regular: spa ? spa.compare_at_price * _qty : undefined,
						subscribe: spa ? spa.price * _qty : undefined,
						adjustment: spa.price_adjustments.map(function (adj) {
							return adj.price * _qty;
						}),
					}),
				);
			},

			apiGetFormattedPriceDetails: function (money) {
				return {
					regular: this.apiFormatMoney(money.regular),
					subscribe: this.apiFormatMoney(money.subscribe),
				};
			},

			apiFormatMoney: function (value) {
				if (value) {
					if (typeof Shopify !== 'undefined') {
						return Intl.NumberFormat(Shopify.locale, {
							style: 'currency',
							currency: Shopify.currency.active,
							minimumFractionDigits: 2,
						}).format(value / 100);
					}
					return '$' + String(value / 100);
				}
				return '$INVALID';
			},

			apiGetRegularPrice: function (
				$div,
				priceEditCallback,
				_variantId,
				_groupId,
				_planId,
				_qty,
			) {
				var priceDetails = this.apiGetPriceDetails(_variantId, _groupId, _planId, _qty);
				priceDetails = priceEditCallback(this.productInfo.ui, $div, priceDetails);
				return this.apiGetFormattedPriceDetails(priceDetails).regular;
			},

			apiGetDiscountPrice: function (
				$div,
				priceEditCallback,
				_variantId,
				_groupId,
				_planId,
				_qty,
			) {
				var priceDetails = this.apiGetPriceDetails(_variantId, _groupId, _planId, _qty);
				priceDetails = priceEditCallback(this.productInfo.ui, $div, priceDetails);

				return this.apiGetFormattedPriceDetails(priceDetails).subscribe;
			},
		});

		if (manual) {
			if (window.smartrrProductList && window.smartrrProductList[uniqueId]) {
				new UIHandler(window.smartrrProductList[uniqueId]);
			}
		} else {
			document.addEventListener('DOMContentLoaded', function () {
				if (window.smartrrProductList && window.smartrrProductList[uniqueId]) {
					new UIHandler(window.smartrrProductList[uniqueId]);
				}
			});

			window.addEventListener('pageshow', function () {
				if (window.smartrrProductList && window.smartrrProductList[uniqueId]) {
					var productInfo = window.smartrrProductList[uniqueId];
					var current = productInfo.ui.logic.apiGetCurrentCopy();
					if (
						(current.groupId === '' && current.planId === '') ||
						productInfo.ui.logic.apiGetSellingPlanAllocationByVariantGroupPlanId(
							current.variantId,
							current.groupId,
							current.planId,
						)
					) {
						productInfo.ui.logic.apiChangeVariant(current.variantId);
						productInfo.ui.logic.apiChangeGroup(current.groupId);
						productInfo.ui.logic.apiChangePlan(current.planId);
					}
				}
			});
		}
	};
}
