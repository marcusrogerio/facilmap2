import fm from '../../app';
import $ from 'jquery';
import L from 'leaflet';
import 'leaflet-almostover';
import 'leaflet.locatecontrol';
import 'leaflet.markercluster';
import 'leaflet-mouse-position';
import 'leaflet-graphicscale';


fm.app.directive("facilmap", function(fmUtils, fmMapMessages, fmMapMarkers, $compile, fmMapLines, fmMapTypes, fmMapViews, $rootScope, fmMapPad, $timeout, $sce, fmMapHistory, $q, fmClient, fmInfoBox, fmMapRoute) {
	return {
		restrict: 'E',
		template: require("./map.html"),
		scope: {
			client: "<fmClient",
			serverUrl: "@fmServerUrl",
			mapId: "@fmMapId"
		},
		transclude: true,
		controller: function($scope, $element) {
			if(!$scope.client)
				$scope.client = new fmClient($scope.serverUrl, $scope.mapId);

			this.mapEvents = $rootScope.$new(true); /* Event types: longmousedown, layerchange */
			this.client = $scope.client;
			this.el = $($element);

			let mapnikLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				fmName: "Mapnik",
				fmBase: true,
				fmKey: "Mpnk",
				attribution: $sce.trustAsHtml('© <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
				noWrap: true
			});

			this.layers = { };
			[
				L.tileLayer("http://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}", {
					fmName: "MapSurfer Road",
					fmBase: true,
					fmKey: "MSfR",
					attribution: $sce.trustAsHtml('© <a href="http://korona.geog.uni-heidelberg.de/" target="_blank">OpenMapSurfer</a> / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
					noWrap: true
				}),
				mapnikLayer,
				L.tileLayer("http://sg.geodatenzentrum.de/wmts_topplus_web_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png", {
					fmName: "TopPlus",
					fmBase: true,
					fmKey: "ToPl",
					attribution: $sce.trustAsHtml('© <a href="http://www.bkg.bund.de/">Bundesamt für Kartographie und Geodäsie</a> ' + (new Date()).getFullYear())
				}),
				L.tileLayer("http://beta.map1.eu/tiles/{z}/{x}/{y}.jpg", {
					fmName: "Map1.eu",
					fmBase: true,
					fmKey: "Map1",
					attribution: $sce.trustAsHtml('© <a href="http://map1.eu/" target="_blank">Map1.eu</a> / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
					noWrap: true
				}),
				L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
					fmName: "OpenTopoMap",
					fmBase: true,
					fmKey: "Topo",
					attribution: $sce.trustAsHtml('© <a href="https://opentopomap.org/" target="_blank">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank">CC-BY-SA</a>) / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>')
				}),
				L.tileLayer("https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=bc74ceb5f91c448b9615f9b576c61c16", {
					fmName: "OpenCycleMap",
					fmBase: true,
					fmKey: "OCyc",
					attribution: $sce.trustAsHtml('© <a href="https://opencyclemap.org/" target="_blank">OpenCycleMap</a> / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
					noWrap: true
				}),
				L.tileLayer("http://{s}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png", {
					fmName: "Hike & Bike Map",
					fmBase: true,
					fmKey: "HiBi",
					attribution: $sce.trustAsHtml('© <a href="http://hikebikemap.org/" target="_blank">Hike &amp; Bike Map</a> / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
					noWrap: true
				}),
				L.tileLayer("https://www.freietonne.de/seekarte/tah.openstreetmap.org/Tiles/TileCache.php?z={z}&x={x}&y={y}.png", {
					fmName: "Mapnik Water",
					fmBase: true,
					fmKey: "MpnW",
					attribution: $sce.trustAsHtml('© <a href="https://www.freietonne.de/" target="_blank">FreieTonne</a> / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
					noWrap: true
				}),
				L.tileLayer("http://openptmap.org/tiles/{z}/{x}/{y}.png", {
					fmName: "Public transportation",
					fmKey: "OPTM",
					attribution: $sce.trustAsHtml('© <a href="http://openptmap.org/" target="_blank">OpenPTMap</a> / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
					zIndex: 300,
					noWrap: true
				}),
				L.tileLayer("http://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png", {
					fmName: "Hiking paths",
					fmKey: "Hike",
					attribution: $sce.trustAsHtml('© <a href="http://osm.lonvia.de/world_hiking.html" target="_blank">Lonvia\'s Hiking Map</a> / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
					zIndex: 300,
					noWrap: true
				}),
				L.tileLayer("http://korona.geog.uni-heidelberg.de/tiles/asterh/x={x}&y={y}&z={z}", {
					fmName: "Relief",
					fmKey: "Rlie",
					attribution: $sce.trustAsHtml('© <a href="http://korona.geog.uni-heidelberg.de/" target="_blank">OpenMapSurfer</a> / <a href="http://www.meti.go.jp/english/press/data/20090626_03.html" target="_blank">METI</a> / <a href="https://lpdaac.usgs.gov/products/aster_policies" target="_blank">NASA</a>'),
					zIndex: 300,
					noWrap: true
				}),
				fmUtils.graticule(map, {
					fmName: "Graticule",
					fmKey: "grid",
					zIndex: 300,
					noWrap: true
				}),
				fmUtils.freieTonne(map, {
					fmName: "Sea marks",
					fmKey: "FrTo",
					attribution: $sce.trustAsHtml('© <a href="https://www.freietonne.de/" target="_blank">FreieTonne</a> / <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM Contributors</a>'),
					zIndex: 300,
					noWrap: true
				})
			].forEach((it) => {
				this.layers[it.options.fmKey] = it;

				if(it.options.fmBase && it !== mapnikLayer) {
					it.on("tileerror", (err) => {
						mapnikLayer._tileZoom = err.target._tileZoom;
						let fallbackUrl = mapnikLayer.getTileUrl(err.coords);
						if(err.tile.src != fallbackUrl)
							err.tile.src = fallbackUrl;
					});
				}
			});

			this.tooltipOptions = {
				direction: "right"
			};

			$scope.loaded = false;

			this.map = L.map($(".fm-map", $element)[0]);

			this.map.createPane("fmHighlightMarkerPane");
			this.map.createPane("fmHighlightShadowPane");
			this.map.createPane("fmHighlightPane");

			this.map._controlCorners.bottomcenter = L.DomUtil.create("div", "leaflet-bottom fm-leaflet-center", this.map._controlContainer);

			$scope.$watch("client.padData.clusterMarkers", (clusterMarkers) => {
				var currentMarkers = this.markerCluster ? this.markerCluster.getLayers() : [ ];

				if(this.markerCluster)
					this.markerCluster.clearLayers().remove();

				if(clusterMarkers) {
					this.markerCluster = L.markerClusterGroup({
						showCoverageOnHover: false,
						maxClusterRadius: 50
					});
				} else
					this.markerCluster = L.featureGroup();

				this.map.addLayer(this.markerCluster);

				for(let marker of currentMarkers)
					this.markerCluster.addLayer(marker);
			});

			this.map.almostOver.options.distance = 10;

			L.control.locate({
				flyTo: true,
				icon: "glyphicon glyphicon-screenshot",
				iconLoading: "glyphicon glyphicon-screenshot"
			}).addTo(this.map);

			L.control.mousePosition({
				emptyString: "0, 0",
				separator: ", ",
				position: "bottomright"
			}).addTo(this.map);

			L.control.graphicScale({
				fill: "hollow",
				position: "bottomcenter"
			}).addTo(this.map);

			this.map.on('almost:over', (e) => {
				e.layer.fire('fm-almostover', e);
				$(this.map.getContainer()).addClass("fm-almostover");
			});

			this.map.on('almost:out', (e) => {
				e.layer.fire('fm-almostout', e);
				$(this.map.getContainer()).removeClass("fm-almostover");
			});

			this.map.on('almost:click', (e) => {
				e.layer.fire('click', e, true);
			});

			this.map.on('almost:move', (e) => {
				e.layer.fire('fm-almostmove', e);
			});

			this.startMarkerColour = "00ff00";
			this.dragMarkerColour = "ffd700";
			this.endMarkerColour = "ff0000";
			this.searchMarkerColour = "000000";

			if(L.Browser.touch && !L.Browser.pointer) {
				// Long click will call the contextmenu event
				this.map.on("contextmenu", ((e) => {
					this.mapEvents.$broadcast("longmousedown", e.latlng);
				}).fmWrapApply($scope));
			} else {
				fmUtils.onLongMouseDown(this.map, ((e) => {
					this.mapEvents.$broadcast("longmousedown", e.latlng);
				}).fmWrapApply($scope));
			}

			this.map.on("layeradd", () => {
				this.mapEvents.$broadcast("layerchange");
			});

			this.map.on("layerremove", () => {
				this.mapEvents.$broadcast("layerchange");
			});

			this.getCurrentView = (addFilter) => {
				var ret = fmUtils.leafletToFmBbox(this.map.getBounds());
				ret.layers = [ ];

				this.map.eachLayer((it) => {
					if(it.options.fmBase)
						ret.baseLayer = it.options.fmKey;
					else if(it.options.fmKey)
						ret.layers.push(it.options.fmKey);
				});

				if(addFilter)
					ret.filter = $scope.client.filterExpr;

				return ret;
			};

			this.displayView = (view, _zoomFactor=0) => {
				var layers = [ view && this.layers[view.baseLayer] ? view.baseLayer : Object.keys(this.layers)[0] ].concat(view ? view.layers : [ ]);
				this.map.eachLayer((it) => {
					if(it.options.fmKey && layers.indexOf(it.options.fmKey) == -1)
						this.map.removeLayer(it);
				});
				layers.forEach((it) => {
					if(!this.layers[it])
						return;

					if(!this.map.hasLayer(this.layers[it]))
						this.map.addLayer(this.layers[it]);
				});

				var bounds = fmUtils.fmToLeafletBbox(view || { top: -90, bottom: 90, left: -180, right: 180 });

				try {
					this.map.getCenter(); // Throws exception if map not initialised
					this.map.flyTo(bounds.getCenter(), this.map.getBoundsZoom(bounds, !view)+_zoomFactor);
				} catch(e) {
					this.map.setView(bounds.getCenter(), this.map.getBoundsZoom(bounds, !view)+_zoomFactor);
				}

				$scope.client.setFilter(view && view.filter);
			};

			var transparentLayer = new (L.Layer.extend({
				onAdd: function(map) {
					// We append this element to the map container, not to the layers pane, so that it doesn't get moved
					// around and always covers 100% of the map.
					this._el = $('<div class="fm-clickHandler"></div>').appendTo(map.getContainer())[0];
					this.addInteractiveTarget(this._el);
				},
				onRemove: function(map) {
					$(this._el.remove());
					this.removeInteractiveTarget(this._el);
				}
			}))();

			this.addClickListener = (listener, moveListener) => {
				let listenMove = (e) => {
					moveListener({ lat: e.latlng.lat, lon: e.latlng.lng });
				};

				let listenClick = (e) => {
					transparentLayer.removeFrom(this.map).off("click", listenClick);

					if(moveListener)
						transparentLayer.off("mousemove", listenMove);

					if(e) {
						e.originalEvent.preventDefault();
						listener({ lat: e.latlng.lat, lon: e.latlng.lng });
					}
				};

				transparentLayer.addTo(this.map).on("click", listenClick);

				if(moveListener)
					transparentLayer.on("mousemove", listenMove);

				return {
					cancel: listenClick
				};
			};

			this.getLayerInfo = () => {
				var ret = { base: [ ], overlay: [ ] };
				for(var i in this.layers) {
					var it = this.layers[i];
					(it.options.fmBase ? ret.base : ret.overlay).push({ visibility: this.map.hasLayer(it), name: it.options.fmName, permalinkName: it.options.fmKey, attribution: it.options.attribution });
				}
				return ret;
			};

			this.showLayer = (key, show) => {
				if(!this.layers[key])
					return;

				if(!this.layers[key].options.fmBase) {
					if(!this.map.hasLayer(this.layers[key]) != !show)
						show ? this.map.addLayer(this.layers[key]) : this.map.removeLayer(this.layers[key]);
				} else if(!this.map.hasLayer(this.layers[key])) {
					this.map.eachLayer((it) => {
						if(it.options.fmBase)
							this.map.removeLayer(it);
					});

					this.map.addLayer(this.layers[key]);
				}
			};

			$scope.loading = 0;

			this.loadStart = () => {
				$scope.loading++;
			};

			this.loadEnd = () => {
				$scope.loading--;
			};

			$scope.client.on("loadStart", () => {
				this.loadStart();
			});

			$scope.client.on("loadEnd", () => {
				this.loadEnd();
			});

			this.messages = fmMapMessages(this);
			this.infoBox = fmInfoBox(this);
			this.markersUi = fmMapMarkers(this);
			this.linesUi = fmMapLines(this);
			this.viewsUi = fmMapViews(this);
			this.typesUi = fmMapTypes(this);
			this.padUi = fmMapPad(this);
			this.historyUi = fmMapHistory(this);
			this.routeUi = fmMapRoute(this);

			this.loadInitialView = () => {
				return $q.resolve().then(() => {
					if(this.client.padId) {
						return $q((resolve) => {
							var loadedWatcher = $scope.$watch("client.padData", (padData) => {
								if(padData != null) {
									loadedWatcher();
									resolve(padData);
								}
							});

							var serverErrorWatcher = $scope.$watch("client.serverError", (serverError) => {
								if(serverError != null) {
									serverErrorWatcher();

									if(serverError.indexOf('does not exist') != -1) {
										$scope.client.serverError = null;
										this.padUi.createPad($scope.client.padId, true);
									}

									resolve();
								}
							});
						});
					}
				}).then((padData) => {
					if(padData) {
						this.displayView(padData.defaultView);
					} else {
						return $q.resolve($.get({
							url: "https://freegeoip.net/json/",
							dataType: "json"
						})).then((data) => {
							this.map.setView([data.latitude, data.longitude], 6);
							this.displayView(this.getCurrentView()); // To set base layer
						}).catch((err) => {
							console.error("Error contacting GeoIP service", err);
							this.displayView();
						});
					}
				});
			};

			var errorMessage = null;
			$scope.$watch("client.disconnected", (disconnected) => {
				if(disconnected && !errorMessage && !$scope.client.serverError)
					errorMessage = this.messages.showMessage("danger", "The connection to the server was lost.");
				else if(!disconnected && errorMessage) {
					errorMessage.close();
					errorMessage = null;
				}
			});

			$scope.$watch("client.serverError", (serverError) => {
				if(errorMessage) {
					errorMessage.close();
					errorMessage = null;
				}

				if(serverError)
					errorMessage = this.messages.showMessage("danger", serverError);
			});

			let updateBbox = () => {
				$scope.client.updateBbox(fmUtils.leafletToFmBbox(this.map.getBounds(), this.map.getZoom()));
			};

			this.map.on("moveend", () => {
				if($scope.client.padId || $scope.client.route)
					updateBbox();
			});

			// When no pad is loaded, there is no need to update the bbox, except if a route gets loaded
			let setRoute = $scope.client.setRoute;
			$scope.client.setRoute = function() {
				if(!$scope.client.padId)
					updateBbox();
				return setRoute.apply(this, arguments);
			};
			let lineToRoute = $scope.client.lineToRoute;
			$scope.client.lineToRoute = function() {
				if(!$scope.client.padId)
					updateBbox();
				return lineToRoute.apply(this, arguments);
			};

			$scope.$watch("client.route", () => {
				// When no pad is opened and a route is set for the first time,
				if(!$scope.client.padId && $scope.client.route)
					$scope.client.updateBbox(fmUtils.leafletToFmBbox(this.map.getBounds(), this.map.getZoom()));
			})
		},
		link: function(scope, element, attrs, ctrl) {
			// Has to be called after the controller is initialised so that loadInitialView can be overridden by fmHash
			// Delay it even further so that sub-directives are initialised (fm-hash needs to communicate with fm-search)
			setTimeout(() => {
				ctrl.loadInitialView().then(() => {
					scope.loaded = true;
				});
			}, 0);
		}
	};
});
