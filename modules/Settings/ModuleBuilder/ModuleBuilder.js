/*************************************************************************************************
 * Copyright 2020 JPL TSolucio, S.L. -- This file is a part of TSOLUCIO coreBOS Customizations.
 * Licensed under the vtiger CRM Public License Version 1.1 (the "License"); you may not use this
 * file except in compliance with the License. You can redistribute it and/or modify it
 * under the terms of the License. JPL TSolucio, S.L. reserves all rights not expressly
 * granted by the License. coreBOS distributed by JPL TSolucio S.L. is distributed in
 * the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. Unless required by
 * applicable law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT ANY WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing
 * permissions and limitations under the License. You may obtain a copy of the License
 * at <http://corebos.org/documentation/doku.php?id=en:devel:vpl11>
 *************************************************************************************************/

loadJS('index.php?module=Settings&action=SettingsAjax&file=getjslanguage');
const tuiGrid = tui.Grid;
let url = 'index.php?module=Settings&action=SettingsAjax&file=BuilderFunctions';
let dataGridInstance;
let fieldGridInstance;
let viewGridInstance;
let listGridInstance;
let moduleData = new Array();

const mb = {
	/**
	 * Save values for each step
	 * @param {number} step
	 * @param {boolean} forward
	 * @param {string} buttonid
	 */
	SaveModule: (step, forward = true, buttonid = '') => {
		var data = {};
		if (step == 1) {
			data = {
				modulename: mb.loadElement('modulename'),
				modulelabel: mb.loadElement('modulelabel'),
				parentmenu: mb.loadElement('parentmenu'),
				moduleicon: mb.loadElement('moduleicon'),
				sharingaccess: mb.getRadioValue('sharingaccess'),
				merge: mb.loadElement('merge', true).checked,
				import: mb.loadElement('import', true).checked,
				export: mb.loadElement('export', true).checked,
				step: step
			};
		}
		if (step == 2) {
			var blocks_label = [];
			const BLOCK_COUNT = mb.loadElement('BLOCK_COUNT');
			for (var i = 1; i <= BLOCK_COUNT; i++) {
				blocks_label[i] = mb.loadElement(`blocks_label_${i}`);
			}
			data = {
				blocks: blocks_label,
				step: step
			};
		}

		if (step == 3) {
			var fields = [];
			const FIELD_COUNT = mb.loadElement('FIELD_COUNT');
			var btnid = buttonid.split('-')[4];
			if (forward == false) {
				let proceed = true;
				if (mb.loadElement(`fieldname_${btnid}`) == '' || mb.loadElement(`fieldlabel_${btnid}`) == '') {
					mb.loadMessage(mod_alert_arr.FieldsEmpty, true);
					proceed = false;
				}
				if (mb.loadElement(`Uitype_${btnid}`) == '10') {
					if (mb.loadElement(`relatedmodules_${btnid}`) == '') {
						mb.loadMessage(mod_alert_arr.Relmod, true);
						proceed = false;
					}
				}
				if (mb.loadElement(`Uitype_${btnid}`) == '15' || mb.loadElement(`Uitype_${btnid}`) == '16') {
					if (mb.loadElement(`picklistvalues_${btnid}`) == '') {
						mb.loadMessage(mod_alert_arr.PickListFld, true);
						proceed = false;
					}
				}
				if (!proceed) {
					return;
				}
				var fieldValues = {
					blockid: mb.getRadioValue(`select-for-field-${btnid}`),
					fieldname: mb.loadElement(`fieldname_${btnid}`),
					columnname: mb.loadElement(`fieldname_${btnid}`),
					fieldlabel: mb.loadElement(`fieldlabel_${btnid}`),
					relatedmodules: mb.loadElement(`relatedmodules_${btnid}`),
					masseditable: mb.loadElement(`Masseditable_${btnid}`),
					displaytype: mb.loadElement(`Displaytype_${btnid}`),
					quickcreate: mb.loadElement(`Quickcreate_${btnid}`),
					typeofdata: mb.loadElement(`Typeofdata_${btnid}`),
					presence: mb.loadElement(`Presence_${btnid}`),
					uitype: mb.loadElement(`Uitype_${btnid}`),
					picklistvalues: mb.loadElement(`picklistvalues_${btnid}`),
					sequence: FIELD_COUNT,
				};
				fields.push(fieldValues);
				data = {
					fields: fields,
					step: step
				};
			} else {
				data = {
					fields: [],
					step: step
				};
			}
		}

		if (step == 4) {
			let customViews = [];
			let field;
			var btnid = buttonid.split('-')[4];
			const FILTER_COUNT = mb.loadElement('FILTER_COUNT');
			if (forward == false) {
				let proceed = true;
				const modulename = mb.loadElement('modulename');
				const data = {
					modulename: modulename
				};
				jQuery.ajax({
					method: 'POST',
					url: url+'&methodName=getCountFilter',
					data: data
				}).done(function (response) {
					if (response == 0) {
						if (mb.loadElement(`viewname-${FILTER_COUNT}`) == 'All') {
							proceed = true;
						}
						if (mb.loadElement(`viewname-${FILTER_COUNT}`) != 'All' || mb.loadElement(`viewname-${FILTER_COUNT}`) != '') {
							mb.loadMessage(mod_alert_arr.FirstFilterAll_msg, true);
							proceed = false;
						}
					}
					if (response > 0) {
						if (mb.loadElement(`viewname-${FILTER_COUNT}`) == '') {
							mb.loadMessage(mod_alert_arr.ViewnameEmpty_msg, true);
							proceed = false;
						}
					}
				});
				const checkboxes = document.getElementsByName('checkbox-options-1');
				let checkboxesChecked = [];
				for (let i = 0; i < checkboxes.length; i++) {
					if (checkboxes[i].checked) {
						checkboxesChecked.push(checkboxes[i].id);
					}
				}
				if (checkboxesChecked.length == 0) {
					mb.loadMessage(mod_alert_arr.CheckOpt, true);
					proceed = false;
				}
				if (!proceed) {
					return;
				}
				var customObj = {
					viewname: mb.loadElement(`viewname-${FILTER_COUNT}`),
					setdefault: mb.loadElement(`setdefault-${FILTER_COUNT}`),
				};
				const checkSize = document.getElementsByName('checkbox-options-'+FILTER_COUNT).length;
				var fieldObj = [];
				for (var j = 0; j < checkSize; j++) {
					const checkedValue = document.querySelector('#checkbox-'+j+'-id-'+FILTER_COUNT);
					if (checkedValue.checked == true) {
						fieldObj.push(checkedValue.value);
					}
				}
				field = fieldObj.join(',');
				customObj.fields = {
					field
				};
				customViews.push(customObj);
				data = {
					customview: customViews,
					step: step
				};
			} else {
				data = {
					customview: [],
					step: step
				};
			}
		}

		if (step == 5) {
			let relatedLists = [];
			const LIST_COUNT = mb.loadElement('LIST_COUNT');
			if (forward == false) {
				let proceed = true;
				if (mb.loadElement(`autocomplete-module-${LIST_COUNT}`) == '' || mb.loadElement(`related-label-${LIST_COUNT}`) == '') {
					mb.loadMessage(mod_alert_arr.Related_name_label, true);
					proceed = false;
				}
				if (!proceed) {
					return;
				}
				let lists = {
					relatedmodule: mb.loadElement(`autocomplete-module-${LIST_COUNT}`),
					actions: mb.loadElement(`autocomplete-related-${LIST_COUNT}`) == 'get_dependents_list' ? 'ADD' : 'ADD,SELECT',
					name: mb.loadElement(`autocomplete-related-${LIST_COUNT}`),
					label: mb.loadElement(`related-label-${LIST_COUNT}`),
				};
				data = {
					relatedlists: lists,
					step: step
				};
			} else {
				data = {
					relatedlists: [],
					step: step
				};
			}
		}

		jQuery.ajax({
			method: 'POST',
			url: url+'&methodName=Save',
			data: data
		}).done(function (response) {
			const res = JSON.parse(response);
			const msg = mod_alert_arr.RecordSaved;
			if (res != null && res.error) {
				mb.loadMessage(res.error, true, 'error');
				return;
			}
			//show message
			if (forward != false && step == 2) {
				if (blocks_label[1] != '') {
					mb.loadMessage(msg, true);
				}
			}
			if (forward == false) {
				if (step == 3) {
					mb.loadMessage(msg, true);
					fieldGridInstance.clear();
					fieldGridInstance.reloadData();
					mb.removeElement(`for-field-${btnid}`);
					mb.removeElement(`for-field-inputs-${btnid}`);
					mb.loadElement('FIELD_COUNT', true).value = 0;
				}
				if (step == 4) {
					mb.loadMessage(msg, true);
					viewGridInstance.clear();
					viewGridInstance.reloadData();
					mb.removeElement(`for-customview-${btnid}`);
					mb.removeElement('FilterBTN', true);
					mb.loadElement('FILTER_COUNT', true).value = 0;
				}
				if (step == 5) {
					mb.loadMessage(msg, true);
					listGridInstance.clear();
					listGridInstance.reloadData();
					document.getElementById('LIST_COUNT').value = 0;
					mb.removeElement('RelatedLists', true);
				}
			} else {
				mb.loadElement(`step-${step}`, true).style.display = 'none';
				var nextstep = step + 1;
				mb.loadElement(`step-${nextstep}`, true).style.display = 'block';
			}
			if (step == 3) {
				document.getElementById('FILTER_COUNT').value = 0;
				mb.removeElement('CustomView', true);
				mb.removeElement('loadViews', true);
			}
			//clean UI
			if (step == 1) {
				mb.VerifyModule();
				setTimeout(function () {
					mb.generateDefaultBlocks();
				}, 500);
			} else if (step == 2) {
				mb.backTo(3);
			} else if (step == 3 && forward != false) {
				mb.removeElement('loadFields', true);
				mb.backTo(4);
			} else if (step == 4 && forward != false) {
				document.getElementById('FILTER_COUNT').value = 0;
				document.getElementById('LIST_COUNT').value = 0;
				mb.removeElement('CustomView', true);
				mb.removeElement('loadViews', true);
				mb.backTo(5);
			} else if (step == 5 && forward != false) {
				mb.loadTemplate();
			}
		});
	},

	getRadioValue: (name) => {
		var el = document.getElementsByName(name);
		for (var i = 0; i < el.length; i++) {
			if (el[i].checked) {
				return el[i].value;
			}
		}
		return '';
	},

	VerifyModule: () => {
		const modulename = mb.loadElement('modulename');
		const data = {
			modulename: modulename
		};
		jQuery.ajax({
			method: 'POST',
			url: url+'&methodName=VerifyModule',
			data: data
		}).done(function (response) {
			mb.removeElement('loadBlocks', true);
			const res = JSON.parse(response);
			if (response.moduleid != 0) {
				const msg = mod_alert_arr.editmode;
				mb.loadMessage(msg, true);
				//load blocks
				jQuery.ajax({
					method: 'GET',
					url: url+'&methodName=loadValues&step=2&moduleid='+res.moduleid,
				}).done(function (response) {
					const res = JSON.parse(response);
					const getDiv = mb.loadElement('loadBlocks', true);
					const ul = document.createElement('ul');
					ul.className = 'slds-has-dividers_top-space slds-list_ordered';
					ul.id = 'ul-block-mb';
					getDiv.appendChild(ul);
					for (let i = 0; i < res.length; i++) {
						const li = document.createElement('li');
						const id = res[i].blocksid+'-block';
						let removeBtn = `
							<div class="slds-button-group" role="group">
								<button onclick='mb.removeBlock("${id}")' class="slds-button slds-button_icon slds-button_icon-border-filled" aria-pressed="false">
									<svg class="slds-button__icon" aria-hidden="true">
										<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#delete"></use>
									</svg>
								</button>
							</div>`;
						if (res[i].blocks_label.toUpperCase() == 'LBL_MODULEBLOCK_INFORMATION' || res[i].blocks_label.toUpperCase() == 'LBL_CUSTOM_INFORMATION' || res[i].blocks_label.toUpperCase() == 'LBL_DESCRIPTION_INFORMATION') {
							removeBtn = '';
						}
						li.innerHTML = res[i].blocks_label.toUpperCase()+removeBtn;
						li.className = 'slds-item';
						li.id = 'li-block-mb-'+res[i].blocksid;
						ul.appendChild(li);
					}
					mb.updateProgress(2);
					mb.removeElement('blocks_inputs', true);
					document.getElementById('BLOCK_COUNT').value = 0;
				});
			} else {
				const msg = mod_alert_arr.RecordSaved;
				mb.loadMessage(msg, true);
			}
		});
	},

 	/**
	 * Go to back step
	 * @param {number} step
	 * @param {boolean} mod
	 * @param {number} moduleid
	 */
	backTo: (step, mod = false, moduleid = 0) => {
		let thisStep = step + 1;
		//remove `finish module` step
		mb.removeElement('info', true);
		mb.removeElement('blocks', true);
		mb.loadElement('step-6', true).style.display = 'none';
		if (mod && step == 3) {
			mb.removeElement('loadFields', true);
		}
		if (mod && step == 4) {
			mb.removeElement('loadViews', true);
		}
		if (mod == true) {
			for (let i = 1; i <=5; i++) {
				if (i != step) {
					mb.loadElement(`step-${i}`, true).style.display = 'none';
				}
			}
			mb.loadElement(`step-${step}`, true).style.display = '';
		} else {
			mb.loadElement(`step-${thisStep}`, true).style.display = 'none';
			mb.loadElement(`step-${step}`, true).style.display = '';
		}
		if (step == 1) {
			mb.removeElement('loadFields', true);
			mb.removeElement('loadViews', true);
			mb.removeElement('loadLists', true);
			document.getElementById('modulename').setAttribute('readonly', true);
			//load active module
			jQuery.ajax({
				method: 'GET',
				url: url+'&methodName=loadValues&step='+step+'&moduleid='+moduleid,
			}).done(function (response) {
				const res = JSON.parse(response);
				mb.loadElement('modulename', true).value = res.name;
				mb.loadElement('modulelabel', true).value = res.label;
				mb.loadElement('parentmenu', true).value = res.parent;
				mb.loadElement('moduleicon', true).value = res.icon;
				if (res.sharingaccess == 'private') {
					mb.loadElement('private', true).checked = 'private';
				} else {
					mb.loadElement('public', true).checked = 'public';
				}
				if (res.actions.merge == 'true') {
					mb.loadElement('merge', true).checked = 'true';
				}
				if (res.actions.import == 'true') {
					mb.loadElement('import', true).checked = 'true';
				}
				if (res.actions.export == 'true') {
					mb.loadElement('export', true).checked = 'true';
				}
				mb.updateProgress(1);
			});
		}

		if (step == 2) {
			mb.removeElement('loadFields', true);
			mb.removeElement('loadViews', true);
			mb.removeElement('loadLists', true);
			mb.generateDefaultBlocks();
			const getUl = mb.loadElement('ul-block-mb', true);
			if (getUl != null) {
				mb.removeElement('ul-block-mb');
			}
			//load blocks
			jQuery.ajax({
				method: 'GET',
				url: url+'&methodName=loadValues&step='+step+'&moduleid='+moduleid,
			}).done(function (response) {
				const res = JSON.parse(response);
				const getDiv = mb.loadElement('loadBlocks', true);
				const ul = document.createElement('ul');
				ul.className = 'slds-has-dividers_top-space slds-list_ordered';
				ul.id = 'ul-block-mb';
				getDiv.appendChild(ul);
				for (let i = 0; i < res.length; i++) {
					const li = document.createElement('li');
					const id = res[i].blocksid+'-block';
					let removeBtn = `
						<div class="slds-button-group" role="group">
							<button onclick='mb.removeBlock("${id}")' class="slds-button slds-button_icon slds-button_icon-border-filled" aria-pressed="false">
								<svg class="slds-button__icon" aria-hidden="true">
									<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#delete"></use>
								</svg>
							</button>
						</div>`;
					if (res[i].blocks_label.toUpperCase() == 'LBL_CUSTOM_INFORMATION' || res[i].blocks_label.toUpperCase() == 'LBL_DESCRIPTION_INFORMATION') {
						removeBtn = '';
					}
					li.innerHTML = res[i].blocks_label.toUpperCase()+removeBtn;
					li.className = 'slds-item';
					li.id = 'li-block-mb-'+res[i].blocksid;
					ul.appendChild(li);
				}
				mb.updateProgress(2);
			});
		}
		if (step == 3) {
			mb.removeElement('loadFields', true);
			mb.removeElement('loadViews', true);
			mb.removeElement('loadLists', true);
			fieldGridInstance = new tuiGrid({
				el: document.getElementById('loadFields'),
				columns: [
					{
						name: 'blockname',
						header: mod_alert_arr.blockname,
					},
					{
						name: 'fieldname',
						header: mod_alert_arr.fieldname,
					},
					{
						name: 'fieldlabel',
						header: mod_alert_arr.fieldlabel,
					},
					{
						name: 'uitype',
						header: mod_alert_arr.uitype,
					},
					{
						name: 'typeofdata',
						header: mod_alert_arr.mandatory,
					},
					{
						name: 'action',
						header: mod_alert_arr.action,
						renderer: {
							type: ActionRender,
							options: {
								type: 'Fields'
							}
						},
						width: 50
					}
				],
				data: {
					api: {
						readData: {
							url: url+'&methodName=loadValues&step='+step+'&moduleid='+moduleid,
							method: 'GET'
						}
					}
				},
				useClientSort: false,
				pageOptions: false,
				rowHeight: 'auto',
				bodyHeight: 250,
				scrollX: false,
				scrollY: true,
				columnOptions: {
					resizable: true
				},
				header: {
					align: 'left',
					valign: 'top'
				}
			});
			tui.Grid.applyTheme('clean');
			mb.updateProgress(3);
		}
		if (step == 4) {
			mb.removeElement('loadFields', true);
			mb.removeElement('loadViews', true);
			mb.removeElement('loadLists', true);
			viewGridInstance = new tuiGrid({
				el: document.getElementById('loadViews'),
				columns: [
					{
						name: 'viewname',
						header: mod_alert_arr.viewname,
					},
					{
						name: 'setdefault',
						header: mod_alert_arr.setdefault,
					},
					{
						name: 'fields',
						header: mod_alert_arr.fields,
					},
					{
						name: 'action',
						header: mod_alert_arr.action,
						renderer: {
							type: ActionRender,
							options: {
								type: 'CustomView'
							}
						},
						width: 50
					}
				],
				data: {
					api: {
						readData: {
							url: url+'&methodName=loadValues&step='+step+'&moduleid='+moduleid,
							method: 'GET'
						}
					}
				},
				useClientSort: false,
				pageOptions: false,
				rowHeight: 'auto',
				bodyHeight: 250,
				scrollX: false,
				scrollY: true,
				columnOptions: {
					resizable: true
				},
				header: {
					align: 'left',
					valign: 'top'
				}
			});
			tui.Grid.applyTheme('clean');
			mb.updateProgress(4);
		}
		if (step == 5) {
			mb.removeElement('loadFields', true);
			mb.removeElement('loadViews', true);
			mb.removeElement('loadLists', true);
			listGridInstance = new tuiGrid({
				el: document.getElementById('loadLists'),
				columns: [
					{
						name: 'relatedmodule',
						header: mod_alert_arr.relatedmodule,
					},
					{
						name: 'actions',
						header: mod_alert_arr.actions,
					},
					{
						name: 'functionname',
						header: mod_alert_arr.functionname,
					},
					{
						name: 'label',
						header: mod_alert_arr.fieldlabel,
					},
					{
						name: 'action',
						header: mod_alert_arr.action,
						renderer: {
							type: ActionRender,
							options: {
								type: 'RelatedLists'
							}
						},
						width: 50
					}
				],
				data: {
					api: {
						readData: {
							url: url+'&methodName=loadValues&step='+step+'&moduleid='+moduleid,
							method: 'GET'
						}
					}
				},
				useClientSort: false,
				pageOptions: false,
				rowHeight: 'auto',
				bodyHeight: 250,
				scrollX: false,
				scrollY: true,
				columnOptions: {
					resizable: true
				},
				header: {
					align: 'left',
					valign: 'top'
				}
			});
			tui.Grid.applyTheme('clean');
			mb.updateProgress(5);
		}
	},
	/**
	 * Update progress bar in real time for step 1
	 * @param {number} step
	 */
	updateProgress: (step) => {
		if (step == 1) {
			const data = {
				modulename: mb.loadElement('modulename'),
				modulelabel: mb.loadElement('modulelabel'),
				parentmenu: mb.loadElement('parentmenu'),
				moduleicon: mb.loadElement('moduleicon'),
			};
			let modInfo = [];
			for (let i in data) {
				if (data[i] == '') {
					modInfo[i] = i;
				}
			}
			const size = Object.keys(modInfo).length;
			const progress = (20 - (parseInt(size) * 5));
			if (progress == 20) {
				mb.loadElement('btn-step-1', true).removeAttribute('disabled');
			} else {
				mb.loadElement('btn-step-1', true).setAttribute('disabled', '');
			}
			document.getElementById('block-information').classList.remove('slds-is-active');
			document.getElementById('field-information').classList.remove('slds-is-active');
			document.getElementById('filters').classList.remove('slds-is-active');
			document.getElementById('relationship').classList.remove('slds-is-active');
		} else {
			if (step == 2) {
				document.getElementById('block-information').classList.add('slds-is-active');
				document.getElementById('field-information').classList.remove('slds-is-active');
				document.getElementById('filters').classList.remove('slds-is-active');
				document.getElementById('relationship').classList.remove('slds-is-active');
			} else if (step == 3) {
				document.getElementById('block-information').classList.add('slds-is-active');
				document.getElementById('field-information').classList.add('slds-is-active');
				document.getElementById('filters').classList.remove('slds-is-active');
				document.getElementById('relationship').classList.remove('slds-is-active');
			} else if (step == 4) {
				document.getElementById('block-information').classList.add('slds-is-active');
				document.getElementById('field-information').classList.add('slds-is-active');
				document.getElementById('filters').classList.add('slds-is-active');
				document.getElementById('relationship').classList.remove('slds-is-active');
			} else if (step == 5) {
				document.getElementById('block-information').classList.add('slds-is-active');
				document.getElementById('field-information').classList.add('slds-is-active');
				document.getElementById('filters').classList.add('slds-is-active');
				document.getElementById('relationship').classList.add('slds-is-active');
			}
 		}
	},
	/**
	 * Show module icons in step 1
	 * @param {string} iconReference
	 */
	showModuleIcon: (iconReference) => {
		let newicon = iconReference.split('-');
		let spn = mb.loadElement('moduleiconshow', true);
		let svg = mb.loadElement('moduleiconshowsvg', true);
		let curicon = svg.getAttribute('xlink:href');
		let category = curicon.substr(24);
		category = category.substr(0, category.indexOf('-'));
		let icon = curicon.substr(curicon.indexOf('#')+1);
		spn.classList.remove('slds-icon-'+category+'-'+icon);
		spn.classList.add('slds-icon-'+newicon[0]+'-'+newicon[1]);
		svg.setAttribute('xlink:href', 'include/LD/assets/icons/'+newicon[0]+'-sprite/svg/symbols.svg#'+newicon[1]);
	},
	/**
	 * generate Default Blocks
	 */
	generateDefaultBlocks: () => {
		mb.removeElement('blocks_inputs', true);
		mb.loadElement('BLOCK_COUNT').value = '1';
		jQuery.ajax({
			method: 'GET',
			url: url+'&methodName=loadDefaultBlocks',
		}).done(function (response) {
			const res = JSON.parse(response);
			if (res == 'load') {
				setTimeout(function () {
					mb.generateInput('default');
				}, 1000);
			} else {
				mb.loadElement('BLOCK_COUNT', true).value = 0;
				mb.generateInput();
			}
		});
	},
	/**
	 * Generate block input for step 2
	 */
	generateInput: (type = '') => {
		if (type == 'default') {
			const modulename = mb.loadElement('modulename').toUpperCase();
			const MODULEBLOCK = document.createElement('input');
			MODULEBLOCK.type = 'text';
			MODULEBLOCK.id = 'blocks_label_1';
			MODULEBLOCK.value = `LBL_${modulename}_INFORMATION`; //change this to modulename
			MODULEBLOCK.className ='slds-input';
			mb.loadElement('blocks_inputs', true).appendChild(MODULEBLOCK);
			const CUSTOM = document.createElement('input');
			CUSTOM.type = 'text';
			CUSTOM.id = 'blocks_label_2';
			CUSTOM.value = 'LBL_CUSTOM_INFORMATION';
			CUSTOM.className ='slds-input';
			mb.loadElement('blocks_inputs', true).appendChild(CUSTOM);
			const DESCRIPTION = document.createElement('input');
			DESCRIPTION.type = 'text';
			DESCRIPTION.id = 'blocks_label_3';
			DESCRIPTION.value = 'LBL_DESCRIPTION_INFORMATION';
			DESCRIPTION.className ='slds-input';
			mb.loadElement('blocks_inputs', true).appendChild(DESCRIPTION);
			mb.loadElement('BLOCK_COUNT', true).value = '3';
		} else {
			const BLOCK_COUNT = mb.autoIncrementIds('BLOCK_COUNT');
			const input = document.createElement('input');
			input.type = 'text';
			input.id = 'blocks_label_' + BLOCK_COUNT;
			input.placeholder = 'LBL_BLOCKNAME_INFORMATION';
			input.className ='slds-input';
			mb.loadElement('blocks_inputs', true).appendChild(input);
		}
	},
	/**
	 * Generate field input for step 3
	 */
	generateFields: () => {
		let textfields = [{
			type: mod_alert_arr.fieldname,
			value: 'fieldname',
		},
		{
			type: mod_alert_arr.fieldlabel,
			value: 'fieldlabel',
		},
		{
			type: mod_alert_arr.picklistvalues,
			value: 'picklistvalues',
		},
		{
			type: mod_alert_arr.relatedmodules,
			value: 'relatedmodules',
		}];
		let fieldtypes = [{
			type: 'Uitype',
			values: {
				1: mod_alert_arr.LineText,
				21: mod_alert_arr.BlockTextSmall,
				19: mod_alert_arr.BlockTextLarge,
				4: mod_alert_arr.AutoGenerated,
				5: mod_alert_arr.Date,
				50: mod_alert_arr.DateTime,
				14: mod_alert_arr.Time,
				7: mod_alert_arr.Number,
				71: mod_alert_arr.Currency,
				9: mod_alert_arr.Percentage,
				10: mod_alert_arr.RelationModule,
				101: mod_alert_arr.RelationUsers,
				11: mod_alert_arr.Phone,
				13: mod_alert_arr.Email,
				17: mod_alert_arr.URL,
				56: mod_alert_arr.Checkbox,
				69: mod_alert_arr.Image,
				85: mod_alert_arr.Skype,
				15: mod_alert_arr.SelectWithRole,
				16: mod_alert_arr.Select,
				1613: mod_alert_arr.SelectModules,
				1024: mod_alert_arr.SelectRoles,
				33: mod_alert_arr.SelectMultiple,
				3313: mod_alert_arr.SelectModulesMultiple,

			}
		},
		{
			type: 'Presence',
			values: {
				0: mod_alert_arr.AlwaysActive,
				1: mod_alert_arr.InactiveActive,
				2: mod_alert_arr.ActiveActive,
			}
		},
		{
			type: 'Quickcreate',
			values: {
				0: mod_alert_arr.AlwaysShownNoDeactivate,
				1: mod_alert_arr.NotShownCanBeActivated,
				2: mod_alert_arr.ShownCanBeDeactivated,
				3: mod_alert_arr.NotShownCanNotBeActivated,
			}
		}];
		let mandatory = [{
			type: 'Typeofdata',
			values: {
				'M': mod_alert_arr.mandatory,
				'O': mod_alert_arr.optional,
			}
		},
		{
			type: 'Displaytype',
			values: {
				1: mod_alert_arr.DisplayEverywhere,
				2: mod_alert_arr.ReadOnly,
				3: mod_alert_arr.DisplayByProgrammer,
				4: mod_alert_arr.ReadOnlyModifyWorkflow,
				5: mod_alert_arr.DisplayCreate,
			}
		},
		{
			type: 'Masseditable',
			values: {
				0: mod_alert_arr.NoMassEditNoActivate,
				1: mod_alert_arr.MassEditable,
				2: mod_alert_arr.NoMassEditActivate,
			},
		}];
		const checkboxFields = [];
		if (document.getElementById('for-field-1')) {
			const msg = mod_alert_arr.fieldprocces;
			mb.loadMessage(msg, true, 'error');
			return;
		}
		const FIELD_COUNT = mb.autoIncrementIds('FIELD_COUNT');
		const table = mb.getTable('Table');
		const row = mb.createRow(table, 0, 'for-field-inputs-', FIELD_COUNT);
		const cell = mb.createCell(row, 0, 'fields_inputs_', FIELD_COUNT);

		mb.loadBlocks(table, FIELD_COUNT);

		let inStyle = {
			'style': 'margin: 5px',
			'id': '',
			'onchange': '',
			'placeholder': '',
		};
		let fieldTemplate = '<div class="slds-grid slds-gutters">';
		for (var key in textfields) {
			if (textfields[key].value == 'relatedmodules' || textfields[key].value == 'picklistvalues') {
				inStyle.style = 'margin: 5px; display: none';
				inStyle.id = `show-field-${textfields[key].value}-${FIELD_COUNT}`;
				inStyle.placeholder = 'Value 1,Value 2,...';
			}
			fieldTemplate += `
			<div class="slds-col" style="${inStyle.style}" id="${inStyle.id}">
				<div class="slds-form-element">
				<label class="slds-form-element__label" for="${textfields[key].value}_${FIELD_COUNT}">
					<abbr class="slds-required" title="required">* </abbr> ${textfields[key].type}
				</label>
				<div class="slds-form-element__control">
					<input type="text" name="${textfields[key].value}_${FIELD_COUNT}" placeholder="${inStyle.placeholder}" id="${textfields[key].value}_${FIELD_COUNT}" class="slds-input" />
				</div>
				</div>
			</div>`;
		}
		fieldTemplate += '</div><div class="slds-grid slds-gutters">';

		for (i = 0; i < mandatory.length; i++) {
			const type = mandatory[i].type;
			const values = mandatory[i].values;
			const selecttype = document.createElement('select');
			if (type == 'Uitype') {
				inStyle.onchange = 'mb.showRelationModule(this, FIELD_COUNT)';
			}
			fieldTemplate += `
			<div class="slds-col">
				<div class="slds-form-element">
					<label class="slds-form-element__label" for="${type}_${FIELD_COUNT}">${type}</label>
					<div class="slds-form-element__control">
						<div class="slds-select_container">
							<select class="slds-select" id="${type}_${FIELD_COUNT}" onchange="${inStyle.onchange}">`;
			for (let j in values) {
				fieldTemplate += `<option value="${j}">${values[j]}</option>`;
			}
			fieldTemplate += `
							</select>
						</div>
					</div>
				</div>
			</div>
			`;
		}

		fieldTemplate += '</div><div class="slds-grid slds-gutters">';
		for (i = 0; i < fieldtypes.length; i++) {
			const type = fieldtypes[i].type;
			const values = fieldtypes[i].values;
			const selecttype = document.createElement('select');
			if (type == 'Uitype') {
				inStyle.onchange = 'mb.showRelationModule(this, FIELD_COUNT)';
			}
			fieldTemplate += `
			<div class="slds-col">
				<div class="slds-form-element">
					<label class="slds-form-element__label" for="${type}_${FIELD_COUNT}">${type}</label>
					<div class="slds-form-element__control">
						<div class="slds-select_container">
							<select class="slds-select" id="${type}_${FIELD_COUNT}" onchange="${inStyle.onchange}">`;
			for (let j in values) {
				fieldTemplate += `<option value="${j}">${values[j]}</option>`;
			}
			fieldTemplate += `
							</select>
						</div>
					</div>
				</div>
			</div>
			`;
		}
		fieldTemplate += '</div><div class="slds-grid slds-gutters">';

		for (let i = 0; i < checkboxFields.length; i++) {
			fieldTemplate += `
			<div class="slds-col"><br>
				<div class="slds-form-element">
					<div class="slds-form-element__control">
						<div class="slds-checkbox">
							<input type="checkbox" name="${checkboxFields[i].type}_${FIELD_COUNT}" id="${checkboxFields[i].type}_${FIELD_COUNT}"/>
							<label class="slds-checkbox__label" for="${checkboxFields[i].type}_${FIELD_COUNT}">
								<span class="slds-checkbox_faux"></span>
								<span class="slds-form-element__label">${checkboxFields[i].value}</span>
							</label>
						</div>
					</div>
				</div><br>
			</div>`;
		}
		//create save button for each field
		fieldTemplate += `</div>
		<div class="slds-grid slds-gutters">
			<div class="slds-col"><br>
				<button class="slds-button slds-button_neutral slds-button_dual-stateful" id="save-btn-for-field-${FIELD_COUNT}" onclick="mb.SaveModule(3, false, this.id)">
					<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
					<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#save"></use>
					</svg>${mod_alert_arr.LBL_MB_SAVEFIELD}
				</button>
				<button class="slds-button slds-button_destructive slds-button_dual-stateful" id="clear-btn-for-field-${FIELD_COUNT}" onclick="mb.clearField(this)">
					<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
					<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#save"></use>
					</svg>${mod_alert_arr.LBL_MB_CLEAR}
				</button>
			</div>
		</div>`;
		mb.loadElement(`fields_inputs_${FIELD_COUNT}`, true).innerHTML = fieldTemplate;
	},

	showRelationModule: (e, id) => {
		if (e.value == 10) {
			document.getElementById(`show-field-relatedmodules-${id.value}`).style.display = '';
			document.getElementById(`show-field-picklistvalues-${id.value}`).style.display = 'none';
		} else if (e.value == 15 || e.value == 16) {
			document.getElementById(`show-field-picklistvalues-${id.value}`).style.display = '';
			document.getElementById(`show-field-relatedmodules-${id.value}`).style.display = 'none';
		} else {
			document.getElementById(`show-field-relatedmodules-${id.value}`).style.display = 'none';
			document.getElementById(`show-field-picklistvalues-${id.value}`).style.display = 'none';
		}
	},

	clearField: (e) => {
		const id = e.id.split('-')[4];
		mb.removeElement(`for-field-${id}`);
		mb.removeElement(`for-field-inputs-${id}`);
		mb.loadElement('FIELD_COUNT', true).value = 0;
	},

	clearView: (e) => {
		const id = e.id.split('-')[4];
		mb.removeElement(`for-customview-${id}`);
		mb.removeElement('FilterBTN', true);
		mb.loadElement('FILTER_COUNT', true).value = 0;
	},

	clearList: (e) => {
		const id = e.id.split('-')[4];
		mb.removeElement(`for-related-${id}`);
		mb.loadElement('LIST_COUNT', true).value = 0;
	},
	/**
	 * Open tui grid to list all modules
	 */
	openModal: () => {
		dataGridInstance = new tuiGrid({
			el: document.getElementById('moduleListView'),
			columns: [
				{
					name: 'modulebuilder_name',
					header: mod_alert_arr.ModuleName,
				},
				{
					name: 'date',
					header: mod_alert_arr.DateCreated,
				},
				{
					name: 'completed',
					header: mod_alert_arr.Status,
				},
				{
					name: 'export',
					header: mod_alert_arr.Export,
				}
			],
			data: {
				api: {
					readData: {
						url: url+'&methodName=loadModules',
						method: 'GET'
					}
				}
			},
			useClientSort: false,
			pageOptions: {
				perPage: '5'
			},
			rowHeight: 'auto',
			bodyHeight: 'auto',
			scrollX: false,
			scrollY: false,
			columnOptions: {
				resizable: true
			},
			header: {
				align: 'left',
				valign: 'top'
			},
			onGridUpdated: (ev) => {
				mb.updateData();
			}
		});
		tui.Grid.applyTheme('clean');
		mb.loadElement('moduleListsModal', true).style.display = '';
	},
	/**
	 * Close modal
	 */
	closeModal: () => {
		mb.loadElement('moduleListsModal', true).style.display = 'none';
		document.getElementById('moduleListView').innerHTML = '';
	},
	/**
	 * Load all blocks for specific module in step 3
	 * @param {Table} tableInstance - Current table instance
	 * @param {number} FIELD_COUNT
	 */
	loadBlocks: (tableInstance, FIELD_COUNT) => {
		jQuery.ajax({
			method: 'GET',
			url: url+'&methodName=loadBlocks',
		}).done(function (response) {
			const res = JSON.parse(response);
			const row = tableInstance.insertRow(0);
			row.setAttribute('id', `for-field-${FIELD_COUNT}`);
			let template = `
				<fieldset class="slds-form-element">
				<legend class="slds-form-element__legend slds-form-element__label">${mod_alert_arr.LBL_CHOOSEFIELDBLOCK} ${FIELD_COUNT}</legend>
				<div class="slds-form-element__control">
					<div class="slds-radio_button-group">`;
			let checked = '';
			for (var i = 0; i < res.length; i++) {
				if (i === 0) {
					checked = 'checked';
					template += `
					<span class="slds-button slds-radio_button">
						<input type="radio" ${checked} name="select-for-field-${FIELD_COUNT}" id="radio-${res[i].blocksid}${FIELD_COUNT}" value="${res[i].blocksid}" />
						<label class="slds-radio_button__label" for="radio-${res[i].blocksid}${FIELD_COUNT}">
						<span class="slds-radio_faux">${res[i].blocks_label}</span>
						</label>
					</span>`;
				} else {
					template += `
					<span class="slds-button slds-radio_button">
						<input type="radio" name="select-for-field-${FIELD_COUNT}" id="radio-${res[i].blocksid}${FIELD_COUNT}" value="${res[i].blocksid}" />
						<label class="slds-radio_button__label" for="radio-${res[i].blocksid}${FIELD_COUNT}">
						<span class="slds-radio_faux">${res[i].blocks_label}</span>
						</label>
					</span>`;
				}
			}
			template += `
				</div>
			</div>
			</fieldset>`;
			document.getElementById(`for-field-${FIELD_COUNT}`).innerHTML = template;
		});
	},
	/**
	 * Generate inputs for custom views in step 4
	 */
	generateCustomView: () => {
		const FILTER_COUNT = mb.autoIncrementIds('FILTER_COUNT');
		const table = mb.getTable('CustomView');
		if (document.getElementById('for-customview-1')) {
			const msg = mod_alert_arr.filterprocces;
			mb.loadMessage(msg, true, 'error');
			return;
		}
		const row = mb.createRow(table, 0, 'for-customview-', FILTER_COUNT);
		const cell = mb.createCell(row, 0, 'customview_inputs', FILTER_COUNT);
		//create viewname
		const inStyle = {
			'style': 'width: 25%'
		};
		let setdefaultOption = [{
			false: alert_arr.NO,
			true:  alert_arr.YES,
		}];
		var viewTemplate = `
		<div class="slds-grid slds-gutters">
			<div class="slds-col">
				<div class="slds-form-element">
				<label class="slds-form-element__label" for="viewname-${FILTER_COUNT}">
					<abbr class="slds-required" title="required">* </abbr> Viewname
				</label>
				<div class="slds-form-element__control">
					<input type="text" placeholder="All" name="viewname-${FILTER_COUNT}" id="viewname-${FILTER_COUNT}" class="slds-input"/>
				</div>
				</div>
			</div>
			<div class="slds-col">
				<div class="slds-form-element">
					<label class="slds-form-element__label" for="setdefault-${FILTER_COUNT}">Set as default</label>
					<div class="slds-form-element__control">
						<div class="slds-select_container">
							<select class="slds-select" name="setdefault-${FILTER_COUNT}" id="setdefault-${FILTER_COUNT}">`;
		for (let val in setdefaultOption[0]) {
			viewTemplate += `<option value="${val}">${setdefaultOption[0][val]}</option>`;
		}
		viewTemplate += `
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>`;

		//get all fields
		viewTemplate += `
			<div class="slds-grid slds-gutters">
				<div class="slds-col"><br>
					<label class="slds-form-element__label">
						<abbr class="slds-required" title="required">* </abbr> ${mod_alert_arr.LBL_CHOOSECUSTOMVIEW}
					</label>
				</div>
			</div>`;
		jQuery.ajax({
			method: 'GET',
			url: url+'&methodName=loadFields',
		}).done(function (response) {
			let res = JSON.parse(response);
			for (let f in res) {
				viewTemplate += `
				<div class="slds-col">
					<div class="slds-form-element">
					<div class="slds-form-element__control">
						<div class="slds-checkbox">
						<input type="checkbox" class="for-checkbox-${FILTER_COUNT}" name="checkbox-options-${FILTER_COUNT}" id="checkbox-${f}-id-${FILTER_COUNT}" value="${res[f]['fieldsid']}"/>
						<label class="slds-checkbox__label" for="checkbox-${f}-id-${FILTER_COUNT}">
							<span class="slds-checkbox_faux"></span>
							<span class="slds-form-element__label">${res[f]['fieldname']}</span>
						</label>
						</div>
					</div>
					</div>
				</div>`;
				mb.loadElement(`customview_inputs${FILTER_COUNT}`, true).innerHTML = viewTemplate;
			}
		});
		//create save button for each field
		let btnTemplate = `
		<div class="slds-grid slds-gutters">
			<button class="slds-button slds-button_neutral slds-button_dual-stateful" id="save-btn-for-view-${FILTER_COUNT}" onclick="mb.SaveModule(4, false, this.id)">
				<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
				<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#save"></use>
				</svg>${mod_alert_arr.LBL_MB_SAVE}
			</button>
			<button class="slds-button slds-button_destructive slds-button_dual-stateful" id="clear-btn-for-view-${FILTER_COUNT}" onclick="mb.clearView(this)">
				<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
				<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#save"></use>
				</svg>${mod_alert_arr.LBL_MB_CLEAR}
			</button>
		</div>`;
		mb.loadElement('FilterBTN', true).innerHTML = btnTemplate;
	},
	/**
	 * Function that load an alert message for success or error
	 * @param {text} msg
	 * @param {boolean} show
	 * @param {text} type - success/error
	 */
	loadMessage: (msg, show = true, type = 'success') => {
		var icon = 'task';
		if (type == 'error') {
			icon = 'first_non_empty';
		}
		if (show == true) {
			ldsPrompt.show(type.toUpperCase(), msg, type);
		}
	},
	/**
	 * Increment id from each step when generate fields
	 * @param {string} id
	 */
	autoIncrementIds: (id) => {
		let number = mb.loadElement(id);
		number = parseInt(number) + 1;
		mb.loadElement(id, true).value = number;
		return number;
	},
	/**
	 * Update grid in every change
	 */
	updateData: () => {
		let btn = '';
		for (var i = 0; i < 5; i++) {
			let completed = dataGridInstance.getValue(i, 'completed');
			let moduleid = dataGridInstance.getValue(i, 'moduleid');
			if (completed == 'Completed') {
				btn = `
				<button class="slds-button slds-button_brand" aria-live="assertive" onclick="mb.generateManifest(${moduleid})">
					<span class="slds-text-not-pressed">
						<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
							<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#download"></use>
						</svg>${mod_alert_arr.Export}
					</span>
				</button>
				<button class="slds-button slds-button_neutral slds-button_dual-stateful" onclick="mb.backTo(5, true, ${moduleid}); mb.closeModal()" aria-live="assertive">
					<span class="slds-text-not-pressed">
						<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
							<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#edit"></use>
						</svg>${mod_alert_arr.StartEditing}
					</span>
				</button>`;
			} else {
				let step = 0;
				if (completed == '20%') {
					step = 1;
				} else if (completed == '40%') {
					step = 2;
				} else if (completed == '60%') {
					step = 3;
				} else if (completed == '80%') {
					step = 4;
				}
				btn = `
				<button class="slds-button slds-button_neutral slds-button_dual-stateful" onclick="mb.backTo(${step}, true, ${moduleid}); mb.closeModal()" aria-live="assertive">
					<span class="slds-text-not-pressed">
						<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
							<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#edit"></use>
						</svg>${mod_alert_arr.StartEditing}
					</span>
				</button>`;
			}
			dataGridInstance.setValue(i, 'export', btn, false);
		}
	},
	/**
	 * Check for module if exists in first step
	 * @param {string} id
	 */
	checkForModule: (id) => {
		const moduleName = mb.loadElement(id);
		jQuery.ajax({
			method: 'POST',
			url: url,
			data: 'modulename='+moduleName+'&methodName=checkForModule'
		}).done(function (response) {
			if (response == 1) {
				const msg = moduleName+' '+mod_alert_arr.Module+' '+mod_alert_arr.AlreadyExists;
				mb.loadMessage(msg, true, 'error');
			} else {
				mb.loadMessage('', false);
			}
		});
	},
	/**
	 * Autocomplete inputs for modules and function names
	 * @param {string} el
	 * @param {string} type - module/name
	 */
	autocomplete: (el, type) => {
		const forId = el.id.split('-')[2];
		const val = mb.loadElement(el.id);
		let method = 'name';
		if (type == 'module') {
			method = type;
		}
		jQuery.ajax({
			method: 'POST',
			url: url,
			data: 'query='+val+'&methodName=autocomplete&method='+method
		}).done(function (response) {
			mb.removeElement('autocomplete-modulespan-'+forId, true);
			let res = JSON.parse(response);
			if (response.length < 3) {
				mb.removeElement('autocomplete-modulespan-'+forId, true);
			} else {
				const inStyle = {
					style: `background: white;
					border: 1px solid #d1d1d1;
					position: absolute;
					z-index: 1000`
				};
				let span = document.createElement('span');
				let ul = `<ul class="slds-dropdown__list" style="${inStyle.style}">`;
				for (let i = 0; i < res.length; i++) {
					ul += `<li class="slds-dropdown__item">
							<a onclick="mb.setValueToInput(this.id, ${forId}, '${method}')" tabindex="${i}" id="${res[i].relatedmodules}">
								<span class="slds-truncate" title="${res[i].relatedmodules}">${res[i].relatedmodules}</span>
							</a>
						</li>`;
				}
				ul += '</ul>';
				span.innerHTML = ul;
				if (type == 'module') {
					mb.loadElement('autocomplete-modulespan-'+forId, true).appendChild(span);
				}
			}
		});
	},
	/**
	 * Set values for each input on autocomplete
	 * @param {string} name - function name
	 * @param {string} forId
	 * @param {string} type - module/name
	 */
	setValueToInput: (name, forId, type) => {
		if (type == 'module') {
			mb.removeElement('autocomplete-modulespan-'+forId, true);
			mb.loadElement('autocomplete-module-'+forId, true).value = name;
		}
	},
	/**
	 * Generate related lists for step 5
	 */
	generateRelatedList: () => {
		const LIST_COUNT = mb.autoIncrementIds('LIST_COUNT');
		const table = mb.getTable('RelatedLists');
		if (document.getElementById('for-related-1')) {
			const msg = mod_alert_arr.relatedprocces;
			mb.loadMessage(msg, true, 'error');
			return;
		}
		const row = mb.createRow(table, 0, 'for-related-', LIST_COUNT);
		const cell = mb.createCell(row, 0, 'related_inputs_', LIST_COUNT);

		let listTemplate = `
		<div class="slds-grid slds-gutters">
			<div class="slds-col">
				<div class="slds-form-element">
					<label class="slds-form-element__label" for="autocomplete-related-${LIST_COUNT}">
						<abbr class="slds-required" title="required">* </abbr> Function name
					</label>
					<div class="slds-form-element__control">
						<div class="slds-select_container">
							<select name="related-function-${LIST_COUNT}" id="autocomplete-related-${LIST_COUNT}" class="slds-select">
								<option value="get_dependents_list">get_dependents_list</option>
								<option value="get_relatedlist_list">get_relatedlist_list</option>
							</select>
						</div>
					</div>
				</div>
			</div>
			<div class="slds-col">
				<div class="slds-form-element">
					<label class="slds-form-element__label" for="related-label-${LIST_COUNT}">
						<abbr class="slds-required" title="required">* </abbr> Label
					</label>
					<div class="slds-form-element__control">
					<input type="text" name="related-label-${LIST_COUNT}" id="related-label-${LIST_COUNT}" class="slds-input" />
					</div>
				</div>
			</div>
			<div class="slds-col">
				<div class="slds-form-element">
					<label class="slds-form-element__label" for="related-action-${LIST_COUNT}">
						<abbr class="slds-required" title="required">* </abbr> Related module
					</label>
					<div class="slds-form-element__control">
					<input type="text" onkeyup="mb.autocomplete(this, 'module')" name="related-module-${LIST_COUNT}" id="autocomplete-module-${LIST_COUNT}" class="slds-input" />
					</div>
					<span id="autocomplete-modulespan-${LIST_COUNT}"></span>
				</div>
			</div>
		</div><br>
		<button class="slds-button slds-button_neutral slds-button_dual-stateful" id="save-btn-for-list-${LIST_COUNT}" onclick="mb.SaveModule(5, false, this.id)">
			<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
			<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#save"></use>
			</svg>${mod_alert_arr.LBL_MB_SAVE}
		</button>
		<button class="slds-button slds-button_destructive slds-button_dual-stateful" id="clear-btn-for-list-${LIST_COUNT}" onclick="mb.clearList(this)">
			<svg class="slds-button__icon slds-button__icon_small slds-button__icon_left" aria-hidden="true">
			<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#save"></use>
			</svg>${mod_alert_arr.LBL_MB_CLEAR}
		</button>`;
		mb.loadElement(`related_inputs_${LIST_COUNT}`, true).innerHTML = listTemplate;
	},
	/**
	 * Create html labels
	 * @param {Label} instance - Current label instance
	 * @param {text} value
	 */
	createLabel: (instance, value) => {
		const label = document.createElement('label');
		label.innerHTML = value;
		return instance.appendChild(label);
	},
	/**
	 * Create html inputs
	 * @param {object} scope = {
		instance: {Input},
		placeholder: {string},
		name: {string},
		id: {string},
		inc: {number},
		attr: {object},
	 }
	 */
	createInput: (scope) => {
		const input = document.createElement('input');
		input.placeholder = scope.placeholder;
		input.id = scope.id+scope.inc;
		input.name = scope.name+scope.inc;
		if (scope.type != '' && scope.type != undefined) {
			input.setAttribute('type', scope.type);
		} else {
			input.className = 'slds-input';
		}
		if (scope.attr != '') {
			for (let f in scope.attr) {
				input.setAttribute(f, scope.attr[f]);
			}
		}
		return scope.instance.appendChild(input);
	},
	/**
	 * Get table instance
	 * @param {string} id
	 */
	getTable: (id) => {
		const table = mb.loadElement(id, true);
		return table;
	},
	/**
	 * Create table row
	 * @param {Row} instance  - Current row instance
	 * @param {number} index
	 * @param {string} id
	 * @param {number} inc
	 */
	createRow: (instance, index, id, inc) => {
		const row = instance.insertRow(index);
		row.id = id + inc;
		return row;
	},
	/**
	 * Create table data
	 * @param {Cell} instance - Current cell instance
	 * @param {number} index
	 * @param {string} id
	 * @param {number} inc
	 */
	createCell: (instance, index, id, inc) => {
		const cell = instance.insertCell(index);
		cell.id = id + inc;
		cell.style = 'padding: 20px';
		return cell;
	},
	/**
	 * Remove block on step 2
	 * @param {string} blockid - Current cell instance
	 */
	removeBlock: (blockid) => {
		const id = blockid.split('-')[0];
		jQuery.ajax({
			method: 'POST',
			url: url+'&methodName=removeBlock',
			data: 'blockid='+id
		}).done(function (response) {
			const res = JSON.parse(response);
			if (res == true) {
				mb.removeElement('li-block-mb-'+id);
			}
		});
	},
	/**
	 * Remove Field on step 3
	 * @param {string} fieldsid
	 */
	removeField: (fieldsid) => {
		jQuery.ajax({
			method: 'POST',
			url: url+'&methodName=removeField',
			data: 'fieldsid='+fieldsid
		}).done(function (response) {
			const res = JSON.parse(response);
			if (res == true) {
				fieldGridInstance.clear();
				fieldGridInstance.reloadData();
			}
		});
	},
	/**
	 * Remove View on step 4
	 * @param {string} viewid
	 */
	removeCustomView: (viewid) => {
		jQuery.ajax({
			method: 'POST',
			url: url+'&methodName=removeCustomView',
			data: 'viewid='+viewid
		}).done(function (response) {
			const res = JSON.parse(response);
			if (res == true) {
				viewGridInstance.clear();
				viewGridInstance.reloadData();
			}
		});
	},
	/**
	 * Remove Lists on step 5
	 * @param {string} listid
	 */
	removeRelatedLists: (list) => {
		jQuery.ajax({
			method: 'POST',
			url: url+'&methodName=removeRelatedLists',
			data: 'listid='+list
		}).done(function (response) {
			const res = JSON.parse(response);
			if (res == true) {
				listGridInstance.clear();
				listGridInstance.reloadData();
			}
		});
	},
	/**
	 * Remove elements
	 * @param {string} elementId
	 * @param {boolean} type
	 */
	removeElement: (elementId, type = false) => {
		var element = mb.loadElement(elementId, true);
		if (type == true) {
			element.innerHTML = '';
		} else {
			element.parentNode.removeChild(element);
		}
	},
	/**
	 * Get values for inputs
	 * @param {string} id
	 * @param {boolean} type
	 */
	loadElement: (id, type = false) => {
		let value = '';
		if (type == true) {
			value = document.getElementById(id);
		} else {
			value = document.getElementById(id).value;
		}
		return value;
	},

	generateManifest: (modId = 0) => {
		document.getElementById('genModule').style.display = 'none';
		document.getElementById('genModuleProgress').style.display = 'block';
		jQuery.ajax({
			method: 'POST',
			url: url,
			data: 'methodName=loadTemplate&modId='+modId
		}).then(function (response) {
			let res = JSON.parse(response);
			let modObj = {};
			//moduleData
			for (let i in res) {
				modObj.name = res.info.name;
				modObj.label = res.info.label;
				modObj.parent = res.info.parent;
				modObj.icon = res.info.icon;
				modObj.version = '1.0';
				modObj.short_description = res.info.name;
				modObj.dependencies = {
					vtiger_version: '5.4.0',
					vtiger_max_version: '5.*'
				};
				modObj.license = {
					inline: 'Your license here'
				};
				const table = [{
					name: 'vtiger_'+res.info.name.toLowerCase(),
					sql: '-'
				},
				{
					name: 'vtiger_'+res.info.name.toLowerCase()+'cf',
					sql: '-'
				},
				];
				modObj.tables = {
					table
				};
				//blocks and fields
				let blocks = [];
				for (let i = 0; i < res.blocks.length; i++) {
					const blocks_label = res.blocks[i].blocks_label;
					const blockObj = {
						block: {
							label: blocks_label,
							fields: {}
						}
					};
					const field = res.fields.data.contents;
					let fields = [];
					for (let j = 0; j < field.length; j++) {
						if (blocks_label == field[j].blockname) {
							field[j].sequence = j;
							fields.push(field[j]);
						}
					}
					blockObj.block.fields = fields;
					blocks.push(blockObj);
				}
				modObj.blocks = blocks;

				//customviews
				const views = res.views.data.contents;
				let view = [];
				for (let i = 0; i < views.length; i++) {
					const viewObj = {
						viewname: views[i].viewname,
						setdefault: views[i].setdefault,
						setmetrics: false,
						fields: {}
					};
					let fields = [];
					for (let j = 0; j < views[i].fields.length; j++) {
						fields.push(views[i].fields[j]);
					}
					viewObj.fields = fields;
					view.push(viewObj);
				}
				modObj.customviews = view;

				//relatedlists
				const lists = res.lists.data.contents;
				let relatedlists = [];
				for (let i = 0; i < lists.length; i++) {
					const actions = lists[i].actions.split(',');
					const listObj = {
						function: lists[i].functionname,
						label: lists[i].label,
						sequence: i,
						presence: 0,
						actions: actions,
						relatedmodule: lists[i].relatedmodule,
					};
					relatedlists.push(listObj);
				}
				modObj.relatedlists = relatedlists;
				modObj.sharingaccess = res.info.sharingaccess;
				modObj.actions = {
					'Merge': res.info.actions.merge,
					'Import': res.info.actions.import,
					'Export': res.info.actions.export,
				};
			}
			jQuery.ajax({
				method: 'POST',
				url: url+'&methodName=generateManifest&map='+encodeURI(JSON.stringify(modObj)),
			}).done(function (response) {
				const res = JSON.parse(response);
				if (res.success == true) {
					window.location.href = 'modules/Settings/ModuleBuilder/modules/'+res.module+'.zip';
					const msg = `Module <b>${res.module}</b> is generated successfully!`;
					mb.resetTemplate();
					mb.loadMessage(msg, true, 'success');
				}
			});
		});
	},

	resetTemplate: () => {
		document.getElementById('modulename').value = '';
		document.getElementById('modulelabel').value = '';
		document.getElementById('parentmenu').selected = '';
		document.getElementById('moduleicon').selected = '';
		document.getElementById('merge').checked = false;
		document.getElementById('import').checked = false;
		document.getElementById('export').checked = false;
		document.getElementById('loadBlocks').innerHTML = '';
		document.getElementById('Table').innerHTML = '';
		document.getElementById('loadFields').innerHTML = '';
		document.getElementById('CustomView').innerHTML = '';
		document.getElementById('loadViews').innerHTML = '';
		document.getElementById('RelatedLists').innerHTML = '';
		document.getElementById('loadLists').innerHTML = '';
		document.getElementById('step-1').style.display = 'block';
		document.getElementById('step-2').style.display = 'none';
		document.getElementById('step-3').style.display = 'none';
		document.getElementById('step-4').style.display = 'none';
		document.getElementById('step-5').style.display = 'none';
		document.getElementById('step-6').style.display = 'none';
		document.getElementById('genModule').style.display = 'block';
		document.getElementById('genModuleProgress').style.display = 'none';
		document.getElementById('block-information').classList.remove('slds-is-active');
		document.getElementById('field-information').classList.remove('slds-is-active');
		document.getElementById('filters').classList.remove('slds-is-active');
		document.getElementById('relationship').classList.remove('slds-is-active');
		document.getElementById('modulename').removeAttribute('readonly');
	},

	loadTemplate: () => {
		jQuery.ajax({
			method: 'POST',
			url: url,
			data: 'methodName=loadTemplate&modId=0'
		}).then(function (response) {
			let res = JSON.parse(response);
			let label;
			//load info block
			const info = mb.loadElement('info', true);
			let infoTemplate = `
			<table class="slds-table slds-table_cell-buffer slds-table_bordered">
				<thead>
				    <tr class="slds-line-height_reset">
				      	<th scope="col">
				        	<div class="slds-truncate">${mod_alert_arr.name}</div>
				      	</th>
				      	<th scope="col">
				       		<div class="slds-truncate">${mod_alert_arr.label}</div>
				      	</th>
				      	<th scope="col">
				        	<div class="slds-truncate">${mod_alert_arr.icon}</div>
				      	</th>
				      	<th scope="col">
				        	<div class="slds-truncate">${mod_alert_arr.parent}</div>
				      	</th>
				    </tr>
				</thead>
				<tbody>
			    <tr class="slds-hint-parent">
			      	<td>
			        	<div class="slds-truncate">${res.info.name}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.info.label}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.info.icon}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.info.parent}</div>
			      	</td>
			    </tr>
				</tbody>
			</table>`;
			document.getElementById('info').innerHTML = infoTemplate;
			//load blocks

			let blockTemplate = `
			<table class="slds-table slds-table_cell-buffer slds-table_bordered">
			  <thead>
			    <tr class="slds-line-height_reset">
			      	<thscope="col">
			        	<div class="slds-truncate">Blocks list</div>
			      	</th>
			    </tr>
			  </thead>
			  <tbody>`;
			for (let i in res.blocks) {
				blockTemplate += `
			    <tr class="slds-hint-parent">
			      	<td>
			      		<div class="slds-truncate">${res.blocks[i].blocks_label}</div>
			      	</td>
			    </tr>`;
			}
			blockTemplate += `
			  </tbody>
			</table>`;
			document.getElementById('blocks').innerHTML = blockTemplate;

			//load fields
			let tableTemplate = `
			<table class="slds-table slds-table_cell-buffer slds-table_bordered">
			  <thead>
			    <tr class="slds-line-height_reset">
			      	<th class="" scope="col">
			        	<div class="slds-truncate" title="fieldname">fieldname</div>
			      	</th>
			      	<th class="" scope="col">
			        	<div class="slds-truncate" title="fieldlabel">fieldlabel</div>
			      	</th>
			      	<th class="" scope="col">
			        	<div class="slds-truncate" title="uitype">uitype</div>
			      	</th>
			      	<th class="" scope="col">
			        	<div class="slds-truncate" title="relatedmodules">relatedmodules</div>
			      	</th>
			      	<th class="" scope="col">
			        	<div class="slds-truncate" title="masseditable">masseditable</div>
			      	</th>
			    </tr>
			  </thead>
			  <tbody>`;
			for (let i = 0; i < res.fields['data'].contents.length; i++) {
				const masseditable = res.fields['data'].contents[i].masseditable == 0 ? 'On' : 'Off';
				tableTemplate += `
			    <tr class="slds-hint-parent">
			      	<td>
			        	<div class="slds-truncate">${res.fields['data'].contents[i].fieldname}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.fields['data'].contents[i].fieldlabel}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.fields['data'].contents[i].uitype}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.fields['data'].contents[i].relatedmodules}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${masseditable}</div>
			      	</td>
			    </tr>`;
			}
			tableTemplate += `
				</tbody>
			</table>`;
			document.getElementById('fields').innerHTML = tableTemplate;
			//load views
			let viewTemplate = `
			<table class="slds-table slds-table_cell-buffer slds-table_bordered">
			  <thead>
			    <tr class="slds-line-height_reset">
			      	<th class="" scope="col">
			        	<div class="slds-truncate">Name</div>
			      	</th>
			      	<th class="" scope="col">
			        	<div class="slds-truncate">Fields</div>
			      	</th>
			    </tr>
			  </thead>
			  <tbody>`;
			for (let i = 0; i < res.views['data'].contents.length; i++) {
				viewTemplate += `
			    <tr class="slds-hint-parent">
			      	<td>
			        	<div class="slds-truncate">${res.views['data'].contents[i].viewname}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.views['data'].contents[i].fields}</div>
			      	</td>
			    </tr>`;
			}
			viewTemplate += `
				</tbody>
			</table>`;
			document.getElementById('views').innerHTML = viewTemplate;

			//load views
			let listTemplate = `
			<table class="slds-table slds-table_cell-buffer slds-table_bordered">
			  <thead>
			    <tr class="slds-line-height_reset">
			      	<th class="" scope="col">
			        	<div class="slds-truncate">function</div>
			      	</th>
			      	<th class="" scope="col">
			        	<div class="slds-truncate">label</div>
			      	</th>
			      	<th class="" scope="col">
			        	<div class="slds-truncate">actions</div>
			      	</th>
			      	<th class="" scope="col">
			        	<div class="slds-truncate">relatedmodule</div>
			      	</th>
			    </tr>
			  </thead>
			  <tbody>`;
			for (let i = 0; i < res.lists['data'].contents.length; i++) {
				listTemplate += `
			    <tr class="slds-hint-parent">
			      	<td>
			        	<div class="slds-truncate">${res.lists['data'].contents[i].functionname}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.lists['data'].contents[i].label}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.lists['data'].contents[i].actions}</div>
			      	</td>
			      	<td>
			        	<div class="slds-truncate">${res.lists['data'].contents[i].relatedmodule}</div>
			      	</td>
			    </tr>`;
			}
			listTemplate += `
				</tbody>
			</table>`;
			document.getElementById('lists').innerHTML = listTemplate;
		});
	},

	showInformation: (id) => {
		document.getElementById(id).style.display = 'block';
	},

	hideInformation: (id) => {
		document.getElementById(id).style.display = 'none';
	},
};

class ActionRender {

	constructor(props) {
		let el;
		let id;
		let functionName = '';
		let rowKey = props.rowKey;
		const { type } = props.columnInfo.renderer.options;
		if (type == 'Fields') {
			id = props.grid.getValue(rowKey, 'fieldsid');
			functionName = 'removeField';
		} else if (type == 'CustomView') {
			id = props.grid.getValue(rowKey, 'customviewid');
			functionName = 'removeCustomView';
		} else if (type == 'RelatedLists') {
			id = props.grid.getValue(rowKey, 'relatedlistid');
			functionName = 'removeRelatedLists';
		}
		el = document.createElement('span');
		let actions = `
			<div class="slds-button-group" role="group">
				<button onclick='mb.${functionName}(${id})' class="slds-button slds-button_icon slds-button_icon-border-filled" aria-pressed="false">
				<svg class="slds-button__icon" aria-hidden="true">
					<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#delete"></use>
				</svg>
				</button>
			</div>`;
		el.innerHTML = actions;
		this.el = el;
		this.render(props);
	}

	getElement() {
		return this.el;
	}

	render(props) {
		this.el.value = String(props.value);
	}
}