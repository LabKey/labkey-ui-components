import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Ajax, Utils } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';

import { CheckboxLK } from '../../Checkbox';

import { LoadingSpinner } from './LoadingSpinner';
import { Alert } from './Alert';

interface SettingState {
    enabled: boolean;
    error: string;
    loading: boolean;
    save: () => void;
    saving: boolean;
}

const useSetting = (
    getUrl: string,
    setUrl: string,
    name: string,
    enabledValue: boolean | string | number,
    disabledValue: boolean | string | number
): SettingState => {
    const [state, setState] = useState<Omit<SettingState, 'save'>>({
        error: undefined,
        loading: true,
        saving: false,
        enabled: false,
    });

    useEffect(() => {
        Ajax.request({
            url: getUrl,
            success: Utils.getCallbackWrapper(response => {
                const value = response.data?.[name] ?? response[name];
                setState(currentState => ({
                    ...currentState,
                    enabled: value !== disabledValue,
                    loading: false,
                }));
            }),
            failure: Utils.getCallbackWrapper(err => {
                console.error(err);
                setState(currentState => ({
                    ...currentState,
                    error: resolveErrorMessage(err) ?? 'Error loading setting',
                    loading: false,
                }));
            }),
        });
    }, []);

    const save = useCallback(() => {
        setState(currentState => ({ ...currentState, saving: true }));
        const updatedValue = !state.enabled ? enabledValue : disabledValue;
        Ajax.request({
            url: setUrl,
            jsonData: { [name]: updatedValue },
            method: 'POST',
            success: Utils.getCallbackWrapper(() => {
                setState(currentState => ({ ...currentState, enabled: updatedValue === enabledValue, saving: false }));
            }),
            failure: Utils.getCallbackWrapper(err => {
                console.error(err);
                setState(currentState => ({
                    ...currentState,
                    error: resolveErrorMessage(err) ?? 'Error saving setting',
                    saving: false,
                }));
            }),
        });
    }, [state.enabled]);

    return { ...state, save };
};

interface SettingProps {
    disabledValue?: any; // likely to be boolean, but could be integers/strings in some case
    enabledValue?: any; // likely to be boolean, but could be integers/strings in some case
    getUrl: string;
    heading?: string;
    label: string;
    name: string;
    setUrl: string;
}

export const Setting: FC<SettingProps> = memo(props => {
    const { getUrl, heading, label, name, setUrl, enabledValue = true, disabledValue = false } = props;
    const { error, loading, saving, save, enabled } = useSetting(getUrl, setUrl, name, enabledValue, disabledValue);
    return (
        <div className="setting-checkbox">
            {heading !== undefined && <div className="list__bold-text margin-bottom">{heading}</div>}

            {loading && <LoadingSpinner />}

            {error !== undefined && <Alert>{error}</Alert>}

            {!loading && (
                <form>
                    <CheckboxLK checked={enabled} name={name} onChange={save} disabled={saving}>
                        {label}
                    </CheckboxLK>
                </form>
            )}
        </div>
    );
});
