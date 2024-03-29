import { ReactNode } from 'react';

import { Query } from '@labkey/api';

import { QueryColumn } from '../../../../public/QueryColumn';

import { SelectInputChange, SelectInputProps } from './SelectInput';

export interface InputRendererProps {
    allowFieldDisable?: boolean;
    col: QueryColumn;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    // The data for the entire row/form section
    data: any;
    formsy?: boolean;
    initiallyDisabled?: boolean;
    inputClass?: string;
    onAdditionalFormDataChange?: (name: string, value: any) => void;
    onSelectChange?: SelectInputChange;
    onToggleDisable?: (disabled: boolean) => void;
    renderLabelField?: (col: QueryColumn) => ReactNode;
    selectInputProps?: Omit<SelectInputProps, 'onChange'>;
    showAsteriskSymbol?: boolean;
    showLabel?: boolean;
    value: any;
    values?: any;
}
