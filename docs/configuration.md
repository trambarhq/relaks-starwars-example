## package.json

This is the configuration file of [npm](https://docs.npmjs.com/cli/npm), a package manager used to manage third-party JavaScript libraries. It contains information about our package and a list of libraries it depends on. Running `npm install` install them.

The following are the libraries used and the reason behind their inclusion:

* **@babel/core** - allows us to use advanced JavaScript features by translating them into older version of JavaScript compatible with existing browsers
* **@babel/plugin-transform-runtime** - plugin used to pull in Babel runtime
* **@babel/preset-env** - Babel configuration preset
* **@babel/preset-react** - Babel configuration preset for React JSX
* **@babel/runtime** - Babel runtime, needed for async functions
* **babel-loader** - Babel-Webpack integration
* **css-loader** - for processing CSS files through WebPack
* **html-webpack-plugin** - used to stick a script tag into a HTML file (and that's it)
* **node-sass** - SASS processor
* **react** - React library code
* **react-dom** - React DOM library code
* **relaks** - Relaks library code
* **sass-loader** - for processing SASS files through WebPack
* **style-loader** - for loading CSS stylesheet using JavaScript
* **uglifyjs-webpack-plugin** - optimizes JavaScript code to make it smaller and faster
* **webpack** - bundles everything together and handles loading at runtime
* **webpack-bundle-analyzer** - used to generates a nice map detailing the sizes of JavaScript modules
* **webpack-cli** - webpack CLI interface
* **webpack-dev-server** - hosts a development version of the app, with instant updates

## webpack.config.js

This is the configuration file of [WebPack](https://webpack.js.org/). It describes how our example app is put together.

Set mode to `production` when building for production environment. This automatically enable optimization of JS code. It also sets `process.env.NODE_ENV` to the static string `"production"`, which would lead to the removal of code meant for development purpose only.
```
  mode: (event === 'build') ? 'production' : 'development',
```

This line set the base folder to `./src`, using `Path.resolve()` to obtain an absolute path:
```javascript
  context: Path.resolve('./src'),
```

Indicates that `main.js` is the entry point of our app:
```javascript
  entry: './main',
```

Set the output folder to `./www` and the name of our app to `app.js`:
```javascript
  output: {
    path: Path.resolve('./www'),
    filename: 'front-end.js',
  },
```

Configure Babel to process `.js` and `.jsx` files, employing necessary presets and plugins:
```javascript
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: [
            '@babel/env',
            '@babel/react',
          ],
          plugins: [
            '@babel/transform-runtime',
          ]
        }
      },
```        

SASS stylesheets to CSS and load the results through WebPack:
```javascript
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ]
      },
```

Stick a script tag that loads our app (`front-end.js`) into `index.html` (yeah, that's it):
```javascript
    new HtmlWebpackPlugin({
      template: Path.resolve(`./src/index.html`),
      filename: Path.resolve(`./www/index.html`),
    }),
```

Generate a cool-looking map detailing the size of each JavaScript library, mainly so we know how large our app is after gzip compression:
```javascript    
    new BundleAnalyzerPlugin({
        analyzerMode: (event === 'build') ? 'static' : 'disabled',
        reportFilename: `report.html`,
    }),  
```

Generate separate source-maps when we're building for production environment while using inline source-maps during development:
```javascript
  devtool: (event === 'build') ? 'source-map' : 'inline-source-map',
```

Tell WebPack to not merge code from different modules so the map from Bundle Analyzer looks cleaner:
```javascript
  optimization: {
    concatenateModules: false,
  },
```

Tell WebPack Dev Server to run in inline mode instead of utilizing an iframe and to open a browser window automatically:
```javascript
  devServer: {
    inline: true,
    open: true,
  }
```
