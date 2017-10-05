//Map and measure variables
var map;
var projectsRI;
var toolbar;
var xPointArray = new Array();
var globalX;
var globalY;
var measureUnits="Miles";
var theDistMeasured=0;
var theLegend;
var tiled;
var polyline;

//Search variables
var citySearchLyr;
var countySearchLyr;
var csSearchLyr;
var districtSearchLyr;
var highwaySearchLyr;
var top100SearchLyr;

//Overlay variables
var aadtLyr;
var labelLayerAADT;
var areaOfficeLyr;
var COGLyr;
var FCLyr;
var UZAlyr;
var NatlFreightLyr;
var TXFreightLyr;
var NHSLyr;
var maintOfficeLyr;
var txTrunkLyr;
var MarkerLyr;
var labelLayerMarker;
var MPOLyr;
var nonAttainLyr;
var controlSectionLyr;
var labelLayerCS;
var USHouseLyr;
var railRoadLyr;
var speedLimitLyr;
var StateHouseLyr;
var StateSenateLyr;
var futureTrafficLyr;
var longTermPlanLyr;
var constScheduledLyr;
var finalForConstLyr;
var underDevLyr;
var minuteOrderLyr;
var pavementConditionLyr;
var VerticalLyr;
var permStationLyr;
var top100Lyr;
var labelLayerTop100;
var activeOverlay;
var currentMeasure=0;
var activeTab = 'tcMap';
var deLength=0;

require(["esri/map",
"esri/renderers/Renderer",
"dojo/dom-construct",
"esri/layers/LayerInfo",
"esri/dijit/Scalebar",
"dojo/on",

"esri/tasks/query",
"esri/tasks/QueryTask",
"esri/arcgis/utils",
"esri/dijit/Legend",
"esri/geometry/webMercatorUtils",
"dojo/dom",
"esri/layers/KMLLayer",
"dojo/parser",
"esri/toolbars/draw",

"esri/geometry/geodesicUtils",
"esri/units",
"esri/graphic",
"esri/graphicsUtils",
"esri/SpatialReference",
"esri/geometry/Extent",
"esri/layers/FeatureLayer",

"esri/symbols/SimpleLineSymbol",
"esri/symbols/CartographicLineSymbol",
"esri/renderers/UniqueValueRenderer",
"esri/symbols/SimpleMarkerSymbol",

"esri/symbols/SimpleFillSymbol",
"esri/symbols/TextSymbol",
"esri/renderers/SimpleRenderer",
"esri/renderers/ClassBreaksRenderer",
"esri/layers/LabelLayer",
"esri/layers/LabelClass",
"esri/Color",
"esri/InfoTemplate",
"esri/layers/ArcGISTiledMapServiceLayer",

"esri/geometry/Polyline",
"esri/geometry/Point",
"esri/symbols/Font",
"esri/dijit/PopupTemplate",
"dojo/number",

"dojo/domReady!"], function (Map, Renderer, domConstruct, LayerInfo, Scalebar, on,
  Query, QueryTask, arcgisUtils, Legend, webMercatorUtils, dom, KMLLayer, parser, Draw,
  geodesicUtils, Units, Graphic, graphicsUtils, SpatialReference, Extent, FeatureLayer,
  SimpleLineSymbol, CartographicLineSymbol, UniqueValueRenderer, SimpleMarkerSymbol,
  SimpleFillSymbol, TextSymbol, SimpleRenderer, ClassBreaksRenderer, LabelLayer, LabelClass, Color, InfoTemplate, Tiled,
  Polyline, Point, Font, PopupTemplate, number) {

    parser.parse();

    window.onresize = handleIEProblem;
    handleIEProblem();

    map = new Map("mapDiv", {minZoom:6, maxZoom:15, logo: false});
    map.infoWindow.set("titleInBody", false);

    tiled = new Tiled("http://tiles.arcgis.com/tiles/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Statewide_Planning_Map/MapServer");
    map.addLayer(tiled);

    var theExtent = new Extent(-107,25.27,-93,37.27, new SpatialReference({ wkid: 4269 }));
    map.setExtent(webMercatorUtils.geographicToWebMercator(theExtent));

    //Add Roadway Inventory data to map but don't show until needed during Query.  Same for search layers.
    addInventoryData();
    addSearchLayers();

    map.on("load", function() {
      map.on("mouse-move", showCoordinates);
      map.on("mouse-drag", showCoordinates);
      map.on("zoom-end", scaleDependentQueries);
    });

    map.on("load", createToolbar);
    map.on("click", logCoords);
    // Clear graphic line on Measure Tab if when a new line is started
    map.on("click", clearMeasuredLineGraphic);
    map.on("mouse-move", newCoords);
    //map.on("load",turnOnTop100);

    var scalebar = new Scalebar({
      map: map,
      scalebarUnit: "english",
      attachTo: "bottom-left"
    });

    theLegend = new Legend({map:map},"legendDiv");

    function turnOnTop100(){
      var fakeevent = {target:{id:"Top_100"}};
      changeOverlay(fakeevent);
    }


    //Function to force IE8 to work, eventually this will not be needed.
    function handleIEProblem() {
      var ua = window.navigator.userAgent;
      var msie = ua.indexOf ( "MSIE " );

      if ( msie > 0 ) {
        var theVersion = parseInt(ua.substring (msie+5, ua.indexOf (".", msie )));
        if (theVersion<8) {
          var outerDiv = document.getElementById("mapDiv");
          outerDiv.style.width = document.body.clientWidth-215;
        }
      }
    }

    function addSearchLayers() {
      var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Planning_Map_Search/FeatureServer/2";
      citySearchLyr = new FeatureLayer(projectsUrl, {id:"City_Search",visible: false,outFields:["CITY_NM","xCoord","yCoord"]});

      projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Planning_Map_Search/FeatureServer/1";
      countySearchLyr = new FeatureLayer(projectsUrl, {id:"County_Search",visible: false,outFields:["CNTY_NM","xCoord","yCoord"]});

      projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Planning_Map_Search/FeatureServer/3";
      csSearchLyr = new FeatureLayer(projectsUrl, {id:"ControlSection_Search",visible: false,outFields:["CTRL_SECT_NBR","xCoord","yCoord"]});

      projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Planning_Map_Search/FeatureServer/0";
      districtSearchLyr = new FeatureLayer(projectsUrl, {id:"District_Search",visible: false,outFields:["DIST_NM","xCoord","yCoord"]});

      projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Planning_Map_Search/FeatureServer/4";
      highwaySearchLyr = new FeatureLayer(projectsUrl, {id:"Highway_Search",visible: false,outFields:["RTE_NM","xCoord","yCoord","CNTY_NM"]});
      //map.addLayers([citySearchLyr, countySearchLyr, csSearchLyr, districtSearchLyr, highwaySearchLyr]);

      projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Top_100_Search/FeatureServer/0";
      //projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/100_test_search_service/FeatureServer/0";
      top100SearchLyr = new FeatureLayer(projectsUrl, {id:"Top100_Search",visible: false,outFields:["RANK","xCoord","yCoord"]});
      map.addLayers([citySearchLyr, countySearchLyr, csSearchLyr, districtSearchLyr, highwaySearchLyr,top100SearchLyr]);

    }

    function createLegend() {
      if (activeOverlay) {
        var div = document.getElementById("legendDiv");
        var div2 = document.getElementById("legendDiv2");
        var link = document.getElementById("legendLink");
        var link2 = document.getElementById("legendLink2");
        var name = activeOverlay.name;
        console.log(activeOverlay);
        console.log(name);
        if (name == "National Highway Freight Network") {
          link.href = "http://ops.fhwa.dot.gov/freight/infrastructure/nfn/index.htm";
          link.innerHTML = "FHWA Website";
          div.innerHTML = 'The National Highway Freight Network (NHFN) was developed by the Federal Highway Administration under the FAST Act, and replaces the National Freight Network previously developed under MAP-21.';
          document.getElementById("legendLink").style.display="block";
          document.getElementById("legendLink2").style.display="none";
        }
        else if (name == "Texas Highway Freight Network") {
          link.href = "http://www.dot.state.tx.us/move-texas-freight/freight_plan.htm";
          link.innerHTML = "Texas Freight Mobility Plan Website";
          div.innerHTML = 'The Texas Highway Freight Network is comprised of a Primary Freight Network and a Secondary Freight Network/Emerging Freight Corridors. It includes interstates, the NHS and the Texas Trunk System.';
          document.getElementById("legendLink").style.display="block";
          document.getElementById("legendLink2").style.display="none";
        }
        else if (name =="Top 100 Congested Roadways"){
          link.href = "http://www.txdot.gov/inside-txdot/projects/100-congested-roadways.html";
          link.innerHTML = "TxDOT Top 100 Website";
          div.innerHTML = "This layer provides a list of the Top 100 Most Congested Roadways in the State as determined by Texas A&M Transportation Institute(TTI). For more information please visit the links below."
          link2.href = "http://mobility.tamu.edu/texas-most-congested-roadways/";
          link2.innerHTML = "TTI Website";
          document.getElementById("legendLink").style.display = "block";
          document.getElementById("legendLink2").style.display = "block";
        }
        else if (name =="TxDOT_Projects"){
          link.href = "http://www.txdot.gov/inside-txdot/projects/project-tracker.html";
          link.innerHTML = "Project Tracker Website";
          div.innerHTML = "";
          document.getElementById("legendLink").style.display="block";
          document.getElementById("legendLink2").style.display="none";
        }
        else {
          div.innerHTML = '';
          theLegend.refresh();
          document.getElementById("legendLink").style.display="none";
          document.getElementById("legendLink2").style.display="none";
        }
        theLegend.refresh();
      }
      else {
        var div = document.getElementById("legendDiv");
        div.innerHTML = 'Select an overlay from the Maps tab to see its legend.';
      }
    }

    function logCoords() {
      if (document.getElementById("measureTab").style.display=="block"||document.getElementById("sketchTab").style.display=="block") {
        xPointArray.push([Number(globalX),Number(globalY)]);
        calculateDistance();
      }
    }

    // Clear graphic line on Measure Tab when a new line is started
    function clearMeasuredLineGraphic (){
      if (document.getElementById("measureTab").style.display=="block"){
        if (document.getElementById("mapDiv_graphics_layer").style.display=="block"){
          map.graphics.clear();
          if (xPointArray.length<2) {
            document.getElementById("measuredDistance").innerHTML = "0.00";
          }
        }
      }
    }

    function newCoords() {
      if (document.getElementById("measureTab").style.display=="block"||document.getElementById("sketchTab").style.display=="block") {
        if (xPointArray.length>=1) {
          polyline = new Polyline();
          polyline.addPath([xPointArray[xPointArray.length - 1],[Number(globalX),Number(globalY)]]);

          if (measureUnits=="Miles") {
            var thisMeasured = geodesicUtils.geodesicLengths([polyline], Units.MILES);
            var piece = Math.round(thisMeasured*1000)/1000
            var potential = currentMeasure + piece;
            document.getElementById("measuredDistance").innerHTML = Math.round(potential*1000)/1000 + " miles.";
          }

          if (measureUnits=="Kilometers") {
            var thisMeasured = geodesicUtils.geodesicLengths([polyline], Units.KILOMETERS);
            var piece = Math.round(thisMeasured*1000)/1000
            var potential = currentMeasure + piece;
            document.getElementById("measuredDistance").innerHTML = Math.round(potential*1000)/1000 + " kilometers.";
          }

          if (measureUnits=="Feet") {
            var thisMeasured = geodesicUtils.geodesicLengths([polyline], Units.FEET);
            var piece = Math.round(thisMeasured*1000)/1000
            var potential = currentMeasure + piece;
            document.getElementById("measuredDistance").innerHTML = Math.round(potential*1000)/1000 + " feet.";
          }

          if (measureUnits=="Meters") {
            var thisMeasured = geodesicUtils.geodesicLengths([polyline], Units.METERS);
            var piece = Math.round(thisMeasured*1000)/1000
            var potential = currentMeasure + piece;
            document.getElementById("measuredDistance").innerHTML = Math.round(potential*1000)/1000 + " meters.";
          }
        }
      }
    }

    function unitsHandler(){
      if (measureUnits=="Miles") {
        theDistMeasured = geodesicUtils.geodesicLengths([polyline], Units.MILES);
        document.getElementById("measuredDistance").innerHTML = Math.round(theDistMeasured*1000)/1000 + " miles.";
        currentMeasure = Math.round(theDistMeasured*1000)/1000;
      }

      if (measureUnits=="Kilometers") {
        theDistMeasured = geodesicUtils.geodesicLengths([polyline], Units.KILOMETERS);
        document.getElementById("measuredDistance").innerHTML = Math.round(theDistMeasured*1000)/1000 + " kilometers.";
        currentMeasure = Math.round(theDistMeasured*1000)/1000;
      }

      if (measureUnits=="Feet") {
        theDistMeasured = geodesicUtils.geodesicLengths([polyline], Units.FEET);
        document.getElementById("measuredDistance").innerHTML = Math.round(theDistMeasured*1000)/1000 + " feet.";
        currentMeasure = Math.round(theDistMeasured*1000)/1000;
      }

      if (measureUnits=="Meters") {
        theDistMeasured = geodesicUtils.geodesicLengths([polyline], Units.METERS);
        document.getElementById("measuredDistance").innerHTML = Math.round(theDistMeasured*1000)/1000 + " meters.";
        currentMeasure = Math.round(theDistMeasured*1000)/1000;
      }
    }

    function calculateDistance() {
      if (xPointArray.length>1) {
        polyline = new Polyline();
        polyline.addPath(xPointArray);
        unitsHandler();
      }
    }

    on(dom.byId("clearMeasure"), "click", clearMeasure);
    function clearMeasure() {
      map.graphics.clear();
      document.getElementById("measuredDistance").innerHTML = "0.00";
      xPointArray.length=0;
      theDistMeasured=0;
      currentMeasure=0;
      polyline = {};
    }

    dojo.query(".MeasureUnits").forEach(function (result){
      on(result, "click", changeUnits);
    });

    function changeUnits(event) {
      measureUnits=event.target.value;
      unitsHandler();
    }

    function createToolbar() {
      toolbar = new Draw(map);
      toolbar.on("draw-end", addToMap);
    }

    function activateTool(theTool) {
      var tool;
      if (theTool == "POLYLINE") {
        tool = Draw.POLYLINE;
      }
      toolbar.activate(tool);
      map.hideZoomSlider();
    }

    function deActivateTool(theTool) {
      var tool;
      if (theTool == "POLYLINE") {
        tool = Draw.POLYLINE;
      }
      toolbar.deactivate(tool);
      map.showZoomSlider();
    }

    function addToMap(evt) {
      var lineColorCode = "#D80000";
      var lineColor = new Color(lineColorCode);
      var theLine = new CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID, lineColor, 3, CartographicLineSymbol.CAP_ROUND, CartographicLineSymbol.JOIN_MITER, 5);
      var defaultSymbol = new SimpleFillSymbol("solid", theLine, null);
      var graphic = new Graphic(evt.geometry,defaultSymbol);
      map.graphics.add(graphic);

      if (activeTab=="sketchTab"){
        deLength = parseFloat(deLength) + parseFloat(theDistMeasured);
      }

      theDistMeasured=0;
      xPointArray.length=0;
      currentMeasure=0;
    }

    function showCoordinates(evt) {
      var mp = new webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
      globalX = mp.x.toFixed(6);
      globalY = mp.y.toFixed(6);
      document.getElementById("info").innerHTML = "Level: " + map.getZoom() + ", " + mp.x.toFixed(6) + ", " + mp.y.toFixed(6);
    }

    dojo.query(".Basemaps").forEach(function (result){
      on(result, "click", changeBaseMap);
    });
    function changeBaseMap(event) {
      clearStyle("tocMaps");
      map.removeLayer(map.getLayer(map.layerIds[0]));

      var newMap = event.target.id;
      document.getElementById(newMap).style.color='red';
      if (newMap=="Statewide_Planning_Map") {
        var tiled = new Tiled("http://tiles.arcgis.com/tiles/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Statewide_Planning_Map/MapServer",{id: newMap});
        map.addLayer(tiled);
      }
      else {
        var basemap = new Tiled("http://server.arcgisonline.com/ArcGIS/rest/services/" + newMap + "/MapServer", {id: newMap});
        map.addLayer(basemap);
      }

      if (activeOverlay) {
        activeOverlay.show();
      }
    }

    dojo.query(".Tabs").forEach(function (result){
      on(result, "click", changeTab);
    });
    function changeTab(event) {
      var ID = event.target.id;
      if (ID == 'tcMap') {
        activeTab = 'mapTab';
      }
      else if (ID == 'tcSearch') {
        activeTab = 'searchTab';
      }
      else if (ID == 'tcMeasure') {
        activeTab = 'measureTab';
      }
      else if (ID == 'tcQuery') {
        activeTab = 'queryTab';
      }
      else if (ID == 'tcSketch') {
        activeTab = 'sketchTab';
      }
      else if (ID == 'tcLegend') {
        activeTab = 'legendTab';
      }
      else if (ID == 'tcAbout') {
        activeTab = 'aboutTab';
      }

      map.graphics.clear();
      map.infoWindow.hide();
      clearMeasure();

      if (activeTab!="queryTab") {
        projectsRI.hide();
      }
      if (activeTab=="queryTab"||activeTab=="sketchTab") {
        hideAllOverlays();
        document.getElementById("CLEAR").style.color = "red";
        document.getElementById("radMile").checked = true;
      }

      clearStyle("tcTabs");
      document.getElementById("mapTab").style.display="none";
      document.getElementById("searchTab").style.display="none";
      document.getElementById("measureTab").style.display="none";
      document.getElementById("queryTab").style.display="none";
      document.getElementById("sketchTab").style.display="none";
      document.getElementById("legendTab").style.display="none";
      document.getElementById("aboutTab").style.display="none";
      document.getElementById(activeTab).style.display="block";

      document.getElementById(ID).style.color='white';
      document.getElementById(ID).style.backgroundColor='#6699CC';

      if (activeTab=="measureTab"||activeTab=="sketchTab") {
        measureUnits="Miles";
        theDistMeasured=0;
        xPointArray.length=0;
        currentMeasure=0;
        deLength=0;
        polyline = {};
        activateTool("POLYLINE");

      }
      else {
        deActivateTool("POLYLINE");
      }

      if (activeTab=="legendTab") {
        createLegend();
      }
    }

    function panTo(theX,theY) {
      var thePt = new Point(theX,theY, new SpatialReference({ wkid: 4269 }));
      map.centerAt(webMercatorUtils.geographicToWebMercator(thePt));
      //onLoad();
    }

    function zoomTo(event) {
      var params = event.target.id;
      var paramsList = params.split(',');
      var theX = paramsList[0];
      var theY = paramsList[1];
      var theZ = paramsList[2];
      var thePt = new Point(theX,theY, new SpatialReference({ wkid: 4269 }));
      map.centerAndZoom(webMercatorUtils.geographicToWebMercator(thePt),theZ);
      //onLoad();
    }

    function clearStyle(theTable) {
      var tcTbl = document.getElementById(theTable);
      var tds = tcTbl.getElementsByTagName("td");

      for(var i = 0; i < tds.length; i++) {
        tds[i].style.color="black";
        if (theTable=="tcTabs") {
          tds[i].style.backgroundColor="white";
        }
      }
    }


    function scaleDependentQueries() {
      if (activeOverlay) {
        if (aadtLyr) {
          aadtLyr.setDefinitionExpression("zLevel<" + (map.getZoom() + 1));
        }

        if (FCLyr) {
          if (map.getZoom()<9) {
            FCLyr.setDefinitionExpression("RIA_RTE_ID LIKE'IH%' AND RIA_RTE_ID LIKE '%KG'");
          }
          if (map.getZoom()>8&&map.getZoom()<11) {
            FCLyr.setDefinitionExpression("(RIA_RTE_ID LIKE'IH%' or RIA_RTE_ID LIKE'US%') AND RIA_RTE_ID LIKE '%KG'");
          }

          if (map.getZoom()>10&&map.getZoom()<13) {
            FCLyr.setDefinitionExpression("NOT RIA_RTE_ID LIKE '%AG' AND NOT RIA_RTE_ID LIKE '%XG' ");
          }

          if (map.getZoom()>=13) {
            FCLyr.setDefinitionExpression("");
          }
        }

        if (MarkerLyr) {
          if (map.getZoom()<9) {
            MarkerLyr.setDefinitionExpression("RTE_PRFX='IH' AND RIGHT(MRKR_NBR,2)='25'");
          }
          if (map.getZoom()>8&&map.getZoom()<11) {
            MarkerLyr.setDefinitionExpression("(RTE_PRFX='IH' AND (RIGHT(MRKR_NBR,1)='0')) or (RTE_PRFX='US' AND (RIGHT(MRKR_NBR,1)='0'))");
          }
          if (map.getZoom()>10&&map.getZoom()<13) {
            MarkerLyr.setDefinitionExpression("(RTE_PRFX='IH' AND (RIGHT(MRKR_NBR,1)='0' OR RIGHT(MRKR_NBR,1)='5')) or (RTE_PRFX='US' AND (RIGHT(MRKR_NBR,1)='0' OR RIGHT(MRKR_NBR,1)='5')) or (RTE_PRFX='SH' AND (RIGHT(MRKR_NBR,1)='0' OR RIGHT(MRKR_NBR,1)='5')) or (RTE_PRFX='SL' AND (RIGHT(MRKR_NBR,1)='0' OR RIGHT(MRKR_NBR,1)='5'))");
          }
          if (map.getZoom()>12) {
            MarkerLyr.setDefinitionExpression("");
          }
        }

        if (controlSectionLyr) {
          if (map.getZoom()<9) {
            controlSectionLyr.setDefinitionExpression("RTE_PRFX='IH'");
            labelLayerCS.hide();
          }
          if (map.getZoom()>8&&map.getZoom()<10) {
            controlSectionLyr.setDefinitionExpression("(RTE_PRFX='IH' or RTE_PRFX='US')");
            labelLayerCS.hide();
          }
          if (map.getZoom()>9&&map.getZoom()<11) {
            controlSectionLyr.setDefinitionExpression("(RTE_PRFX='IH' or RTE_PRFX='SH' or RTE_PRFX='US' or RTE_PRFX='SL')");
            labelLayerCS.show();
          }
          if (map.getZoom()>10&&map.getZoom()<13) {
            controlSectionLyr.setDefinitionExpression("RTE_PRFX NOT IN ('CS', 'FC', 'CR', 'FD', 'PR')");
            labelLayerCS.show();
          }
          if (map.getZoom()>12&&map.getZoom()<15) {
            controlSectionLyr.setDefinitionExpression("RTE_PRFX <> 'CS'");
            labelLayerCS.show();
          }
          if (map.getZoom()>14) {
            controlSectionLyr.setDefinitionExpression("");
            labelLayerCS.show();
          }
        }

        if (speedLimitLyr) {
          if (map.getZoom()<9) {
            speedLimitLyr.setDefinitionExpression("LEFT(RIA_RTE_ID,2)='IH'");
          }
          if (map.getZoom()>8&&map.getZoom()<11) {
            speedLimitLyr.setDefinitionExpression("(LEFT(RIA_RTE_ID,2)='IH' or LEFT(RIA_RTE_ID,2)='US')");
          }
          if (map.getZoom()>10&&map.getZoom()<13) {
            speedLimitLyr.setDefinitionExpression("(LEFT(RIA_RTE_ID,2)='IH' or LEFT(RIA_RTE_ID,2)='US' or LEFT(RIA_RTE_ID,2)='SH' or LEFT(RIA_RTE_ID,2)='SL')");
          }
          if (map.getZoom()>12) {
            speedLimitLyr.setDefinitionExpression("");
          }
        }

        if (futureTrafficLyr) {
          if (map.getZoom()<9) {
            futureTrafficLyr.setDefinitionExpression("LEFT(RIA_RTE_ID,2)='IH'");
          }
          if (map.getZoom()>8&&map.getZoom()<11) {
            futureTrafficLyr.setDefinitionExpression("(LEFT(RIA_RTE_ID,2)='IH' or LEFT(RIA_RTE_ID,2)='US')");
          }
          if (map.getZoom()>10&&map.getZoom()<13) {
            futureTrafficLyr.setDefinitionExpression("(LEFT(RIA_RTE_ID,2)='IH' or LEFT(RIA_RTE_ID,2)='US' or LEFT(RIA_RTE_ID,2)='SH' or LEFT(RIA_RTE_ID,2)='SL' or LEFT(RIA_RTE_ID,2)='TL')");
          }
          if (map.getZoom()>12) {
            futureTrafficLyr.setDefinitionExpression("");
          }
        }

        if (pavementConditionLyr) {
          if (map.getZoom()<9) {
            pavementConditionLyr.setDefinitionExpression("LEFT(ROUTE_ID,2)='IH'");
          }
          if (map.getZoom()>8&&map.getZoom()<11) {
            pavementConditionLyr.setDefinitionExpression("(LEFT(ROUTE_ID,2)='IH' or LEFT(ROUTE_ID,2)='US')");
          }
          if (map.getZoom()>10&&map.getZoom()<13) {
            pavementConditionLyr.setDefinitionExpression("(LEFT(ROUTE_ID,2)='IH' or LEFT(ROUTE_ID,2)='US' or LEFT(ROUTE_ID,2)='SH' or LEFT(ROUTE_ID,2)='SL')");
          }
          if (map.getZoom()>12) {
            pavementConditionLyr.setDefinitionExpression("");
          }
        }

        if (top100Lyr) {
          if (map.getZoom()<10) {
            top100Lyr.setDefinitionExpression("");
            labelLayerTop100.hide();
          }
          if (map.getZoom()>8) {
            top100Lyr.setDefinitionExpression("");
            labelLayerTop100.show();
          }
        }
      }
    }

    function hideAllOverlays() {
      activeOverlay = "";
      if (aadtLyr) {aadtLyr.hide(); labelLayerAADT.hide()}
      if (areaOfficeLyr) {areaOfficeLyr.hide();}
      if (COGLyr) {COGLyr.hide();}
      if (FCLyr) {FCLyr.hide();}
      if (FCLyr) {UZALyr.hide();}
      if (NatlFreightLyr) {NatlFreightLyr.hide();}
      if (TXFreightLyr) {TXFreightLyr.hide();}
      if (maintOfficeLyr) {maintOfficeLyr.hide();}
      if (txTrunkLyr) {txTrunkLyr.hide();}
      if (txTrunkLyr) {UZALyr.hide();}
      if (MPOLyr) {MPOLyr.hide();}
      if (NHSLyr) {NHSLyr.hide();}
      if (nonAttainLyr) {nonAttainLyr.hide();}
      if (MarkerLyr) {MarkerLyr.hide(); labelLayerMarker.hide();}
      if (controlSectionLyr) {controlSectionLyr.hide(); labelLayerCS.hide();}
      if (USHouseLyr) {USHouseLyr.hide();}
      if (railRoadLyr) {railRoadLyr.hide();}
      if (StateHouseLyr) {StateHouseLyr.hide();}
      if (speedLimitLyr) {speedLimitLyr.hide();}
      if (StateSenateLyr) {StateSenateLyr.hide();}
      if (futureTrafficLyr) {futureTrafficLyr.hide();}
      if (longTermPlanLyr) {longTermPlanLyr.hide();}
      if (constScheduledLyr) {constScheduledLyr.hide();}
      if (finalForConstLyr) {finalForConstLyr.hide();}
      if (underDevLyr) {underDevLyr.hide();}
      if (minuteOrderLyr) {minuteOrderLyr.hide();}
      if (pavementConditionLyr) {pavementConditionLyr.hide();}
      if (VerticalLyr) {VerticalLyr.hide();}
      if (permStationLyr) {permStationLyr.hide();}
      if (top100Lyr) {top100Lyr.hide(); labelLayerTop100.hide()}

      clearStyle("tocData");
    }

    dojo.query(".Overlay").forEach(function (result){
      on(result, "click", changeOverlay);
    });
    function changeOverlay(event) {
      var tableText="";
      clearStyle("tocData");
      hideAllOverlays();
      map.infoWindow.hide();

      var theLayer = event.target.id;
      document.getElementById(theLayer).style.color='red';
      if (theLayer=="CLEAR") {
        activeOverlay="";
      }

      // if (theLayer=="Pavement_Conditions") {
      // 	if (pavementConditionLyr) {
      // 		pavementConditionLyr.show();
      // 	}
      // 	else {
      // 		tableText = "";
      // 		tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
      // 		tableText += "<tr><td>Highway</td><td>${ROUTE_ID}</td></tr>";
      // 		tableText += "<tr><td>Condition</td><td>${CONDITION}</td></tr>";
      // 		tableText += "<tr><td>Begin DFO</td><td>${BEGIN_POIN}</td></tr>";
      // 		tableText += "<tr><td>End DFO</td><td>${END_POINT}</td></tr>";
      // 		tableText += "</table>";

      // 		var infoTemplate = new InfoTemplate("Pavement Conditions:",tableText);
      // 		// var projectsUrl = "https://maps.dot.state.tx.us/ArcGIS/rest/services/PavementConditions_Dynamic/MapServer/0";
      // 		var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Pavement_Conditions/FeatureServer/0";

      // 		pavementConditionLyr = new FeatureLayer(projectsUrl, {id:"Pavement Conditions",visible: true,outFields:["ROUTE_ID","BEGIN_POIN","END_POINT","CONDITION"], infoTemplate: infoTemplate});
      // 		map.addLayer(pavementConditionLyr);
      // 	}
      // 	activeOverlay = pavementConditionLyr;
      // 	theLegend.layerInfos=[{layer:pavementConditionLyr, title:"Pavement Condition"}];
      // }

      if (theLayer=="Minute_Orders") {
        if (minuteOrderLyr) {
          minuteOrderLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway Name</td><td>${RTE_NM}</td></tr>";
          tableText += "<tr><td>Control Section</td><td>${CTRL_SECT}</td></tr>";
          tableText += "<tr><td>Minute Order Number</td><td><a href='http://publiccm.txdot.gov/minord/mosearch/Pages/Minute-Order-Search-Results.aspx#k=${MO_NBR}' target='_blank'>${MO_NBR}</a></td></tr>";
          tableText += "<tr><td>Approval Date</td><td>${APRV_DT}</td></tr>";
          tableText += "<tr><td>Description</td><td>${DSPN_DSCR}</td></tr>";
          tableText += "<tr><td>AASHTO Application</td><td>${AASHTO_APPLN}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Highway Designations:",tableText);
          // var projectsUrl = "http://maps.dot.state.tx.us/arcgis/rest/services/TPPuser/TxDOT_Highway_Designations/MapServer/0";
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Highway_Designations/FeatureServer/0"

          minuteOrderLyr = new FeatureLayer(projectsUrl, {id:"Minute Orders",visible: true,outFields:["RTE_NM","CTRL_SECT","MO_NBR","APRV_DT","DSPN_DSCR","AASHTO_APPLN"], infoTemplate: infoTemplate});
          map.addLayer(minuteOrderLyr);
        }
        activeOverlay = minuteOrderLyr;
        theLegend.layerInfos=[{layer:minuteOrderLyr, title:"Highway Designations"}];
      }

      if (theLayer=="Speed_Limit") {
        if (speedLimitLyr) {
          speedLimitLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Route ID</td><td>${RIA_RTE_ID}</td></tr>";
          tableText += "<tr><td>Max Speed</td><td>${SPD_MAX}</td></tr>";
          tableText += "<tr><td>From DFO</td><td>${FRM_DFO}</td></tr>";
          tableText += "<tr><td>To DFO</td><td>${TO_DFO}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Speed Limit:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Speed_Limits/FeatureServer/0";

          speedLimitLyr = new FeatureLayer(projectsUrl, {id:"Speed_Limit",visible: true,outFields:["RIA_RTE_ID","SPD_MAX","FRM_DFO","TO_DFO"], infoTemplate: infoTemplate});
          map.addLayer(speedLimitLyr);
        }
        activeOverlay = speedLimitLyr;
        theLegend.layerInfos=[{layer:speedLimitLyr, title:"Speed Limits"}];
      }

      if (theLayer=="Long_Term_Planning") {
        if (longTermPlanLyr) {
          longTermPlanLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${HIGHWAY_NUMBER}</td></tr>";
          tableText += "<tr><td>CSJ</td><td>${CONTROL_SECT_JOB}</td></tr>";
          tableText += "<tr><td>Project Class</td><td>${PROJ_CLASS}</td></tr>";
          tableText += "<tr><td>Type of Work</td><td>${TYPE_OF_WORK}</td></tr>";
          tableText += "<tr><td>Layman Description</td><td>${LAYMAN_DESCRIPTION1}</td></tr>";
          tableText += "<tr><td>Work Program</td><td>${TPP_WORK_PROGRAM}</td></tr>";
          tableText += "<tr><td>Category</td><td>${TPP_CATEGORY_P2}</td></tr>";
          tableText += "<tr><td>PID</td><td>${TPP_PID}</td></tr>";
          tableText += "<tr><td>Est. Construction Cost</td><td>$${EST_CONST_COST:NumberFormat(places:0)}</td></tr>";
          tableText += "<tr><td>Funding</td><td>$${UTP_TOTAL_FUNDING_AVAILABLE:NumberFormat(places:0)}</td></tr>";
          //tableText += "<tr><td>Total Score</td><td>${UTP_TOTAL_SCORE:NumberFormat(places:0)}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Long Term Planning:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Projects/FeatureServer/0";

          var theSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([44,123,182]),3);
          var theRenderer = new SimpleRenderer(theSymbol);

          longTermPlanLyr = new FeatureLayer(projectsUrl, {id:"Long_Term_Planning",visible: true,outFields:["HIGHWAY_NUMBER","CONTROL_SECT_JOB","PROJ_CLASS","TYPE_OF_WORK","LAYMAN_DESCRIPTION1","TPP_WORK_PROGRAM","TPP_CATEGORY_P2","TPP_PID","EST_CONST_COST","UTP_TOTAL_FUNDING_AVAILABLE","UTP_STRATEGIC_SCORE","UTP_TOTAL_SCORE","PRJ_STATUS"], infoTemplate: infoTemplate});
          longTermPlanLyr.setDefinitionExpression("PRJ_STATUS = 'Long Term Planning'");
          longTermPlanLyr.setRenderer(theRenderer);
          map.addLayer(longTermPlanLyr);
        }
        activeOverlay = longTermPlanLyr;
        theLegend.layerInfos=[{layer:longTermPlanLyr, title:"TxDOT Projects - Long Term Planning"}];
      }

      if (theLayer=="Construction_Scheduled") {
        if (constScheduledLyr) {
          constScheduledLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${HIGHWAY_NUMBER}</td></tr>";
          tableText += "<tr><td>CSJ</td><td>${CONTROL_SECT_JOB}</td></tr>";
          tableText += "<tr><td>Project Class</td><td>${PROJ_CLASS}</td></tr>";
          tableText += "<tr><td>Type of Work</td><td>${TYPE_OF_WORK}</td></tr>";
          tableText += "<tr><td>Layman Description</td><td>${LAYMAN_DESCRIPTION1}</td></tr>";
          tableText += "<tr><td>Work Program</td><td>${TPP_WORK_PROGRAM}</td></tr>";
          tableText += "<tr><td>Category</td><td>${TPP_CATEGORY_P2}</td></tr>";
          tableText += "<tr><td>PID</td><td>${TPP_PID}</td></tr>";
          tableText += "<tr><td>Est. Construction Cost</td><td>$${EST_CONST_COST:NumberFormat(places:0)}</td></tr>";
          tableText += "<tr><td>Funding</td><td>TBD</td></tr>";
          //tableText += "<tr><td>Strategic Score</td><td>${UTP_STRATEGIC_SCORE:NumberFormat(places:0)}</td></tr>";
          //tableText += "<tr><td>Total Score</td><td>${UTP_TOTAL_SCORE:NumberFormat(places:0)}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Construction Scheduled:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Projects/FeatureServer/0";

          var theSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([215,25,28]),3);
          var theRenderer = new SimpleRenderer(theSymbol);

          constScheduledLyr = new FeatureLayer(projectsUrl, {id:"Construction_Scheduled",visible: true,outFields:["HIGHWAY_NUMBER","CONTROL_SECT_JOB","PROJ_CLASS","TYPE_OF_WORK","LAYMAN_DESCRIPTION1","TPP_WORK_PROGRAM","TPP_CATEGORY_P2","TPP_PID","EST_CONST_COST","UTP_TOTAL_FUNDING_AVAILABLE","UTP_STRATEGIC_SCORE","UTP_TOTAL_SCORE", "PRJ_STATUS"], infoTemplate: infoTemplate});
          constScheduledLyr.setDefinitionExpression("PRJ_STATUS = 'Construction Scheduled'");
          constScheduledLyr.setRenderer(theRenderer);
          map.addLayer(constScheduledLyr);
        }
        activeOverlay = constScheduledLyr;
        theLegend.layerInfos=[{layer:constScheduledLyr, title:"TxDOT Projects - Construction Scheduled"}];
      }

      if (theLayer=="Finalizing_for_Construction") {
        if (finalForConstLyr) {
          finalForConstLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${HIGHWAY_NUMBER}</td></tr>";
          tableText += "<tr><td>CSJ</td><td>${CONTROL_SECT_JOB}</td></tr>";
          tableText += "<tr><td>Project Class</td><td>${PROJ_CLASS}</td></tr>";
          tableText += "<tr><td>Type of Work</td><td>${TYPE_OF_WORK}</td></tr>";
          tableText += "<tr><td>Layman Description</td><td>${LAYMAN_DESCRIPTION1}</td></tr>";
          tableText += "<tr><td>Work Program</td><td>${TPP_WORK_PROGRAM}</td></tr>";
          tableText += "<tr><td>Category</td><td>${TPP_CATEGORY_P2}</td></tr>";
          tableText += "<tr><td>PID</td><td>${TPP_PID}</td></tr>";
          tableText += "<tr><td>Est. Construction Cost</td><td>$${EST_CONST_COST:NumberFormat(places:0)}</td></tr>";
          tableText += "<tr><td>Funding</td><td>$${UTP_TOTAL_FUNDING_AVAILABLE:NumberFormat(places:0)}</td></tr>";
          tableText += "<tr><td>Strategic Score</td><td>${UTP_STRATEGIC_SCORE:NumberFormat(places:0)}</td></tr>";
          tableText += "<tr><td>Total Score</td><td>${UTP_TOTAL_SCORE:NumberFormat(places:0)}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Finalizing for Construction:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Projects/FeatureServer/0";

          var theSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([253,174,97]),3);
          var theRenderer = new SimpleRenderer(theSymbol);

          finalForConstLyr = new FeatureLayer(projectsUrl, {id:"Finalizing_for_Construction",visible: true,outFields:["HIGHWAY_NUMBER","CONTROL_SECT_JOB","PROJ_CLASS","TYPE_OF_WORK","LAYMAN_DESCRIPTION1","TPP_WORK_PROGRAM","TPP_CATEGORY_P2","TPP_PID","EST_CONST_COST","UTP_TOTAL_FUNDING_AVAILABLE","UTP_STRATEGIC_SCORE","UTP_TOTAL_SCORE","PRJ_STATUS"], infoTemplate: infoTemplate});
          finalForConstLyr.setDefinitionExpression("PRJ_STATUS = 'Finalizing for Construction'");
          finalForConstLyr.setRenderer(theRenderer);
          map.addLayer(finalForConstLyr);
        }
        activeOverlay = finalForConstLyr;
        theLegend.layerInfos=[{layer:finalForConstLyr, title:"TxDOT Projects - Finalizing for Construction"}];
      }

      if (theLayer=="Under_Development") {
        if (underDevLyr) {
          underDevLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${HIGHWAY_NUMBER}</td></tr>";
          tableText += "<tr><td>CSJ</td><td>${CONTROL_SECT_JOB}</td></tr>";
          tableText += "<tr><td>Project Class</td><td>${PROJ_CLASS}</td></tr>";
          tableText += "<tr><td>Type of Work</td><td>${TYPE_OF_WORK}</td></tr>";
          tableText += "<tr><td>Layman Description</td><td>${LAYMAN_DESCRIPTION1}</td></tr>";
          tableText += "<tr><td>Work Program</td><td>${TPP_WORK_PROGRAM}</td></tr>";
          tableText += "<tr><td>Category</td><td>${TPP_CATEGORY_P2}</td></tr>";
          tableText += "<tr><td>PID</td><td>${TPP_PID}</td></tr>";
          tableText += "<tr><td>Est. Construction Cost</td><td>$${EST_CONST_COST:NumberFormat(places:0)}</td></tr>";
          tableText += "<tr><td>Funding</td><td>$${UTP_TOTAL_FUNDING_AVAILABLE:NumberFormat(places:0)}</td></tr>";
          //tableText += "<tr><td>Strategic Score</td><td>${UTP_STRATEGIC_SCORE:NumberFormat(places:0)}</td></tr>";
          //tableText += "<tr><td>Total Score</td><td>${UTP_TOTAL_SCORE:NumberFormat(places:0)}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Under Development:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Projects/FeatureServer/0";

          var theSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([128,205,193]),3);
          var theRenderer = new SimpleRenderer(theSymbol);

          underDevLyr = new FeatureLayer(projectsUrl, {id:"Under_Development",visible: true,outFields:["HIGHWAY_NUMBER","CONTROL_SECT_JOB","PROJ_CLASS","TYPE_OF_WORK","LAYMAN_DESCRIPTION1","TPP_WORK_PROGRAM","TPP_CATEGORY_P2","TPP_PID","EST_CONST_COST","UTP_TOTAL_FUNDING_AVAILABLE","UTP_STRATEGIC_SCORE","UTP_TOTAL_SCORE","PRJ_STATUS"], infoTemplate: infoTemplate});
          underDevLyr.setDefinitionExpression("PRJ_STATUS = 'Under Development'");
          underDevLyr.setRenderer(theRenderer);
          map.addLayer(underDevLyr);
        }
        activeOverlay = underDevLyr;
        theLegend.layerInfos=[{layer:underDevLyr, title:"TxDOT Projects - Under Development"}];
      }

      if (theLayer=="Future_Traffic") {
        if (futureTrafficLyr) {
          futureTrafficLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Route ID</td><td>${RIA_RTE_ID}</td></tr>";
          tableText += "<tr><td>${ADT_YEAR} AADT</td><td>${ADT_CUR:NumberFormat}</td></tr>";
          tableText += "<tr><td>${DESGN_YR} Estimated AADT</td><td>${ADT_DESGN:NumberFormat}</td></tr>";
          tableText += "<tr><td>24 Hour Truck Percentage</td><td>${TRK_AADT_PCT}</td></tr>";
          tableText += "</table><br>Future Traffic and Percent Truck data is for main lanes only.";

          var infoTemplate = new InfoTemplate("Future Traffic:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Future_Traffic/FeatureServer/0";
          //var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Inventory_Themes/FeatureServer/0";

          var theRenderer = new ClassBreaksRenderer(null,function(feature){
            return feature.attributes.ADT_CUR;
          });

          theRenderer.addBreak({minValue:-Infinity,maxValue:50000,symbol:(new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID, new esri.Color("#FF0000"),1.5, esri.symbol.CartographicLineSymbol.CAP_ROUND, esri.symbol.CartographicLineSymbol.JOIN_MITER,5)),label:"<= 40,000",field:"ADT_CUR"});
          theRenderer.addBreak({minValue:50000,maxValue:100000,symbol:(new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID, new esri.Color("#FF0000"),3.45, esri.symbol.CartographicLineSymbol.CAP_ROUND, esri.symbol.CartographicLineSymbol.JOIN_MITER,5)),label:"50,000 - 99,999",field:"ADT_CUR"});
          theRenderer.addBreak({minValue:100000,maxValue:150000,symbol:(new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID, new esri.Color("#FF0000"),5.4, esri.symbol.CartographicLineSymbol.CAP_ROUND, esri.symbol.CartographicLineSymbol.JOIN_MITER,5)),label:"100,000 - 149,999",field:"ADT_CUR"});
          theRenderer.addBreak({minValue:150000,maxValue:200000,symbol:(new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID, new esri.Color("#FF0000"),7.35, esri.symbol.CartographicLineSymbol.CAP_ROUND, esri.symbol.CartographicLineSymbol.JOIN_MITER,5)),label:"150,000 - 199,999",field:"ADT_CUR"});
          theRenderer.addBreak({minValue:200000,maxValue:250000,symbol:(new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID, new esri.Color("#FF0000"),9.3, esri.symbol.CartographicLineSymbol.CAP_ROUND, esri.symbol.CartographicLineSymbol.JOIN_MITER,5)),label:"200,000 - 249,999",field:"ADT_CUR"});
          theRenderer.addBreak({minValue:250000,maxValue:Infinity,symbol:(new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID, new esri.Color("#FF0000"),11.25, esri.symbol.CartographicLineSymbol.CAP_ROUND, esri.symbol.CartographicLineSymbol.JOIN_MITER,5)),label:">= 250,000",field:"ADT_CUR"});



          futureTrafficLyr = new FeatureLayer(projectsUrl, {id:"Future_Traffic",visible: true,outFields:["RIA_RTE_ID","ADT_CUR","ADT_DESGN","TRK_AADT_PCT","ADT_YEAR","DESGN_YR"], infoTemplate: infoTemplate});
          futureTrafficLyr.setRenderer(theRenderer);
          map.addLayer(futureTrafficLyr);
        }

        activeOverlay = futureTrafficLyr;
        theLegend.layerInfos=[{layer:futureTrafficLyr, title:"Future Traffic and Percent Trucks.  Future is calculated as 2% growth rate and percent truck is 24 hour."}];
      }

      if (theLayer=="Railroads") {
        if (railRoadLyr) {
          railRoadLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Railroad Name</td><td>{RR_COMPANY}</td></tr>";
          tableText += "<tr><td>Railroad Abbreviation</td><td>{RR_ABRVN}</td></tr>";
          tableText += "<tr><td>Status</td><td>{RR_STATUS}</td></tr>";
          tableText += "<tr><td>Type</td><td>{RR_TYP}</td></tr>";
          tableText += "<tr><td>Number</td><td>{RR_NBR}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new PopupTemplate({description : tableText});
          infoTemplate.setTitle("Railroads:");
          // var projectsUrl = "http://maps.dot.state.tx.us/arcgis/rest/services/TPPuser/Texas_Railroads/MapServer/0";
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_Railroads/FeatureServer/0";


          railRoadLyr = new FeatureLayer(projectsUrl, {id:"Railroads",visible: true,outFields:["RR_COMPANY","RR_ABRVN","RR_STATUS","RR_TYP","RR_NBR"], infoTemplate: infoTemplate});
          railRoadLyr.setDefinitionExpression("RR_STATUS='Active' AND RR_TYP='Main Line'");
          map.addLayer(railRoadLyr);
        }
        activeOverlay = railRoadLyr;
        theLegend.layerInfos=[{layer:railRoadLyr, title:"Mainline Railroads"}];
      }

      if (theLayer=="Non_Attainment") {
        if (nonAttainLyr) {
          nonAttainLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>FIPS</td><td>${FIPS}</td></tr>";
          tableText += "<tr><td>Region</td><td>${REGION}</td></tr>";
          tableText += "<tr><td>Status</td><td>${STATUS}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Non Attainment:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_NonAttainment_Areas/FeatureServer/0";

          nonAttainLyr = new FeatureLayer(projectsUrl, {id:"Non_Attainment",visible: true,outFields:["FIPS","REGION","STATUS"], infoTemplate: infoTemplate});
          map.addLayer(nonAttainLyr);
        }
        activeOverlay = nonAttainLyr;
        theLegend.layerInfos=[{layer:nonAttainLyr, title:"Non-Attainment or Near Non-Attainment Areas"}];
      }

      if (theLayer=="Texas_Trunk") {
        if (txTrunkLyr) {
          txTrunkLyr.show();
          UZALyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${RTE_RB_NM}</td></tr>";
          tableText += "<tr><td>Trunk Type</td><td>${TRUNK_TYP}</td></tr>";
          tableText += "</table>";

          UZATableText = "";
          UZATableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          UZATableText += "<tr><td>Name</td><td>${NAMELSAD10}</td></tr>";
          UZATableText += "<tr><td>Urban Area Type</td><td>${UrbanAreaType}</td></tr>";
          UZATableText += "<tr><td>Urban Area Number</td><td>${UrbanAreaNumber}</td></tr>";
          UZATableText += "<tr><td>Pop Code</td><td>${POP_CODE}</td></tr>";
          UZATableText += "</table>";


          function setUZAPopupContent(graphic){
            console.log(graphic);
            UZATableText = "";
            UZATableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
            UZATableText += "<tr><td>Name</td><td>"+graphic.attributes.CENSUS_NM+"</td></tr>";
            UZATableText += "<tr><td>Rural/Urban Code</td><td>"+graphic.attributes.POP_CD+"</td></tr>";
            if (graphic.attributes.POP_CD == 2){
              UZATableText += "<tr><td>Rural/Urban Description</td><td>Small Urban (Population 5,000 – 49,999)</td></tr>";
            }
            if (graphic.attributes.POP_CD == 3){
              UZATableText += "<tr><td>Rural/Urban Description</td><td>Urbanized (Population 50,000 – 199,999)</td></tr>";
            }
            if (graphic.attributes.POP_CD == 4){
              UZATableText += "<tr><td>Rural/Urban Description</td><td>Large Urbanized (Population 200,000+)</td></tr>";
            }
            UZATableText += "<tr><td>Urban Area Number</td><td>"+graphic.attributes.UZA_NBR+"</td></tr>";
            UZATableText += "</table>";
            return UZATableText;
          }
          var UZAInfoTemplate = new InfoTemplate("Urbanized Area:",setUZAPopupContent);

          var infoTemplate = new InfoTemplate("Texas Trunk:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Texas_Trunk_System/FeatureServer/0";

          var theRenderer = new ClassBreaksRenderer(null,function(feature){
            return feature.attributes.POP2010;
          });

          theRenderer.addBreak({minValue:-Infinity,maxValue:50000,symbol:(new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DOT, new esri.Color([230,152,0]), 2.25),new esri.Color([182,137,48,0.50]))),label:"Small Urban Area",field:"POP2010"});

          theRenderer.addBreak({minValue:50000,maxValue:Infinity,symbol:(new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DOT, new esri.Color([0,77,168]), 2.25),new esri.Color([90,147,168,0.50]))),label:"Urbanized Area",field: "POP2010"});


          txTrunkLyr = new FeatureLayer(projectsUrl, {id:"Texas_Trunk",visible: true,outFields:["RTE_RB_NM","TRUNK_TYP"], infoTemplate: infoTemplate});
          UZALyr = new FeatureLayer("http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Urbanized_Areas/FeatureServer/0",{outFields:["*"], infoTemplate:UZAInfoTemplate});
          UZALyr.setRenderer(theRenderer);
          map.addLayers([UZALyr,txTrunkLyr]);
        }
        activeOverlay = txTrunkLyr;
        theLegend.layerInfos=[{layer:UZALyr, title:"2010 Adjusted Urban Areas"},{layer:txTrunkLyr, title:"Texas Trunk System"}];
      }

      if (theLayer=="Maintenance_Offices") {
        if (maintOfficeLyr) {
          maintOfficeLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Office Name</td><td>${OFFICE_NM}</td></tr>";
          tableText += "<tr><td>Section Number</td><td>${MNT_SEC_NBR}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Maintenance Office:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Maintenance_Sections/FeatureServer/0";

          maintOfficeLyr = new FeatureLayer(projectsUrl, {id:"Maintenance_Offices",visible: true,outFields:["OFFICE_NM","MNT_SEC_NBR"], infoTemplate: infoTemplate});
          map.addLayer(maintOfficeLyr);
        }
        activeOverlay = maintOfficeLyr;
        theLegend.layerInfos=[{layer:maintOfficeLyr, title:"TxDOT Maintenance Offices"}];
      }

      if (theLayer=="Functional_Classification") {
        if (FCLyr) {
          FCLyr.show();
          UZALyr.show();
        }
        else {
          // Manipulate the contents of the popup infoTemplate

          function setPopupContent(graphic){
            console.log(graphic);
            tableText = "";
            tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
            tableText += "<tr><td>Highway</td><td>"+graphic.attributes.FAC_NAM+"</td></tr>";
            tableText += "<tr><td>Proposed</td><td>"+graphic.attributes.PROPOSED+"</td></tr>";
            tableText += "<tr><td>FC Code</td><td>"+graphic.attributes.F_SYSTEM+"</td></tr>";
            tableText += "<tr><td>FC Description</td><td>"+graphic.attributes.FC_DESC+"</td></tr>";
            tableText += "<tr><td>Rural/Urban Code</td><td>"+graphic.attributes.RU+"</td></tr>";
            if (graphic.attributes.RU == 1){
              tableText += "<tr><td>Rural/Urban Description</td><td>Rural (Population < 5,000)</td></tr>";
            }
            if (graphic.attributes.RU == 2){
              tableText += "<tr><td>Rural/Urban Description</td><td>Small Urban (Population 5,000 – 49,999)</td></tr>";
            }
            if (graphic.attributes.RU == 3){
              tableText += "<tr><td>Rural/Urban Description</td><td>Urbanized (Population 50,000 – 199,999)</td></tr>";
            }
            if (graphic.attributes.RU == 4){
              tableText += "<tr><td>Rural/Urban Description</td><td>Large Urbanized (Population 200,000+)</td></tr>";
            }
            tableText += "</table>";
            return tableText;
          }
          var infoTemplate = new InfoTemplate("Functional Classification:",setPopupContent);


          function setUZAPopupContent(graphic){
            console.log(graphic);
            UZATableText = "";
            UZATableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
            UZATableText += "<tr><td>Name</td><td>"+graphic.attributes.CENSUS_NM+"</td></tr>";
            UZATableText += "<tr><td>Rural/Urban Code</td><td>"+graphic.attributes.POP_CD+"</td></tr>";
            if (graphic.attributes.POP_CD == 2){
              UZATableText += "<tr><td>Rural/Urban Description</td><td>Small Urban (Population 5,000 – 49,999)</td></tr>";
            }
            if (graphic.attributes.POP_CD == 3){
              UZATableText += "<tr><td>Rural/Urban Description</td><td>Urbanized (Population 50,000 – 199,999)</td></tr>";
            }
            if (graphic.attributes.POP_CD == 4){
              UZATableText += "<tr><td>Rural/Urban Description</td><td>Large Urbanized (Population 200,000+)</td></tr>";
            }
            UZATableText += "<tr><td>Urban Area Number</td><td>"+graphic.attributes.UZA_NBR+"</td></tr>";
            UZATableText += "</table>";
            return UZATableText;
          }
          var UZAInfoTemplate = new InfoTemplate("Urbanized Area:",setUZAPopupContent);

          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Functional_Classification/FeatureServer/0";

          var theRenderer = new ClassBreaksRenderer(null,function(feature){
            return feature.attributes.POP2010;
          });

          theRenderer.addBreak({minValue:-Infinity,maxValue:50000,symbol:(new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DOT, new esri.Color([230,152,0]), 2.25),new esri.Color([182,137,48,0.50]))),label:"Small Urban Area",field:"POP2010"});

          theRenderer.addBreak({minValue:50000,maxValue:Infinity,symbol:(new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DOT, new esri.Color([0,77,168]), 2.25),new esri.Color([90,147,168,0.50]))),label:"Urbanized Area",field: "POP2010"});


          FCLyr = new FeatureLayer(projectsUrl, {id:"Functional_Classification",visible: true,outFields:["FAC_NAM","PROPOSED","F_SYSTEM","FC_DESC", "RU"], infoTemplate: infoTemplate});

          UZALyr = new FeatureLayer("http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Urbanized_Areas/FeatureServer/0",{outFields:["*"], infoTemplate:UZAInfoTemplate});
          UZALyr.setRenderer(theRenderer);
          map.addLayers([UZALyr,FCLyr]);

        }
        activeOverlay = FCLyr;
        theLegend.layerInfos=[{layer:UZALyr, title:"2010 Adjusted Urban Areas"}, {layer:FCLyr, title:"Functional Classification"}];
      }

      if (theLayer=="Natl_Freight_Network") {
        if (NatlFreightLyr) {
          NatlFreightLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${RTE_RB_NM}</td></tr>";
          // tableText += "<tr><td>Network Type</td><td>${NATL_FRT}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("National Highway Freight Network:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_National_Highway_Freight_Network/FeatureServer/0";

          NatlFreightLyr = new FeatureLayer(projectsUrl, {id:"National Highway Freight Network",visible: true,outFields:["RTE_RB_NM","NATL_FRT"], infoTemplate: infoTemplate});
          map.addLayer(NatlFreightLyr);
        }
        activeOverlay = NatlFreightLyr;
        theLegend.layerInfos=[{layer:NatlFreightLyr, title:"National Highway Freight Network"}];
      }

      if (theLayer=="TX_Freight_Network") {	releaseNotesDiv
        if (TXFreightLyr) {
          TXFreightLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${RTE_RB_NM}</td></tr>";
          tableText += "<tr><td>Network Type</td><td>${TIER}</td></tr>";
          tableText += "</table>";


          var infoTemplate = new InfoTemplate("Freight Network:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Texas_Highway_Freight_Network/FeatureServer/0";

          TXFreightLyr = new FeatureLayer(projectsUrl, {id:"Freight Network",visible: true,outFields:["RTE_RB_NM","TIER"], infoTemplate: infoTemplate});
          map.addLayer(TXFreightLyr);
        }
        activeOverlay = TXFreightLyr;
        theLegend.layerInfos=[{layer:TXFreightLyr, title:"Texas Highway Freight Network"}];
      }

      if (theLayer=="Vertical_Clearance") {
        if (VerticalLyr) {
          VerticalLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Status</td><td>${STATUS}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Vertical Clearance:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Vertical_Clearances/FeatureServer/0";

          VerticalLyr = new FeatureLayer(projectsUrl, {id:"Vertical Clearance",visible: true,outFields:["STATUS"], infoTemplate: infoTemplate});
          map.addLayer(VerticalLyr);
        }
        activeOverlay = VerticalLyr;
        theLegend.layerInfos=[{layer:VerticalLyr, title:"Vertical Clearance"}];
      }

      if (theLayer=="Permanent_Stations") {
        if (permStationLyr) {
          permStationLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Station ID</td><td>${T_FLAG}</td></tr>";
          tableText += "<tr><td>Station Type</td><td>${STATION_TYPE}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Permanent Count Station:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Permanent_Count_Stations/FeatureServer/0";

          permStationLyr = new FeatureLayer(projectsUrl, {id:"Permanent Stations",visible: true,outFields:["T_FLAG","STATION_TYPE"], infoTemplate: infoTemplate});
          map.addLayer(permStationLyr);
        }
        activeOverlay = permStationLyr;
        theLegend.layerInfos=[{layer:permStationLyr, title:"Permanent Count Stations"}];
      }

      if (theLayer=="AADT") {
        if (aadtLyr) {
          aadtLyr.show();
          labelLayerAADT.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Station Flag</td><td>${T_FLAG}</td></tr>";
          tableText += "<tr><td>Site ID</td><td>${T_SITE_ID}</td></tr>";
          tableText += "<tr><td>AADT 2015</td><td>${F2015_TRAF:NumberFormat}</td></tr>";
          tableText += "<tr><td>AADT 2014</td><td>${F2014_TRAF:NumberFormat}</td></tr>";
          tableText += "<tr><td>AADT 2013</td><td>${F2013_TRAF:NumberFormat}</td></tr>";
          tableText += "<tr><td>AADT 2012</td><td>${F2012_TRAF:NumberFormat}</td></tr>";
          tableText += "<tr><td>AADT 2011</td><td>${F2011_TRAF:NumberFormat}</td></tr>";
          tableText += "<tr><td>AADT 2010</td><td>${F2010_TRAF:NumberFormat}</td></tr>";
          tableText += "<tr><td>AADT 2009</td><td>${F2009_TRAF:NumberFormat}</td></tr>";
          tableText += "<tr><td>AADT 2008</td><td>${F2008_TRAF:NumberFormat}</td></tr>";
          tableText += "<tr><td>AADT 2007</td><td>${F2007_TRAF:NumberFormat}</td></tr>";
          tableText += "</table><br>This count includes frontage roads when present.";

          var infoTemplate = new InfoTemplate("Traffic Count Station:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0";

          aadtLyr = new FeatureLayer(projectsUrl, {id:"AADT",visible: true,outFields:["T_FLAG","T_SITE_ID","F2015_TRAF","F2014_TRAF","F2013_TRAF","F2012_TRAF","F2011_TRAF","F2010_TRAF","F2009_TRAF","F2008_TRAF","F2007_TRAF"], infoTemplate: infoTemplate});
          map.addLayer(aadtLyr);

          //Labeling
          var label_symbol =  new TextSymbol();
          label_symbol.setColor(new Color("#F00000"));
          label_symbol.setFont(new Font("10pt").setWeight(Font.WEIGHT_BOLD));
          label_symbol.setHaloSize(2);
          label_symbol.setHaloColor(new Color([255,255,255]));

          var label_renderer = new SimpleRenderer(label_symbol);
          labelLayerAADT = new LabelLayer({id:"AADT_Labels"});
          labelLayerAADT.addFeatureLayer(aadtLyr, label_renderer, "{F2015_TRAF}");

          // function to crack open the label text and manipulate to add a thousands separator
          // labelLayerAADT._buildLabelText = function(b,d){
          // 	var aadtCount = d.F2015_TRAF;
          // 	return aadtCount.toLocaleString();
          // }

          map.addLayer(labelLayerAADT);
        }
        activeOverlay = aadtLyr;
        theLegend.layerInfos=[{layer:aadtLyr, title:"Annual Average Daily Traffic - Count Location"}];
      }

      if (theLayer=="Reference_Markers") {
        if (MarkerLyr) {
          MarkerLyr.show();
          labelLayerMarker.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${RID}</td></tr>";
          tableText += "<tr><td>Reference Marker</td><td>${MRKR_NBR}</td></tr>";
          tableText += "<tr><td>Marker Suffix</td><td>${MRKR_SFX}</td></tr>";
          tableText += "<tr><td>DFO</td><td>${MEAS:NumberFormat(places:3)}</td></tr>";
          tableText += "<tr><td>Source</td><td>${SOURCE}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Reference Markers:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/SPM_Reference_Markers/FeatureServer/0";

          MarkerLyr = new FeatureLayer(projectsUrl, {id:"Reference Marker",visible: true,outFields:["RID","MRKR_NBR","MRKR_SFX","MEAS","SOURCE"], infoTemplate: infoTemplate});
          map.addLayer(MarkerLyr);

          //Labeling
          var label_symbol =  new TextSymbol();
          label_symbol.setColor(new Color("#CC6633"));
          label_symbol.setFont(new Font("9pt").setWeight(Font.WEIGHT_BOLD));
          label_symbol.setHaloColor(new Color([255, 255, 255]));
          label_symbol.setHaloSize(2);


          var label_renderer = new SimpleRenderer(label_symbol);
          labelLayerMarker = new LabelLayer({id:"Marker_Labels"});
          labelLayerMarker.addFeatureLayer(MarkerLyr, label_renderer, "{MRKR_NBR}");
          map.addLayer(labelLayerMarker);
        }
        activeOverlay = MarkerLyr;
        theLegend.layerInfos=[{layer:MarkerLyr, title:"Reference Markers"}];
      }

      if (theLayer=="State_House_Districts") {
        if (StateHouseLyr) {
          StateHouseLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>District</td><td>${DIST_NBR}</td></tr>";
          tableText += "<tr><td>Representative</td><td><a href='http://www.house.state.tx.us/members/member-page/?district=${DIST_NBR}' target='_blank'>${REP_NM}</a></td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("State House District:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_State_House_Districts/FeatureServer/0";

          var theSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([105,105,105,255]), 2.25), new Color([211,211,211,.4]));
          var theRenderer = new SimpleRenderer(theSymbol);

          StateHouseLyr = new FeatureLayer(projectsUrl, {id:"State House District",visible: true,outFields:["DIST_NBR","REP_NM"], infoTemplate: infoTemplate});
          StateHouseLyr.setRenderer(theRenderer);
          map.addLayer(StateHouseLyr);
        }
        activeOverlay = StateHouseLyr;
        theLegend.layerInfos=[{layer:StateHouseLyr, title:"Texas House Districts"}];
      }

      if (theLayer=="State_Senate_Districts") {
        if (StateSenateLyr) {
          StateSenateLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>District</td><td>${DIST_NBR}</td></tr>";
          tableText += "<tr><td>Senator</td><td><a href='http://www.senate.state.tx.us/75r/Senate/members/dist${DIST_NBR}/dist${DIST_NBR}.htm' target='_blank'>${REP_NM}</a></td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("State Senate District:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_State_Senate_Districts/FeatureServer/0";

          var theSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([65,105,225,255]), 2.25), new Color([135,206,235,.2]));
          var theRenderer = new SimpleRenderer(theSymbol);

          StateSenateLyr = new FeatureLayer(projectsUrl, {id:"State Senate District",visible: true,outFields:["DIST_NBR","REP_NM"], infoTemplate: infoTemplate});
          StateSenateLyr.setRenderer(theRenderer);
          map.addLayer(StateSenateLyr);
        }
        activeOverlay = StateSenateLyr;
        theLegend.layerInfos=[{layer:StateSenateLyr, title:"Texas Senate Districts"}];
      }

      if (theLayer=="US_House_Districts") {
        if (USHouseLyr) {
          USHouseLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>District</td><td>${DIST_NBR}</td></tr>";
          tableText += "<tr><td>Representative</td><td>${REP_NM}</td></tr>";
          tableText += "<tr><td colspan='2'><a href='http://www.house.gov' target='_blank'>US House of Representatives</a></td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("US House District:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_US_House_Districts/FeatureServer/0";

          var theSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([233,150,122,255]), 2.25), new Color([255,160,122,.15]));
          var theRenderer = new SimpleRenderer(theSymbol);

          USHouseLyr = new FeatureLayer(projectsUrl, {id:"US House District",visible: true,outFields:["DIST_NBR","REP_NM"], infoTemplate: infoTemplate});
          USHouseLyr.setRenderer(theRenderer);
          map.addLayer(USHouseLyr);
        }
        activeOverlay = USHouseLyr;
        theLegend.layerInfos=[{layer:USHouseLyr, title:"US House Districts"}];
      }

      if (theLayer=="NHS") {
        if (NHSLyr) {
          NHSLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Highway</td><td>${RTE_NM}</td></tr>";
          tableText += "<tr><td>System Type</td><td>${Sys_Type}</td></tr>";
          tableText += "<tr><td>NHS Code</td><td>${NHS_CD}</td></tr>";
          tableText += "<tr><td>NHS Type</td><td>${NHS_TYPE}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("NHS:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_National_Highway_System/FeatureServer/0";

          NHSLyr = new FeatureLayer(projectsUrl, {id:"NHS",visible: true,outFields:["RTE_NM","Sys_Type","NHS_CD","NHS_TYPE"], infoTemplate: infoTemplate});
          map.addLayer(NHSLyr);
        }
        activeOverlay = NHSLyr;
        theLegend.layerInfos=[{layer:NHSLyr, title:"National Highway System"}];
      }

      if (theLayer=="Area_Offices") {
        if (areaOfficeLyr) {
          areaOfficeLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Office Name</td><td>${OFFICE_NM}</td></tr>";
          tableText += "<tr><td>District Name</td><td>${DIST_NM}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Area Office:",tableText);
          // var projectsUrl = "http://maps.dot.state.tx.us/arcgis/rest/services/TPPuser/TxDOT_Area_Offices/MapServer/0";
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Area_Offices/FeatureServer/0";

          // Create renderer to deal with transparency problem
          var theSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([238,59,59,1]), 2), new Color([238,59,59,0.05]));
          var theRenderer = new SimpleRenderer(theSymbol);

          areaOfficeLyr = new FeatureLayer(projectsUrl, {id:"Area_Offices",visible: true,outFields:["OFFICE_NM", "DIST_NM"], infoTemplate: infoTemplate});
          areaOfficeLyr.setRenderer(theRenderer);
          map.addLayer(areaOfficeLyr);

        }
        activeOverlay = areaOfficeLyr;
        theLegend.layerInfos=[{layer:areaOfficeLyr, title:"TxDOT Area Offices"}];
      }

      if (theLayer=="COG") {
        if (COGLyr) {
          COGLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>COG Name</td><td>${COG_NM}</td></tr>";
          tableText += "<tr><td>COG Abbreviation</td><td>${COG_ABRVN}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("COG:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_Councils_of_Governments/FeatureServer/0";

          COGLyr = new FeatureLayer(projectsUrl, {id:"COG",visible: true,outFields:["COG_NM","COG_ABRVN"], infoTemplate: infoTemplate});
          map.addLayer(COGLyr);
        }
        activeOverlay = COGLyr;
        theLegend.layerInfos=[{layer:COGLyr, title:"Council of Governments"}];
      }

      if (theLayer=="MPO") {
        if (MPOLyr) {
          MPOLyr.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>MPO Name</td><td>${MPO_NM}</td></tr>";
          tableText += "<tr><td>MPO Label</td><td>${MPO_LBL}</td></tr>";
          tableText += "<tr><td>MPO Number</td><td>${MPO_NBR}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("MPO:",tableText);
          // var projectsUrl = "http://maps.dot.state.tx.us/arcgis/rest/services/TPPuser/Texas_Metropolitan_Planning_Organization/MapServer/0";
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/Texas_Metropolitan_Planning_Organizations/FeatureServer/0";

          MPOLyr = new FeatureLayer(projectsUrl, {id:"MPO",visible: true,outFields:["MPO_NM","MPO_LBL","MPO_NBR"], infoTemplate: infoTemplate});
          map.addLayer(MPOLyr);
        }
        activeOverlay = MPOLyr;
        theLegend.layerInfos=[{layer:MPOLyr, title:"Metropolitan Planning Organizations"}];
      }

      if (theLayer=="Control_Section") {
        if (controlSectionLyr) {
          controlSectionLyr.show();
          labelLayerCS.show();
        }
        else {
          tableText = "";
          tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
          tableText += "<tr><td>Control Section</td><td>${CTRL_SECT_LN_NBR}</td></tr>";
          tableText += "<tr><td>Highway</td><td>${RTE_RB_NM}</td></tr>";
          tableText += "<tr><td>Begin Mile Point</td><td>${BEGIN_MPT}</td></tr>";
          tableText += "<tr><td>End Mile Point</td><td>${END_MPT}</td></tr>";
          tableText += "</table>";

          var infoTemplate = new InfoTemplate("Control Section:",tableText);
          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Control_Sections/FeatureServer/0";

          controlSectionLyr = new FeatureLayer(projectsUrl, {id:"Control_Section",visible: true,outFields:["CTRL_SECT_LN_NBR","RTE_RB_NM","BEGIN_MPT","END_MPT"], infoTemplate: infoTemplate});
          map.addLayer(controlSectionLyr);

          //Labeling

          var label_symbol =  new TextSymbol();
          label_symbol.setColor(new Color([0,0,0]));
          label_symbol.setFont(new Font("10pt").setWeight(Font.WEIGHT_BOLD));
          // label_symbol.setHaloSize(1);
          // label_symbol.setHaloColor(new Color([253,253,253,253]));


          var label_renderer = new SimpleRenderer(label_symbol);
          labelLayerCS = new LabelLayer({id:"CS_Labels"});
          console.log(labelLayerCS);
          labelLayerCS.addFeatureLayer(controlSectionLyr, label_renderer, "{CTRL_SECT_LN_NBR}");
          console.log(labelLayerCS);

          // function to crack open the label text and manipulate to add a hyphen in the CS number
          labelLayerCS._buildLabelText = function (b, d, c, e) {
            var csNbr = d.CTRL_SECT_LN_NBR;
            var firstFour = csNbr.substring(0,4);
            var lastTwo = csNbr.substring(4,6);
            var fixed = firstFour + "-" + lastTwo;
            return fixed;
          }
          map.addLayer(labelLayerCS);
        }
        activeOverlay = controlSectionLyr;
        theLegend.layerInfos=[{layer:controlSectionLyr, title:"Control Section Segment colors only serve to distinguish one segment from the next."}];
      }

      if (theLayer=="Top_100") {

        if (top100Lyr) {
          top100Lyr.show();
          labelLayerTop100.show();

        }
        else {

          function addCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }


          function getTextContent(graphic){
            var costDelay = "$"+(graphic.attributes.COST_DLAY/1000000).toFixed(2)+" Million";
            var costTruck = "$"+(graphic.attributes.COST_TRK/1000000).toFixed(2)+" Million";
            var delayMile = addCommas(Math.round(parseFloat(graphic.attributes.DLAY_MILE)));
            var truckDelay = addCommas(Math.round(parseFloat(graphic.attributes.TRK_DLAY)));
            tableText = "";
            tableText += "<table border=1  cellspacing=0 cellpadding=3 style='font-size:small'>";
            tableText += "<tr><td>Roadway Name</td><td>"+graphic.attributes.RD_NM+"</td></tr>";
            tableText += "<tr><td>TxDOT District</td><td>"+graphic.attributes.DIST_NM+"</td></tr>";
            tableText += "<tr><td>Annual Cost of Delay</td><td>"+costDelay+"</td></tr>";
            tableText += "<tr><td>Annual Hours of Delay per Mile</td><td>"+delayMile+"</td></tr>";
            if (graphic.attributes.TRK_RANK == 0){
              tableText += "<tr><td>Truck Delay Rank</td><td>-</td></tr>";
            }
            else{
              tableText += "<tr><td>Truck Delay Rank</td><td>"+graphic.attributes.TRK_RANK+"</td></tr>";
            }
            tableText += "<tr><td>Annual Hours of Truck Delay per Mile</td><td>"+truckDelay+"</td></tr>";
            tableText += "<tr><td>Annual Cost of Truck Delay</td><td>"+costTruck+"</td></tr>";
            tableText += "<tr><td>TCI</td><td>"+graphic.attributes.TCI+"</td></tr>";
            tableText += "<tr><td colspan='2' align='left' style= font-size:10px>TCI - Texas Congestion Index - ratio of the peak period average travel time to the free flow travel time. A value of 1.20 means that a 30 minute trip during light traffic would take 36 minutes during peak periods.</td></tr>";
            tableText += "<tr><td colspan='2'><a href='http://www.txdot.gov/inside-txdot/projects/100-congested-roadways.html' target='_blank'>List View</a></td></tr>";
            tableText += "</table>";
            return tableText;
          }
          var infoTemplate = new InfoTemplate("Rank: ${RANK} / Year: ${YR}",getTextContent);

          var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Top_100_Congested_Roadways/FeatureServer/0";
          //var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/100_test_service/FeatureServer/0"
          top100Lyr = new FeatureLayer(projectsUrl, {id:"Top 100:",visible: true,outFields:["RANK","TRK_RANK","SEG_ID","RD_NM","DLAY_MILE","TRK_DLAY","TCI","COST_DLAY","COST_TRK","DIST_NM","YR"], infoTemplate: infoTemplate});
          map.addLayer(top100Lyr);
          map.infoWindow.resize(350,400);
          //Labeling
          var label_symbol =  new TextSymbol();
          label_symbol.setColor(new Color([255,255,0]));
          label_symbol.setFont(new Font("11pt"));
          label_symbol.setHaloColor(new Color([0,0,0]));
          label_symbol.setHaloSize(2);




          var label_renderer = new SimpleRenderer(label_symbol);
          labelLayerTop100 = new LabelLayer({id:"Top_100_Labels"});
          labelLayerTop100.addFeatureLayer(top100Lyr, label_renderer, "{RANK}",{lineLabelPosition:"InLine",labelRotation:false});

          map.addLayer(labelLayerTop100);

        }

        activeOverlay = top100Lyr;
        theLegend.layerInfos=[null];
        //theLegend.layerInfos=[{ title:"Top 100 Congested Roadways"}];
      }


      scaleDependentQueries();
    }
    function addInventoryData() {

      tableText = "";
      tableText += "<table border=1 cellspacing=0 cellpadding=3 style='font-size:small'>";
      tableText += "<tr><td>Highway</td><td>${HWY}</td></tr>";
      tableText += "<tr><td>AADT</td><td>${ADT_CUR:NumberFormat}</td></tr>";
      tableText += "<tr><td>AADT Future</td><td>${ADT_DESGN:NumberFormat}</td></tr>";
      tableText += "<tr><td>Lanes</td><td>${NUM_LANES}</td></tr>";
      tableText += "<tr><td>Speed</td><td>${SPD_MAX}</td></tr>";
      tableText += "<tr><td>Truck PCT</td><td>${TRK_AADT_PCT}</td></tr>";
      tableText += "<tr><td>ROW Width</td><td>${ROW_W_USL}</td></tr>";
      tableText += "<tr><td>Surface Width</td><td>${SUR_W}</td></tr>";
      tableText += "<tr><td>Roadbed Width</td><td>${RB_WID}</td></tr>";
      tableText += "<tr><td>Median Width</td><td>${MED_WID}</td></tr>";
      tableText += "</table>";

      var infoTemplate = new InfoTemplate("Roadway Inventory:",tableText);
      var projectsUrl = "http://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Roadway_Inventory_OnSystem/FeatureServer/0";

      //var theSymbol = new esri.symbol.SimpleLineSymbol("solid", new esri.Color("#FF0000"), 5);
      var theSymbol = new CartographicLineSymbol(CartographicLineSymbol.STYLE_SOLID, new Color("#FF0000"), 5, CartographicLineSymbol.CAP_ROUND, CartographicLineSymbol.JOIN_MITER, 5);
      var theRenderer = new SimpleRenderer(theSymbol);

      //Add the layer - outFields: ["*"] if you want to use all fields
      projectsRI = new FeatureLayer(projectsUrl, {id:"RoadwayInventory",visible: false,outFields:["HWY","ADT_CUR","ADT_DESGN","NUM_LANES","SPD_MAX","TRK_AADT_PCT","ROW_W_USL","SUR_W","RB_WID","MED_WID","HSYS","ADT_YEAR"], infoTemplate: infoTemplate});
      projectsRI.setRenderer(theRenderer);
      projectsRI.setAutoGeneralize(false);
      map.addLayer(projectsRI);
    }

    on(dom.byId("cmdRunQuery"), "click", gatherQueryInfo);
    function gatherQueryInfo() {
      /*if (validateQueryForm()!=true) {
      updateExternalLinks();
      return;
    }*/

    var theRteName = document.getElementById("rteName").value;
    var theAttrSelected = document.getElementById("attrSelect").value;
    var theOpSelected = document.getElementById("opSelect").value;
    var theValue = document.getElementById("attrValue").value;
    var theOperator = "";

    theRteName = theRteName.toUpperCase();

    if (theOpSelected=="opGreaterThan") {
      theOperator = ">";
    }
    if (theOpSelected=="opLessThan") {
      theOperator = "<";
    }
    if (theOpSelected=="opEqual") {
      theOperator = "=";
    }

    var theQuery = "";

    if (theRteName=="*") {
      theQuery = "REC=1 and HWY_STAT>3 and " + theAttrSelected + theOperator + theValue;
    }
    else if (theRteName=="IH") {
      theQuery = "REC=1 and HWY_STAT>3 and HSYS='IH' and " + theAttrSelected + theOperator + theValue;
    }
    else if (theRteName=="US") {
      theQuery = "REC=1 and HWY_STAT>3 and HSYS='US' and " + theAttrSelected + theOperator + theValue;
    }
    else if (theRteName=="SH") {
      theQuery = "REC=1 and HWY_STAT>3 and HSYS='SH' and " + theAttrSelected + theOperator + theValue;
    }
    else if (theRteName=="SL") {
      theQuery = "REC=1 and HWY_STAT>3 and HSYS='SL' and " + theAttrSelected + theOperator + theValue;
    }
    else if (theRteName=="FM") {
      theQuery = "REC=1 and HWY_STAT>3 and HSYS='FM' and " + theAttrSelected + theOperator + theValue;
    }
    else if (theRteName=="RM") {
      theQuery = "REC=1 and HWY_STAT>3 and HSYS='RM' and " + theAttrSelected + theOperator + theValue;
    }
    else {
      theQuery = "REC=1 and HWY_STAT>3 and RIA_RTE_ID='" + theRteName + "-KG' and " + theAttrSelected + theOperator + theValue;
    }

    selectAttributes(theQuery);
  }

  function selectAttributes(theQuery) {
    projectsRI.setDefinitionExpression(theQuery);
    noResults("queryResults","Running Query.....");

    projectsRI.selectFeatures(theQuery,FeatureLayer.SELECTION_NEW,function(featureSet){
      if (featureSet.length>0) {
        if (featureSet.length<50) {
          map.setExtent(graphicsUtils.graphicsExtent(featureSet));
          noResults("queryResults",featureSet.length + " records returned.  Click mapped segments to view details.");
        }
        else {
          noResults("queryResults","More than 2,000 records returned.  Zoom out to view results, then click mapped segments to view details.");
        }
        projectsRI.show();
      }
      else {
        noResults("queryResults","Query returned 0 records.<br>Please try again.");
        projectsRI.hide();
      }
    });
  }

  dojo.query(".Searcher").forEach(function (result){
    on(result, "click", check);
  });
  var theSearchLayer;
  function check(searchLayer) {
    theSearchLayer = searchLayer.target.id;
    document.getElementById("txtSearch").focus();
    document.getElementById("searchResults").innerHTML = "";
  }

  on(dom.byId("txtSearch"), "keyup", checkInput);
  function checkInput(event) {
    var userInput = event.target.value;

    var inputLenTest=3;
    if (theSearchLayer=="OnSystem_Highway") {
      inputLenTest=4;
    }

    else if (theSearchLayer=="Top_100_Congested"){
      inputLenTest=0;
    }

    else {
      inputLenTest=3;
    }



    if (userInput.length>inputLenTest) {
      if (theSearchLayer=="Texas_City") {
        var query = new Query();
        query.returnGeometry = false;
        query.where = "[CITY_NM] LIKE '" + userInput + "%'";
        citySearchLyr.queryIds(query, function (objectIds) {getAttributeData(objectIds);});
      }

      if (theSearchLayer=="TxDOT_Control_Section") {
        var query = new Query();
        query.returnGeometry = false;
        query.where = "[CTRL_SECT_NBR] LIKE '" + userInput + "%'";
        csSearchLyr.queryIds(query, function (objectIds) {getAttributeData(objectIds);});
      }

      if (theSearchLayer=="Texas_County") {
        var query = new Query();
        query.returnGeometry = false;
        query.where = "[CNTY_NM] LIKE '" + userInput + "%'";
        countySearchLyr.queryIds(query, function (objectIds) {getAttributeData(objectIds);});
      }

      if (theSearchLayer=="TxDOT_District") {
        var query = new Query();
        query.returnGeometry = false;
        query.where = "[DIST_NM] LIKE '" + userInput + "%'";
        districtSearchLyr.queryIds(query, function (objectIds) {getAttributeData(objectIds);});
      }

      if (theSearchLayer=="OnSystem_Highway") {
        var query = new Query();
        query.returnGeometry = false;
        query.where = "[RTE_NM] LIKE '" + userInput + "%'";
        highwaySearchLyr.queryIds(query, function (objectIds) {getAttributeData(objectIds);});
      }

      if (theSearchLayer=="Top_100_Congested") {
        var query = new Query();
        query.returnGeometry = false;
        query.where = "[Rank] LIKE '" + userInput + "%'";
        top100SearchLyr.queryIds(query, function (objectIds) {getAttributeData(objectIds);});
      }

    }
  }

  function getAttributeData(theIDs) {
    var querySuccessful = false;
    var query = new Query();
    query.objectIds = theIDs.slice();
    query.outFields = ["*"];

    if (theSearchLayer=="Texas_City") {
      citySearchLyr.queryFeatures(query, function (featureSet) {
        showSearchResults(featureSet,12);
        querySuccessful = true;
      });
    }

    if (theSearchLayer=="TxDOT_Control_Section") {
      csSearchLyr.queryFeatures(query, function (featureSet) {
        showSearchResults(featureSet,13);
        querySuccessful = true;
      });
    }

    if (theSearchLayer=="Texas_County") {
      countySearchLyr.queryFeatures(query, function (featureSet) {
        showSearchResults(featureSet,10);
        querySuccessful = true;
      });
    }

    if (theSearchLayer=="TxDOT_District") {
      districtSearchLyr.queryFeatures(query, function (featureSet) {
        showSearchResults(featureSet,8);
        querySuccessful = true;
      });
    }

    if (theSearchLayer=="OnSystem_Highway") {
      highwaySearchLyr.queryFeatures(query, function (featureSet) {
        showSearchResults(featureSet,12);
        querySuccessful = true;
      });
    }

    if (theSearchLayer=="Top_100_Congested") {
      top100SearchLyr.queryFeatures(query, function (featureSet) {
        showSearchResults(featureSet,13);
        querySuccessful = true;
      });
    }


    if (querySuccessful) {
      //Nothing
    }
    else {
      noResults("searchResults","Searching...");
    }
  }

  function noResults(theDiv,theText) {
    document.getElementById(theDiv).innerHTML = theText;
  }

  function showSearchResults(results,theZoom) {
    var resultItems = [];
    var finalSet = [];
    var resultText = "";
    var resultCount = results.features.length;
    for (var i = 0; i < resultCount; i++) {
      var featureAttributes = results.features[i].attributes;
      for (var attr in featureAttributes) {
        finalSet.push(featureAttributes[attr]);
      }
      console.log(finalSet);
      if (theSearchLayer=="OnSystem_Highway") {
        resultText += "<span class='SearchResult' id='" + finalSet[3] + "," + finalSet[4] + "," + theZoom + "," + finalSet[0] + "'>" + finalSet[1] + "-" + finalSet[2] + " CO.</span>";
      }

      else if (theSearchLayer=="Top_100_Congested"){
        resultText += "<span class='SearchResult' id='" + finalSet[3] + "," + finalSet[4] + "," + theZoom + "," + finalSet[0] + "'>" + finalSet[1] + "</span>";
      }

      else if (theSearchLayer=="TxDOT_Control_Section"){
        resultText += "<span class='SearchResult' id='" + finalSet[3] + "," + finalSet[4] + "," + theZoom + "," + finalSet[0] + "'>" + finalSet[1] + "</span>";
      }

      else {
        resultText += "<span class='SearchResult' id='" + finalSet[4] + "," + finalSet[5] + "," + theZoom + "," + finalSet[0] + "'>" + finalSet[1] + "</span>";
      }
      finalSet = [];
    }

    document.getElementById("searchResults").innerHTML = resultText;

    dojo.query(".SearchResult").forEach(function (result){
      on(result, "click", zoomTo);
      on(result, "click", clearHighlighter);
      on(result, "click", highlighter);
    });

  }

  function highlighter (result) {
    var params = result.target.id;
    var paramsList = params.split(',');
    var theOID = paramsList[3];
    var whereClause = "OBJECTID =" + theOID;
    if (theSearchLayer=="Texas_City") {
      citySearchLyr.setDefinitionExpression(whereClause);
      citySearchLyr.show();
    }
    if (theSearchLayer=="TxDOT_Control_Section") {
      csSearchLyr.setDefinitionExpression(whereClause);
      csSearchLyr.show();
    }
    if (theSearchLayer=="Texas_County") {
      countySearchLyr.setDefinitionExpression(whereClause);
      countySearchLyr.show();
    }
    if (theSearchLayer=="TxDOT_District") {
      districtSearchLyr.setDefinitionExpression(whereClause);
      districtSearchLyr.show();
    }
    if (theSearchLayer=="OnSystem_Highway") {
      highwaySearchLyr.setDefinitionExpression(whereClause);
      highwaySearchLyr.show();
    }
    if (theSearchLayer=="Top_100_Congested") {
      top100SearchLyr.setDefinitionExpression(whereClause);
      top100SearchLyr.show();
    }

  }

  on(dom.byId("txtSearch"), "click", clearHighlighter);
  on(dom.byId("btnClearHighlighter"), "click", clearHighlighter);
  function clearHighlighter () {
    citySearchLyr.setDefinitionExpression("");
    csSearchLyr.setDefinitionExpression("");
    countySearchLyr.setDefinitionExpression("");
    districtSearchLyr.setDefinitionExpression("");
    highwaySearchLyr.setDefinitionExpression("");
    top100SearchLyr.setDefinitionExpression("");
    citySearchLyr.hide();
    csSearchLyr.hide();
    countySearchLyr.hide();
    districtSearchLyr.hide();
    highwaySearchLyr.hide();
    top100SearchLyr.hide();
    document.getElementById("btnClearHighlighter").style.display="none";
  }

  on(dom.byId("searchResults"), "click", showClearButton);
  function showClearButton (){
    document.getElementById("btnClearHighlighter").style.display="block";
  }

  on(dom.byId("btnCalcCost"), "click", deCalculateCost);
  function deCalculateCost() {
    if (deLength>0) {
      //Nothing
    }
    else {
      alert("Please draw a line before calculating costs.");
      return;
    }

    var deProjectType = document.getElementById("selPrjType").value;
    var deAreaType = document.getElementById("selPrjAreaType").value;
    var deRouteType = document.getElementById("selPrjRouteType").value;
    var deDivided = document.getElementById("selPrjDividedType").value;
    var deFrontageRoads = document.getElementById("selPrjFrontageRoads").value;
    var deLanes = document.getElementById("txtPrjLanes").value;
    var deProjectLength = Math.round(deLength*1000)/1000;

    if (deLanes<1) {
      alert("Number of Lanes must be greater than 0.");
      return;
    }

    if (deRouteType=="E") {
      deDivided = "H";
    }

    var userProjectInput = deProjectType + deAreaType + deRouteType + deDivided;
    var codeArray = new Array("ADFH","ADFI","BDFH","BDFI","ADGH","ADGI","BDGH","BDGI","ADEH","BDEH","ACFH","ACFI","BCFH","BCFI","ACGH","ACGI","BCGH","BCGI","ACEH","BCEH");
    var costArray = new Array(2891181,1523096,679775,410606,1567558,1142895,743221,527346,2500000,585985,3307443,1424801,883591,742257,2948087,1413481,1213519,853382,5463629,917134);
    var prjCostPerMile;

    var i;
    for (i=0;i<20;i++) {
      if (userProjectInput==codeArray[i]) {
        prjCostPerMile = costArray[i];
      }
    }

    var totalRoadTypeCost = prjCostPerMile * deLanes * deProjectLength;
    var totalFrontageRoadCost=0;

    if (deFrontageRoads=="2") {
      totalFrontageRoadCost = 1250000 * deProjectLength * 4;
    }
    else {
      totalFrontageRoadCost = 0;
    }

    //Summing total project cost and writing to output
    var theOutputArea = document.getElementById("deCostResult");
    var totalProjectCost = totalRoadTypeCost + totalFrontageRoadCost;
    totalProjectCost = Math.round(totalProjectCost/1000)*1000;
    theOutputArea.innerHTML = "<br>Project Length: <br>" + deProjectLength + " miles<br><br>Estimated Construction Cost: <br>$" + addCommas(totalProjectCost);
  }

  function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  }

  on(dom.byId("btnClearProject"), "click", deClear);
  function deClear() {
    map.graphics.clear();
    document.getElementById("deCostResult").innerHTML = "";
    theDistMeasured=0;
    xPointArray.length=0;
    currentMeasure=0;
    deLength=0;
  }

  on(dom.byId("googleLink"), "click", openGoogleMaps);
  function openGoogleMaps() {
    var ctr = map.extent.getCenter();
    var lat = ctr.getLatitude();
    var lon = ctr.getLongitude();
    var level = map.getLevel();
    window.open("https://www.google.com/maps/@"+lat+","+lon+","+level+"z");
  }
  on(dom.byId("bingLink"), "click", openBingMaps);
  function openBingMaps() {
    var ctr = map.extent.getCenter();
    var lat = ctr.getLatitude();
    var lon = ctr.getLongitude();
    var level = map.getLevel();
    window.open("http://www.bing.com/mapspreview?cp="+lat+"~"+lon+"&lvl="+level+"&style=r");
  }
  // on(dom.byId("takeSurvey"), "click", surveyLink);
  on(dom.byId("btnSurvey"), "click", surveyLink);
  // on(dom.byId("noThanks"), "click", noThanks);
  function surveyLink(){
    window.open("https://www.surveymonkey.com/r/txdot_spm_feedback");
    // noThanks();
  }
  //    function noThanks(){
  //    	document.getElementById("maskDiv").style.display="none";
  //    	document.getElementById("surveyDiv").style.display="none";
  //    	if (document.getElementById("doNotShow").checked == true){
  //    		localStorage.setItem("SPM_survey", "noThanks");
  //    	}
  // }
  // function checkLocalStorage(){
  // 	if (localStorage.getItem("SPM_survey")===null){
  // 		document.getElementById("maskDiv").style.display="block";
  //    		document.getElementById("surveyDiv").style.display="block";
  // 	}
  // }
  // window.onload=checkLocalStorage;

  on(dom.byId("btnReleaseNotes"), "click", showReleaseNotes);
  function showReleaseNotes(){
    document.getElementById("maskDiv").style.display="block";
    document.getElementById("releaseNotesDiv").style.display="block";
  }
});
function closeReleaseNotes(){
  document.getElementById("maskDiv").style.display="none";
  document.getElementById("releaseNotesDiv").style.display="none";
}