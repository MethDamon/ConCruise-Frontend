import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';

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

    const LoginButton = withRouter(({history}) => (
      <button
        type="button"
        className="btn btn-block btn-primary"
        onClick={() => {this.login(history)}}
      >
      Login
      </button>
    ))

    const LogoutButton = withRouter(({history}) => (
      <button
        type="button"
        className="btn btn-block btn-primary"
        onClick={() => {this.logout(history)}}
      >
      Logout
      </button>
    ))

    return (
      <div className="animated fadeIn">
        <div><input type="text" id="text-input" name="text-input" className="form-control" placeholder="Text"/></div>
        <div><input type="password" id="password-input" name="password-input" className="form-control" placeholder="Password"/></div>
        <div><LoginButton/><LogoutButton/></div>
      </div>
    )
  }
}

export default Login;
