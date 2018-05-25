import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { SSL_OP_EPHEMERAL_RSA } from 'constants';

class Login extends Component {

  login(history) {
    this.props.authenticate();
    history.push('/');
  }

  logout(history) {    
    this.props.signout();
    history.push('/');
  }

  render() {

    const LoginButton = withRouter(({ history }) => (
      <button
        type="button"
        className="btn btn-primary"
        style={{marginRight: '20px'}}
        onClick={() => { setTimeout(() => this.login(history), 500 )}}
      >
        Login
      </button>
    ))

    const LogoutButton = withRouter(({ history }) => (
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => { this.logout(history) }}
      >
        Logout
      </button>
    ))

    return (
      <div className="animated fadeIn">
        <div className="row">
          <div className="col-md-6 mx-auto">
            <div className="card">
              <div className="card-header">
                <strong>Please login</strong>
              </div>
              <div className="card-body">
                <form className="form-horizontal">
                  <div className="row form-group">
                    <div className="col-md-3">
                      <label htmlFor="email">Email</label>
                    </div>
                    <div className="col-12 col-md-9">
                      <input type="email" id="text-input" name="email" className="form-control" placeholder="max.muster@gmail.com" />
                      <small className="help-block form-text text-muted">Please enter your email</small>
                    </div>
                  </div>
                  <div className="row form-group">
                    <div className="col-md-3">
                      <label htmlFor="password">Password</label>
                    </div>
                    <div className="col-12 col-md-9">
                      <input type="password" id="text-input" name="password" className="form-control" placeholder="hunter2" />
                      <small className="help-block form-text text-muted">Please enter your password</small>
                    </div>
                  </div>
                  <div className="form-actions">
                    <LoginButton style="margin-right: 20px;" />
                    <LogoutButton />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Login;
