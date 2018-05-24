import React, { Component } from 'react';

//import FineUploaderTraditional from 'fine-uploader-wrappers';
//import Gallery from 'react-fine-uploader';
//import 'react-fine-uploader/gallery/gallery.css'



// Import React FilePond
import { FilePond, File, registerPlugin } from 'react-filepond';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';

// Register the image preview plugin
//import FilePondImagePreview from 'filepond-plugin-image-preview';
//import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
//registerPlugin(FilePondImagePreview);

/*
const uploader = new FineUploaderTraditional({
    options: {
        chunking: {
            enabled: true
        },
        deleteFile: {
            enabled: true,
            endpoint: '/uploads'
        },
        request: {
            endpoint: '/uploads'
        },
        retry: {
            enableAuto: true
        }
    }
})
*/

class FileUpload extends Component {
    render() {
        return (
            //<div></div>
            //<Filepond allowMultiple={true} maxFiles={3} server="/api"/>
            <div>

                {/* Pass FilePond properties as attributes */}
                <FilePond allowMultiple={true} maxFiles={3} server="/api">



                </FilePond>
            </div>
        );
    }
}

export default FileUpload;