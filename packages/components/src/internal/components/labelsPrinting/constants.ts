import { SchemaQuery } from '../../../public/SchemaQuery';

export const BAR_TENDER_TOPIC = 'barTender';
export const LABEL_NOT_FOUND_ERROR =
    "The supplied label template contains an error or was not found. Please check the template, filename, and the BarTender service's configured path.";
export const BARTENDER_CONFIGURATION_TITLE = 'BarTender Web Service Configuration';
export const LABEL_TEMPLATES_LIST_NAME = 'LabelTemplates';
export const LABEL_TEMPLATE_SQ = new SchemaQuery('lists', LABEL_TEMPLATES_LIST_NAME);
