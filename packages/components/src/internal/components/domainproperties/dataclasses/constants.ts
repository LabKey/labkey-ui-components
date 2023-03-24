const DESCRIPTION_FIELD = {
        Name: 'Description',
        Label: 'Description',
        DataType: 'Text',
        Required: false,
        Description: 'Contains a description for this data object',
        Disableble: true,
    };

export const DATACLASS_DOMAIN_SYSTEM_FIELDS = [
    {
        Name: 'Name',
        Label: 'Name',
        DataType: 'Text',
        Required: true,
        Description: 'Contains a short name for this data object',
        Disableble: false,
    },
    DESCRIPTION_FIELD,
];

export const SOURCE_DOMAIN_SYSTEM_FIELDS = [
    {
        Name: 'Name',
        Label: 'Source ID',
        DataType: 'Text',
        Required: true,
        Description: 'Contains a short name for this data object',
        Disableble: false,
    },
    DESCRIPTION_FIELD,
];
