export const PROPERTIES_HEADER_ID = 'assay-properties-hdr';
export const FORM_ID_PREFIX = 'assay-design-';
export const SCRIPTS_DIR = '@scripts';

export const FORM_IDS = {
    ASSAY_NAME: FORM_ID_PREFIX + 'name',
    ASSAY_DESCRIPTION: FORM_ID_PREFIX + 'description',
    AUTO_LINK_TARGET: FORM_ID_PREFIX + 'autoCopyTargetContainerId',
    AUTO_LINK_CATEGORY: FORM_ID_PREFIX + 'autoLinkCategory',
    BACKGROUND_UPLOAD: FORM_ID_PREFIX + 'backgroundUpload',
    DETECTION_METHOD: FORM_ID_PREFIX + 'selectedDetectionMethod',
    EDITABLE_RUNS: FORM_ID_PREFIX + 'editableRuns',
    EDITABLE_RESULTS: FORM_ID_PREFIX + 'editableResults',
    METADATA_INPUT_FORMAT: FORM_ID_PREFIX + 'selectedMetadataInputFormat',
    PLATE_TEMPLATE: FORM_ID_PREFIX + 'selectedPlateTemplate',
    PROTOCOL_TRANSFORM_SCRIPTS: FORM_ID_PREFIX + 'protocolTransformScripts',
    QC_ENABLED: FORM_ID_PREFIX + 'qcEnabled',
    SAVE_SCRIPT_FILES: FORM_ID_PREFIX + 'saveScriptFiles',
    PLATE_METADATA: FORM_ID_PREFIX + 'plateMetadata',
    STATUS: FORM_ID_PREFIX + 'status',
};

export const BOOLEAN_FIELDS = [
    FORM_IDS.BACKGROUND_UPLOAD,
    FORM_IDS.EDITABLE_RUNS,
    FORM_IDS.EDITABLE_RESULTS,
    FORM_IDS.QC_ENABLED,
    FORM_IDS.SAVE_SCRIPT_FILES,
    FORM_IDS.PLATE_METADATA,
    FORM_IDS.STATUS,
];
