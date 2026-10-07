import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Classify from './pages/Classify';
import NotFound from './pages/NotFound';

const Routes = ({ childProps }) =>
  <Switch>
    <Route path="/" exact component={Classify} props={childProps} />
    <Route component={NotFound} />
  </Switch>;

export default Routes;
