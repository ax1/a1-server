# VERSION HISTORY 

For in-depth changes, see the source 
### 3.7.0
- request logs are not sent to output unless the new 'debug' config property is enabled

### 3.4.0
- ssl configuration is file strings instead of file(). This way, the config data can be JSON-able.
- start from different ports by using `PORT` environment variable.

### 3.3.0
- allow symbolic links in `public` and `app` to use resources from other applications without adding them as dependencies. Useful for merging REST services from different apps.

### 3.2.0
- automatic REST rule generation, no need to manual typing in most of the cases. Example: `/a/b/c/d` results in `file: app/a/b.js` and `params:{p0:c, p1:d}`. This allows direct reusability of REST services either by dropping or by linking into the /app folder. This also allows to generate REST services in real-time.
- performance config parameter is obsolete. Now you can use `SERVER_PERFORMANCE` environment variable.
- Allow again to set a custom root folder for the application. Use the `SERVER_ROOT` environment variable.

### 3.1.0
- autoclose when non managed stream errors
- allow throw(number) to send error response automatically
- hide response error descriptions when throw() for security reasons

### 3.0
- `performance` config flag when max throughput is required
- allow again `params === null` (for 90 percent of time it is better, and Javascript will always have null types even if the FP trend rises)

### 2.0
- `params` contain the parameters in the queryString. No parsing queryString anymore!
- `params` is never null. Replace `if (!params)` by `(Object.keys(params).length==0)`
- add MIME types in header automatically

## 1.0
- use rest services as single files
- add proxy
- add static pages