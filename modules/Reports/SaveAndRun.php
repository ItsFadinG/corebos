<?php
/*********************************************************************************
** The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 ********************************************************************************/
global $theme;
$theme_path='themes/'.$theme.'/';
$image_path=$theme_path.'images/';
require_once 'modules/CustomView/CustomView.php';
require_once 'config.inc.php';
require_once 'modules/Reports/Reports.php';
require_once 'include/logging.php';
require_once 'modules/Reports/ReportRun.php';
require_once 'include/utils/utils.php';
require_once 'Smarty_setup.php';

global $adb,$mod_strings,$app_strings;

$reportid = vtlib_purify($_REQUEST['record']);
$folderid = isset($_REQUEST['folderid']) ? vtlib_purify($_REQUEST['folderid']) : 0;
$now_action = vtlib_purify($_REQUEST['action']);

$res = $adb->pquery('select * from vtiger_report where reportid=?', array($reportid));

$Report_ID = $adb->query_result($res, 0, 'reportid');
$cbreporttype = $adb->query_result($res, 0, 'cbreporttype');

if ($cbreporttype == 'external') {
	$url = $adb->query_result($res, 0, 'moreinfo');
	$str_one = html_entity_decode($url);
	$result = unserialize($str_one);
	$url = vtlib_purify($result['url']);
	echo "<script>window.open('".$url."', '_blank');window.close();</script>";
}

if (empty($folderid)) {
	$folderid = $adb->query_result($res, 0, 'folderid');
}
$numOfRows = $adb->num_rows($res);

if ($numOfRows > 0) {
	global $primarymodule,$secondarymodule,$orderbylistcolumns,$ogReport, $current_user;

	$ogReport = new Reports($reportid);
	$primarymodule = $ogReport->primodule;
	$restrictedmodules = array();
	if ($ogReport->secmodule!='') {
		$rep_modules = explode(':', $ogReport->secmodule);
	} else {
		$rep_modules = array();
	}

	$rep_modules[] = $primarymodule;
	$modules_permitted = true;
	$modules_export_permitted = true;
	foreach ($rep_modules as $mod) {
		if (isPermitted($mod, 'index')!= 'yes' || !vtlib_isModuleActive($mod)) {
			$modules_permitted = false;
			$restrictedmodules[] = $mod;
		}
		if (isPermitted($mod, 'Export', '')!='yes') {
			$modules_export_permitted = false;
		}
	}

	if (isPermitted($primarymodule, 'index') == 'yes' && $modules_permitted) {
		$oReportRun = new ReportRun($reportid);
		$groupBy = $oReportRun->getGroupingList($reportid);
		$showCharts = (count($groupBy) > 0);

		$advft_criteria = isset($_REQUEST['advft_criteria']) ? $_REQUEST['advft_criteria'] : null;
		coreBOS_Session::set('ReportAdvCriteria'.$_COOKIE['corebos_browsertabID'], $advft_criteria);
		if (!empty($advft_criteria)) {
			$advft_criteria = json_decode($advft_criteria, true);
		}
		$advft_criteria_groups = isset($_REQUEST['advft_criteria_groups']) ? $_REQUEST['advft_criteria_groups'] : null;
		coreBOS_Session::set('ReportAdvCriteriaGrp'.$_COOKIE['corebos_browsertabID'], $advft_criteria_groups);
		if (!empty($advft_criteria_groups)) {
			$advft_criteria_groups = json_decode($advft_criteria_groups, true);
		}

		if (isset($_REQUEST['submode']) && $_REQUEST['submode'] == 'saveCriteria') {
			updateAdvancedCriteria($reportid, $advft_criteria, $advft_criteria_groups);
		}

		$filtersql = $oReportRun->RunTimeAdvFilter($advft_criteria, $advft_criteria_groups);

		$list_report_form = new vtigerCRM_Smarty;
		$list_report_form->assign('THEME', $theme);
		if ($showCharts) {
			require_once 'modules/Reports/CustomReportUtils.php';
			require_once 'include/utils/ChartUtils.php';

			$groupBy = $oReportRun->getGroupingList($reportid);
			if (count($groupBy) > 0) {
				foreach ($groupBy as $key => $value) {
					list($tablename,$colname,$module_field,$fieldname,$single) = explode(":", $key);
					list($module,$field)= explode("_", $module_field);
					$fieldDetails = $key;
					break;
				}
				$queryReports = CustomReportUtils::getCustomReportsQuery($Report_ID, $filtersql);
				$queryResult = $adb->pquery($queryReports, array());
				if ($queryResult && $adb->num_rows($queryResult)) {
					$ChartDetails = ChartUtils::generateChartDataFromReports($queryResult, strtolower($module_field), $fieldDetails, $reportid);
					$list_report_form->assign('CHARTDATA', $ChartDetails);
				} else {
					$showCharts = false;
				}
			} else {
				$showCharts = false;
			}
		}
		$list_report_form->assign('SHOWCHARTS', $showCharts);

		if (isset($_REQUEST['submode']) && $_REQUEST['submode'] == 'generateReport' && empty($advft_criteria)) {
			$filtersql = '';
		}
		$ogReport->getPriModuleColumnsList($ogReport->primodule);
		$ogReport->getSecModuleColumnsList($ogReport->secmodule);
		$ogReport->getAdvancedFilterList($reportid);

		$COLUMNS_BLOCK = getPrimaryColumns_AdvFilter_HTML($ogReport->primodule, $ogReport);
		$COLUMNS_BLOCK .= getSecondaryColumns_AdvFilter_HTML($ogReport->secmodule, $ogReport);
		$list_report_form->assign('COLUMNS_BLOCK', $COLUMNS_BLOCK);

		$COLUMNS_BLOCK_ARRAY = getPrimaryColumns_AdvFilter_HTML($ogReport->primodule, $ogReport, '', true);
		$SEC_COLUMNS_BLOCK_ARRAY = getSecondaryColumns_AdvFilter_HTML($ogReport->secmodule, $ogReport, '', true);
		$list_report_form->assign('COLUMNS_BLOCK_ARRAY', array_merge($COLUMNS_BLOCK_ARRAY, $SEC_COLUMNS_BLOCK_ARRAY));

		$FILTER_OPTION = Reports::getAdvCriteriaHTML();
		$list_report_form->assign('FOPTION', $FILTER_OPTION);

		$rel_fields = $ogReport->adv_rel_fields;
		$list_report_form->assign('REL_FIELDS', json_encode($rel_fields));

		$list_report_form->assign('CRITERIA_GROUPS', $ogReport->advft_criteria);

		$list_report_form->assign('MOD', $mod_strings);
		$list_report_form->assign('APP', $app_strings);
		$list_report_form->assign('MODULE', $currentModule);
		$list_report_form->assign('IMAGE_PATH', $image_path);
		$list_report_form->assign('REPORTID', $reportid);
		$list_report_form->assign('IS_EDITABLE', $ogReport->is_editable);

		$list_report_form->assign('REP_FOLDERS', $ogReport->sgetRptFldr());

		$list_report_form->assign('REPORTNAME', htmlspecialchars($ogReport->reportname, ENT_QUOTES, $default_charset));
		$jsonheaders = $oReportRun->GenerateReport('HEADERS', '');
		$list_report_form->assign('TABLEHEADERS', $jsonheaders['i18nheaders']);
		$list_report_form->assign('JSONHEADERS', $jsonheaders['jsonheaders']);
		if ($jsonheaders['has_contents']) {
			$totalhtml = $oReportRun->GenerateReport('TOTALHTML', $filtersql, false);
		} else {
			$totalhtml = '';
		}
		$list_report_form->assign('REPORTTOTHTML', $totalhtml);
		$list_report_form->assign('FOLDERID', $folderid);
		$list_report_form->assign('DATEFORMAT', $current_user->date_format);
		$list_report_form->assign('JS_DATEFORMAT', parse_calendardate($app_strings['NTC_DATE_FORMAT']));
		$list_report_form->assign('EXPORT_PERMITTED', $modules_export_permitted);
		$rep_in_fldr = $ogReport->sgetRptsforFldr($folderid);
		for ($i=0; $i<count($rep_in_fldr); $i++) {
			$rep_id = $rep_in_fldr[$i]['reportid'];
			$rep_name = $rep_in_fldr[$i]['reportname'];
			$reports_array[$rep_id]=$rep_name;
		}
		$list_report_form->assign('CHECK', Button_Check($ogReport->primodule));
		$list_report_form->assign('GRAPHSHOW', GlobalVariable::getVariable('Graph_DataLabels', 'Percentage', $ogReport->primodule));
		$list_report_form->assign('GRAPHSHOWCOLOR', GlobalVariable::getVariable('Graph_DataLabels_Color', '#FFFFFF', $ogReport->primodule));
		$list_report_form->assign('GRAPHCOLORSCHEME', GlobalVariable::getVariable('Graph_ColorScheme', 'tableau.Tableau10', $ogReport->primodule));
		if (empty($_REQUEST['mode']) || $_REQUEST['mode'] != 'ajax') {
			$list_report_form->assign('REPINFOLDER', $reports_array);
			include 'modules/Vtiger/header.php';
			$list_report_form->display('ReportRun.tpl');
		} else {
			$list_report_form->display('ReportRunContents.tpl');
		}
	} else {
		if (empty($_REQUEST['mode']) || $_REQUEST['mode'] != 'ajax') {
			include 'modules/Vtiger/header.php';
		}
		echo "<table border='0' cellpadding='5' cellspacing='0' width='100%' height='450px'><tr><td align='center'>";
		echo "<div style='border: 3px solid rgb(153, 153, 153); background-color: rgb(255, 255, 255); width: 80%; position: relative; z-index: 10000000;'>
		<table border='0' cellpadding='5' cellspacing='0' width='98%'>
		<tbody><tr>
		<td rowspan='2' width='11%'><img src='". vtiger_imageurl('denied.gif', $theme) ."' ></td>
		<td style='border-bottom: 1px solid rgb(204, 204, 204);' nowrap='nowrap' width='70%'>
			<span class='genHeaderSmall'>".$mod_strings['LBL_NO_ACCESS']." : ".implode(',', $restrictedmodules)." </span>
		</td>
		</tr>
		<tr>
		<td class='small' align='right' nowrap='nowrap'>
		<a href='javascript:window.history.back();'>".$app_strings['LBL_GO_BACK']."</a><br></td>
		</tr>
		</tbody></table>
		</div>
		</td></tr></table>";
	}
} else {
	$theme = vtlib_purify($theme);
	echo "<link rel='stylesheet' type='text/css' href='themes/$theme/style.css'>";
	echo "<table border='0' cellpadding='5' cellspacing='0' width='100%' height='450px'><tr><td align='center'>";
	echo "<div style='border: 3px solid rgb(153, 153, 153); background-color: rgb(255, 255, 255); width: 80%; position: relative; z-index: 10000000;'>
	<table border='0' cellpadding='5' cellspacing='0' width='98%'>
	<tbody><tr>
	<td rowspan='2' width='11%'><img src='". vtiger_imageurl('denied.gif', $theme) ."' ></td>
	<td style='border-bottom: 1px solid rgb(204, 204, 204);' nowrap='nowrap' width='70%'><span class='genHeaderSmall'>".$mod_strings['LBL_REPORT_DELETED']."</span></td>
	</tr>
	<tr>
	<td class='small' align='right' nowrap='nowrap'>
	<a href='javascript:window.history.back();'>".$app_strings['LBL_GO_BACK']."</a><br></td>
	</tr>
	</tbody></table>
	</div>
	</td></tr></table>";
}

/** Function to get the StdfilterHTML strings for the given  primary module
 *  @ param $module : Type String
 *  @ param $selected : Type String(optional)
 *  This Generates the HTML Combo strings for the standard filter for the given reports module
 *  This Returns a HTML sring
 */
function getPrimaryStdFilterHTML($module, $selected = '') {
	global $ogReport, $current_language;
	$ogReport->oCustomView=new CustomView();
	$result = $ogReport->oCustomView->getStdCriteriaByModule($module);
	$mod_strings = return_module_language($current_language, $module);
	$shtml = '';
	if (isset($result)) {
		foreach ($result as $key => $value) {
			if (isset($mod_strings[$value])) {
				if ($key == $selected) {
					$shtml .= "<option selected value=\"".$key."\">".getTranslatedString($module, $module)." - ".$mod_strings[$value]."</option>";
				} else {
					$shtml .= "<option value=\"".$key."\">".getTranslatedString($module, $module)." - ".$mod_strings[$value]."</option>";
				}
			} else {
				if ($key == $selected) {
					$shtml .= "<option selected value=\"".$key."\">".getTranslatedString($module, $module)." - ".$value."</option>";
				} else {
					$shtml .= "<option value=\"".$key."\">".getTranslatedString($module, $module)." - ".$value."</option>";
				}
			}
		}
	}
	return $shtml;
}

/** Function to get the StdfilterHTML strings for the given secondary module
 *  @ param $module : Type String
 *  @ param $selected : Type String(optional)
 *  This Generates the HTML Combo strings for the standard filter for the given reports module
 *  This Returns a HTML sring
 */
function getSecondaryStdFilterHTML($module, $selected = '') {
	global $ogReport, $current_language;
	$ogReport->oCustomView=new CustomView();
	$shtml = '';
	if ($module != '') {
		$secmodule = explode(":", $module);
		for ($i=0; $i < count($secmodule); $i++) {
			$result =  $ogReport->oCustomView->getStdCriteriaByModule($secmodule[$i]);
			$mod_strings = return_module_language($current_language, $secmodule[$i]);
			if (isset($result)) {
				foreach ($result as $key => $value) {
					if (isset($mod_strings[$value])) {
						if ($key == $selected) {
							$shtml .= "<option selected value=\"".$key."\">".getTranslatedString($secmodule[$i], $secmodule[$i])." - ".$mod_strings[$value]."</option>";
						} else {
							$shtml .= "<option value=\"".$key."\">".getTranslatedString($secmodule[$i], $secmodule[$i])." - ".$mod_strings[$value]."</option>";
						}
					} else {
						if ($key == $selected) {
							$shtml .= "<option selected value=\"".$key."\">".getTranslatedString($secmodule[$i], $secmodule[$i])." - ".$value."</option>";
						} else {
							$shtml .= "<option value=\"".$key."\">".getTranslatedString($secmodule[$i], $secmodule[$i])." - ".$value."</option>";
						}
					}
				}
			}
		}
	}
	return $shtml;
}

function getPrimaryColumns_AdvFilter_HTML($module, $ogReport, $selected = '', $array = false) {
	global $current_language;
	$mod_strings = return_module_language($current_language, $module);
	$block_listed = array();
	$shtml = '';
	$return_array = array();
	foreach ($ogReport->module_list[$module] as $value) {
		if (isset($ogReport->pri_module_columnslist[$module][$value]) && empty($block_listed[$value])) {
			$block_listed[$value] = true;
			$fields_array = array();
			$shtml .= '<optgroup label="'.getTranslatedString($module, $module).' '.getTranslatedString($value).'" class="select" style="border:none">';
			foreach ($ogReport->pri_module_columnslist[$module][$value] as $field => $fieldlabel) {
				list($table, $column, $mod_fldlbl, $fldname, $tod) = explode(':', $field);
				$field_array = array(
					'label' => isset($mod_strings[$fieldlabel]) ? $mod_strings[$fieldlabel] : $fieldlabel,
					'value' => $field,
					'selected' => $selected == $field ? '1' : '',
					'typeofdata' => $tod
				);
				$fields_array[$fldname] = $field_array;
				if (isset($mod_strings[$fieldlabel])) {
					//fix for ticket 5191
					$selected = decode_html($selected);
					$field = decode_html($field);
					//fix ends
					if ($selected == $field) {
						$shtml .= "<option selected value=\"".$field."\">".$mod_strings[$fieldlabel]."</option>";
					} else {
						$shtml .= "<option value=\"".$field."\">".$mod_strings[$fieldlabel]."</option>";
					}
				} else {
					if ($selected == $field) {
						$shtml .= "<option selected value=\"".$field."\">".$fieldlabel."</option>";
					} else {
						$shtml .= "<option value=\"".$field."\">".$fieldlabel."</option>";
					}
				}
			}
			if (count($fields_array) > 0) {
				$blockname = getTranslatedString($value);
				$return_array[$module][$blockname] = $fields_array;
			}
		}
	}
	return $array == true ? $return_array : $shtml;
}

function getSecondaryColumns_AdvFilter_HTML($module, $ogReport, $selected = '', $array = false) {
	global $current_language;
	$shtml = '';
	$return_array = array();
	if ($module != '') {
		$secmodule = explode(":", $module);
		for ($i=0; $i < count($secmodule); $i++) {
			$mod_strings = return_module_language($current_language, $secmodule[$i]);
			if (vtlib_isModuleActive($secmodule[$i])) {
				$block_listed = array();
				foreach ($ogReport->module_list[$secmodule[$i]] as $value) {
					if (isset($ogReport->sec_module_columnslist[$secmodule[$i]][$value]) && empty($block_listed[$value])) {
						$block_listed[$value] = true;
						$fields_array = array();
						$shtml .= '<optgroup label="'.getTranslatedString($secmodule[$i], $secmodule[$i]).' '.getTranslatedString($value).'" class="select" style="border:none">';
						foreach ($ogReport->sec_module_columnslist[$secmodule[$i]][$value] as $field => $fieldlabel) {
							list($table, $column, $mod_fldlbl, $fldname, $tod) = explode(':', $field);
							$field_array = array(
								'label' => isset($mod_strings[$fieldlabel]) ? $mod_strings[$fieldlabel] : $fieldlabel,
								'value' => $field,
								'selected' => $selected == $field ? '1' : '',
								'typeofdata' => $tod
							);
							$fields_array[$fldname] = $field_array;
							if (isset($mod_strings[$fieldlabel])) {
								if ($selected == $field) {
									$shtml .= "<option selected value=\"".$field."\">".$mod_strings[$fieldlabel]."</option>";
								} else {
									$shtml .= "<option value=\"".$field."\">".$mod_strings[$fieldlabel]."</option>";
								}
							} else {
								if ($selected == $field) {
									$shtml .= "<option selected value=\"".$field."\">".$fieldlabel."</option>";
								} else {
									$shtml .= "<option value=\"".$field."\">".$fieldlabel."</option>";
								}
							}
						}
					}
					if (count($fields_array) > 0) {
						$blockname = getTranslatedString($value);
						$return_array[$secmodule[$i]][$blockname] = $fields_array;
					}
				}
			}
		}
	}
	return $array == true ? $return_array : $shtml;
}

function getAdvCriteria_HTML($adv_filter_options, $selected = '') {
	$shtml = '';
	foreach ($adv_filter_options as $key => $value) {
		if ($selected == $key) {
			$shtml .= '<option selected value="'.$key.'">'.$value.'</option>';
		} else {
			$shtml .= '<option value="'.$key.'">'.$value.'</option>';
		}
	}
	return $shtml;
}
?>
