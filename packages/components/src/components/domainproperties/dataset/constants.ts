export const DATASET_NAME_TIP = 'This name must be unique. It is used when identifying datasets during data upload.';

export const DATASET_CATEGORY_TIP =
    'Assigning a category to a dataset will group it with similar datasets in the navigator and data browser.';

export const DATASET_LABEL_TIP = 'The name of the dataset shown to users. If no Label is provided, the Name is used.';

export const DATASET_ID_TIP =
    'The unique, numerical identifier for your dataset. It is defined during dataset creation and cannot be modified.';

export const VISIT_DATE_TIP =
    "If the official 'Visit Date' for a visit can come from this dataset, choose the date column to represent it. Note that since datasets can include data from many visits, each visit must also indicate the official 'VisitDate' dataset.";

export const COHORT_TIP = 'Datasets may be cohort specific, or associated with all cohorts.';

export const TAG_TIP = 'Adding a tag provides an additional, flexible way to categorize this dataset.';

export const DATASPACE_TIP =
    "Shared data across studies,   When 'No' is selected (default) each study folder 'owns' its own data rows.  If study has shared visits, then 'Share by Participants' means that data rows are shared across the project, and studies will only see data rows for participants that are part of that study.";

export const DATA_ROW_UNIQUENESS =
    'Choose criteria for how participants and visits are paired with or without an additional data column.';
