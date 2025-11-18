# TODO

## File Upload and Serving Model Rework

- When a zip file is uploaded, unzip it **once and only once** during the upload process
- Store the extracted HTML/CSS files directly (no need to keep the zip or re-extract)
- When files are served, the server should never need to unzip - the raw HTML/CSS files should be ready to go
- These extracted files can be served via a CDN or similar static file serving mechanism

