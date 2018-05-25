import React, { Component } from 'react';
import { Redirect } from 'react-router';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

class Overview extends Component {
  render() {
    return (
      <div className="animated fadeIn">
        <div className="card">
          <div className="card-header">
            < i className="fa fa-align-justify"></i> Cases Overview
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Link to="/case/2345709">2345709</Link></td>
                    <td>15.05.2018</td>
                    <td>Max Muster</td>
                    <td className="text-success">Finished</td>
                  </tr>
                  <tr>
                    <td><Link to="/case/8091117">8091117</Link></td>
                    <td>20.05.2018</td>
                    <td>John Doe</td>
                    <td className="text-warning">Pending</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Overview;
