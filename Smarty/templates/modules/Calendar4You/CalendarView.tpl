{*<!--
/*********************************************************************************
 * The content of this file is subject to the Calendar4You Free license.
 * ("License"); You may not use this file except in compliance with the License
 * The Initial Developer of the Original Code is IT-Solutions4You s.r.o.
 * Portions created by IT-Solutions4You s.r.o. are Copyright(C) IT-Solutions4You s.r.o.
 * All Rights Reserved.
 ********************************************************************************/
-->*}
<div id='miniCal' style='width:300px; position:absolute; display:none; left:100px; top:100px; z-index:100000; background-color:white'></div>
<div id='calSettings' class='layerPopup calSettings' style='display:none;width:500px;' align=center ></div>
<div id="event_info" class='layerPopup' style="position:absolute;display:none;z-index:10000;padding:5px;">
	<table align="center" border="0" cellpadding="5" cellspacing="0" width="300px">
		<tbody>
			<tr>
				<td class="small" id="event_info_content" style="background-color:#ffffff;padding:5px;"></td>
			</tr>
		</tbody>
	</table>
</div>
<script src='modules/Calendar4You/fullcalendar/locale-all.js'></script>
<div id="event_setting" style="border:1px solid #000000;position:absolute;display:none;z-index:10000;background-color:white"></div>
<!-- Dropdown for Add Event Button -->
<div id='addEventDropDown' style='width:160px' onmouseover='fnShowITSEvent()' onmouseout='fnRemoveITSEvent()'>
<table width="100%" cellpadding="0" cellspacing="0" border="0">{$ADD_BUTTONEVENTLIST}</table>
</div>
<!-- Dropdown for Add Event on Button hover -->
<div id='addButtonDropDown' style='width:160px' onmouseover='fnShowButton()' onmouseout='fnRemoveButton()'>
<table width="100%" cellpadding="0" cellspacing="0" border="0">{$ADD_ADDEVENTLIST}</table>
</div>
<script>
var Events_color = new Array();

{foreach name=calendar_users item=userdata key=userid from=$CALENDAR_USERS}
Events_color['user_{$userid}_textColor'] = '{$userdata.textColor}';
Events_color['user_{$userid}_color'] = '{$userdata.color}';
Events_color['user_{$userid}_title_color'] = '{$userdata.title_color}';
{/foreach}

{foreach name=act_types item=typedata key=typeid from=$ACTIVITYTYPES}
Events_color['{$typeid}_textColor'] = '{$typedata.textColor}';
Events_color['{$typeid}_color'] = '{$typedata.color}';
Events_color['{$typeid}_title_color'] = '{$typedata.title_color}';
{/foreach}
{foreach name=act_types item=typedata key=typeid from=$MODULETYPES}
Events_color['{$typeid}_textColor'] = '{$typedata.textColor}';
Events_color['{$typeid}_color'] = '{$typedata.color}';
Events_color['{$typeid}_title_color'] = '{$typedata.title_color}';
{/foreach}

Calendar_Event_Types = {literal}{
	events: function(start1, end1, timezone,callback) {
		var start=start1._d;
		var end=end1._d;
		var loggeduser = jQuery('#logged_user').val();

		var user_view_type = jQuery('#user_view_type :selected').val();
		typeids_val = '';
		{/literal}
		{foreach name=act_types item=typedata key=typeid from=$ACTIVITYTYPES}
			if (jQuery('#calendar_event_{$typeid}').is(':checked')) {ldelim}
				if (typeids_val != '') {
					typeids_val += ',';
				}
				typeids_val += '{$typeid}';
			{rdelim}
		{/foreach}
		{foreach name=act_types item=typedata key=typeid from=$MODULETYPES}
			if (jQuery('#calendar_event_{$typeid}').is(':checked')) {ldelim}
				if (typeids_val != '') {
					typeids_val += ',';
				}
				typeids_val += '{$typeid}';
			{rdelim}
		{/foreach}

		usersids = '';
		if (user_view_type == 'all') {ldelim}
			{foreach name=act_types item=userdata key=userid from=$CALENDAR_USERS}
				if (jQuery('#calendar_user_{$userid}').is(':checked')) {ldelim}
					if (usersids != '') {
						usersids += ',';
					}
					usersids += '{$userid}';
				{rdelim}
			{/foreach}
			if (usersids == '') {
				usersids = '0';
			}
		{rdelim}

		var event_status = '';
		{foreach name=calendar_event_status item=estatusdata key=estatus_key from=$EVENT_STATUS}
			if (!jQuery('#calendar_event_status_{$estatusdata.id}').is(':checked')) {ldelim}
				if (event_status != "") event_status += ",";
				event_status += '{$estatusdata.id}';
			{rdelim}
		{/foreach}

		var task_priority = '';
		{foreach name=calendar_task_priority item=tprioritydata key=tpriority_key from=$TASK_PRIORITY}
			if (!jQuery('#calendar_task_priority_{$tprioritydata.id}').is(':checked')) {ldelim}
				if (task_priority != '') {
					task_priority += ',';
				}
				task_priority += '{$tprioritydata.id}';
			{rdelim}
		{/foreach}
		{literal}

		var block_status = {};
		block_status.event_type = jQuery('#event_type_wrapper').css('display');
		block_status.module_type = jQuery('#module_type_wrapper').css('display');
		block_status.et_status = jQuery('#et_status_wrapper').css('display');
		block_status.task_priority = jQuery('#task_priority_list').css('display');

		var view_val = jQuery('#calendar_div').fullCalendar('getView');
		document.getElementById('status').style.display='inline';
		jQuery.ajax({
			url: 'index.php',
			dataType: 'json',
			data: {
				module: 'Calendar4You',
				action: 'Calendar4YouAjax',
				file: 'Events',
				typeids: typeids_val,
				usersids: usersids,
				user_view_type: user_view_type,
				view: view_val.name,
				event_status: event_status,
				task_priority: task_priority,
				block_status: JSON.stringify(block_status),
				save: loggeduser,
				start: Math.round(new Date(start).getTime() / 1000),
				end: Math.round(new Date(end).getTime() / 1000)
			},
			success: function(data){
				var events = [];
				for (var i = 0; i < data.length; i++) {
					var object = data[i];

					load_typeid = object['typeid'];
					load_userid = object['userid'];

					if (user_view_type == 'all') {
						event_color = Events_color['user_' + load_userid + '_color'];
						event_textColor = Events_color['user_' + load_userid + '_textColor'];
						event_title_color = Events_color['user_' + load_userid + '_title_color'];
					} else {
						event_color = Events_color[load_typeid + '_color'];
						event_textColor = Events_color[load_typeid + '_textColor'];
						event_title_color = Events_color[load_typeid + '_title_color'];
					}

					events.push({
						id: object['id'],
						typeid: object['typeid'],
						userid: object['userid'],
						visibility: object['visibility'],
						editable: object['editable'],
						activity_mode: object['activity_mode'],
						title: object['title'],
						start: object['start'],
						end: object['end'],
						allDay : object['allDay'],
						geventid: object['geventid'],
						color: event_color,
						textColor: event_textColor,
						title_color: event_title_color,
						borderColor: event_title_color
					});
				}
				callback(events);
				document.getElementById('status').style.display='none';
			}
		});
	}
}

jQuery(document).ready(function(){
	var lastView;
	var date = new Date();
	var d = date.getDate();
	var m = date.getMonth();
	var y = date.getFullYear();
	var config = {
		locale: '{/literal}{$USER_LANGUAGE}{literal}',
		fixedWeekCount :false,
		theme: true,
		defaultView: '{/literal}{$DEFAULTVIEW}{literal}',
		allDayText: {/literal}'{$MOD.LBL_ALL_DAY}'{literal},
		weekNumbers: {/literal}{$Calendar_Show_WeekNumber}{literal},
		weekends: {/literal}{$CALENDAR_SETTINGS.show_weekends}{literal},
		minTime: '{/literal}{$CALENDAR_SETTINGS.start_hour}{literal}',
		maxTime: '{/literal}{$CALENDAR_SETTINGS.end_hour}{literal}',
		slotDuration: '{/literal}{$Calendar_Slot_Minutes}{literal}',
		slotEventOverlap: {/literal}{$Calendar_Slot_Event_Overlap}{literal},
		header: {
			left: 'prev,next today ',
			center: 'title',
			right: 'agendaDay,agendaWeek,month'
		},
		editable: false,
{/literal}
		{if $IS_24 eq "true"}
			timeFormat: 'H:mm',
			slotLabelFormat: 'H(:mm)',
		{else}
			timeFormat: 'h:mma',
			slotLabelFormat: 'h(:mm)a',
		{/if}
		monthNames: ['{$CMOD.cal_month_long.1|escape}', '{$CMOD.cal_month_long.2|escape}', '{$CMOD.cal_month_long.3|escape}', '{$CMOD.cal_month_long.4|escape}', '{$CMOD.cal_month_long.5|escape}', '{$CMOD.cal_month_long.6|escape}', '{$CMOD.cal_month_long.7|escape}', '{$CMOD.cal_month_long.8|escape}', '{$CMOD.cal_month_long.9|escape}', '{$CMOD.cal_month_long.10|escape}', '{$CMOD.cal_month_long.11|escape}', '{$CMOD.cal_month_long.12|escape}'],
		monthNamesShort: ['{$CMOD.cal_month_short.1|escape}', '{$CMOD.cal_month_short.2|escape}', '{$CMOD.cal_month_short.3|escape}', '{$CMOD.cal_month_short.4|escape}', '{$CMOD.cal_month_short.5|escape}', '{$CMOD.cal_month_short.6|escape}', '{$CMOD.cal_month_short.7|escape}', '{$CMOD.cal_month_short.8|escape}', '{$CMOD.cal_month_short.9|escape}', '{$CMOD.cal_month_short.10|escape}', '{$CMOD.cal_month_short.11|escape}', '{$CMOD.cal_month_short.12|escape}'],
		firstDay:{$FISRTDAY},
		dayNames: ['{$CMOD.LBL_DAY0|escape}','{$CMOD.LBL_DAY1|escape}', '{$CMOD.LBL_DAY2|escape}', '{$CMOD.LBL_DAY3|escape}', '{$CMOD.LBL_DAY4|escape}', '{$CMOD.LBL_DAY5|escape}', '{$CMOD.LBL_DAY6|escape}'],
		dayNamesShort: ['{$CMOD.LBL_SM_SUN|escape}','{$CMOD.LBL_SM_MON|escape}', '{$CMOD.LBL_SM_TUE|escape}', '{$CMOD.LBL_SM_WED|escape}', '{$CMOD.LBL_SM_THU|escape}', '{$CMOD.LBL_SM_FRI|escape}', '{$CMOD.LBL_SM_SAT|escape}'],
		buttonText: {ldelim}
			today:'{$APP.LBL_TODAY|escape:'quotes'}',
			month: '{$CMOD.LBL_MON|escape:'quotes'}',
			week: '{$CMOD.LBL_WEEK|escape:'quotes'}',
			day: '{$CMOD.LBL_DAY|escape:'quotes'}',
			list: '{$MOD.LBL_LIST|escape:'quotes'}'
		{rdelim},
		eventSources: [Calendar_Event_Types],
{literal}
		loading: function (bool) {
			if (bool) {
				jQuery('#loading').show();
			} else {
				jQuery('#loading').hide();
			}
		},

		dayClick : function (date, jsEvent, view) {
			if (date._ambigTime==true) {
				argg1 = 'createTodo';
				type = 'todo';
			} else {
				argg1 = 'addITSEvent';
				type = '0';
			}
{/literal}
			if ('{$CREATE_PERMISSION}'!='permitted') {
				return false;
			}
			var formated_date = date.format('{$USER_DATE_FORMAT|upper}');
			{if $IS_24 eq "true"}
			starthr = date.format('HH');
			startfmt = '';
			endhr = date.format('HH');
			endfmt = '';
			{else}
			starthr = date.format('hh');
			startfmt = date.format('a');
			endhr = date.format('hh');
			endfmt = date.format('a');
			{/if}
			startmin = date.format('mm');
			endmin = date.format('mm');
			var viewOption = 'hourview';
			var subtab = '';
			var startdate = formated_date;
			var enddate = formated_date;

			eventlist = new Array({$EVENTLIST});
			var timemodulearr = new Array({$TIMEMODULEARRAY});
			var timemoduledet = {$TIMEMODULEDETAILS};
			var calendar_other_default_duration = {$Calendar_Other_Default_Duration}; // hours
{literal}
			for (var i=0; i<(eventlist.length); i++) {
				document.getElementById('add'+eventlist[i].toLowerCase()).href="javascript:gITSshow('addITSEvent','"+eventlist[i]+"','"+startdate+"','"+enddate+"','"+starthr+"','"+startmin+"','"+startfmt+"','"+endhr+"','"+endmin+"','"+endfmt+"','"+viewOption+"','"+subtab+"');fnRemoveITSEvent();";
			}
			for (var i=0; i<(timemodulearr.length); i++) {
				var tmmod = timemodulearr[i];
				if (startfmt=='am' || startfmt=='') {
					var tmstime = starthr + ':' + startmin;
				} else { // pm
					var nt = parseInt(starthr) + 12;
					var tmstime = nt + ':' + startmin;
				}
				if (endfmt=='am' || endfmt=='') {
					var tmetime = endhr + ':' + endmin;
				} else { // pm
					var nt = parseInt(starthr) + 12;
					var tmetime = nt + ':' + endmin;
				}
				if (starthr == endhr && startmin == endmin) {
					endhr = String(parseInt(endhr) + calendar_other_default_duration);
					if (endhr.length == 1) {
						endhr = '0'+endhr;
					}
				}
				var addmoduleurl = "javascript:gotourl('index.php?action=EditView&return_module=Calendar4You&return_action=index&module="+tmmod;
				addmoduleurl += timemoduledet[tmmod].start ? '&'+timemoduledet[tmmod].start+'='+startdate : '';
				addmoduleurl += timemoduledet[tmmod].end ? '&'+timemoduledet[tmmod].end+'='+enddate : '';
				addmoduleurl += timemoduledet[tmmod].stime ? '&'+timemoduledet[tmmod].stime+'='+tmstime : '';
				addmoduleurl += timemoduledet[tmmod].etime ? '&'+timemoduledet[tmmod].etime+'='+tmetime : '';
				addmoduleurl += "');";
				document.getElementById('addmod'+tmmod.toLowerCase()).href=addmoduleurl;
			}

			xOffset = 5;
			yOffset = -5;
			var left = (jsEvent.clientX + yOffset);
			if ((jsEvent.clientX + 200 + yOffset) > jQuery(window).width()) {
				left = (jsEvent.clientX - 200);
			}

			jQuery('#addEventDropDown').css('top', (jsEvent.clientY - xOffset) + 'px').css('left', left + 'px').fadeIn('fast');
		},

		eventClick: function (calEvent, jsEvent, view) {
			if (calEvent.visibility == 'public') {
				jQuery(this).css('cursor', 'pointer');
				var view_val = jQuery('#calendar_div').fullCalendar('getView');
				jQuery('#event_info').css('display', 'block');
				jQuery('#event_info').css('top', jsEvent.pageY + 1);
				var docwidth =jQuery(window).width();
				if(docwidth-jsEvent.pageX>=70 && docwidth-jsEvent.pageX<=185 ){
					jQuery('#event_info').css('right', docwidth-jsEvent.pageX);
				} else {
					jQuery('#event_info').css('left', jsEvent.pageX + 1);
				}
				jQuery('#event_info_content').html('<img src=\'themes/images/vtbusy.gif\'>');

				if (calEvent.id.substr(0,1) == 'g') {
					jQuery.ajax({
						url: 'index.php',
						dataType: 'html',
						data: {
							module: 'Calendar4You',
							action: 'Calendar4YouAjax',
							file: 'EventGoogleInfo',
							userid: calEvent.userid,
							geventid: calEvent.geventid,
							typeid: calEvent.typeid,
							eventid: calEvent.id
						},
						success: function (response) {
							jQuery('#event_info_content').html(response);
						}
					});
				} else {
					jQuery.ajax({
						url: 'index.php',
						dataType: 'json',
						data: {
							module: 'Calendar4You',
							action: 'Calendar4YouAjax',
							file: 'Events',
							view: 'agendaDay',
							record: calEvent.id,
							user_view_type: calEvent.userid,
							usersids: calEvent.userid,
							typeids: calEvent.typeid,
							geventid: calEvent.geventid
						},
						success: function (data) {
							object = data[0];
							{/literal}
							{if $goDirectToDetailView}
							window.open(object['actionDetail'], '_new'+object['id']);
							{else}
							jQuery('#event_info_content').html(object['title']);
							{/if}
							{literal}
						}
					});
				}
			} else {
				jQuery(this).css('cursor', 'default');
			}
		},

		eventDragStart: function ( event, jsEvent, ui, view ) {
			hideITSEventInfo();
		},

		eventDrop: function (event,dayDelta,revertFunc) {
			if (confirm("{/literal}{$MOD.MOVE_EVENT_QUESTION}{literal}")) {
				jQuery.ajax({
					url: 'index.php',
					dataType: 'json',
					data: {
						module: 'Calendar4You',
						action: 'SaveEvent',
						mode: 'event_drop',
						record: event.id,
						day: dayDelta._days,
						minute: dayDelta._milliseconds/60000,
						allday: event.allDay
					},
					success: function (data) {
					}
				});
			} else {
				revertFunc();
			}
		},

		eventResizeStart: function (event, jsEvent, ui, view) {
			hideITSEventInfo();
		},

		eventResize: function (event, dayDelta, revertFunc) {
			if (confirm("{/literal}{$MOD.RESIZE_EVENT_QUESTION}{literal}")) {
				jQuery.ajax({
					url: 'index.php',
					dataType: 'json',
					data: {
						module: 'Calendar4You',
						action: 'SaveEvent',
						mode: 'event_resize',
						record: event.id,
						day: dayDelta._days,
						minute: dayDelta._milliseconds/60000,
					},
					success: function (data) {
					}
				});
			} else {
				revertFunc();
			}
		},

		eventRender: function (event, element) {
			element.find('.fc-title').html(event.title);
			element.bind('dblclick', function () {
				if (event.visibility == 'public' && event.id.substr(0,1) != 'g') {
					fnHideDrop('event_info');
					let module = event.typeid;
					if (!isNaN(event.typeid)) {
						module = 'cbCalendar';
					}
					window.location.href = 'index.php?action=DetailView&module='+module+'&record='+event.id+'&activity_mode='+event.activity_mode;
				}
			});
		},
	}
	jQuery('#calendar_div').fullCalendar(config);
});

function changeCalendarEvents(el) {
	jQuery('#logged_user').val('{/literal}{$CURRENT_USER_ID}{literal}');
	jQuery('#calendar_div').fullCalendar('refetchEvents');
}

function hideITSEventInfo(){
	jQuery('#event_info').css('display', 'none');
	jQuery('#event_info_content').html('');
}
{/literal}
</script>
{include file='Buttons_List.tpl'}
<div style="width:98%;margin:auto;" class="slds-card">
	<!-- Calendar Tabs starts -->
	<div class="small" style="padding: 10px;width:100%;display:flex;">
		<div style="min-width:215px;" class="noprint">
			{foreach item=PANEL_NAME from=$Calendar_Panel_Order}
			{if $PANEL_NAME eq 'ActivityType'}
			<div class="dvtContentSpace" style="border:0;width:100%;">
				<div class="ui-widget-header">
					<div style="font-size:13px;padding:5px" class="ui-widget" onclick="jQuery('#event_type_wrapper').toggle();">{$CMOD.LBL_LIST_FORM_TITLE}</div>
				</div>
				<div style="padding:5px" class="ui-widget-content">
					<div id="event_type_wrapper" style="display:{$upEVENTBLOCK_DISPLAY}">
						{foreach name=act_types2 item=typedata key=typeid from=$ACTIVITYTYPES}
						<div id="event_type_{$typeid}" class="cblds-p-v_small" style="font-weight:bold;font-size:12px;width:98%;{if $USER_VIEW_TYPE neq "all"}color:{$typedata.textColor};background-color:{$typedata.color};border: 2px solid {$typedata.title_color}{else}background-color:#ffffff;border: 2px solid #dedede{/if};margin:0px 3px 3px 3px;padding:1px;border-top-left-radius: 3px;border-bottom-left-radius: 3px; border-top-right-radius: 3px; border-bottom-right-radius: 3px;" onMouseOver="showEventIcon('event_type_{$typeid}_icon')" onMouseOut="hideEventIcon('event_type_{$typeid}_icon')">
							<input class="cblds-m-r_small" type="checkbox" id="calendar_event_{$typeid}" name="calendar_event_{$typeid}" onClick="changeCalendarEvents(this)" value="{$typeid}" {if $typedata.checked eq 'true'}checked="checked"{/if}>
							{$typedata.label}
							<span class="cblds-t-align_right" style="float:right;">
							<a id="event_type_{$typeid}_icon" href="javascript:;" style="display:none" onClick="loadITSEventSettings(this,'type','{$typeid}')"><img src="themes/images/activate.gif" border="0"></a>
							</span>
						</div>
						{/foreach}
					</div>
				</div>
			</div>
			{/if}
			{if $Calendar_Modules_Panel_Visible && $PANEL_NAME eq 'ModulePanel'}
			<div class="dvtContentSpace" style="border:0;width:100%;">
				<div class="ui-widget-header">
					<div style="font-size:13px;padding:5px" class="ui-widget" onclick="jQuery('#module_type_wrapper').toggle();">{'LIST_MODULES'|@getTranslatedString:$MODULE}</div>
				</div>
				<div style="padding:5px" class="ui-widget-content">
					<div id="module_type_wrapper" style="display:{$upMODULEBLOCK_DISPLAY}">
						{foreach name=act_types2 item=typedata key=typeid from=$MODULETYPES}
						<div id="event_type_{$typeid}" style="font-weight:bold;font-size:12px;width:98%;{if $USER_VIEW_TYPE neq "all"}color:{$typedata.textColor};background-color:{$typedata.color};border: 2px solid {$typedata.title_color}{else}background-color:#ffffff;border: 2px solid #dedede{/if};margin:0px 3px 3px 3px;padding:1px;border-top-left-radius: 3px;border-bottom-left-radius: 3px; border-top-right-radius: 3px; border-bottom-right-radius: 3px;" onMouseOver="showEventIcon('event_type_{$typeid}_icon')" onMouseOut="hideEventIcon('event_type_{$typeid}_icon')">
							<input class="cblds-m-r_small" type="checkbox" id="calendar_event_{$typeid}" name="calendar_event_{$typeid}" onClick="changeCalendarEvents(this)" value="{$typeid}" {if $typedata.checked eq 'T'}checked="checked"{/if}>
							{$typedata.label}
							<span class="cblds-t-align_right" style="float:right;">
							<a id="event_type_{$typeid}_icon" href="javascript:;" style="display:none" onClick="loadITSEventSettings(this,'module','{$typeid}')"><img src="themes/images/activate.gif" border="0"></a>
							</span>
						</div>
						{/foreach}
					</div>
				</div>
			</div>
			{/if}
			{if $PANEL_NAME eq 'AssignedUser'}
			<div class="dvtContentSpace" style="border:0;width:100%;">
				<div class="ui-widget-header">
					<div style="font-size:13px;padding:5px">{$APP.LBL_ASSIGNED_TO}</div>
				</div>
				<div style="padding:5px" class="ui-widget-content">
					<select id="user_view_type" onChange="changeCalendarUserView(this.value);" style="width:100%;padding:2px">
					<option value="all" {if isset($SHOW_ONLY_ME) && $SHOW_ONLY_ME neq "true"}selected{/if}>{$MOD.LBL_ALL_USERS}</option>
					{foreach name=calendar_users item=userdata key=userid from=$CALENDAR_USERS}
					<option value="{$userid}" {if $USER_VIEW_TYPE eq $userid}selected{/if}>{$userdata.fullname} {if $userdata.status eq "Inactive"} ({$APP.Inactive}){/if}</option>
					{/foreach}
					</select><br>
					<div id="users_list" {if $USER_VIEW_TYPE neq "all"}style="display:none"{/if}>
					{foreach name=calendar_users item=userdata key=userid from=$CALENDAR_USERS}
					<div style="font-weight:bold;font-size:12px;width:98%;color:{$userdata.textColor};background-color:{$userdata.color};border: 2px solid {$userdata.title_color};margin:3px;padding:1px;border-top-left-radius: 3px;border-bottom-left-radius: 3px; border-top-right-radius: 3px; border-bottom-right-radius: 3px;" onMouseOver="showEventIcon('event_user_{$userid}_icon')" onMouseOut="hideEventIcon('event_user_{$userid}_icon')">
					<input type="checkbox" id="calendar_user_{$userid}" name="calendar_user_{$userid}" onClick="changeCalendarEvents(this)" value="{$userid}" {if $userdata.checked eq 'true'}checked="checked"{/if}>
					{$userdata.fullname}
					<span class="cblds-t-align_right" style="float:right;">
						<a href="javascript:;" id="event_user_{$userid}_icon" style="display:none"><img src="themes/images/activate.gif" onClick="loadITSEventSettings(this,'user','{$userid}')" border="0"></a>
					</span>
					</div>
					{/foreach}
					</div>
				</div>
			</div>
			{/if}
			{if $Calendar_Status_Panel_Visible && $PANEL_NAME eq 'ActivityStatus'}
			<div class="dvtContentSpace" style="border:0;width:100%;">
				<div class="ui-widget-header">
					<div style="font-size:13px;padding:5px" onclick="jQuery('#et_status_wrapper').toggle();">{$CMOD.Status}</div>
				</div>
				<div style="padding:5px" class="ui-widget-content">
					<div id="et_status_wrapper" style="display:{$upESTATUSBLOCK_DISPLAY}">
						<div id="event_status_list" style="font-size:12px;">
							{foreach name=calendar_event_status item=estatusdata key=estatus_key from=$EVENT_STATUS}
							<div style="font-weight:bold;margin:3px;padding:1px;width:98%;">
								<input type="checkbox" id="calendar_event_status_{$estatusdata.id}" name="calendar_event_status_{$estatusdata.id}" onClick="changeCalendarEvents(this)" value="{$estatusdata.id}" {if $estatusdata.checked eq 'true'}checked="checked"{/if}>
								{$estatusdata.label}
							</div>
							{/foreach}
						</div>
					</div>
				</div>
			</div>
			{/if}
			{if $Calendar_Priority_Panel_Visible && $PANEL_NAME eq 'ActivityPriority'}
			<div class="dvtContentSpace" style="border:0;width:100%;">
				<div align="left" class="ui-widget-header">
					<div style="font-size:13px;padding:5px" onclick="jQuery('#task_priority_list').toggle();">{$CMOD.Priority}</div>
				</div>
				<div style="padding:5px" class="ui-widget-content">
					<div id="task_priority_list" style="font-size:12px;display:{$upTPRIORITYBLOCK_DISPLAY};">
						{foreach name=calendar_task_priority item=tprioritydata key=tpriority_key from=$TASK_PRIORITY}
						<div style="font-weight:bold;font-size:12px;margin:3px;padding:1px;width:98%;">
							<input type="checkbox" id="calendar_task_priority_{$tprioritydata.id}" name="calendar_task_priority_{$tprioritydata.id}" onClick="changeCalendarEvents(this)" value="{$tprioritydata.id}" {if $tprioritydata.checked eq 'true'}checked="checked"{/if}>
							{$tprioritydata.label}
						</div>
						{/foreach}
					</div>
				</div>
			</div>
			{/if}
			<br/>
			{/foreach}
		</div>
		<div style="padding:0px 10px 0px 10px;float:right;">
			<div id="calendar_div" onMouseOver="hideITSEventInfo();"><br></div>
		</div>
	</div>
</div>
<div id="calendar_div2"><br></div>
<input type="hidden" name="logged_user" id="logged_user" value="">
<form id="EditView" name="EditView" method="POST" action="index.php">
	<input type="hidden" name="action" value="SaveEvent">
	<input type="hidden" name="module" value="Calendar4You">
	<input type="hidden" name="return_action" value="index">
	<input type="hidden" name="return_module" value="Calendar4You">
	<input type="hidden" name="record" value="">
	<input type="hidden" name="mode" value="">
	<input type="hidden" name="geventid" value="">
	<input type="hidden" name="gevent_type" value="">
	<input type="hidden" name="gevent_userid" value="">
</form>
<script>
function changeCalendarUserView(type) {ldelim}
	if (type == 'all') {ldelim}
		{foreach name=act_types2 item=typedata key=typeid from=$ACTIVITYTYPES}
			jQuery('#event_type_{$typeid}').css('color', '#000000');
			jQuery('#event_type_{$typeid}').css('background-color', '#ffffff');
			jQuery('#event_type_{$typeid}').css('border', '2px solid #dedede');
		{/foreach}
		{foreach name=act_types2 item=typedata key=typeid from=$MODULETYPES}
			jQuery('#event_type_{$typeid}').css('color', '#000000');
			jQuery('#event_type_{$typeid}').css('background-color', '#ffffff');
			jQuery('#event_type_{$typeid}').css('border', '2px solid #dedede');
		{/foreach}
		jQuery('#users_list').css('display', 'block');
	{rdelim} else {ldelim}
		{foreach name=act_types2 item=typedata key=typeid from=$ACTIVITYTYPES}
			jQuery('#event_type_{$typeid}').css('color', '{$typedata.textColor}');
			jQuery('#event_type_{$typeid}').css('background-color', '{$typedata.color}');
			jQuery('#event_type_{$typeid}').css('border', '2px solid {$typedata.title_color}');
		{/foreach}
		{foreach name=act_types2 item=typedata key=typeid from=$MODULETYPES}
			jQuery('#event_type_{$typeid}').css('color', '{$typedata.textColor}');
			jQuery('#event_type_{$typeid}').css('background-color', '{$typedata.color}');
			jQuery('#event_type_{$typeid}').css('border', '2px solid {$typedata.title_color}');
		{/foreach}
		jQuery('#users_list').css('display', 'none');
	{rdelim}
	jQuery('#calendar_div').fullCalendar('refetchEvents');
{rdelim}
</script>