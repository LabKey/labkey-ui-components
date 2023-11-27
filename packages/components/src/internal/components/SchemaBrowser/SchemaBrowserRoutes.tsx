import React, { FC } from 'react';
import { Routes, Route } from 'react-router-dom';

import { QueriesListingPage } from './pages/QueriesListingPage';
import { QueryDetailPage } from './pages/QueryDetailPage';
import { QueryListingPage } from './pages/QueryListingPage';
import { SchemaListingPage } from './pages/SchemaListingPage';

export const SchemaBrowserRoutes = () => (
    <Routes>
        <Route index element={<SchemaListingPage />} />
        <Route path=":schema">
            <Route index element={<QueriesListingPage />} />
            <Route path=":query">
                <Route index element={<QueryListingPage />} />
                <Route path=":id" element={<QueryDetailPage />} />
            </Route>
        </Route>
    </Routes>
);
