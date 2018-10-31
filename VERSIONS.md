# VERSION HISTORY 

For in-depth changes, see the source commits

- autoclose when non managed stream errors
- allow throw(number) to send error response automatically

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