<?php
/*+***********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 *************************************************************************************/

class VtigerCRMObjectMeta extends EntityMeta {

	private $tabId;
	private $meta;
	private $assign;
	private $hasAccess;
	private $hasCreateAccess;
	private $hasReadAccess;
	private $hasWriteAccess;
	private $hasDeleteAccess;
	private $assignUsers;
	public $idColumn;
	public $baseTable;
	public $allDisplayTypes = false;

	public function __construct($webserviceObject, $user) {
		parent::__construct($webserviceObject, $user);
		$this->allDisplayTypes = $webserviceObject->allDisplayTypes;
		$this->columnTableMapping = null;
		$this->fieldColumnMapping = null;
		$this->userAccessibleColumns = null;
		$this->mandatoryFields = null;
		$this->emailFields = null;
		$this->referenceFieldDetails = null;
		$this->ownerFields = null;
		$this->moduleFields = array();
		$this->hasAccess = false;
		$this->hasCreateAccess = false;
		$this->hasReadAccess = false;
		$this->hasWriteAccess = false;
		$this->hasDeleteAccess = false;
		$instance = vtws_getModuleInstance($this->webserviceObject);
		$this->idColumn = $instance->tab_name_index[$instance->table_name];
		$this->baseTable = $instance->table_name;
		$this->tableList = $instance->tab_name;
		$this->tableIndexList = $instance->tab_name_index;
		if (in_array('vtiger_crmentity', $instance->tab_name)) {
			$this->defaultTableList = array('vtiger_crmentity');
		} else {
			$this->defaultTableList = array();
		}
		$this->tabId = null;
	}

	/**
	 * returns tabid of the current object.
	 * @return Integer
	 */
	public function getTabId() {
		if ($this->tabId == null) {
			$this->tabId = getTabid($this->objectName);
		}
		return $this->tabId;
	}

	/**
	 * returns tabid that can be consumed for database lookup
	 * @return Integer
	 */
	public function getEffectiveTabId() {
		return getTabid($this->getTabName());
	}

	public function getTabName() {
		return $this->objectName;
	}

	private function computeAccess() {
		global $adb;
		$active = vtlib_isModuleActive($this->getTabName());
		if (!$active) {
			$this->hasAccess = false;
			$this->hasCreateAccess = false;
			$this->hasReadAccess = false;
			$this->hasWriteAccess = false;
			$this->hasDeleteAccess = false;
			return;
		}

		$userprivs = $this->user->getPrivileges();
		if ($userprivs->hasGlobalReadPermission()) {
			$this->hasAccess = true;
			$this->hasCreateAccess = true;
			$this->hasReadAccess = true;
			$this->hasWriteAccess = true;
			$this->hasDeleteAccess = true;
		} else {
			$profileList = getCurrentUserProfileList();

			$sql = 'select * from vtiger_profile2globalpermissions where profileid in ('.generateQuestionMarks($profileList).');';
			$result = $adb->pquery($sql, array($profileList));

			$noofrows = $adb->num_rows($result);
			//globalactionid=1 is view all action.
			//globalactionid=2 is edit all action.
			for ($i=0; $i<$noofrows; $i++) {
				$permission = $adb->query_result($result, $i, 'globalactionpermission');
				$globalactionid = $adb->query_result($result, $i, 'globalactionid');
				if ($permission != 1 || $permission != '1') {
					$this->hasAccess = true;
					if ($globalactionid == 2 || $globalactionid == '2') {
						$this->hasCreateAccess = true;
						$this->hasWriteAccess = true;
						$this->hasDeleteAccess = true;
					} else {
						$this->hasReadAccess = true;
					}
				}
			}

			$sql = 'select 1 from vtiger_profile2tab where profileid in ('.generateQuestionMarks($profileList).') and tabid = ? and permissions=0 limit 1';
			$result = $adb->pquery($sql, array($profileList,$this->getTabId()));
			$standardDefined = false;
			if ($result && $adb->num_rows($result) == 1) {
				$this->hasAccess = true;
			} else {
				$this->hasAccess = false;
				return;
			}

			//operation=0 is save
			//operation=1 is edit
			//operation=2 is delete
			//operation=3 index or popup. //ignored for webservices
			//operation=4 is view
			//operation=7 is create
			$sql = 'select * from vtiger_profile2standardpermissions where profileid in ('.generateQuestionMarks($profileList).') and tabid=?';
			$result = $adb->pquery($sql, array($profileList,$this->getTabId()));

			$noofrows = $adb->num_rows($result);
			for ($i=0; $i<$noofrows; $i++) {
				$standardDefined = true;
				$permission = $adb->query_result($result, $i, 'permissions');
				$operation = $adb->query_result($result, $i, 'operation');

				if ($permission != 1 || $permission != '1') {
					$this->hasAccess = true;
					if ($operation == 0 || $operation == '0') {
						$this->hasWriteAccess = true;
					} elseif ($operation == 1 || $operation == '1') {
						$this->hasWriteAccess = true;
					} elseif ($operation == 2 || $operation == '2') {
						$this->hasDeleteAccess = true;
					} elseif ($operation == 4 || $operation == '4') {
						$this->hasReadAccess = true;
					} elseif ($operation == 7 || $operation == '7') {
						$this->hasCreateAccess = true;
					}
				}
			}
			if (!$standardDefined) {
				$this->hasCreateAccess = true;
				$this->hasReadAccess = true;
				$this->hasWriteAccess = true;
				$this->hasDeleteAccess = true;
			}
		}
	}

	public function hasAccess() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return $this->hasAccess;
	}

	public function hasCreateAccess() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return $this->hasCreateAccess;
	}

	public function hasWriteAccess() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return $this->hasWriteAccess;
	}

	public function hasReadAccess() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return $this->hasReadAccess;
	}

	public function hasDeleteAccess() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return $this->hasDeleteAccess;
	}

	public function hasPermission($operation, $webserviceId) {
		if (empty($webserviceId)) {
			$id = '';
		} else {
			if (strpos($webserviceId, 'x')>0) {
				$idComponents = vtws_getIdComponents($webserviceId);
				$id = $idComponents[1];
			} else {
				$id = $webserviceId;
			}
		}
		$permitted = isPermitted($this->getTabName(), $operation, $id);
		return strcmp($permitted, 'yes')===0;
	}

	public function hasAssignPrivilege($webserviceId) {
		global $adb;

		// administrator's have assign privilege
		if (is_admin($this->user)) {
			return true;
		}

		$idComponents = vtws_getIdComponents($webserviceId);
		$userId=$idComponents[1];
		$ownerTypeId = $idComponents[0];

		if ($userId == null || $userId =='' || $ownerTypeId == null || $ownerTypeId =='') {
			return false;
		}
		$webserviceObject = VtigerWebserviceObject::fromId($adb, $ownerTypeId);
		if (strcasecmp($webserviceObject->getEntityName(), 'Users')===0) {
			if ($userId == $this->user->id) {
				return true;
			}
			if (!$this->assign) {
				$this->retrieveUserHierarchy();
			}
			return in_array($userId, array_keys($this->assignUsers));
		} elseif (strcasecmp($webserviceObject->getEntityName(), 'Groups') === 0) {
			$groups = vtws_getUserAccessibleGroups($this->getTabId(), $this->user);
			foreach ($groups as $group) {
				if ($group['id'] == $userId) {
					return true;
				}
			}
			return false;
		}
	}

	public function getUserAccessibleColumns() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return parent::getUserAccessibleColumns();
	}

	public function getModuleFields() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return parent::getModuleFields();
	}

	public function getColumnTableMapping() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return parent::getColumnTableMapping();
	}

	public function getFieldColumnMapping() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		if ($this->fieldColumnMapping === null) {
			$this->fieldColumnMapping = array();
			foreach ($this->moduleFields as $fieldName => $webserviceField) {
				$this->fieldColumnMapping[$fieldName] = $webserviceField->getColumnName();
			}
			$this->fieldColumnMapping['id'] = $this->idColumn;
		}

		return $this->fieldColumnMapping;
	}

	public function getMandatoryFields() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return parent::getMandatoryFields();
	}

	public function getReferenceFieldDetails() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return parent::getReferenceFieldDetails();
	}

	public function getOwnerFields() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return parent::getOwnerFields();
	}

	public function getEntityName() {
		return $this->getTabName();
	}

	public function getEntityId() {
		return $this->objectId;
	}

	public function getEmailFields() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return parent::getEmailFields();
	}

	public function getImageFields() {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		return parent::getImageFields();
	}

	public function getFieldIdFromFieldName($fieldName) {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		if (isset($this->moduleFields[$fieldName])) {
			$webserviceField = $this->moduleFields[$fieldName];
			return $webserviceField->getFieldId();
		}
		return null;
	}

	public function getFieldUItypeFromFieldName($fieldName) {
		if (!$this->meta) {
			$this->retrieveMeta();
		}
		if (isset($this->moduleFields[$fieldName])) {
			$webserviceField = $this->moduleFields[$fieldName];
			return $webserviceField->getUIType();
		}
		return null;
	}

	public function retrieveMeta() {
		require_once 'modules/CustomView/CustomView.php';
		vtws_preserveGlobal('current_user', $this->user);
		vtws_preserveGlobal('theme', $this->user->theme);
		$default_language = VTWS_PreserveGlobal::getGlobal('default_language');
		global $current_language;
		if (empty($current_language)) {
			$current_language = $default_language;
		}
		$current_language = vtws_preserveGlobal('current_language', $current_language);
		$this->computeAccess();
		$cv = new CustomView();
		$cv->getCustomViewModuleInfo($this->getTabName(), $this->allDisplayTypes);
		$blockArray = array();
		foreach ($cv->module_list[$this->getTabName()] as $blockList) {
			$blockArray = array_merge($blockArray, explode(',', $blockList));
		}
		$this->retrieveMetaForBlock($blockArray);
		$this->meta = true;
		VTWS_PreserveGlobal::restore('current_user');
		VTWS_PreserveGlobal::restore('theme');
		VTWS_PreserveGlobal::restore('current_language');
	}

	private function retrieveUserHierarchy() {
		$heirarchyUsers = get_user_array(false, 'ACTIVE', $this->user->id);
		$groupUsers = vtws_getUsersInTheSameGroup($this->user->id);
		$this->assignUsers = $heirarchyUsers+$groupUsers;
		$this->assign = true;
	}

	private function retrieveMetaForBlock($block) {
		global $adb;
		$tabid = $this->getTabId();
		$condition = 'vtiger_field.fieldid IN (select min(vtiger_field.fieldid) from vtiger_field where vtiger_field.tabid=? GROUP BY vtiger_field.columnname)';
		$userprivs = $this->user->getPrivileges();
		if ($userprivs->hasGlobalReadPermission() || $this->objectName == 'Users') {
			$sql = "SELECT vtiger_field.*, '0' as readonly, vtiger_blocks.sequence as blkseq
				FROM vtiger_field
				LEFT JOIN vtiger_blocks ON vtiger_field.block=vtiger_blocks.blockid
				WHERE ".$condition.' and block in ('.generateQuestionMarks($block).') and displaytype in (1,2,3,4)
				ORDER BY vtiger_blocks.sequence ASC, vtiger_field.sequence ASC';
			$params = array_merge([$tabid], $block);
		} else {
			$profileList = getCurrentUserProfileList();
			if (count($profileList) > 0) {
				$sql = 'SELECT distinct vtiger_field.*, vtiger_profile2field.readonly, vtiger_blocks.sequence as blkseq, vtiger_profile2field.summary
					FROM vtiger_field
					LEFT JOIN vtiger_blocks ON vtiger_field.block=vtiger_blocks.blockid
					INNER JOIN vtiger_profile2field ON vtiger_profile2field.fieldid = vtiger_field.fieldid
					INNER JOIN vtiger_def_org_field ON vtiger_def_org_field.fieldid = vtiger_field.fieldid
					WHERE '.$condition.' AND vtiger_profile2field.visible = 0
						AND vtiger_profile2field.profileid IN ('. generateQuestionMarks($profileList) .')
						AND vtiger_def_org_field.visible = 0 and vtiger_field.block in ('.generateQuestionMarks($block).') and vtiger_field.displaytype in (1,2,3,4)
						AND vtiger_field.presence in (0,2) ORDER BY vtiger_blocks.sequence ASC, vtiger_field.sequence ASC';
				$params = array_merge([$tabid], $profileList, $block);
			} else {
				$sql = 'SELECT distinct vtiger_field.*, vtiger_profile2field.readonly, vtiger_blocks.sequence as blkseq, vtiger_profile2field.summary
					FROM vtiger_field
					LEFT JOIN vtiger_blocks ON vtiger_field.block=vtiger_blocks.blockid
					INNER JOIN vtiger_profile2field ON vtiger_profile2field.fieldid = vtiger_field.fieldid
					INNER JOIN vtiger_def_org_field ON vtiger_def_org_field.fieldid = vtiger_field.fieldid
					WHERE '.$condition.' AND vtiger_profile2field.visible = 0
						AND vtiger_def_org_field.visible = 0 and vtiger_field.block in ('.generateQuestionMarks($block).') and vtiger_field.displaytype in (1,2,3,4)
						AND vtiger_field.presence in (0,2) ORDER BY vtiger_blocks.sequence ASC, vtiger_field.sequence ASC';
				$params = array_merge([$tabid], $block);
			}
		}

		$result = $adb->pquery($sql, $params);
		$noofrows = $adb->num_rows($result);
		for ($i=0; $i<$noofrows; $i++) {
			$webserviceField = WebserviceField::fromQueryResult($adb, $result, $i);
			$this->moduleFields[$webserviceField->getFieldName()] = $webserviceField;
		}
	}

	public function getObjectEntityName($webserviceId) {
		return $this->getObjectEntityNameWithDelete($webserviceId, 0);
	}

	public function getObjectEntityNameDeleted($webserviceId) {
		return $this->getObjectEntityNameWithDelete($webserviceId, 1);
	}

	public function getObjectEntityNameWithDelete($webserviceId, $deleted) {
		global $adb;

		$idComponents = vtws_getIdComponents($webserviceId);
		$id=$idComponents[1];

		$seType = null;
		if ($this->objectName == 'Users') {
			$result = $adb->pquery('select user_name from vtiger_users where id=? and deleted=?', array($id,$deleted));
			if ($result != null && isset($result) && $adb->num_rows($result)>0) {
				$seType = 'Users';
			}
		} else {
			$result = $adb->pquery('select setype from vtiger_crmobject where crmid=? and deleted=?', array($id, $deleted));
			if ($result && $adb->num_rows($result)>0) {
				$seType = $adb->query_result($result, 0, 'setype');
			}
		}
		return $seType;
	}

	public function exists($recordId) {
		global $adb;

		// Caching user existence value for optimizing repeated reads.
		// NOTE: We are not caching the record existence to ensure only latest state from DB is sent.
		static $user_exists_cache = array();

		$exists = false;
		$sql = '';
		if ($this->objectName == 'Users') {
			if (isset($user_exists_cache[$recordId])) {
				$exists = $user_exists_cache[$recordId];
			} else {
				$sql = "select 1 from vtiger_users where id=? and deleted=0 and status='Active'";
			}
		} else {
			$module = $this->getTabName();
			$mod = CRMEntity::getInstance($module);
			$sql = 'select 1 from '.$mod->crmentityTable." where crmid=? and deleted=0 and setype='".$this->getTabName()."'";
		}

		if ($sql) {
			$result = $adb->pquery($sql, array($recordId));
			if ($result && $adb->num_rows($result)>0) {
				$exists = true;
			}
			// Cache the value for further lookup.
			if ($this->objectName == 'Users') {
				$user_exists_cache[$recordId] = $exists;
			}
		}

		return $exists;
	}

	public function getNameFields() {
		global $adb;
		$tabid = $this->getEffectiveTabId();
		$result = $adb->pquery('select fieldname from vtiger_entityname where tabid=?', array($tabid));
		$fieldNames = array();
		if ($result && $adb->num_rows($result) > 0) {
			$labelFields = $adb->query_result($result, 0, 'fieldname');
			$lfields = explode(',', $labelFields);
			foreach ($lfields as $key => $columnname) {
				$fieldinfo = VTCacheUtils::lookupFieldInfoByColumn($tabid, $columnname);
				if ($fieldinfo === false) {
					getColumnFields($this->getTabName());
					$fieldinfo = VTCacheUtils::lookupFieldInfoByColumn($tabid, $columnname);
				}
				$lfields[$key] = $fieldinfo['fieldname'];
			}
			$fieldNames = $lfields;
		}
		return implode(',', $fieldNames);
	}

	public function getName($webserviceId) {
		$idComponents = vtws_getIdComponents($webserviceId);
		$id=$idComponents[1];
		$nameList = getEntityName($this->getTabName(), array($id));
		return $nameList[$id];
	}

	public function getEntityAccessControlQuery() {
		$accessControlQuery = '';
		$instance = vtws_getModuleInstance($this->webserviceObject);
		if ($this->getTabName() != 'Users') {
			$accessControlQuery = $instance->getNonAdminAccessControlQuery($this->getTabName(), $this->user);
		}
		return $accessControlQuery;
	}

	public function getJoinClause($tableName) {
		$instance = vtws_getModuleInstance($this->webserviceObject);
		return $instance->getJoinClause($tableName);
	}

	public function isModuleEntity() {
		return true;
	}
}
?>
