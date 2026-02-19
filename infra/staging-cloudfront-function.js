// CloudFront Function: palavara-staging-auth
// Runtime: cloudfront-js-2.0
// Event type: viewer-request
//
// Handles:
// 1. Basic auth
// 2. Subdomain routing (pr-49.staging.studio.palavara.com → /pr-49/ prefix in S3)
// 3. SPA fallback (URIs without file extensions → index.html)
//
// To generate the base64 auth string:
//   echo -n "username:password" | base64
// Then replace the value of expectedAuth below.

function handler(event) {
    var request = event.request;
    var headers = request.headers;

    // --- Basic Auth ---
    // Replace with: 'Basic ' + base64('username:password')
    var expectedAuth = 'Basic REPLACE_WITH_BASE64_CREDENTIALS';

    if (
        typeof headers.authorization === 'undefined' ||
        headers.authorization.value !== expectedAuth
    ) {
        return {
            statusCode: 401,
            statusDescription: 'Unauthorized',
            headers: {
                'www-authenticate': { value: 'Basic realm="Staging"' }
            }
        };
    }

    // --- Subdomain Routing ---
    var host = headers.host.value;
    var match = host.match(/^(pr-\d+)\./);

    if (match) {
        var prefix = '/' + match[1];
        var uri = request.uri;

        // Static assets (have file extension) → prepend prefix
        // SPA routes (no file extension) → serve index.html from prefix
        if (uri.match(/\.\w+$/)) {
            request.uri = prefix + uri;
        } else {
            request.uri = prefix + '/index.html';
        }
    }

    return request;
}
