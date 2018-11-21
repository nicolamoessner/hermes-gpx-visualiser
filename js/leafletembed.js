$(document).ready(function() {
    /* Create a div block in the html document, and add the list of filenames. */
    for (var i=0; i < sessionStorage.length ; i++) {
        var gpxFile = sessionStorage.getItem(sessionStorage.key(i));
        var gpxName = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).name;
        var gpxDate = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).time.substring(0,10);
        var gpxTime = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).time.substring(11,19);
        var id = "tab_id_" + i;
        $("#gpx-files-list").append(
            "<a class='list-group-item inactive-file font-weight-bold' id='"+id+"' href='#' onclick='routeSelected("+i+", "+gpxFile+")' role='tab' aria-controls='home'>"+gpxName+" ("+gpxDate+"; "+gpxTime+")"+"</a>"
          );

        var togglerId = "file-" + i + "-toggler";
        $("#togglesContainer").append(
          "<div id="+togglerId+" class='btn btn-outline-secondary toggler font-weight-bold' onclick='toggle("+i+")'>Details for: "+gpxName+" ("+gpxDate+"; "+gpxTime+")"+"</div>"
        );
        var detailsId = "file-" + i + "-details";
        $("#togglesContainer").append(
          "<div id="+detailsId+" style='display: none;'></div>"
        );
        renderDetailToggle(i, gpxFile);
    }

    /* Initialise the map then draw the first (possibly only) file uploaded by the user. */
    initmap();
    routeSelected(0, sessionStorage.getItem(sessionStorage.key(0)));
    toggle(0);
});

/* Initialise an array with 10 colors for the different files. */
var colors = ["#FF9700", "#FF660D", "#FF1A0D", "#FF0D67", "#F10DFF", "#5F0DFF", "#0D5CFF", "#0DF5FF", "#1AFF0D", "#F8FF0D"]
/* Initialise an array to store selected files in. Functions like a stack. */
var selectedFiles = [];

/* Initialise variable hrIcon to store the info on the icon image. */
var hrIcon = L.icon({
    iconUrl: './img/hr.png',
    iconSize:     [20, 20], // size of the icon
    iconAnchor:   [10, 20], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -20] // point from which the popup should open relative to the iconAnchor
});

/*** Initialise the leaflet map. ***/
var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
var markerGroup = {};
function initmap() {
    // set up the map
    map = new L.Map('map');

    // create the tile layer with correct attribution
    var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 17, attribution: osmAttrib});
    map.addLayer(osm);
}
/***********************************/

/* Adds the heart rate icons to the map */
function addIcon(index){
	var gpxFile = JSON.parse(sessionStorage.getItem(sessionStorage.key(index)));
	var markers = [];
	for (seg of gpxFile.trksegs) {
		for (var i=0; i < seg.length; i++) {
			/* Add a heart rate icon for every num entry. */
			if (i % 50 == 0){
				markers.push(L.marker([seg[i].lat,seg[i].lon], {icon: hrIcon}).bindPopup("Heart rate: "+seg[i].ext.hr));
			}
        }
		markerGroup[index] = L.layerGroup(markers).addTo(map);
	}
}

/* Removes the heart rate icons from the map. */
function delIcon(index){
	map.removeLayer(markerGroup[index]);
	delete markerGroup[index];
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
        /* Check if any files are selected, display message if not. */
        // ToDo: Nicola
    } else {
        $("#"+id+"").removeClass("inactive-file");
        $("#"+id+"").addClass("active-file");
        $("#"+id+"").css("background-color", colors[i]),
        selectedFiles.push(i);
        console.log(selectedFiles);
        gpxMapRender(i);
        /* Show toggler */
        $("#file-"+i+"-toggler").show();
		addIcon(i);
    }
}

function toggle(id) {
  if ($("#file-"+id+"-details").is(":visible")) {
    $("#file-"+id+"-toggler").removeClass("btn-success");
    $("#file-"+id+"-toggler").addClass("btn-outline-secondary");
  } else {
    $("#file-"+id+"-toggler").removeClass("btn-outline-secondary");
    $("#file-"+id+"-toggler").addClass("btn-success");
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
    '<div class="row my-3">\
        <div class="col-4"> \
          <strong>Start Time:</strong> '+gpxFile.trksegs[0][0].time.substring(11,19)+' \
        </div> \
        <div class="col-4"> \
          <strong>End Time:</strong> '+lastTrkpt.time.substring(11,19)+'\
        </div> \
        <div class="col-4"> \
          <strong>Distance:</strong> '+distance.toFixed(2)+' km\
        </div> \
        \
    </div>'
    );
  var trackExts = [];
  var trackExt = gpxFile.trksegs[0][0].ext;
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
  for (ext of trackExts) {
      var divId = "file-" + id + "-graph-" + ext;
      $("#"+parentDivId+"").append(
        '<div id="'+divId+'"> \
          Here comes the div for File: '+divId+' \
        </div>'
      );
      // renderGraph(gpxFile, ext, divId);
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
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1
        });
        firstPolyline.addTo(map);
        plotlayers.push(firstPolyline); // Add ployline layer to list of al layers.

    }

    /* Set the map to view the starting position of the gpx file. */
    map.setView(new L.LatLng(gpxFile.trksegs[0][0].lat, gpxFile.trksegs[0][0].lon),15);
}
function renderGraph(id,inp_type){
        var gpxFile = JSON.parse(sessionStorage.getItem(sessionStorage.key(id)));

        console.log("graph")
        var data = []
        var earliesttime = 0
        var type
        var unit
        
        if (inp_type == "atemp"){
            type = "Temperature"
            unit = "Degree ( Celsius )"
        } else if (inp_type == "cad"){
            type = "Cadence"
            unit = "cadence unit"
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
                }
                
            }
        }
        console.log(type)

        var chart = new CanvasJS.Chart('chartContainer', {
            animationEnabled: true,
            theme: "light2",
            title:{
                text: type + " from " + gpxFile.name
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

    
    