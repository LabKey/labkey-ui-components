import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Progress } from '../base/Progress';

import { useServerContext } from '../base/ServerContext';

import { resolveErrorMessage } from '../../util/messaging';
import { Modal } from '../../Modal';

import { useAppContext } from '../../AppContext';
import { Summary } from '../security/APIWrapper';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';

interface Props {
    onCancel: () => void;
    onDeleteSuccess: () => void;
    onError: (e: string) => void;
    project: Container;
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
    let body;
    let titleText = `Permanently delete ${projectName}?`;

    if (isDeleting) {
        body = (
            <div className="deleting-project-modal-text">Please don't close this page until deletion is complete.</div>
        );
        titleText = 'Deleting project';
    } else if (noData) {
        body = (
            <div className="delete-project-modal__text">
                <p>This project will be permanently deleted. It contains no data.</p>
            </div>
        );
    } else {
        body = (
            <>
                <div className="delete-project-modal__text">
                    <p>This project and all of its data will be permanently deleted.</p>
                    <p>
                        Before deleting this project, ensure there are no references to data (samples, sources or
                        registry, assay data, etc.) in other projects.
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
            </>
        );
    }

    return (
        <Modal
            confirmClass="btn-danger"
            confirmText="Yes, Delete"
            isConfirming={isDeleting}
            onCancel={isDeleting ? undefined : onHide}
            onConfirm={isDeleting ? undefined : onDeleteProject}
            titleText={titleText}
        >
            {body}
            {!isDeleting && (
                <div className="delete-project-modal__comment">
                    <p>
                        <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                    </p>
                    <p>
                        <label htmlFor="delete-project-comment">Reason for deleting</label>
                    </p>
                    <textarea
                        className="form-control"
                        id="delete-project-comment"
                        placeholder="Enter comments (optional)"
                        value={comment}
                        rows={5}
                        cols={50}
                        onChange={onChangeComment}
                    />
                </div>
            )}
            <Progress delay={0} estimate={totalCountFromSummaries * 15} toggle={isDeleting} />
        </Modal>
    );
});
