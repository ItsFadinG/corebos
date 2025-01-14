<?php
/*********************************************************************************
 * The content of this file is subject to the Calendar4You Free license.
 * ("License"); You may not use this file except in compliance with the License
 * The Initial Developer of the Original Code is IT-Solutions4You s.r.o.
 * Portions created by IT-Solutions4You s.r.o. are Copyright(C) IT-Solutions4You s.r.o.
 * All Rights Reserved.
 ********************************************************************************/

class GoogleSync4You {

	private $user_id = '';
	private $user_clientsecret = '';
	private $apikey;
	private $keyfile;
	private $clientid;
	private $refresh_token;
	private $googleinsert;
	public $root_directory = '';
	public $status = '';
	public $is_logged = false;
	public $event = '';
	public $selected_calendar = '';
	private $service='GoogleCalendar';

	public function __construct() {
		global $root_directory;
		$this->db = PearDatabase::getInstance();
		$this->root_directory = $root_directory;
	}

	public function getclientsecret() {
		global $adb;
		$q=$adb->query("select google_login from its4you_googlesync4you_access where userid=1 and service='$this->service'");
		if ($adb->num_rows($q)!=0 && $adb->query_result($q, 0, 'google_login')) {
			return $adb->query_result($q, 0, 'google_login');
		} else {
			return $this->user_clientsecret;
		}
	}

	public function getAPI() {
		global $adb;
		$q=$adb->query("select google_apikey from its4you_googlesync4you_access where userid=1 and service='$this->service'");
		if ($adb->num_rows($q)!=0 && $adb->query_result($q, 0, 'google_apikey')) {
			return $adb->query_result($q, 0, 'google_apikey');
		} else {
			return $this->apikey;
		}
	}
	public function getclientid() {
		global $adb;
		$q=$adb->query("select google_clientid from its4you_googlesync4you_access where userid=1 and service='$this->service'");
		if ($adb->num_rows($q)!=0 && $adb->query_result($q, 0, 'google_clientid')) {
			return $adb->query_result($q, 0, 'google_clientid');
		} else {
			return $this->clientid;
		}
	}
	public function getrefreshtoken() {
		return $this->refresh_token;
	}
	public function getgoogleinsert() {
		return $this->googleinsert;
	}
	public function getkeyfile() {
		global $adb;
		$q=$adb->query("select google_keyfile from its4you_googlesync4you_access where userid=1 and service='$this->service'");
		if ($adb->num_rows($q)!=0 && $adb->query_result($q, 0, 'google_keyfile')) {
			return $adb->query_result($q, 0, 'google_keyfile');
		} else {
			return $this->keyfile;
		}
	}
	public function getStatus() {
		return $this->status;
	}

	public function isLogged() {
		return $this->is_logged;
	}

	public function setAccessDataForUser($userid, $only_active = false) {
		$sql = "SELECT gad.google_login ,gad.google_apikey, gad.google_keyfile, gad.google_clientid,gad.refresh_token,googleinsert
			FROM vtiger_users
			INNER JOIN its4you_googlesync4you_access AS gad ON gad.userid = vtiger_users.id
			WHERE vtiger_users.id=? AND gad.google_login != '' and gad.google_apikey != '' and gad.google_keyfile != '' and gad.google_clientid != '' and gad.service=?";

		if ($only_active) {
			$sql .= " AND vtiger_users.status = 'Active'";
		}

		$result = $this->db->pquery($sql, array($userid,$this->service));
		$num_rows = $this->db->num_rows($result);
		if ($num_rows == 1) {
			$this->user_id = $userid;
			$this->user_clientsecret = $this->db->query_result($result, 0, 'google_login');
			$this->apikey = $this->db->query_result($result, 0, 'google_apikey');
			$this->clientid = $this->db->query_result($result, 0, 'google_clientid');
			$this->keyfile = $this->db->query_result($result, 0, 'google_keyfile');
			$this->refresh_token = $this->db->query_result($result, 0, 'refresh_token');
			$this->googleinsert = $this->db->query_result($result, 0, 'googleinsert');
			return true;
		}
		return false;
	}

	public function setAccessData($userid, $login, $apikey, $keyfile, $clientid, $refresh, $googleinsert) {
		$this->user_id = $userid;
		$this->user_clientsecret = $login;
		$this->apikey = $apikey;
		$this->clientid = $clientid;
		$this->keyfile = $keyfile;
		$this->refresh_token = $refresh;
		$this->googleinsert = $googleinsert;
	}

	public function getAuthURL($force = false) {
		set_include_path($this->root_directory.'modules/Calendar4You/');
		require_once 'vendor/autoload.php';
		$CLIENT_ID = $this->clientid;
		$KEY_FILE = $this->keyfile;
		$client = new Google_Client();
		$client->setApplicationName('corebos');
		$client->setClientSecret($this->user_clientsecret);
		$client->setRedirectUri($KEY_FILE);
		$client->setClientId($CLIENT_ID);
		$client->setDeveloperKey($this->apikey);
		$client->setAccessType('offline');
		$client->setScopes(array('https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/calendar.readonly'));
		$authUrl = $client->createAuthUrl();
		if ($force) {
			$authUrl = str_replace('approval_prompt=auto', 'approval_prompt=force', $authUrl);
		}
		return $authUrl;
	}

	public function connectToGoogle() {
		$this->connectToGoogleViaAPI3();
	}

	//new method for API v.3
	private function connectToGoogleViaAPI3() {
		set_include_path($this->root_directory. 'modules/Calendar4You/');
		require_once 'vendor/autoload.php';
		if ($this->user_clientsecret != '' && $this->apikey != '' && $this->clientid!='' && $this->keyfile!='') {
			try {
				$CLIENT_ID = $this->clientid;
				$KEY_FILE = $this->keyfile;
				$client = new Google_Client();
				$client->setApplicationName('corebos');
				$client->setClientSecret($this->user_clientsecret);
				$client->setRedirectUri($KEY_FILE);
				$client->setClientId($CLIENT_ID);
				$client->setDeveloperKey($this->apikey);
				$client->setAccessType('offline');
				$client->setScopes(array('https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/calendar.readonly'));
				$token=coreBOS_Session::get('token');
				if (isset($token) && $token!='') {
					$client->setAccessToken($token);
					$reftoken=$client->getRefreshToken();
					$this->db->pquery(
						"update its4you_googlesync4you_access set refresh_token=? where (refresh_token='' or refresh_token is null) and service=?",
						array($reftoken,$this->service)
					);
				} elseif ($client->isAccessTokenExpired()) {
					$reftoken=$this->refresh_token;
					try {
						$ref=$client->refreshToken($reftoken);
						if ($ref['error']==null) {
							coreBOS_Session::set('token', $client->getAccessToken());
						} else {
							$authUrl = $client->createAuthUrl();
							$this->status='No refresh token';
							echo "<a class='login' href='$authUrl'>".getTranslatedString('LBL_CONNECT', 'Calendar4You').'</a><br>';
						}
					} catch (Exception $e) {
						$this->status =$e->getMessage();
						$authUrl = $client->createAuthUrl();
						echo "<a class='login' href='$authUrl'>".getTranslatedString('LBL_CONNECT', 'Calendar4You').'</a><br>';
					}
				}
				if ($client->getAccessToken()) {
					$this->gService =  new Google_Service_Calendar($client);
					//a fast way to check if the login parameters work
					$colors = $this->gService->colors->get();
					$this->is_logged = true;
				}
			} catch (Exception $e) {
				$this->status = $e->getMessage();
				$authUrl = $client->createAuthUrl();
				echo "<a class='login' href='$authUrl'>".getTranslatedString('LBL_CONNECT', 'Calendar4You').'</a><br>';
			}
		} else {
			$this->status = getTranslatedString('LBL_MISSING_AUTH_DATA', 'Calendar4You');
		}

		if ($this->is_logged) {
			try {
				$feed=$this->gService->calendarList->listCalendarList();
				$this->gListFeed =$feed;
			} catch (Exception $e) {
				$this->gListFeed = array();
			}
		}
		set_include_path($this->root_directory);
	}
	public function getGoogleCalendars() {
		return $this->gListFeed;
	}

	public function setEvent($evnt, $load_user_calendar = true) {
		$this->event = $evnt;
		if ($load_user_calendar) {
			$this->loadUserCalendar();
		}
	}

	//$type: 1 = export, 2 = import
	public function isDisabled($type = 1) {
		$result = $this->db->pquery(
			'SELECT type FROM `its4you_googlesync4you_dis` WHERE `userid`=? AND `event`=? AND `type` =?',
			array($this->user_id, $this->event, $type)
		);
		return ($this->db->num_rows($result) == 1);
	}

	public function loadUserCalendar() {
		$result = $this->db->pquery(
			'SELECT calendar FROM `its4you_googlesync4you_calendar` WHERE `userid`=? AND `event`=? AND `type`=?',
			array($this->user_id, $this->event, '1')
		);
		if ($this->db->num_rows($result) == 1) {
			$this->selected_calendar = $this->db->query_result($result, 0, 'calendar');
		}
	}

	public function getSCalendar($type) {
		if ($type == '1') {
			return $this->selected_calendar;
		}
	}

	public function getEvent($eventURL) {
		set_include_path($this->root_directory. 'modules/Calendar4You/');
		try {
			$eventEntry = $this->gService->events->get($this->selected_calendar, $eventURL);
		} catch (Exception $e) {
			$eventEntry = false;
		}
		set_include_path($this->root_directory);
		return $eventEntry;
	}

	public function addEvent($recordid, $Data, $tzOffset) {
		set_include_path($this->root_directory. 'modules/Calendar4You/');
		$startDate = $Data['date_start'];
		$endDate = $Data['due_date'];
		global $default_timezone;
		$startTime = $Data['time_start'];
		$endTime = $Data['time_end'];
		$evnt = new Google_Service_Calendar_Event();
		$evnt->setSummary(decode_html(utf8_decode(trim($Data['subject']))));
		$evnt->setDescription(decode_html(utf8_decode($Data['description'])));
		$evnt->setLocation(decode_html(utf8_decode(trim($Data['location']))));
		$start = new Google_Service_Calendar_EventDateTime();
		if (strlen($startTime) == 5) {
			$start->setDateTime($startDate.'T'.$startTime.':00.000');
		} elseif (strlen($startTime)==8) {
			$start->setDateTime($startDate.'T'.$startTime.'.000');
		} else {
			$start->setDateTime($startDate.'T'.$startTime.':00:00.000');
		}
		$start->setTimeZone("$default_timezone");
		$evnt->setStart($start);
		$end = new Google_Service_Calendar_EventDateTime();
		if (strlen($endTime) == 5) {
			$end->setDateTime($endDate.'T'.$endTime.':00.000');
		} elseif (strlen($endTime) == 8) {
			$end->setDateTime($endDate.'T'.$endTime.'.000');
		} else {
			$end->setDateTime($endDate.'T'.$endTime.':00:00.000');
		}
		$end->setTimeZone("$default_timezone");
		$evnt->setEnd($end);
		$SendEventNotifications = new Google_Service_Calendar_EventReminders();
		$evnt->setReminders($SendEventNotifications);
		$whos = $this->getInvitedUsersEmails($evnt, $recordid);
		if (count($whos) > 0) {
			$evnt->attendees=$whos;
		}
		try {
			$createdEvent = $this->gService->events->insert($this->selected_calendar, $evnt);
			$eventid = urldecode($createdEvent->getId());
		} catch (Exception $e) {
			// ignore it
		}
		set_include_path($this->root_directory);
		return $eventid;
	}

	public function updateEvent($recordid, $eventOld, $Data, $tzOffset = '+00:00') {
		set_include_path($this->root_directory. 'modules/Calendar4You/');
		$startDate = $Data['date_start'];
		$endDate = $Data['due_date'];
		global $default_timezone;
		$startTime = $Data['time_start'];
		$endTime = $Data['time_end'];
		try {
			$evnt = $this->gService->events->get($this->selected_calendar, $eventOld);
			$evnt->setSummary(decode_html(utf8_decode(trim($Data['subject']))));
			$evnt->setDescription(decode_html(utf8_decode($Data['description'])));
			$evnt->setLocation(decode_html(utf8_decode(trim($Data['location']))));
			$start = new Google_Service_Calendar_EventDateTime();
			if (strlen($startTime) == 5) {
				$start->setDateTime($startDate.'T'.$startTime.':00.000');
			} elseif (strlen($startTime)==8) {
				$start->setDateTime($startDate.'T'.$startTime.'.000');
			} else {
				$start->setDateTime($startDate.'T'.$startTime.':00:00.000');
			}
			$start->setTimeZone("$default_timezone");
			$evnt->setStart($start);
			$end = new Google_Service_Calendar_EventDateTime();
			if (strlen($endTime) == 5) {
				$end->setDateTime($endDate.'T'.$endTime.':00.000');
			} elseif (strlen($endTime) == 8) {
				$end->setDateTime($endDate.'T'.$endTime.'.000');
			} else {
				$end->setDateTime($endDate.'T'.$endTime.':00:00.000');
			}
			$end->setTimeZone("$default_timezone");
			$evnt->setEnd($end);
			$SendEventNotifications = new Google_Service_Calendar_EventReminders();
			$evnt->setReminders($SendEventNotifications);
			$whos = $this->getInvitedUsersEmails($evnt, $recordid);
			if (count($whos) > 0) {
				$evnt->attendees=$whos;
			}
			try {
				$this->gService->events->update($this->selected_calendar, $eventOld, $evnt);
				$stat = true;
			} catch (Exception $e) {
				$stat = null;
			}
		} catch (Exception $e) {
			$stat=null;
		}
		set_include_path($this->root_directory);
		return $stat;
	}

	public function deleteEvent($recordid, $eventURL) {
		$this->getEvent($eventURL);
		set_include_path($this->root_directory. 'modules/Calendar4You/');
		try {
			$this->gService->events->delete($this->selected_calendar, $eventURL);
		} catch (Exception $e) {
			echo $e->getMessage();
		}
		set_include_path($this->root_directory);
	}

	private function getInvitedUsersEmails($GCalClass, $recordid) {
		$whos = array();
		$sql = 'select vtiger_users.email1, inviteeid from vtiger_invitees left join vtiger_users on vtiger_invitees.inviteeid=vtiger_users.id where activityid=?';
		$result = $this->db->pquery($sql, array($recordid));
		$num_rows=$this->db->num_rows($result);
		if ($num_rows > 0) {
			for ($i=0; $i<$num_rows; $i++) {
				$googleEmail=$this->db->query_result($result, $i, 'email1');
				$who  = new Google_Service_Calendar_EventAttendee();
				$who->setEmail($googleEmail);
				$whos[] = $who;
			}
		}
		return $whos;
	}

	private function removeLastColon($text) {
		return substr($text, 0, -3);
	}

	public function saveEvent($recordid, $evnt, $Data) {
		if ($this->is_logged) {
			$serv=$this->getRecordsGEvent($recordid, $evnt);
			if ($serv->getSummary()!=null && $serv->getSummary()!='' && $this->getGEventId($recordid, $evnt)!='') {
				$oldEvent = $this->getGEventId($recordid, $evnt);
				if (!isset($Data['time_end'])) {
					$Data['time_end'] = $Data['time_start'];
				}
				$eventid = $this->updateEvent($recordid, $oldEvent, $Data, date('P'));
			} else {
				$eventid = $this->addEvent($recordid, $Data, date('P'));
				$this->insertIntoEvents($recordid, $eventid, $evnt);
			}
		}
	}

	public function getGEventId($recordid, $evnt) {
		$geventid = '';
		$sql = 'SELECT geventid FROM its4you_googlesync4you_events WHERE crmid = ? AND userid = ? AND eventtype = ?';
		$result = $this->db->pquery($sql, array($recordid, $this->user_id, $evnt));
		if ($this->db->num_rows($result) > 0) {
			$geventid = $this->db->query_result($result, 0, 'geventid');
		}
		return $geventid;
	}

	public function getRecordsGEvent($recordid, $evnt) {
		$geventid = $this->getGEventId($recordid, $evnt);
		return $this->getEvent($geventid);
	}

	public function insertIntoEvents($recordid, $geventid, $evnt) {
		$p = array($recordid, $geventid, $this->user_id, $evnt);
		$sql1 = 'SELECT crmid FROM its4you_googlesync4you_events WHERE crmid = ? AND geventid = ? AND userid = ? AND eventtype = ? limit 1';
		$result1 = $this->db->pquery($sql1, $p);
		$num_rows1 = $this->db->num_rows($result1);
		if ($num_rows1 == 0) {
			$this->db->pquery('INSERT INTO its4you_googlesync4you_events (crmid,geventid,userid,eventtype) VALUES (?,?,?,?)', $p);
		}
	}

	public function getGoogleCalEvents($CALENDAR_ID, $synctoken, $pagetoken = null) {
		set_include_path($this->root_directory. 'modules/Calendar4You/');
		try {
			if ($synctoken!='') {
				if ($pagetoken=='' && $pagetoken==null) {
					$optParams1 = array('syncToken' => "$synctoken",'singleEvents'=>true);
				} else {
					$optParams1 = array('pageToken' => $pagetoken,'syncToken' => "$synctoken",'singleEvents'=>true);
				}
				$events = $this->gService->events->listEvents($CALENDAR_ID, $optParams1);
			} else {
				if ($pagetoken=='' && $pagetoken==null) {
					$optParams1 = array('singleEvents'=>true);
					$events = $this->gService->events->listEvents($CALENDAR_ID, $optParams1);
				} else {
					$optParams1 = array('pageToken' => $pagetoken,'singleEvents'=>true);
					$events = $this->gService->events->listEvents($CALENDAR_ID, $optParams1);
				}
			}
		} catch (Exception $e) {
			if (strstr($e, 'Sync token is no longer valid, a full sync is required')) {
				try {
					$optParams1 = array('singleEvents'=>true);
					$events = $this->gService->events->listEvents($CALENDAR_ID, $optParams1);
				} catch (Exception $e) {
					echo $e->getMessage();
				}
			}
		}
		return $events;
	}

	public function getGoogleCalEvent($event_id) {
		set_include_path($this->root_directory. 'modules/Calendar4You/');
		try {
			$evnt = $this->gService->events->get($this->selected_calendar, $event_id);
		} catch (Exception $e) {
			$evnt = false;
		}
		set_include_path($this->root_directory);
		return $evnt;
	}

	public function getGoogleCalEventfromcron($event_id, $cal) {
		set_include_path($this->root_directory. 'modules/Calendar4You/');
		try {
			$evnt = $this->gService->events->get($cal, $event_id);
		} catch (Exception $e) {
			echo 'Caught exception: ',  $e->getMessage(), "\n";
			$evnt = false;
		}
		set_include_path($this->root_directory);
		return $evnt;
	}
}
