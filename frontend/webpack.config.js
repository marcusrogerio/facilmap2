const webpack = require("webpack");
const copyPlugin = require("copy-webpack-plugin");
const duplicatePlugin = require("./webpack-duplicates");
const htmlPlugin = require("html-webpack-plugin");
const ngAnnotatePlugin = require("ng-annotate-webpack-plugin");
const path = require("path");


const depLoaders = {
	jquery: "expose-loader?jQuery",
	angular: "exports-loader?window.angular",
	"leaflet.elevation": [
		"imports-loader?d3=d3",
		"string-replace-loader?search=L.Browser.touch&replace=L.Browser.mobile" // https://github.com/MrMufflon/Leaflet.Elevation/issues/67
	]
};

// Add imports to these modules, as they don't specify their imports properly
const addDeps = {
	"angular-ui-sortable": [ "jquery-ui", "jquery-ui/ui/widgets/sortable" ],

	// Until https://github.com/webpack-contrib/css-loader/issues/51 is resolved we have to include CSS files by hand
	bootstrap: [ "bootstrap/dist/css/bootstrap.css", "bootstrap/dist/css/bootstrap-theme.css" ],
	"leaflet-simple-graticule": [ "leaflet-simple-graticule/L.SimpleGraticule.css" ],
	"bootstrap-touchspin": [ "bootstrap-touchspin/dist/jquery.bootstrap-touchspin.css" ],
	leaflet: [ "leaflet/dist/leaflet.css" ],
	"leaflet.locatecontrol": [ "leaflet.locatecontrol/dist/L.Control.Locate.css" ],
	"leaflet.markercluster": [ "leaflet.markercluster/dist/MarkerCluster.css", "leaflet.markercluster/dist/MarkerCluster.Default.css" ],
	"leaflet.elevation": [ require.resolve("leaflet.elevation/dist/Leaflet.Elevation-0.0.2.css") ],
	"leaflet-mouse-position": [ "leaflet-mouse-position/src/L.Control.MousePosition.css" ],
	"leaflet-graphicscale": [ "leaflet-graphicscale/src/Leaflet.GraphicScale.scss" ]
};

for(let i in addDeps) {
	let thisDep = `imports-loader?${addDeps[i].map((dep, i) => `fmImport${i}=${dep}`).join(",")}`;
	if(depLoaders[i]) {
		depLoaders[i] = [thisDep, ...(Array.isArray(depLoaders[i]) ? depLoaders[i] : [ depLoaders[i] ])];
	} else {
		depLoaders[i] = thisDep;
	}
}

module.exports = {
	entry: {
		index: __dirname + "/index/index.js",
		table: __dirname + "/table/table.js"
	},
	output: {
		filename: "frontend-[name]-[hash].js",
		path: __dirname + "/build/"
	},
	resolve: {
		unsafeCache: true,
		alias: {
			angular: "angular/angular", // We cannot use the main file, as it exports the variable "angular", which clashes with this ProvidePlugin
			"leaflet.elevation": "leaflet.elevation/dist/Leaflet.Elevation-0.0.2.src.js"
		}
	},
	module: {
		rules: [
			{ test: /\.css$/, use: [ "style-loader", "css-loader" ] },
			{ test: /\.scss$/, use: [ "style-loader", "css-loader", "sass-loader" ]},
			{ test: /\.js$/, exclude: /\/node_modules\//, loader: "babel-loader?presets=es2015" },
			{ test: /\.(png|jpe?g|gif|ttf)$/, loader: "url-loader" },
			{ test: /\.(html|ejs)$/, loader: "html-loader?attrs[]=img:src&attrs[]=link:href" },
			...Object.keys(depLoaders).map(key => ({ test: new RegExp("/node_modules/" + key + "/.*\.js$"), [Array.isArray(depLoaders[key]) ? "use" : "loader"]: depLoaders[key] })),

			{
				test: /\/node_modules\/bootstrap\/dist\/css\/bootstrap\.css$/,
				loader: "string-replace-loader",
				options: {
					multiple: [
						{ search: "src: url\\('\\.\\./fonts/glyphicons-halflings-regular.eot'\\);", replace: "", flags: "" },
						{ search: "src: url\\('\\.\\./fonts/glyphicons-halflings-regular\\..*", replace: "src: url('../fonts/glyphicons-halflings-regular.ttf') format('truetype');", flags: "" }
					]
				}
			}
		],
	},
	plugins: [
		new duplicatePlugin(),
		new ngAnnotatePlugin({
			add: true
		}),
		new htmlPlugin({
			template: `${__dirname}/index/index.ejs`,
			filename: "index.ejs",
			chunks: ["index"]
		}),
		new htmlPlugin({
			template: `${__dirname}/table/table.ejs`,
			filename: "table.ejs",
			chunks: ["table"]
		}),
		new webpack.ProvidePlugin({
		    $: "jquery",
		    jQuery: "jquery",
		    "window.jQuery": "jquery",
			L: "leaflet",
			angular: "angular"
		}),
		new copyPlugin([ "deref.html", "opensearch.xml" ].map((file) => ({ from: `${__dirname}/static/${file}` }))),
		...(!process.env.FM_DEV ? [
			new webpack.optimize.UglifyJsPlugin({
				sourceMap: true
			})
		] : [ ]),
	],
};

if(!process.env.FM_DEV)
	module.exports.devtool = "source-map";
