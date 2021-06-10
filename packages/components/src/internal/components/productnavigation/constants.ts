import { List } from 'immutable';

import { getHelpLink, imageURL } from '../../..';

import { BIOLOGICS_PRODUCT_ID, FREEZER_MANAGER_PRODUCT_ID, SAMPLE_MANAGER_PRODUCT_ID } from '../../app/constants';
import { ActionURL } from '@labkey/api';

// map for product menuSections query so that we request the LKFM section with the LKSM product
export const PRODUCT_ID_SECTION_QUERY_MAP = {
    [SAMPLE_MANAGER_PRODUCT_ID.toLowerCase()]: List.of(SAMPLE_MANAGER_PRODUCT_ID, FREEZER_MANAGER_PRODUCT_ID),
};

// list of section keys to skip for the section rendering
export const SECTION_KEYS_TO_SKIP = ['user', 'biologicsWorkflow'];

export const SAMPLE_MANAGER_PRODUCT_ICON = 'LK-SampleManager-Badge-COLOR.svg';
export const SAMPLE_MANAGER_ALT_PRODUCT_ICON = 'LK-SampleManager-Badge-WHITE.svg';
export const SAMPLE_MANAGER_DISABLED_PRODUCT_ICON = 'LK-SampleManager-Badge-WHITE.svg'; // TODO

export const BIOLOGICS_PRODUCT_ICON = 'lk-bio-logo-badge-color.svg';
export const BIOLOGICS_ALT_PRODUCT_ICON = 'lk-bio-logo-badge.svg';
export const BIOLOGICS_DISABLED_PRODUCT_ICON = 'lk-bio-logo-badge.svg' // TODO

// mapping from product ids to the image/icon src paths
export const PRODUCT_ID_IMG_SRC_MAP = {
    [SAMPLE_MANAGER_PRODUCT_ID.toLowerCase()]: {
        iconUrl: imageURL('sampleManagement/images', SAMPLE_MANAGER_PRODUCT_ICON),
        iconUrlAlt: imageURL('sampleManagement/images', SAMPLE_MANAGER_ALT_PRODUCT_ICON),

        iconUrlDisabled: imageURL('sampleManagement/images', SAMPLE_MANAGER_DISABLED_PRODUCT_ICON),
    },
    [BIOLOGICS_PRODUCT_ID.toLowerCase()]: {
        iconUrl: imageURL('biologics/images', BIOLOGICS_PRODUCT_ICON),
        iconUrlAlt: imageURL('biologics/images', BIOLOGICS_ALT_PRODUCT_ICON),
        // TODO
        iconUrlDisabled: imageURL('biologics/images', BIOLOGICS_DISABLED_PRODUCT_ICON),
    },
};

export const LK_DOC_FOLDER_TABS = getHelpLink('tabs');
export const PRODUCT_SERVICES_URL = 'https://www.labkey.com/products-services/';
export const ADMIN_LOOK_AND_FEEL_URL = ActionURL.buildURL("admin", "lookAndFeelSettings.view", "/");

export const APPLICATION_NAVIGATION_METRIC = 'applicationNavigation';
export const TO_LKS_HOME_METRIC = 'toHomeProject';
export const TO_LKS_CONTAINER_METRIC = 'toServerContainer';
export const TO_LKS_TAB_METRIC = 'toServerContainerTab';
export const APPLICATION_SECTION_METRIC = 'toApplicationSection';
export const BIOLOGICS_SECTION_METRIC = 'toBiologicsSection';
export const SAMPLE_MANAGER_SECTION_METRIC = 'toSampleManagerSection';
