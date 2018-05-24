import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';


class Authentication extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: false,
    };
  }

  componentDidMount() {
    this.setState({
      isLoggedIn: this.props.isLoggedIn,
    });

    // If the user is not logged in, redirect him to the login page
    if (!this.state.isLoggedIn) {
      this.props.history.push("/login");
    }
  }

  render() {
    if (this.state.isLoggedIn) {
      return this.props.children;
    } else {
      return null;
    }
  }
}

export default withRouter(Authentication);
