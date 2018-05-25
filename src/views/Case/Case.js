import React, { Component } from 'react';

// Import React FilePond
import { FilePond, File, registerPlugin } from 'react-filepond';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';

// Register the image preview plugin
import FilePondImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
registerPlugin(FilePondImagePreview);

class Case extends Component {
  constructor(props) {
    super(props);

    this.state = {
      files: []
    };
  }

  someContent() {
    let content = {
      case: '2345709',
      date: '15.05.2018',
      subject: 'Max Muster',
      status: 'Finished',
    };

    if (this.props.match.params.caseId == '8091117') {
      content = {
        case: '8091117',
        date: '20.05.2018',
        subject: 'John Doe',
        status: 'Pending',
      };
    }
    return <div>
      <dl className="dl-horizontal">
        <dt>Case:</dt>
        <dd>{content.case}</dd>
        <dt>Date:</dt>
        <dd>{content.date}</dd>
        <dt>Subject:</dt>
        <dd>{content.subject}</dd>
        <dt>Status:</dt>
        <dd>{content.status}</dd>
      </dl>
    </div>;
  }

  render() {
    return (
      <div className="animated fadeIn">
        <div >
          {this.someContent()}
        </div>
        <div>
          <FilePond allowMultiple={true} maxFiles={3}>

            {/* Set current files using the <File/> component */}
            {this.state.files.map(file => (
              <File key={file} source={file} />
            ))}

          </FilePond>
        </div>
      </div>

    )
  }
}

export default Case;
