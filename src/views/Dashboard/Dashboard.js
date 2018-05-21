import React, { Component } from 'react';
import FileUpload from '../../components/FileUpload/FileUpload';

class Dashboard extends Component {

  render() {
    return (
      <div className="animated fadeIn">
      <FileUpload></FileUpload>
      </div>
    )
  }
}

export default Dashboard;
