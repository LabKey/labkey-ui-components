import React, { FC, memo, useCallback } from 'react';
import { Dropdown, MenuItem } from 'react-bootstrap';

import { isLoading, isImage, LoadingSpinner, LoadingState } from '../..';

const now = (): number => new Date().valueOf();

export interface IAttachment {
    created?: number;
    fileIcon?: string;
    iconFontCls: string;
    loadingState?: LoadingState;
    name: string;
    size?: number;
}

export interface AttachmentCardProps {
    allowRemove?: boolean;
    onDownload?: (attachment: IAttachment) => void;
    onRemove?: (attachment: IAttachment) => void;
}

interface Props extends AttachmentCardProps {
    attachment: IAttachment;
    imageURL?: string;
    imageCls?: string;
    onClick?: () => void;
}

export const AttachmentCard: FC<Props> = memo(props => {
    const { allowRemove = true, attachment, imageURL, imageCls, onClick, onRemove, onDownload } = props;

    const _onDownload = useCallback((): void => {
        onDownload?.(attachment);
    }, [attachment, onDownload]);

    const _onRemove = useCallback(() => {
        if (allowRemove) {
            onRemove?.(attachment);
        }
    }, [allowRemove, attachment, onRemove]);

    if (!attachment) {
        return null;
    }

    const { iconFontCls, loadingState, name, size } = attachment;
    const isLoaded = !isLoading(loadingState);
    const recentlyCreated = attachment.created ? attachment.created > now() - 30000 : false;
    const _isImage = isImage(attachment.name);

    return (
        <div className="attachment-card" title={name}>
            <div className="attachment-card__body" onClick={isLoaded ? onClick ?? _onDownload : undefined}>
                <div className="attachment-card__icon">
                    {_isImage && !isLoaded && <LoadingSpinner msg="" />}
                    {_isImage && isLoaded && (
                        <img className={`attachment-card__icon_img ${imageCls}`} src={imageURL} alt={name} />
                    )}
                    {!_isImage && <i className={`attachment-card__icon_tile ${iconFontCls}`} />}
                </div>
                <div className="attachment-card__content">
                    <div className="attachment-card__name">{name}</div>
                    <div className="attachment-card__size">
                        {!isLoaded && <LoadingSpinner msg="Uploading..." />}
                        {isLoaded && recentlyCreated && (
                            <>
                                <i className="fa fa-check-circle" /> File attached
                            </>
                        )}
                        {isLoaded && !recentlyCreated && size && formatBytes(size)}
                    </div>
                </div>
            </div>
            {isLoaded && (
                <Dropdown className="attachment-card__menu" componentClass="div" id="attachment-card__menu">
                    <Dropdown.Toggle useAnchor={true}>
                        <i className="fa fa-ellipsis-v" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="pull-right">
                        <MenuItem onClick={_onDownload}>Download</MenuItem>
                        {allowRemove && <MenuItem onClick={_onRemove}>Remove attachment</MenuItem>}
                    </Dropdown.Menu>
                </Dropdown>
            )}
        </div>
    );
});

/**
 * Formats number of bytes into a human readable string.
 * Example:
 * ```
 * formatBytes(1024);       // 1 KB
 * formatBytes('1024');     // 1 KB
 * formatBytes(1234);       // 1.21 KB
 * formatBytes(1234, 3);    // 1.205 KB
 * ```
 * https://stackoverflow.com/a/18650828
 */
function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === undefined || bytes === null) return 'Size unknown';
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
