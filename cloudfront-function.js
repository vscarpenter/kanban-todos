function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check if the URI ends with a slash (directory request)
    if (uri.endsWith('/')) {
        // Append index.html to directory requests
        request.uri = uri + 'index.html';
    }
    // Check if the URI doesn't have a file extension and doesn't end with slash
    else if (!uri.includes('.')) {
        // Add trailing slash and index.html for paths without extensions
        request.uri = uri + '/index.html';
    }
    
    return request;
}