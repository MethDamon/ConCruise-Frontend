import React, {Component} from 'react';
import {Link, Switch, Route, Redirect} from 'react-router-dom';
import {Container} from 'reactstrap';
import Header from '../../components/Header/';
import Sidebar from '../../components/Sidebar/';
import Breadcrumb from '../../components/Breadcrumb/';
import Aside from '../../components/Aside/';
import Footer from '../../components/Footer/';

import Login from '../../views/Login/';
import Overview from '../../views/Overview/';
import Case from '../../views/Case/';

import Authentication from '../../containers/Authentication/';

class Full extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
    };
  }

  authenticate() {
      this.setState({
        isAuthenticated: true,
      })
    }

  signout() {
      this.setState({
        isAuthenticated: false,
      })
    }

  render() {
    const PrivateRoute = ({ component: Component, ...rest }) => (
      <Route {...rest} render={(props) => (
        this.state.isAuthenticated === true ? <Component {...props} /> : <Redirect to='/login' />
      )} />
    )
    return (
      <div className="app">
        <Header />
        <div className="app-body">
          <Sidebar {...this.props}/>
          <main className="main">
            <Breadcrumb />
            <Container fluid>
              <Switch>
                <PrivateRoute path="/case/:caseId" name="Case" component={Case}/>
                <Route path="/login" name="Login" render={(props) => <Login isAuthenticated={this.state.isAuthenticated} authenticate={this.authenticate.bind(this)} signout={this.signout.bind(this)} {...props} />}/>
                <PrivateRoute path="/overview" name="Overview" component={Overview}/>
                <Redirect from="/" to="/overview"/>
              </Switch>
            </Container>
          </main>
          {/*<Aside />*/}
        </div>
        {/*<Footer />*/}
      </div>
    );
  }
}

export default Full;
