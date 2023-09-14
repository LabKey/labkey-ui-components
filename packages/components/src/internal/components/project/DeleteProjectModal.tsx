import React, { ChangeEventHandler, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Progress } from '../base/Progress';

import { useServerContext } from '../base/ServerContext';
import { AppURL, createProductUrl } from '../../url/AppURL';
import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';

import { resolveErrorMessage } from '../../util/messaging';

import { useAppContext } from '../../AppContext';
import { Summary } from '../security/APIWrapper';
import { Alert } from '../base/Alert';
import {Container} from "../base/models/Container";

interface CommentAreaProps {
    comment: string;
    onChangeComment: ChangeEventHandler<HTMLTextAreaElement>;
}
export const CommentArea: FC<CommentAreaProps> = memo(({ comment, onChangeComment }) => {
    return (
        <div className="delete-project-modal__comment">
            <p>
                <b>Deletion cannot be undone.</b> Do you want to proceed?{' '}
            </p>
            <p>
                <b>Reason for deleting</b>
            </p>
            <textarea
                className="form-control"
                placeholder="Enter comments (optional)"
                value={comment}
                rows={5}
                cols={50}
                onChange={onChangeComment}
            />
        </div>
    );
});

export const BodyEmpty: FC<CommentAreaProps> = memo(({ comment, onChangeComment }) => {
    return (
        <Modal.Body>
            <div className="delete-project-modal__text">
                <p>This project will be permanently deleted. It contains no data.</p>
            </div>

            <CommentArea comment={comment} onChangeComment={onChangeComment} />
        </Modal.Body>
    );
});

interface BodyProps {
    comment: string;
    error: string;
    isLoading: boolean;
    onChangeComment: ChangeEventHandler<HTMLTextAreaElement>;
    summaries: Summary[];
}
export const Body: FC<BodyProps> = memo(({ summaries, comment, isLoading, onChangeComment, error }) => {
    return (
        <Modal.Body>
            <div className="delete-project-modal__text">
                <p>This project and all of its data will be permanently deleted.</p>
                <p>
                    Before deleting this project, ensure there are no references to data (samples, sources or registry,
                    assay data, etc.) in other projects.
                </p>
            </div>

            <b> Project Data </b>

            {error && <Alert bsStyle="danger">{error}</Alert>}

            {!error && isLoading ? (
                <LoadingSpinner wrapperClassName="delete-project-modal__spinner" />
            ) : (
                <table className="table table-responsive table-condensed delete-project-modal__table ">
                    <tbody>
                        {summaries.map(s => (
                            <tr key={s.count + s.noun}>
                                <td>{s.noun}</td>
                                <td>{s.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <CommentArea comment={comment} onChangeComment={onChangeComment} />
        </Modal.Body>
    );
});

interface BodyDeletingProps {
    totalCountFromSummaries: number;
}
export const BodyDeleting: FC<BodyDeletingProps> = memo(({ totalCountFromSummaries }) => {
    const [toggle, setToggle] = React.useState<boolean>(false);

    // Note that <Progress/> requires a 'toggle' that flips from false to true in order to render
    React.useEffect(() => {
        setTimeout(() => setToggle(true), 1);
    }, []);

    return (
        <Modal.Body>
            <div className="deleting-project-modal-text">
                Please don't close this page until deletion is complete.
            </div>
            <Progress delay={0} estimate={totalCountFromSummaries * 15} toggle={toggle} />
        </Modal.Body>
    );
});

interface Props {
    onCancel: () => void;
    onError: (e: string) => void;
    project: Container;
    onDeleteSuccess: () => void;
}

export const DeleteProjectModal: FC<Props> = memo(props => {
    const { project, onCancel, onError, onDeleteSuccess } = props;
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [comment, setComment] = useState<string>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const { api } = useAppContext();
    const { container } = useServerContext();

    const projectName = project?.name;

    useEffect(() => {
        (async () => {
            try {
                const allSummaries = await api.security.getDeletionSummaries();
                setSummaries(allSummaries);
                setIsLoading(false);
            } catch (e) {
                // getDeletionSummaries() handles error logging
                setError(resolveErrorMessage(e));
                setIsLoading(false);
            }
        })();
    }, [api.security]);

    const onHide = useCallback(() => {
        if (!isDeleting) onCancel();
    }, [isDeleting, onCancel]);

    const onChangeComment = useCallback(e => {
        setComment(e.target.value);
    }, []);

    const onDeleteProject = useCallback(async () => {
        setIsDeleting(true);
        try {
            await api.security.deleteContainer({
                comment,
                containerPath: project.path,
            });

            onDeleteSuccess();

            const successMsg = project.name;
            const adminProjectsHref = createProductUrl(
                getPrimaryAppProperties()?.productId,
                getCurrentAppProperties()?.productId,
                AppURL.create('admin', 'projects').addParam('successMsg', successMsg).toHref(),
                container.parentPath
            ).toString();

            window.location.href = adminProjectsHref;


        } catch (e) {
            onError(resolveErrorMessage(e) ?? `${projectName} could not be deleted. Please try again.`);
        }
    }, [api.security, comment, container.parentPath, onError, projectName, onDeleteSuccess]);

    const totalCountFromSummaries = useMemo(
        () =>
            summaries.reduce((prev, curr) => {
                return prev + curr.count;
            }, 0) ?? 0,
        [summaries]
    );

    const noData = !isLoading && summaries.length === 0 && !error;

    return (
        <Modal onHide={onHide} show>
            <Modal.Header closeButton={!isDeleting}>
                <Modal.Title>{isDeleting ? 'Deleting project' : <> Permanently delete {projectName}? </>} </Modal.Title>
            </Modal.Header>

            {isDeleting ? (
                <BodyDeleting totalCountFromSummaries={totalCountFromSummaries} />
            ) : noData ? (
                <BodyEmpty onChangeComment={onChangeComment} comment={comment} />
            ) : (
                <Body
                    comment={comment}
                    onChangeComment={onChangeComment}
                    summaries={summaries}
                    isLoading={isLoading}
                    error={error}
                />
            )}

            {!isDeleting && (
                <Modal.Footer>
                    <Button className="btn btn-default pull-left" type="button" onClick={onCancel}>
                        Cancel
                    </Button>

                    <Button className="btn btn-danger" type="button" onClick={onDeleteProject}>
                        Yes, Delete
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
});
