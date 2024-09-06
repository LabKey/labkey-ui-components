/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { PropsWithChildren } from 'react';
import classNames from 'classnames';

import { Modal } from '../../Modal';

interface Props extends PropsWithChildren {
    delay?: number;
    estimate?: number;
    modal?: boolean;
    title?: React.ReactNode;
    toggle: boolean;
    updateIncrement?: number;
}

interface State {
    duration: number;
    percent: number;
    show: boolean;
}

export class Progress extends React.Component<Props, State> {
    static defaultProps = {
        delay: 350,
        estimate: 500,
        modal: false,
        updateIncrement: 50,
    };

    delayTimer: number;
    timer: number;

    state: Readonly<State> = { duration: 0, percent: 0, show: false };

    componentWillUnmount(): void {
        this.end(true);
    }

    componentDidUpdate(prevProps: Props): void {
        const { delay, toggle } = this.props;
        if (!prevProps.toggle && toggle) {
            if (delay) {
                this.delayTimer = window.setTimeout(() => {
                    this.cycle(true);
                    this.start();
                }, delay);
            } else {
                this.start();
            }
        } else if (prevProps.toggle && !toggle) {
            this.end();
        }
    }

    cycle = (fromDelay?: boolean): void => {
        const newDuration = this.state.duration + (fromDelay ? this.props.delay : this.props.updateIncrement);
        const newPercent = Math.ceil((newDuration / this.props.estimate) * 100);

        this.setState({
            duration: newDuration,
            percent: newPercent > 100 ? 100 : newPercent,
            show: true,
        });
    };

    end = (fromUnmount?: boolean): void => {
        clearTimeout(this.delayTimer);
        clearTimeout(this.timer);

        if (fromUnmount !== true) {
            this.setState({ percent: 0, show: false });
        }
    };

    start = (): void => {
        clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
            this.timer = null;
            this.cycle();
            this.start();
        }, this.props.updateIncrement);
    };

    render() {
        const { children, modal, title } = this.props;
        const { percent, show } = this.state;

        if (!show) return null;

        const progressClassName = classNames('progress-bar', 'progress-bar-striped', 'active', {
            'progress-bar-success': percent === 100,
        });
        const progressWidth = percent + '%';
        const indicator = (
            <div className="progress">
                <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    className={progressClassName}
                    style={{ width: progressWidth }}
                >
                    <span className="sr-only">{percent}%</span>
                </div>
            </div>
        );

        if (modal) {
            return (
                <Modal bsSize="lg" onCancel={undefined} onConfirm={undefined} canConfirm={false} title={title}>
                    {children}
                    {indicator}
                </Modal>
            );
        }

        return indicator;
    }
}
