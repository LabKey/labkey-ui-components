import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PipelineJobDetailPage } from './PipelineJobDetailPage';
import { PipelineJobsListingPage } from './PipelineJobsListingPage';

export const PipelineRoutes: FC = () => (
    <Routes>
        <Route index element={<PipelineJobsListingPage />} />
        <Route path=":id" element={<PipelineJobDetailPage />} />
    </Routes>
);
