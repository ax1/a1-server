
# INSTALL ASYNC-AWAIT (pre-ES7)

### Install babel
npm install babel babel-cli --save-dev
npm install babel-plugin-transform-async-to-generator --save-dev

### Add plugin to package.json
"babel": {
  "plugins": [
    "transform-async-to-generator"
  ]
}

### Execute
cd opamp/demo
../node_modules/babel-cli/bin/babel-node.js index.js
