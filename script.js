
document.addEventListener('alpine:init', () => {
	window.Alpine = Alpine
	Alpine.store('ticker', {
		init() {
			console.log('alpine init')
			this.fetchData()
			// this.dividendsChart()
		  },
		  
		  on: false,
		  data: {},
		  company: { title: '' },
		  prices: [],
		  dividends: [],
		  calculations: [],
		  dividendsDates: [],
		  companies: [],
		  
		  async fetchData() {
			fetch(window.location.origin + `:5000/?ticker=${new URLSearchParams(window.location.search).get('hash')||'e48ded55-6886-4c91-92d6-e6b93917f68a'}`)
			.then(response => response.json())
			.then(data => {
				this.data = data;
				this.prices = (data.prices||[]).sort((a,b) => new Date(a.eodhd_date_str) < new Date(b.eodhd_date_str));
				this.dividends = (data.dividends||[]).sort((a,b) => new Date(a.eodhd_date_str) > new Date(b.eodhd_date_str));
				this.calculations = (data.calculations||[]).sort((a,b) => new Date(a.eodhd_date_str) < new Date(b.eodhd_date_str));
				this.dividends.forEach(d => {
					if( !this.dividendsDates.includes( new Date(d.eodhd_date_str).getUTCFullYear() ) ){
						this.dividendsDates.push( new Date(d.eodhd_date_str).getUTCFullYear() )
					}
				});

				this.loadPricesChart()
				this.dividendsChart()
				this.distanceChart()
				this.variationsChart()
				this.overAllRank()
				this.allOverAnalysisChart()
				this.overAllRank2()
			})
			.catch(error => { console.error('Error fetching data:', error); })

			fetch('https://www.aitadawulaty.com/_functions/companyCodes')
			.then(res => res.json())
			.then(res => {
				let hash = new URLSearchParams(window.location.search).get('hash')
				this.company = (res.companies||[]).find(c => c._id == hash)
				this.companies = res.companies||[]
			})
			.catch(e => console.log(e))
			.finally(e => {
				setTimeout(() => {
					$('#datatable').DataTable().destroy();
					let rows = [];
					this.companies.forEach(c => {
						rows.push(`<tr>
							<td class="english">
								<a href="?hash=${c._id}" title="Remove from watchlist "><i class="fa fa-star" style='color:yellow'></i></a> ${c.code}
							</td>
							<td class="english"><a href="?hash=${c._id}" style="color:#333;">${c.title}</a></td>
							<td class="english">${(((c.close||0-c.open||0)/c.open||0)*100).toFixed(2)}%</td>
						</tr>`)
					})
					$('#datatable').find('tbody').append(rows.join(''));
					$('#datatable').DataTable({ searching: true, paging: false, ordering: true, scroller: true, }).draw();

					var addClassUpperDiv = document.getElementById('datatable_filter');
					var parentDiv = addClassUpperDiv?.closest('.col-md-6');
					if (parentDiv) {
						parentDiv.classList.add('my_own_class');
					}
				}, 2000)
			})
		},

		async loadPricesChart(){
			am5.ready(() => {

				var root = am5.Root.new("priceChart");
				root.setThemes([ am5themes_Animated.new(root) ]);
				root._logo.dispose();
				// Create chart
				// https://www.amcharts.com/docs/v5/charts/xy-chart/
				var chart = root.container.children.push(am5xy.XYChart.new(root, {
					panX: true, wheelX: "panX",
					panY: true, wheelY: "zoomX",
					pinchZoomX: true, paddingLeft: 0
				}));

				var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" } ));
				cursor.lineY.set("visible", false);
				// Generate random data
				var inputDate = "2021-12-01";
				var [year, month, day] = inputDate.split('-');
				var date = new Date(year, month - 1, day);
				date.setHours(0, 0, 0, 0);

				const generateDatas = (count) => {
					var data = [];
					console.log(this)
					for (var i = 0; i < this?.prices?.length; ++i) {
						var inputDate = this.prices[i].eodhd_date_str;
						var [year, month, day] = inputDate.split('-');
						var date1 = new Date(year, month - 1, day);
						am5.time.add(date1, "day", 1);
						data.push({ date: date1.getTime(), value: parseFloat(this?.prices[i].close, 10) });
					}
					return data;
				}

				var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
					maxDeviation: 0.2,
					baseInterval: {
						timeUnit: "day",
						count: 1
					},
					renderer: am5xy.AxisRendererX.new(root, {
						minorGridEnabled: true,
						minGridDistance: 90
					}),
					tooltip: am5.Tooltip.new(root, {})
				}));

				var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
					renderer: am5xy.AxisRendererY.new(root, {})
				}));
				// Add series
				// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
				var series = chart.series.push(am5xy.LineSeries.new(root, {
					name: "Series",
					xAxis: xAxis,
					yAxis: yAxis,
					valueYField: "value",
					valueXField: "date",
					fill: am5.color(0x68dc76),
					stroke: am5.color(0x68dc76),
					tooltip: am5.Tooltip.new(root, {
						pointerOrientation: "down",
						labelText: "{valueY}",
						label: am5.Label.new(root, {
							propertyFields: {
								fill: am5.color(0x8e54e9) // Set label text color
							}
						})
					})
				}));
				/* xAxis.get("renderer").labels.template.setAll({
					fill: root.interfaceColors.get("alternativeText")
				}); */
				xAxis.setAll({
					background: am5.Rectangle.new(root, {
					  fill: root.interfaceColors.get("alternativeBackground"),
					  fillOpacity: 0
					})
				});
				/* yAxis.get("renderer").labels.template.setAll({
					fill: root.interfaceColors.get("alternativeText")
				}); */
				yAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});
				series.fills.template.setAll({
					fillOpacity: 0.2,
					visible: true
				});
				chart.set("scrollbarX", am5.Scrollbar.new(root, {
					orientation: "horizontal",
					minHeight: 0
				}));
				let scrollbarX = chart.get("scrollbarX");
				scrollbarX.startGrip.setAll({
					visible: false
				});
				scrollbarX.endGrip.setAll({
					visible: false
				});
				// Set data
				var data = generateDatas(1200);
				series.data.setAll(data);
				series.appear(1000);
				chart.appear(1000, 100);
			})
		},

		async dividendsChart(){
			am5.ready(() => {

				let root = am5.Root.new("dividendsChart");
				root.setThemes([ am5themes_Animated.new(root) ]);
				root._logo.dispose();

				let chart = root.container.children.push(am5xy.XYChart.new(root, {
					panX: true, wheelX: "panX",
					panY: true, wheelY: "zoomX",
					pinchZoomX: true, paddingLeft:0, paddingRight:1
				}));

				let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
				cursor.lineY.set("visible", false);

				let xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 30, minorGridEnabled: true });				
				xRenderer.labels.template.setAll({
					centerY: am5.p50, centerX: am5.p100,
					rotation: -20, paddingRight: 15
				});
				xRenderer.grid.template.setAll({ location: 1 })
				let xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
					maxDeviation: 0.3,
					categoryField: "date",
					renderer: xRenderer,
					tooltip: am5.Tooltip.new(root, {})
				}));
				
				let yRenderer = am5xy.AxisRendererY.new(root, { strokeOpacity: 0.1 })
				let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { maxDeviation: 0.3, renderer: yRenderer }));

				let series = chart.series.push(am5xy.ColumnSeries.new(root, {
					name: "Series 1",
					xAxis: xAxis,
					yAxis: yAxis,
					valueYField: "value",
					sequencedInterpolation: true,
					categoryXField: "date",
					tooltip: am5.Tooltip.new(root, {
						labelText: "{valueY}"
				  	})
				}));
				
				series.columns.template.setAll({ cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0 });
				series.columns.template.adapters.add("fill", function (fill, target) {
				  	return chart.get("colors").getIndex(series.columns.indexOf(target));
				});
				
				series.columns.template.adapters.add("stroke", function (stroke, target) {
				  	return chart.get("colors").getIndex(series.columns.indexOf(target));
				});

				let data = this.dividends.reverse().map(d => ({ date: d.eodhd_date_str, value: d.value }))
				xAxis.data.setAll(data);
				series.data.setAll(data);
				series.appear(1000);
				chart.appear(1000, 100);

			});
		},

		async distanceChart(){
			am5.ready(() => {

				var root = am5.Root.new("distanceChart");
				root.setThemes([ am5themes_Animated.new(root) ]);
				root._logo.dispose();
				var chart = root.container.children.push(am5xy.XYChart.new(root, {
					panX: true, wheelX: "panX", pinchZoomX: true,
					panY: true, wheelY: "zoomX", paddingLeft: 0,
				}));
				var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
				cursor.lineY.set("visible", false);
				// Generate random data
				var inputDate = "2021-12-01";
				var [year, month, day] = inputDate.split('-');
				var date = new Date(year, month - 1, day);
				date.setHours(0, 0, 0, 0);
		
				function generateDatas(data=[]) {
					return data.map(c => {
						var [year, month, day] = c.eodhd_date_str.split('-');
						var date1 = new Date(year, month - 1, day);
						am5.time.add(date1, "day", 0);
						return {
							date: date1.getTime(),
							value: parseFloat(c.dis_of_closing_from_low, 10)
						}
					})
				}

				var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
					maxDeviation: 0.2,
					baseInterval: { timeUnit: "day", count: 1 },
					renderer: am5xy.AxisRendererX.new(root, {
						minorGridEnabled: true,
						minGridDistance: 90
					}),
					tooltip: am5.Tooltip.new(root, {})
				}));

				var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}) }));
				var series = chart.series.push(am5xy.LineSeries.new(root, {
					name: "Series",
					xAxis: xAxis,
					yAxis: yAxis,
					valueYField: "value",
					valueXField: "date",
					fill: am5.color(0xFF0000),
					stroke: am5.color(0xFF0000),
					tooltip: am5.Tooltip.new(root, {
						pointerOrientation: "down",
						labelText: "{valueY}",
						label: am5.Label.new(root, {
							propertyFields: {
								fill: am5.color(0x8e54e9) // Set label text color
							}
						})
					})
				}));
				// xAxis.get("renderer").labels.template.setAll({ fill: root.interfaceColors.get("alternativeText") });
				xAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});
				// yAxis.get("renderer").labels.template.setAll({ fill: root.interfaceColors.get("alternativeText") });
				yAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});

				series.fills.template.setAll({ fillOpacity: 0.2, visible: true });
				chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", minHeight: 0 }));

				let scrollbarX = chart.get("scrollbarX");
				scrollbarX.startGrip.setAll({ visible: false });
				scrollbarX.endGrip.setAll({ visible: false });
				// Set data
				var data = generateDatas(this.calculations);
				series.data.setAll(data);
				series.appear(1000);
				chart.appear(1000, 100);
			});
		},

		async variationsChart(){
			am5.ready(() => {

				let variation = this.calculations.map(c => ({variation: c.CV_of_past_two_years, created_at: c.eodhd_date_str}))

				var root = am5.Root.new("stabilityChart");
				root.setThemes([ am5themes_Animated.new(root) ]);
				root._logo.dispose();
				var chart = root.container.children.push(am5xy.XYChart.new(root, {
					panX: true, wheelX: "panX", pinchZoomX: true,
					panY: true, wheelY: "zoomX", paddingLeft: 0
				}));
				var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
				cursor.lineY.set("visible", false);
				var inputDate = "2021-12-01";
				var [year, month, day] = inputDate.split('-');
				var date = new Date(year, month - 1, day);
				date.setHours(0, 0, 0, 0);

				function generateDatas(data) {
					return data.map(c => {
						var [year, month, day] = c.eodhd_date_str.split('-');
						var date1 = new Date(year, month - 1, day);
						am5.time.add(date1, "day", 0);
						return {
							date: date1.getTime(),
							value: parseFloat(c.CV_of_past_two_years, 10)
						}
					})
				}
				// Create axes
				// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
				var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
					maxDeviation: 0.2,
					baseInterval: {
						timeUnit: "day",
						count: 1
					},
					renderer: am5xy.AxisRendererX.new(root, {
						minorGridEnabled: true,
						minGridDistance: 90
					}),
					tooltip: am5.Tooltip.new(root, {})
				}));
				var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
					renderer: am5xy.AxisRendererY.new(root, {})
				}));
				// Add series
				// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
				var series = chart.series.push(am5xy.LineSeries.new(root, {
					name: "Series",
					xAxis: xAxis,
					yAxis: yAxis,
					valueYField: "value",
					valueXField: "date",
					fill: am5.color(0x68dc76),
					stroke: am5.color(0x68dc76),
					tooltip: am5.Tooltip.new(root, {
						pointerOrientation: "down",
						labelText: "{valueX}",
						label: am5.Label.new(root, {
							propertyFields: {
								fill: am5.color(0x8e54e9) // Set label text color
							}
						})
					})
				}));
				// xAxis.get("renderer").labels.template.setAll({ fill: root.interfaceColors.get("alternativeText") });
				xAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});
				// yAxis.get("renderer").labels.template.setAll({ fill: root.interfaceColors.get("alternativeText") });
				yAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});
				series.fills.template.setAll({ fillOpacity: 0.2, visible: true });
				chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", minHeight: 0 }));
				// chart.scrollbarX.disabled = true;
				let scrollbarX = chart.get("scrollbarX");
				scrollbarX.startGrip.setAll({ visible: false });
				scrollbarX.endGrip.setAll({ visible: false });
				// Set data
				var data = generateDatas(this.calculations);
				series.data.setAll(data);
				series.appear(1000);
				chart.appear(1000, 100);
			}); // end am5.ready()
		},

		async allOverAnalysisChart(){
			am5.ready(() => {
				var root = am5.Root.new("allOverAnalysisChart");

				root.setThemes([ am5themes_Animated.new(root) ]);
				root._logo.dispose();
				// Create chart
				// https://www.amcharts.com/docs/v5/charts/radar-chart/
				var chart = root.container.children.push(am5radar.RadarChart.new(root, {
					panX: false, wheelX: "panX",
					panY: false, wheelY: "zoomX",
				}));
				// Add cursor
				// https://www.amcharts.com/docs/v5/charts/radar-chart/#Cursor
				var cursor = chart.set("cursor", am5radar.RadarCursor.new(root, { behavior: "zoomX" }));
				cursor.lineY.set("visible", false);
				// Create axes and their renderers
				// https://www.amcharts.com/docs/v5/charts/radar-chart/#Adding_axes
				var xRenderer = am5radar.AxisRendererCircular.new(root, {});
				xRenderer.labels.template.setAll({ radius: 10 });
				var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
					maxDeviation: 0,
					categoryField: "country",
					renderer: xRenderer,
					tooltip: am5.Tooltip.new(root, {
						pointerOrientation: "up",
						labelText: "{hover}", // Use an empty string initially
						label: am5.Label.new(root, { fontSize: 5 })
					}),
				}));

				var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
					renderer: am5radar.AxisRendererRadial.new(root, {})
				}));
				// Create series
				// https://www.amcharts.com/docs/v5/charts/radar-chart/#Adding_series
				var series = chart.series.push(am5radar.RadarLineSeries.new(root, {
					name: "Series",
					xAxis: xAxis,
					yAxis: yAxis,
					valueYField: "litres",
					fill: am5.color(0xff0000),
					label: am5.color(0xff0000),
					stroke: am5.color(0x68dc76),
					categoryXField: "country",
					tooltip: am5.Tooltip.new(root, {
						pointerOrientation: "down",
						labelText: "{valueY}",
						label: am5.Label.new(root, {
							propertyFields: {
								fill: am5.color(0x8e54e9),
								// Set label text color
							}
						})
					}),
				}));
				series.strokes.template.setAll({ strokeWidth: 2 });

				series.bullets.push(function() {
					return am5.Bullet.new(root, {
						sprite: am5.Circle.new(root, {
							radius: 5,
							fill: series.get("fill")
						})
					});
				});
				xAxis.get("renderer").labels.template.setAll({
					// fill: root.interfaceColors.get("alternativeText"),
					fontSize: 9
				});
				xAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});
				yAxis.get("renderer").labels.template.setAll({
					// fill: root.interfaceColors.get("alternativeText")
				});
				yAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});
				// Set data
				// https://www.amcharts.com/docs/v5/charts/radar-chart/#Setting_data


				let data = [];

				// let years = [];
				/* this.calculations.forEach(c => {
					let key = c.eodhd_date_str.split('-')[0]
					years[key] = [...(years[key]||[]), c]
				}) */
				// let current_year = years[years.length-1]?.[0]
				let price = this.calculations[0]
				let year = Number(price.eodhd_date_str.split('-')[0])

				data = [{
				  "country": `% of ${year} Dividends of high`,
				  "hover": `${year} dividends/2023 highest`,
				  "litres": price.current_year_div_from_high
				}, {
				  "country": `% of ${year} Dividends of low`,
				  "hover": `${year} dividends/2003 lowest`,
				  "litres": price.current_year_div_from_low
				}, {
					"country": `% of ${year} Dividends of closing`,
					"hover": `${year} dividends / Current Price`,
					"litres": price.current_year_div_from_close
				}, {
				  "country": `% of ${year-1} Dividends of high`,
				  "hover": `${year-1} dividends / ${year-1} highest`,
				  "litres": price.past_year_div_from_high
				}, {
				  "country": `% of ${year-1} Dividends of low`,
				  "hover": `${year} dividends / ${year-1} lowest`,
				  "litres": price.past_year_div_from_low
				}, {
				  "country": "Difference between Current and Lowest",
				  "hover": `Means how close the current price to the\nlowest known price over the past 2 years.\n100% means the stock in its lowest\nknown price since 2 years ago`,
				  "litres": price.dis_of_closing_from_low
				}, {
				  "country": "Stability of Prices ",
				  "hover": `This is a measure to calculate the stability\nof the prices over the past 2 years. A 100%\nis most stable and 0% means high volatility`,
				  "litres": price.CV_of_past_two_years

				}, ];




				/* let groupingAvgs = [];
				for(key in grouping){
					let group = grouping[k]||[]
					let avgs = {
						highAvg: group.reduce((sum,c) => sum+Number(c.current_year_div_from_high), 0),
						lowAvg: group.reduce((sum,c) => sum+Number(c.current_year_div_from_low), 0),
						highAvg: group.reduce((sum,c) => sum+Number(c.current_year_div_from_high), 0),
					}
				} */


				series.data.setAll(data);
				xAxis.data.setAll(data);
				// Animate chart and series in
				// https://www.amcharts.com/docs/v5/concepts/animations/#Initial_animation
				series.appear(1000);
				chart.appear(1000, 100);
			}); // end am5.ready()
		},

		async overAllRank(){
			am5.ready(() => {
				var root = am5.Root.new("overallRankChart");
				root.setThemes([ am5themes_Animated.new(root) ]);
				root._logo.dispose();
				var chart = root.container.children.push(am5xy.XYChart.new(root, {
					panX: true, wheelX: "panX", pinchZoomX: true,
					panY: true, wheelY: "zoomX", paddingLeft: 0
				}));
				var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
				cursor.lineY.set("visible", false);
				// Generate random data
				var inputDate = "2021-12-01";
				var [year, month, day] = inputDate.split('-');
				var date = new Date(year, month - 1, day);
				date.setHours(0, 0, 0, 0);

				function generateDatas(data) {
					return data.map(c => {
						var [year, month, day] = c.eodhd_date_str.split('-');
						var date1 = new Date(year, month - 1, day);
						am5.time.add(date1, "day", 0);
						return {
							date: date1.getTime(),
							value: parseFloat(c.overall_calcuation, 10)
						}
					})
				}
				var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
					maxDeviation: 0.2,
					baseInterval: {
						timeUnit: "day",
						count: 1
					},
					renderer: am5xy.AxisRendererX.new(root, {
						minorGridEnabled: true,
						minGridDistance: 90
					}),
					tooltip: am5.Tooltip.new(root, {})
				}));
				var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
					renderer: am5xy.AxisRendererY.new(root, {})
				}));
				// Add series
				// https://www.amcharts.com/docs/v5/charts/xy-chart/series/
				var series = chart.series.push(am5xy.LineSeries.new(root, {
					name: "Series",
					xAxis: xAxis,
					yAxis: yAxis,
					valueYField: "value",
					valueXField: "date",
					fill: am5.color(0x68dc76),
					stroke: am5.color(0x68dc76),
					tooltip: am5.Tooltip.new(root, {
						pointerOrientation: "down",
						labelText: "{valueY}",
						label: am5.Label.new(root, {
							propertyFields: {
								fill: am5.color(0x8e54e9) // Set label text color
							}
						})
					})
				}));
				// xAxis.get("renderer").labels.template.setAll({ fill: root.interfaceColors.get("alternativeText") });
				xAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});
				// yAxis.get("renderer").labels.template.setAll({ fill: root.interfaceColors.get("alternativeText") });
				yAxis.setAll({
					background: am5.Rectangle.new(root, {
						fill: root.interfaceColors.get("alternativeBackground"),
						fillOpacity: 0
					})
				});
				series.fills.template.setAll({
					fillOpacity: 0.2,
					visible: true
				});
				// Add scrollbar
				// https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
				chart.set("scrollbarX", am5.Scrollbar.new(root, {
					orientation: "horizontal",
					minHeight: 0
				}));
				// chart.scrollbarX.disabled = true;
				let scrollbarX = chart.get("scrollbarX");
				scrollbarX.startGrip.setAll({ visible: false });
				scrollbarX.endGrip.setAll({ visible: false });
				// Set data
				var data = generateDatas(this.calculations);
				series.data.setAll(data);
				// Make stuff animate on load
				// https://www.amcharts.com/docs/v5/concepts/animations/
				series.appear(1000);
				chart.appear(1000, 100);
			}); // end am5.ready()
		},

		async overAllRank2(){
			am5.ready(() => {

				var root = am5.Root.new("chartdiv_2");
				root.setThemes([ am5themes_Animated.new(root) ]);
				root._logo.dispose();
				var chart = root.container.children.push(am5xy.XYChart.new(root, {
				  panX: true, wheelX: "panX", pinchZoomX: true,
				  panY: true, wheelY: "zoomX", paddingLeft: 0
				}));
				var cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
				cursor.lineY.set("visible", false);
				// Generate random data
				var inputDate = "2021-12-01";
				var [year, month, day] = inputDate.split('-');
				var date = new Date(year, month - 1, day);
				date.setHours(0, 0, 0, 0);
				var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
				  maxDeviation: 0.2,
				  baseInterval: {
					timeUnit: "day",
					count: 1
				  },
				  renderer: am5xy.AxisRendererX.new(root, {
					minorGridEnabled: true,
					minGridDistance: 90
				  }),
				  tooltip: am5.Tooltip.new(root, {})
				}));
				var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
				  renderer: am5xy.AxisRendererY.new(root, {})
				}));
				var series = chart.series.push(am5xy.LineSeries.new(root, {
				  name: "Series",
				  xAxis: xAxis, valueYField: "value",
				  yAxis: yAxis, valueXField: "date",
				  fill: am5.color(0xFF0000),
				  stroke: am5.color(0xFF0000),
				  tooltip: am5.Tooltip.new(root, {
					pointerOrientation: "down",
					labelText: "{valueY}",
					label: am5.Label.new(root, {
					  propertyFields: {
						fill: am5.color(0x8e54e9) // Set label text color
					  }
					})
				  })
				}));
				// xAxis.get("renderer").labels.template.setAll({ fill: root.interfaceColors.get("alternativeText") });
				xAxis.setAll({
				  background: am5.Rectangle.new(root, {
					fill: root.interfaceColors.get("alternativeBackground"),
					fillOpacity: 0
				  })
				});
				// yAxis.get("renderer").labels.template.setAll({ fill: root.interfaceColors.get("alternativeText") });
				yAxis.setAll({
				  background: am5.Rectangle.new(root, {
					fill: root.interfaceColors.get("alternativeBackground"),
					fillOpacity: 0
				  })
				});
				series.fills.template.setAll({ fillOpacity: 0.2, visible: true });
				chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal", minHeight: 0 }));
				// chart.scrollbarX.disabled = true;
				let scrollbarX = chart.get("scrollbarX");
				scrollbarX.startGrip.setAll({
				  visible: false
				});
				scrollbarX.endGrip.setAll({
				  visible: false
				});
				// Set data
				var data = this.dividends.map(d => {
					var [year, month, day] = d.eodhd_date_str.split('-');
					var date = new Date(year, month - 1, day);
					return {date: date.getTime(), value: parseFloat(d.value, 10)}
				})
				series.data.setAll(data);
				series.appear(1000);
				chart.appear(1000, 100);
			  }); // end am5.ready()
		},

	})
})