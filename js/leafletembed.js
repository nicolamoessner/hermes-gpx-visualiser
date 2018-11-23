$(document).ready(function() {

    /* Create a div block in the html document, and add the list of filenames. */
    for (var i=0; i < sessionStorage.length ; i++) {
        var gpxFile = sessionStorage.getItem(sessionStorage.key(i));
        var gpxName = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).name;
        var gpxDate = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).time.substring(0,10);
        var gpxTime = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).time.substring(11,19);
        var id = "tab_id_" + i;
        $("#gpx-files-list").append(
            "<div class='list-group-item file-inList inactive-file font-weight-bold' id='"+id+"' href='#' onclick='routeSelected("+i+", "+gpxFile+")' role='tab' aria-controls='home'>"+gpxName+"<br />("+gpxDate+", "+gpxTime+")"+"</div>"
          );

        var togglerId = "file-" + i + "-toggler";
        $("#togglesContainer").append(
          "<div id="+togglerId+" class='btn toggler font-weight-bold text-white pt-0 rounded-0' style='background-color: "+colors[i]+"' onclick='toggle("+i+")'>Details for: "+gpxName+" ("+gpxDate+", "+gpxTime+")"+"</div>"
        );
        var detailsId = "file-" + i + "-details";
        $("#togglesContainer").append(
          "<div id="+detailsId+" style='display: none; border-color: #f2f2f2' class='pl-4 pb-1 mb-2 border border-top-0'></div>"
        );
        renderDetailToggle(i, gpxFile);
    }

    /* Initialise the map then draw the first (possibly only) file uploaded by the user. */
    initmap();
    routeSelected(0, sessionStorage.getItem(sessionStorage.key(0)));
    toggle(0);
});

/* Initialise an array with 10 colors for the different files. Yellow:F7BB27 Orange:FF553A, FF9700, FF660D */
var colors = ["#FF9700", "#FF660D", "#C8003C", "#900F40", "#591D46", "#485E6E", "#519597", "#81A36D", "#A8BA75", "#6D6875"];
var colorsInactive = ["#874F00", "#FF660D", "#C8003C", "#900F40", "#591D46", "#485E6E", "#519597", "#81A36D", "#A8BA75", "#6D6875"];
/* Initialise an array to store selected files in. Functions like a stack. */
var selectedFiles = [];

/* Initialise variable hrIcon to store the info on the icon image. */
var hrIcon = L.icon({
    iconUrl: './img/hr.png',
    iconSize:     [20, 20], // size of the icon
    iconAnchor:   [10, 20], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -20] // point from which the popup should open relative to the iconAnchor
});

var cadIcon = L.icon({
    iconUrl: './img/cad.png',
    iconSize:     [20, 20], // size of the icon
    iconAnchor:   [10, 20], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -20] // point from which the popup should open relative to the iconAnchor
});

/*** Initialise the leaflet map. ***/
var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
var hrMarkerGroup = {};
var hrToggle = {};
var cadMarkerGroup = {};
var cadToggle = {};

function initmap() {
    // set up the map
    map = new L.Map('map');

    // create the tile layer with correct attribution
    var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 17, attribution: osmAttrib});
    map.addLayer(osm);
}
/***********************************/

/* Adds the heart rate icons to the map */
function addIcon(index){
    var gpxFile = JSON.parse(sessionStorage.getItem(sessionStorage.key(index)));
    var hrMarkers = [];
    var cadMarkers = [];
    for (seg of gpxFile.trksegs) {
        for (var i=0; i < seg.length; i++) {
        /* Add a heart rate icon for every num entry. */
            if (i % 50 == 0){
                hrMarkers.push(L.marker([seg[i].lat,seg[i].lon], {icon: hrIcon}).bindPopup("Heart rate: "+seg[i].ext.hr));
                cadMarkers.push(L.marker([seg[i].lat,seg[i].lon], {icon: cadIcon}).bindPopup("Cadence: "+seg[i].ext.cad));
            }
        }
        hrMarkerGroup[index] = L.layerGroup(hrMarkers);
	hrToggle[index] = hrMarkerGroup[index];
        hrToggle[index].addTo(map);
        cadMarkerGroup[index] = L.layerGroup(cadMarkers);
	cadToggle[index] = cadMarkerGroup[index];
        cadToggle[index].addTo(map);
    }
}

/* Removes the heart rate icons from the map. */
function delIcon(index){
    map.removeLayer(hrMarkerGroup[index]);
    delete hrMarkerGroup[index];
    delete hrToggle[index];
    map.removeLayer(cadMarkerGroup[index]);
    delete cadMarkerGroup[index];
    delete cadToggle[index];
}

function radClick() {
    if (document.getElementById('none').checked){
        Object.keys(hrMarkerGroup).forEach(function(key) {
            map.removeLayer(hrToggle[key]);
        });
        Object.keys(cadMarkerGroup).forEach(function(key) {
            map.removeLayer(cadToggle[key]);
        });
    }
    else if (document.getElementById('hr').checked){
        Object.keys(hrMarkerGroup).forEach(function(key) {
            hrMarkerGroup[key].eachLayer(function (layer) {
                hrToggle[key] = hrMarkerGroup[key];
                map.addLayer(hrToggle[key]);
             });
        });
        Object.keys(cadMarkerGroup).forEach(function(key) {
            map.removeLayer(cadToggle[key]);
        });
    }
    else if (document.getElementById('cad').checked){
        Object.keys(cadMarkerGroup).forEach(function(key) {
            cadMarkerGroup[key].eachLayer(function (layer) {
                cadToggle[key] = cadMarkerGroup[key];
                map.addLayer(cadToggle[key]);
            });
        });
        Object.keys(hrMarkerGroup).forEach(function(key) {
            map.removeLayer(hrToggle[key]);
        });
    }
}

function routeSelected(i, gpxFile) {
    /* Build id of the tab divs */
    var id = "tab_id_" + i;
    //var gpxKey = sessionStorage.key(i);

    /* Check if the tab is already selected */
    if ($("#"+id+"").hasClass("active-file")) {
        /* Remove active class form tab */
        $("#"+id+"").removeClass("active-file");
        $("#"+id+"").css("background-color", "#fff");
        /* Get the selected polygon and remove it from the map. */
        for (var j = 0; j < plotlayers.length; j++) {
            if (plotlayers[j].options.id == i) {
              plotlayers[j].remove(map);
            }
        }
        /* Remove file from list of selected files. */
        var index_rm;
        for (var k = 0; k < selectedFiles.length; k++) {
          if (selectedFiles[k] == i) {
            index_rm = k;
          }
        }
        selectedFiles.splice(index_rm, 1);

        if (selectedFiles.length > 0) {
          /* Focus map on latest file selected. */
          var lastSelected = selectedFiles[selectedFiles.length - 1];
          console.log("Last: ", lastSelected);
          var lat = JSON.parse(sessionStorage.getItem(sessionStorage.key(lastSelected))).trksegs[0][0].lat;
          var lon = JSON.parse(sessionStorage.getItem(sessionStorage.key(lastSelected))).trksegs[0][0].lon;
          console.log(lat, lon);
          map.setView([lat, lon]);
        } else {
          map.fitWorld();
        }

        /* Hide toggler & detail divs. */
        $("#file-"+i+"-toggler").hide();
        $("#file-"+i+"-details").hide();
	delIcon(i);
        radClick();
        /* Check if any files are selected, display message if not. */
        // ToDo: Nicola
    } else {
        $("#"+id+"").removeClass("inactive-file");
        $("#"+id+"").addClass("active-file");
        $("#"+id+"").css("background-color", colors[i]),
        selectedFiles.push(i);
        console.log(selectedFiles);
        gpxMapRender(i);
        // renderGraph(i);
        /* Show toggler */
        $("#file-"+i+"-toggler").show();
        addIcon(i);
        radClick();
    }
}

function toggle(id) {
  if ($("#file-"+id+"-details").is(":visible")) {
    // $("#file-"+id+"-toggler").removeClass("btn-success");
    // $("#file-"+id+"-toggler").addClass("btn-outline-secondary");
    // $("#file-"+id+"-toggler").css("border-color", colors[id]);
  } else {
    // $("#file-"+id+"-toggler").removeClass("btn-outline-secondary");
    // $("#file-"+id+"-toggler").addClass("btn-success");
    // $("#file-"+id+"-toggler").css("background-color", colors[id]);
  }
  $( "#file-"+id+"-details" ).slideToggle( "slow", function() {
    // Animation complete.
  });

}

/*** SOURCE: https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates-shows-wrong ***/
//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2)
{
  var R = 6371; // km
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
}
// Converts numeric degrees to radians
function toRad(Value)
{
    return Value * Math.PI / 180;
}
/*** *********************************************** ***/

function renderDetailToggle(id, gpxFile) {
  gpxFile = JSON.parse(gpxFile);
  var parentDivId = "file-" + id + "-details";
  var lastTrkpt = gpxFile.trksegs[gpxFile.trksegs.length-1][gpxFile.trksegs[gpxFile.trksegs.length-1].length-1];
  var distance = 0;
  for (seg of gpxFile.trksegs) {
    for (i=0; i<(seg.length-1); i++) {
      distance += calcCrow(seg[i].lat, seg[i].lon, seg[i+1].lat, seg[i+1].lon);
    }
  }
  $("#"+parentDivId+"").append(
    '<div class="row py-2">\
        <div class="col-6" id="'+parentDivId+'-col4"> \
          \
        </div> \
        <div class="col-2 text-center"> \
          <strong>Start Time</strong><br />'+gpxFile.trksegs[0][0].time.substring(11,19)+' \
        </div> \
        <div class="col-2 text-center"> \
          <strong>End Time</strong><br />'+lastTrkpt.time.substring(11,19)+'\
        </div> \
        <div class="col-2 text-center"> \
          <strong>Distance</strong><br />'+distance.toFixed(2)+' km\
        </div>'
    );

  var trackExts = [];
  var trackExt = gpxFile.trksegs[0][5].ext;
  /* Add a chart for each extension included in the gpx file. */
  if (trackExt.hr) {
      trackExts.push("hr");
  }
  if (trackExt.cad) {
      trackExts.push("cad");
  }
  /** ADD OTHER EXTENSIONS HERE USING THE SAME FORMAT **/
  if (trackExt.atemp) {
      trackExts.push("atemp");
  }

  // console.log("Extensions: ", trackExts);
  // $("#"+parentDivId+"").append(
  //   '<div class="row my-3">\
  //       <div class="col-4"> \
  //         <strong> Choose extension graph to show </strong> \
  //       </div> \
  //       <div class="col-4"> \
  //         <strong>( click button to show, reclick it to close )</strong> \
  //       </div> \
  //   </div>'
  //   );

  //add button
  for (ext of trackExts) {
      var graph_render_type
      graph_render_type = "renderGraph("+id+",'"+ext+"')"
      var divId = "file-" + id + "-graph-" + ext;
      var type;
      if (ext == "atemp"){
          type = "Temperature";
      } else if (ext == "cad"){
          type = "Cadence";
      } else{
          type = "Heart Rate";
      }

      $("#"+parentDivId+"-col4").append(
        '<div id="extension_btn'+divId+'" \
        class="btn btn-outline-info mr-2" onclick="'+graph_render_type+'"> '+ type +' \
        </div>'
      );
  }
  // renderGraph(gpxFile, ext, divId);
  for (ext of trackExts){
    var divId = "file-" + id + "-graph-" + ext;
    $("#"+parentDivId+"").append(
        '</div>\
            <div class="row my-0 ml-1">\
            <div id="chartContainer'+ id + ext +'" style="display: none; height: 200px; width: 90%;"></div>\
        </div>'
    );
  }

}

/* Draws the route gpxKey on the map using leaflet. */
function gpxMapRender(index) {
    /* Load the file with the given index from sessionStorage. */
    var gpxFile = JSON.parse(sessionStorage.getItem(sessionStorage.key(index)));

    /* Load the file with track name gpxKey from sessionStorage. */
    // var gpxFile = JSON.parse(sessionStorage.getItem(gpxKey.name+" "+gpxKey.time));
    /* Go through each track segment and draw a Polyline on the map */
    for (seg of gpxFile.trksegs) {
        /* Create an empty list then add to it the coordinates of each track point in the segment. */
        var pointList = [];
        for (var i=0; i < seg.length; i++) {
            pointList.push(new L.LatLng(seg[i].lat, seg[i].lon));
        }

        /* Draw poplyline for current track segment. */
        var firstPolyline = new L.Polyline(pointList, {
            id: index, // Same index for multiple segments!!!
            color: colors[index],
            weight: 3,
            opacity: 1,
            smoothFactor: 1
        });
        firstPolyline.addTo(map);
        plotlayers.push(firstPolyline); // Add ployline layer to list of al layers.

    }

    /* Set the map to view the starting position of the gpx file. */
    map.setView(new L.LatLng(gpxFile.trksegs[0][0].lat, gpxFile.trksegs[0][0].lon), 13);
}
function renderGraph(id,inp_type){
        if ($("#chartContainer"+id+inp_type+"").is(":hidden")) {
          $("#chartContainer"+id+inp_type+"").show();
        } else {
          $("#chartContainer"+id+inp_type+"").hide();
        }
        var gpxFile = JSON.parse(sessionStorage.getItem(sessionStorage.key(id)));

        console.log("graph")
        console.log(inp_type)
        var data = []
        var earliesttime = 0
        var type
        var unit

        if (inp_type == "atemp"){
            type = "Temperature"
            unit = "Degree ( Celsius )"
        } else if (inp_type == "cad"){
            type = "Cadence"
            unit = "Cycle per minute"
        } else{
            type = "Heart Rate"
            unit = "BPM ( Beats Per Minute )"
        }

        for (seg of gpxFile.trksegs){

            for(var i =0 ;i<seg.length ; i++){
                var time = seg[i].time;

                if(earliesttime == 0){
                    earliesttime = time
                }

                if(type == "Temperature"  && seg[i].ext.atemp){
                    var atemp = seg[i].ext.atemp
                    data.push({x : (toDate(time).getTime() - toDate(earliesttime).getTime()) / (3600 * 60), y : parseInt(atemp)})

                } else if (type == "Heart Rate" && seg[i].ext.hr){
                    var hr = seg[i].ext.hr
                    data.push({x : (toDate(time).getTime() - toDate(earliesttime).getTime()) / (3600 * 60), y : parseInt(hr)})

                } else if (type == "Cadence" && seg[i].ext.hr){
                    var cad = seg[i].ext.cad
                    data.push({x : (toDate(time).getTime() - toDate(earliesttime).getTime()) / (3600 * 60), y : parseInt(cad)})
                }

            }
        }
        console.log(type)

        var chart = new CanvasJS.Chart('chartContainer'+id+inp_type, {
            animationEnabled: true,
            theme: "light2",
            title:{
                text: type /* +  " from " + gpxFile.name */
            },
            axisX:{
                // valueFormatString: "HH:MM:SS",
                title : "Time (hr)",
                crosshair: {
                    enabled: true,
                    snapToDataPoint: true
                }
            },
            axisY: {
                title: unit,
                crosshair: {
                    enabled: true
                }
            },
            toolTip:{
                shared:true
            },
            legend:{
                cursor:"pointer",
                verticalAlign: "bottom",
                horizontalAlign: "left",
                dockInsidePlotArea: true,
                itemclick: toogleDataSeries
            },
            data: [{
                type: "line",
                showInLegend: true,
                name: type,
                markerType: "square",
                color: "#F08080",
                dataPoints : data
            }]
        });
        chart.render();
    }

    function removeGraph(id){

    }

    function toogleDataSeries(e){
        if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
        } else{
            e.dataSeries.visible = true;
        }
        chart.render();
    }


    function toDate(time){
        var result = new Date();

        result.setFullYear(time.substring(0,4));
        result.setMonth(time.substring(5,7));
        result.setDate(time.substring(8,10));
        result.setHours(time.substring(11,13));
        result.setMinutes(time.substring(14,16));
        result.setSeconds(time.substring(17,19));

        // console.log(result);
        return result;
    }
